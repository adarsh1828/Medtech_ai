import express from 'express';
import { query, getOne, run, transaction } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

import { snapshot, hospitalDate, sessionFor, fail } from '../services/opd.js';

const router = express.Router();

// GET appointments based on user role
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['patient','doctor','admin','staff','nurse'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
    const { date, status, doctor_id, patient_id } = req.query;
    let sql = `
      SELECT a.*, 
             p.full_name as patient_name, p.dob as patient_dob, p.gender as patient_gender, 
             p.blood_group as patient_blood_group, p.allergies as patient_allergies, p.phone as patient_phone,
             d.full_name as doctor_name, d.specialization as doctor_specialization, d.room_number as doctor_room,
             dep.name as department_name, dep.floor_number as department_floor,
             (SELECT id FROM Prescriptions WHERE appointment_id = a.id) as prescription_id
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.id
      JOIN Doctors d ON a.doctor_id = d.id
      JOIN Departments dep ON a.department_id = dep.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based restrictions
    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (!patient) return res.json({ appointments: [] });
      sql += ' AND a.patient_id = ?';
      params.push(patient.id);
    } else if (req.user.role === 'doctor') {
      const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]);
      if (!doctor) return res.json({ appointments: [] });
      sql += ' AND a.doctor_id = ?';
      params.push(doctor.id);
    } else if (req.user.role === 'admin' || req.user.role === 'staff' || req.user.role === 'nurse') {
      if (doctor_id) {
        sql += ' AND a.doctor_id = ?';
        params.push(doctor_id);
      }
      if (patient_id) {
        sql += ' AND a.patient_id = ?';
        params.push(patient_id);
      }
    }

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.token_number ASC';

    const appointments = await query(sql, params);
    res.json({ appointments });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to retrieve appointments.' });
  }
});

// GET Live Queue & OPD Tracker ("Where is my train" style live tracking)
router.get('/live-tracker', authenticateToken, async (req, res) => {
  try {
    let doctorId = Number(req.query.doctor_id);
    let period = req.query.period || 'morning';
    if (req.user.role === 'patient' && !doctorId) {
      const own = await getOne(`SELECT a.* FROM Appointments a JOIN Patients p ON p.id = a.patient_id WHERE p.user_id = ? AND a.appointment_date = ? ORDER BY CASE WHEN a.status IN ('completed','cancelled') THEN 1 ELSE 0 END, a.id LIMIT 1`, [req.user.userId, hospitalDate()]);
      if (own) { doctorId = own.doctor_id; period = sessionFor(own.time_slot); }
    }
    if (req.user.role === 'doctor') doctorId = (await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]))?.id;
    if (!doctorId) doctorId = (await getOne("SELECT id FROM Doctors WHERE status = 'approved' OR status IS NULL ORDER BY id LIMIT 1"))?.id;
    const data = await snapshot(req.user, doctorId, hospitalDate(), period, true);
    data.active_doctors = await query("SELECT id, full_name, specialization FROM Doctors WHERE status = 'approved' OR status IS NULL ORDER BY full_name");
    res.json(data);
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

// GET single appointment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await getOne(
      `SELECT a.*, 
              p.full_name as patient_name, p.dob as patient_dob, p.gender as patient_gender, 
              p.blood_group as patient_blood_group, p.allergies as patient_allergies, p.phone as patient_phone,
              d.full_name as doctor_name, d.specialization as doctor_specialization, d.room_number as doctor_room,
              dep.name as department_name, dep.floor_number as department_floor
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.id
       JOIN Doctors d ON a.doctor_id = d.id
       JOIN Departments dep ON a.department_id = dep.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (patient?.id !== appointment.patient_id) return res.status(403).json({ error: 'Access denied.' });
    } else if (req.user.role === 'doctor') {
      const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]);
      if (doctor?.id !== appointment.doctor_id) return res.status(403).json({ error: 'Access denied.' });
    } else if (!['admin','staff','nurse'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve appointment details.' });
  }
});

// POST book new appointment (Patient or Admin)
router.post('/book', authenticateToken, async (req, res) => {
  try {
    let { doctor_id, department_id, appointment_date, time_slot, reason_for_visit, patient_id } = req.body;

    // If patient is booking, use their own patient record
    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (!patient) {
        return res.status(400).json({ error: 'Patient profile does not exist. Please complete your registration.' });
      }
      patient_id = patient.id;
    } else if (req.user.role === 'admin' || req.user.role === 'staff') {
      if (!patient_id) {
        return res.status(400).json({ error: 'Please specify the patient for this appointment.' });
      }
    } else {
      return res.status(403).json({ error: 'Doctors cannot book appointments for themselves.' });
    }

    if (!doctor_id || !department_id || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'Please select department, doctor, appointment date, and time slot.' });
    }

    // Verify doctor belongs to department and is approved
    const doctor = await getOne(
      "SELECT id, full_name, department_id, status FROM Doctors WHERE id = ? AND (status = 'approved' OR status IS NULL)",
      [doctor_id]
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Selected doctor is unavailable or pending administrative approval.' });
    }

    if (Number(doctor.department_id) !== Number(department_id)) return res.status(400).json({ error: 'Doctor does not belong to this department.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date) || appointment_date < hospitalDate()) return res.status(400).json({ error: 'Choose today or a future date.' });
    const createdBooking = await transaction(async () => {
    const session = await getOne('SELECT state FROM OPDSessions WHERE doctor_id = ? AND session_date = ? AND period = ?', [doctor_id, appointment_date, sessionFor(time_slot)]);
    if (session?.state === 'closed') fail('This OPD session is closed. Choose another session.');
      // Calculate queue token number for this doctor on this day
      const tokenRecord = await getOne(
        'SELECT MAX(token_number) as max_token FROM Appointments WHERE doctor_id = ? AND appointment_date = ?',
        [doctor_id, appointment_date]
      );
      const token_number = (tokenRecord?.max_token || 100) + 1;

      const result = await run(
        `INSERT INTO Appointments (patient_id, doctor_id, department_id, appointment_date, time_slot, token_number, status, reason_for_visit)
         VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [patient_id, doctor_id, department_id, appointment_date, time_slot, token_number, reason_for_visit || 'General consultation']
      );

      const created = await getOne(
        `SELECT a.*, d.full_name as doctor_name, dep.name as department_name
         FROM Appointments a
         JOIN Doctors d ON a.doctor_id = d.id
         JOIN Departments dep ON a.department_id = dep.id
         WHERE a.id = ?`,
        [result.lastID]
      );

      return { created, token_number };
    });
    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: createdBooking.created,
      token_number: createdBooking.token_number
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to book appointment. Please try again.' });
  }
});

// PATCH update appointment status / vitals (Doctor or Admin)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient' || req.body.status !== 'cancelled') return res.status(403).json({ error: 'Use the assigned assistant OPD panel for queue changes.' });
    await transaction(async () => {
      const appointment = await getOne('SELECT a.* FROM Appointments a JOIN Patients p ON p.id = a.patient_id WHERE a.id = ? AND p.user_id = ?', [req.params.id, req.user.userId]);
      if (!appointment) fail('Appointment not found.', 404);
      const entry = await getOne('SELECT * FROM OPDEntries WHERE appointment_id = ?', [appointment.id]);
      if (['in_consultation','completed'].includes(appointment.status) || ['called','in_consultation','completed'].includes(entry?.state)) fail('This appointment can no longer be cancelled online.');
      await run("UPDATE Appointments SET status = 'cancelled' WHERE id = ?", [appointment.id]);
      if (entry) {
        await run("UPDATE OPDEntries SET state = 'cancelled' WHERE appointment_id = ?", [appointment.id]);
        await run('UPDATE OPDSessions SET version = version + 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), entry.session_id]);
        await run("INSERT INTO OPDEvents (session_id, appointment_id, actor_id, action, created_at) VALUES (?, ?, ?, 'patient_cancel', ?)", [entry.session_id, appointment.id, req.user.userId, new Date().toISOString()]);
      }
    });
    res.json({ message: 'Appointment cancelled.' });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

// PATCH update appointment vitals specifically (Doctor Consultation Flow)
router.patch('/:id/vitals', authenticateToken, async (req, res) => {
  try {
    const { vitals_bp, vitals_pulse, vitals_temp, vitals_weight, bp, pulse, temp, weight } = req.body;
    const appointmentId = req.params.id;

    const appointment = await getOne('SELECT * FROM Appointments WHERE id = ?', [appointmentId]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (!['admin','doctor','nurse'].includes(req.user.role)) return res.status(403).json({ error: 'Clinical access required.' });
    if (req.user.role === 'doctor') {
      const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]);
      if (doctor?.id !== appointment.doctor_id) return res.status(403).json({ error: 'Access denied.' });
    }
    const bpVal = vitals_bp || bp || appointment.vitals_bp;
    const pulseVal = vitals_pulse || pulse || appointment.vitals_pulse;
    const tempVal = vitals_temp || temp || appointment.vitals_temp;
    const weightVal = vitals_weight || weight || appointment.vitals_weight;

    await run(
      `UPDATE Appointments
       SET vitals_bp = ?,
           vitals_pulse = ?,
           vitals_temp = ?,
           vitals_weight = ?
       WHERE id = ?`,
      [bpVal, pulseVal, tempVal, weightVal, appointmentId]
    );

    const updated = await getOne('SELECT * FROM Appointments WHERE id = ?', [appointmentId]);
    res.json({ message: 'Patient vitals saved successfully!', appointment: updated });
  } catch (err) {
    console.error('Error updating appointment vitals:', err);
    res.status(500).json({ error: 'Failed to record vitals for appointment.' });
  }
});

export default router;
