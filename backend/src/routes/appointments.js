import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET appointments based on user role
router.get('/', authenticateToken, async (req, res) => {
  try {
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
    } else if (req.user.role === 'admin') {
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
    } else if (req.user.role === 'admin') {
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

    res.status(201).json({
      message: 'Appointment confirmed successfully!',
      appointment: created,
      token_number
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: 'Failed to book appointment. Please try again.' });
  }
});

// PATCH update appointment status / vitals (Doctor or Admin)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, vitals_bp, vitals_pulse, vitals_temp, vitals_weight } = req.body;
    const appointmentId = req.params.id;

    const appointment = await getOne('SELECT * FROM Appointments WHERE id = ?', [appointmentId]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const validStatuses = ['scheduled', 'confirmed', 'in_consultation', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    await run(
      `UPDATE Appointments
       SET status = COALESCE(?, status),
           vitals_bp = COALESCE(?, vitals_bp),
           vitals_pulse = COALESCE(?, vitals_pulse),
           vitals_temp = COALESCE(?, vitals_temp),
           vitals_weight = COALESCE(?, vitals_weight)
       WHERE id = ?`,
      [status || null, vitals_bp || null, vitals_pulse || null, vitals_temp || null, vitals_weight || null, appointmentId]
    );

    const updated = await getOne('SELECT * FROM Appointments WHERE id = ?', [appointmentId]);
    res.json({ message: 'Appointment updated successfully', appointment: updated });
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment.' });
  }
});

export default router;
