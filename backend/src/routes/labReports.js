import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all available lab tests
router.get('/tests', async (req, res) => {
  try {
    const tests = await query('SELECT * FROM LabTests ORDER BY category, test_name');
    res.json({ tests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve lab test catalog.' });
  }
});

// GET patient lab reports
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id } = req.query;
    let sql = `
      SELECT lr.*, 
             lt.test_name, lt.test_code, lt.category, lt.units, lt.normal_range as test_normal_range,
             p.full_name as patient_name,
             d.full_name as doctor_name
      FROM LabReports lr
      JOIN LabTests lt ON lr.test_id = lt.id
      JOIN Patients p ON lr.patient_id = p.id
      LEFT JOIN Doctors d ON lr.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (!patient) return res.json({ reports: [] });
      sql += ' AND lr.patient_id = ?';
      params.push(patient.id);
    } else if (patient_id) {
      sql += ' AND lr.patient_id = ?';
      params.push(patient_id);
    }

    sql += ' ORDER BY lr.test_date DESC, lr.created_at DESC';
    const reports = await query(sql, params);
    res.json({ reports });
  } catch (err) {
    console.error('Error fetching lab reports:', err);
    res.status(500).json({ error: 'Failed to retrieve lab reports.' });
  }
});

// POST record new lab test result (Doctor or Admin)
router.post('/', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { patient_id, test_id, test_date, status, result_value, reference_range, remarks } = req.body;

    if (!patient_id || !test_id || !result_value) {
      return res.status(400).json({ error: 'Patient ID, Test ID, and Result Value are required.' });
    }

    let doctor_id = null;
    if (req.user.role === 'doctor') {
      const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]);
      doctor_id = doctor?.id || null;
    }

    const test = await getOne('SELECT * FROM LabTests WHERE id = ?', [test_id]);
    const refRange = reference_range || test?.normal_range || 'N/A';
    const reportDate = test_date || new Date().toISOString().split('T')[0];

    const result = await run(
      `INSERT INTO LabReports (patient_id, test_id, doctor_id, test_date, status, result_value, reference_range, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, test_id, doctor_id, reportDate, status || 'completed', result_value, refRange, remarks || '']
    );

    const created = await getOne(
      `SELECT lr.*, lt.test_name, lt.units, p.full_name as patient_name
       FROM LabReports lr
       JOIN LabTests lt ON lr.test_id = lt.id
       JOIN Patients p ON lr.patient_id = p.id
       WHERE lr.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ message: 'Lab report added successfully', report: created });
  } catch (err) {
    console.error('Error adding lab report:', err);
    res.status(500).json({ error: 'Failed to add lab report.' });
  }
});

export default router;
