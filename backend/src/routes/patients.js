import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET current logged-in patient's profile
router.get('/me', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patient = await getOne(
      `SELECT p.*, u.email, u.created_at as account_created
       FROM Patients p
       JOIN Users u ON p.user_id = u.id
       WHERE p.user_id = ?`,
      [req.user.userId]
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    res.json({ patient });
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// UPDATE current patient's profile
router.put('/me', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const { full_name, dob, gender, blood_group, phone, emergency_contact, address, allergies, medical_history_summary } = req.body;

    const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found.' });
    }

    await run(
      `UPDATE Patients 
       SET full_name = ?, dob = ?, gender = ?, blood_group = ?, phone = ?, emergency_contact = ?, address = ?, allergies = ?, medical_history_summary = ?
       WHERE id = ?`,
      [
        full_name,
        dob,
        gender,
        blood_group,
        phone,
        emergency_contact,
        address,
        allergies,
        medical_history_summary,
        patient.id
      ]
    );

    if (full_name || phone) {
      await run('UPDATE Users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?', [full_name, phone, req.user.userId]);
    }

    const updated = await getOne('SELECT * FROM Patients WHERE id = ?', [patient.id]);
    res.json({ message: 'Profile updated successfully', patient: updated });
  } catch (err) {
    console.error('Error updating patient profile:', err);
    res.status(500).json({ error: 'Failed to update patient profile.' });
  }
});

// GET patient details and full history by ID (Accessible by Doctor or Admin)
router.get('/:id', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const patient = await getOne(
      `SELECT p.*, u.email
       FROM Patients p
       JOIN Users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Fetch past appointments
    const appointments = await query(
      `SELECT a.*, d.full_name as doctor_name, dep.name as department_name
       FROM Appointments a
       JOIN Doctors d ON a.doctor_id = d.id
       JOIN Departments dep ON a.department_id = dep.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.created_at DESC`,
      [req.params.id]
    );

    // Fetch prescriptions
    const prescriptions = await query(
      `SELECT pr.*, d.full_name as doctor_name, dep.name as department_name
       FROM Prescriptions pr
       JOIN Doctors d ON pr.doctor_id = d.id
       JOIN Departments dep ON d.department_id = dep.id
       WHERE pr.patient_id = ?
       ORDER BY pr.created_at DESC`,
      [req.params.id]
    );

    // Fetch medicines for each prescription
    for (const pr of prescriptions) {
      pr.medicines = await query('SELECT * FROM Medicines WHERE prescription_id = ?', [pr.id]);
    }

    // Fetch lab reports
    const labReports = await query(
      `SELECT lr.*, lt.test_name, lt.test_code, lt.category, lt.units
       FROM LabReports lr
       JOIN LabTests lt ON lr.test_id = lt.id
       WHERE lr.patient_id = ?
       ORDER BY lr.test_date DESC`,
      [req.params.id]
    );

    res.json({
      patient,
      history: {
        appointments,
        prescriptions,
        labReports
      }
    });
  } catch (err) {
    console.error('Error fetching patient history:', err);
    res.status(500).json({ error: 'Failed to load patient history.' });
  }
});

// GET all patients list (Admin and Doctors)
router.get('/', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT p.*, u.email,
        (SELECT COUNT(*) FROM Appointments WHERE patient_id = p.id) as total_visits,
        (SELECT appointment_date FROM Appointments WHERE patient_id = p.id ORDER BY appointment_date DESC LIMIT 1) as last_visit
      FROM Patients p
      JOIN Users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (p.full_name LIKE ? OR p.phone LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.full_name ASC';
    const patients = await query(sql, params);
    res.json({ patients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list patients.' });
  }
});

export default router;
