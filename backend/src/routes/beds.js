import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all beds with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { ward_type, status, department_id } = req.query;

    let sql = `
      SELECT b.*, 
             dep.name as department_name, dep.floor_number,
             p.full_name as patient_name, p.gender as patient_gender, p.blood_group as patient_blood_group, p.phone as patient_phone
      FROM Beds b
      LEFT JOIN Departments dep ON b.department_id = dep.id
      LEFT JOIN Patients p ON b.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (ward_type) {
      sql += ' AND b.ward_type = ?';
      params.push(ward_type);
    }

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    if (department_id) {
      sql += ' AND b.department_id = ?';
      params.push(department_id);
    }

    sql += ' ORDER BY b.ward_type, b.bed_number ASC';
    const beds = await query(sql, params);

    // Calculate quick counts
    const total = beds.length;
    const available = beds.filter(b => b.status === 'available').length;
    const occupied = beds.filter(b => b.status === 'occupied').length;
    const maintenance = beds.filter(b => b.status === 'maintenance').length;

    res.json({
      beds,
      stats: {
        total,
        available,
        occupied,
        maintenance,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Error fetching beds:', err);
    res.status(500).json({ error: 'Failed to retrieve hospital bed status.' });
  }
});

// PATCH update bed status / allocation (Admin or Doctor)
router.patch('/:id', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { status, patient_id, notes } = req.body;
    const bedId = req.params.id;

    const bed = await getOne('SELECT * FROM Beds WHERE id = ?', [bedId]);
    if (!bed) {
      return res.status(404).json({ error: 'Bed not found.' });
    }

    let admitted_at = bed.admitted_at;
    let newPatientId = bed.patient_id;

    if (status === 'occupied') {
      newPatientId = patient_id !== undefined ? patient_id : bed.patient_id;
      admitted_at = admitted_at || new Date().toISOString();
    } else if (status === 'available' || status === 'maintenance') {
      newPatientId = null;
      admitted_at = null;
    }

    await run(
      `UPDATE Beds 
       SET status = COALESCE(?, status),
           patient_id = ?,
           admitted_at = ?,
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [status || null, newPatientId, admitted_at, notes || null, bedId]
    );

    const updated = await getOne(
      `SELECT b.*, dep.name as department_name, p.full_name as patient_name
       FROM Beds b
       LEFT JOIN Departments dep ON b.department_id = dep.id
       LEFT JOIN Patients p ON b.patient_id = p.id
       WHERE b.id = ?`,
      [bedId]
    );

    res.json({ message: 'Bed updated successfully', bed: updated });
  } catch (err) {
    console.error('Error updating bed:', err);
    res.status(500).json({ error: 'Failed to update bed status.' });
  }
});

// POST add new bed (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { bed_number, ward_type, department_id, notes } = req.body;

    if (!bed_number || !ward_type) {
      return res.status(400).json({ error: 'Bed number and ward type are required.' });
    }

    const existing = await getOne('SELECT id FROM Beds WHERE bed_number = ?', [bed_number.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'A bed with this number already exists.' });
    }

    const result = await run(
      `INSERT INTO Beds (bed_number, ward_type, department_id, status, notes)
       VALUES (?, ?, ?, 'available', ?)`,
      [bed_number.trim(), ward_type, department_id || null, notes || '']
    );

    const created = await getOne('SELECT * FROM Beds WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Bed added successfully', bed: created });
  } catch (err) {
    console.error('Error adding bed:', err);
    res.status(500).json({ error: 'Failed to add bed.' });
  }
});

export default router;
