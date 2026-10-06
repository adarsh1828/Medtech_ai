import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST trigger new Emergency SOS
router.post('/', async (req, res) => {
  try {
    const { 
      patient_name = 'Anonymous Caller', 
      phone = 'N/A', 
      emergency_type = 'Cardiac / Acute Trauma', 
      priority = 'LEVEL_1_CRITICAL', 
      location = 'Hospital Emergency Reception', 
      notes = '' 
    } = req.body;

    const result = await run(
      `INSERT INTO EmergencyIncidents (patient_name, phone, emergency_type, priority, location, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [patient_name, phone, emergency_type, priority, location, notes]
    );

    const created = await getOne('SELECT * FROM EmergencyIncidents WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: '🚨 Code Red Emergency SOS dispatched! Trauma team notified.',
      incident: created
    });
  } catch (err) {
    console.error('Error triggering Emergency SOS:', err);
    res.status(500).json({ error: 'Failed to record Emergency SOS incident.' });
  }
});

// GET active emergency incidents (for Command Center, Nurse Station, Top Header)
router.get('/', async (req, res) => {
  try {
    const incidents = await query(
      `SELECT * FROM EmergencyIncidents 
       ORDER BY CASE WHEN status = 'active' THEN 1 WHEN status = 'dispatched' THEN 2 ELSE 3 END, created_at DESC 
       LIMIT 10`
    );
    const activeCount = incidents.filter(i => i.status === 'active').length;

    res.json({ incidents, activeCount });
  } catch (err) {
    console.error('Error fetching emergency incidents:', err);
    res.status(500).json({ error: 'Failed to retrieve emergency incidents.' });
  }
});

// PATCH update incident status (dispatch ambulance or resolve)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    const incident = await getOne('SELECT * FROM EmergencyIncidents WHERE id = ?', [id]);
    if (!incident) {
      return res.status(404).json({ error: 'Emergency incident not found.' });
    }

    const nowIso = new Date().toISOString();
    let dispatchedAt = incident.dispatched_at;
    let resolvedAt = incident.resolved_at;

    if (status === 'dispatched') dispatchedAt = nowIso;
    if (status === 'resolved') resolvedAt = nowIso;

    await run(
      `UPDATE EmergencyIncidents
       SET status = COALESCE(?, status),
           notes = COALESCE(?, notes),
           dispatched_at = COALESCE(?, dispatched_at),
           resolved_at = COALESCE(?, resolved_at)
       WHERE id = ?`,
      [status || null, notes || null, dispatchedAt, resolvedAt, id]
    );

    const updated = await getOne('SELECT * FROM EmergencyIncidents WHERE id = ?', [id]);
    res.json({ message: 'Incident updated successfully', incident: updated });
  } catch (err) {
    console.error('Error updating emergency incident:', err);
    res.status(500).json({ error: 'Failed to update emergency incident.' });
  }
});

export default router;
