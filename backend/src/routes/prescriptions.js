import express from 'express';
import { query, getOne, run, transaction } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET prescriptions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, doctor_id } = req.query;
    let sql = `
      SELECT pr.*, 
             p.full_name as patient_name, p.dob as patient_dob, p.gender as patient_gender, p.blood_group as patient_blood_group, p.allergies as patient_allergies,
             d.full_name as doctor_name, d.qualification as doctor_qualification, d.specialization as doctor_specialization,
             dep.name as department_name,
             a.appointment_date, a.vitals_bp, a.vitals_pulse, a.vitals_temp, a.vitals_weight
      FROM Prescriptions pr
      JOIN Patients p ON pr.patient_id = p.id
      JOIN Doctors d ON pr.doctor_id = d.id
      JOIN Departments dep ON d.department_id = dep.id
      LEFT JOIN Appointments a ON pr.appointment_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (!patient) return res.json({ prescriptions: [] });
      sql += ' AND pr.patient_id = ?';
      params.push(patient.id);
    } else if (req.user.role === 'doctor') {
      const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]);
      if (!doctor) return res.json({ prescriptions: [] });
      sql += ' AND pr.doctor_id = ?';
      params.push(doctor.id);
    } else if (req.user.role === 'admin' || req.user.role === 'nurse' || req.user.role === 'staff') {
      if (patient_id) {
        sql += ' AND pr.patient_id = ?';
        params.push(patient_id);
      }
      if (doctor_id) {
        sql += ' AND pr.doctor_id = ?';
        params.push(doctor_id);
      }
    }

    sql += ' ORDER BY pr.created_at DESC';
    const prescriptions = await query(sql, params);

    // Attach medicines to each prescription
    for (const rx of prescriptions) {
      rx.medicines = await query('SELECT * FROM Medicines WHERE prescription_id = ?', [rx.id]);
    }

    res.json({ prescriptions });
  } catch (err) {
    console.error('Error retrieving prescriptions:', err);
    res.status(500).json({ error: 'Failed to retrieve prescriptions.' });
  }
});

// GET single prescription by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rx = await getOne(
      `SELECT pr.*, 
             p.full_name as patient_name, p.dob as patient_dob, p.gender as patient_gender, p.blood_group as patient_blood_group, p.allergies as patient_allergies, p.phone as patient_phone,
             d.full_name as doctor_name, d.qualification as doctor_qualification, d.specialization as doctor_specialization, d.room_number as doctor_room,
             dep.name as department_name,
             a.appointment_date, a.vitals_bp, a.vitals_pulse, a.vitals_temp, a.vitals_weight
      FROM Prescriptions pr
      JOIN Patients p ON pr.patient_id = p.id
      JOIN Doctors d ON pr.doctor_id = d.id
      JOIN Departments dep ON d.department_id = dep.id
      LEFT JOIN Appointments a ON pr.appointment_id = a.id
      WHERE pr.id = ?`,
      [req.params.id]
    );

    if (!rx) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    // Role check
    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (rx.patient_id !== patient.id) {
        return res.status(403).json({ error: 'Unauthorized to view this prescription.' });
      }
    }

    rx.medicines = await query('SELECT * FROM Medicines WHERE prescription_id = ?', [rx.id]);
    res.json({ prescription: rx });
  } catch (err) {
    console.error('Error fetching prescription:', err);
    res.status(500).json({ error: 'Failed to load prescription details.' });
  }
});

// POST create digital prescription (Doctor only)
router.post('/', authenticateToken, requireRole(['doctor']), async (req, res) => {
  try {
    const { appointment_id, patient_id, diagnosis, clinical_notes, advice, follow_up_date, medicines, vitals } = req.body;

    // Retrieve doctor record
    const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]);
    if (!doctor) {
      return res.status(403).json({ error: 'Only certified doctors can issue prescriptions.' });
    }

    if (!patient_id || typeof diagnosis !== 'string' || !diagnosis.trim()) {
      return res.status(400).json({ error: 'Patient ID and clinical diagnosis are required.' });
    }

    if (medicines !== undefined && (!Array.isArray(medicines) || medicines.some(med => !med || typeof med.medicine_name !== 'string' || typeof med.dosage !== 'string' || !med.medicine_name.trim() || !med.dosage.trim()))) {
      return res.status(400).json({ error: 'Each medicine needs a name and dosage.' });
    }
    const created = await transaction(async () => {
      if (appointment_id) {
        const appointment = await getOne('SELECT * FROM Appointments WHERE id = ?', [appointment_id]);
        if (!appointment || appointment.doctor_id !== doctor.id || appointment.patient_id !== Number(patient_id)) {
          throw Object.assign(new Error('Appointment does not belong to this doctor and patient.'), { status: 403 });
        }
        if (!['in_consultation', 'completed'].includes(appointment.status)) throw Object.assign(new Error('Patient must be in consultation or have a finished visit.'), { status: 409 });
        if (await getOne('SELECT id FROM Prescriptions WHERE appointment_id = ?', [appointment_id])) throw Object.assign(new Error('Prescription already issued for this visit.'), { status: 409 });
      }
      const rxResult = await run(
        `INSERT INTO Prescriptions (appointment_id, patient_id, doctor_id, diagnosis, clinical_notes, advice, follow_up_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [appointment_id || null, patient_id, doctor.id, diagnosis.trim(), clinical_notes || '', advice || '', follow_up_date || null]
      );

      const prescriptionId = rxResult.lastID;

      // Add medicines if provided
      if (Array.isArray(medicines) && medicines.length > 0) {
        for (const med of medicines) {
          if (med.medicine_name && med.dosage) {
            await run(
              `INSERT INTO Medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                prescriptionId,
                med.medicine_name.trim(),
                med.dosage.trim(),
                med.frequency || 'Once daily',
                med.duration || '5 days',
                med.instructions || 'After meals'
              ]
            );
          }
        }
      }

      const created = await getOne('SELECT * FROM Prescriptions WHERE id = ?', [prescriptionId]);
      created.medicines = await query('SELECT * FROM Medicines WHERE prescription_id = ?', [prescriptionId]);

      return created;
    });
    res.status(201).json({
      message: 'Prescription recorded and synced with patient record.',
      prescription: created
    });
  } catch (err) {
    console.error('Error issuing prescription:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to record prescription. Please try again.' });
  }
});

export default router;
