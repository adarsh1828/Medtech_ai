import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all departments (public / authenticated)
router.get('/', async (req, res) => {
  try {
    const departments = await query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM Doctors WHERE department_id = d.id AND (status = 'approved' OR status IS NULL)) as doctor_count,
        (SELECT COUNT(*) FROM Beds WHERE department_id = d.id) as bed_count
      FROM Departments d
      ORDER BY d.name ASC
    `);
    res.json({ departments });
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to retrieve hospital departments.' });
  }
});

// GET single department
router.get('/:id', async (req, res) => {
  try {
    const department = await getOne('SELECT * FROM Departments WHERE id = ?', [req.params.id]);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    const doctors = await query(
      "SELECT * FROM Doctors WHERE department_id = ? AND (status = 'approved' OR status IS NULL)",
      [req.params.id]
    );
    res.json({ department, doctors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load department details.' });
  }
});

// POST new department (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, code, description, floor_number, head_doctor_name, icon_name } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and unique code are required.' });
    }

    const existing = await getOne('SELECT id FROM Departments WHERE code = ? OR name = ?', [code.toUpperCase(), name]);
    if (existing) {
      return res.status(409).json({ error: 'A department with this name or code already exists.' });
    }

    const result = await run(
      `INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), code.toUpperCase().trim(), description || '', floor_number || 1, head_doctor_name || '', icon_name || 'HeartPulse']
    );

    const created = await getOne('SELECT * FROM Departments WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Department created successfully', department: created });
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

export default router;
