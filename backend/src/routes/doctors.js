import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all doctors
router.get('/', async (req, res) => {
  try {
    const { department_id, on_duty_only } = req.query;
    let sql = `
      SELECT d.*, dep.name as department_name, dep.code as department_code, dep.floor_number, u.email, u.phone
      FROM Doctors d
      JOIN Departments dep ON d.department_id = dep.id
      JOIN Users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      sql += ' AND d.department_id = ?';
      params.push(department_id);
    }

    if (on_duty_only === 'true') {
      sql += ' AND d.is_on_duty = 1';
    }

    sql += ' ORDER BY d.full_name ASC';

    const doctors = await query(sql, params);
    res.json({ doctors });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Failed to retrieve doctors.' });
  }
});

// GET doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await getOne(
      `SELECT d.*, dep.name as department_name, dep.floor_number, u.email, u.phone
       FROM Doctors d
       JOIN Departments dep ON d.department_id = dep.id
       JOIN Users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve doctor details.' });
  }
});

// Toggle Duty Status (Doctor for self, or Admin)
router.patch('/:id/toggle-duty', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await getOne('SELECT * FROM Doctors WHERE id = ?', [doctorId]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor record not found.' });
    }

    // Check authorization: must be the doctor themself or an admin
    if (req.user.role !== 'admin' && req.user.doctorId != doctorId) {
      return res.status(403).json({ error: 'You are only authorized to change your own duty status.' });
    }

    const newStatus = doctor.is_on_duty === 1 ? 0 : 1;
    await run('UPDATE Doctors SET is_on_duty = ? WHERE id = ?', [newStatus, doctorId]);

    res.json({
      message: `Doctor duty status changed to ${newStatus === 1 ? 'On Duty' : 'Off Duty'}`,
      is_on_duty: newStatus
    });
  } catch (err) {
    console.error('Toggle duty error:', err);
    res.status(500).json({ error: 'Could not update duty status.' });
  }
});

export default router;
