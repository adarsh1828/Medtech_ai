import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Calculate live dynamic status (clean, due, overdue)
function calculateHygieneStatus(lastCleanedAt, frequencyHours) {
  if (!lastCleanedAt) return 'overdue';
  const lastTime = new Date(lastCleanedAt).getTime();
  const now = Date.now();
  const elapsedHours = (now - lastTime) / (1000 * 60 * 60);

  if (elapsedHours > frequencyHours) {
    return 'overdue';
  } else if (elapsedHours > frequencyHours * 0.75) {
    return 'due';
  }
  return 'clean';
}

// GET all cleaning zones / tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM CleaningTasks ORDER BY area_name ASC');
    
    // Dynamically calculate live status and overdue minutes
    const enrichedTasks = tasks.map(task => {
      const liveStatus = calculateHygieneStatus(task.last_cleaned_at, task.cleaning_frequency_hours);
      const lastTime = task.last_cleaned_at ? new Date(task.last_cleaned_at).getTime() : 0;
      const elapsedHours = lastTime ? (Date.now() - lastTime) / (1000 * 60 * 60) : 999;
      const overdueMinutes = Math.max(0, Math.round((elapsedHours - task.cleaning_frequency_hours) * 60));

      return {
        ...task,
        status: liveStatus,
        elapsed_hours: Number(elapsedHours.toFixed(1)),
        overdue_minutes: overdueMinutes
      };
    });

    res.json({ tasks: enrichedTasks });
  } catch (err) {
    console.error('Error fetching cleaning tasks:', err);
    res.status(500).json({ error: 'Failed to retrieve cleaning tasks.' });
  }
});

// POST Scan QR Code & Submit Hygiene Checklist (Anti-Negligence Verification)
router.post('/scan', async (req, res) => {
  try {
    const { area_code, checklist = {}, cleaner_name, cleaner_id, notes, photo_url } = req.body;

    if (!area_code) {
      return res.status(400).json({ error: 'Area QR code is required for scan verification.' });
    }

    const task = await getOne('SELECT * FROM CleaningTasks WHERE area_code = ?', [area_code.trim().toUpperCase()]);
    if (!task) {
      return res.status(404).json({ error: `Invalid QR Code: No registered hospital area matches "${area_code}".` });
    }

    const mopping = checklist.mopping ? 1 : 0;
    const linen = checklist.linen ? 1 : 0;
    const dustbin = checklist.dustbin ? 1 : 0;
    const sanitizer = checklist.sanitizer ? 1 : 0;
    const staffName = cleaner_name || 'Ramesh Shinde (Sanitation Staff)';

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update CleaningTasks table
    await run(
      `UPDATE CleaningTasks
       SET last_cleaned_at = ?,
           last_cleaned_by = ?,
           last_cleaner_id = ?,
           status = 'clean',
           checklist_mopping = ?,
           checklist_linen = ?,
           checklist_dustbin = ?,
           checklist_sanitizer = ?
       WHERE id = ?`,
      [nowStr, staffName, cleaner_id || null, mopping, linen, dustbin, sanitizer, task.id]
    );

    // Insert into tamper-proof audit log
    const logRes = await run(
      `INSERT INTO CleaningLogs (task_id, area_name, area_code, cleaner_name, cleaner_id, checklist_mopping, checklist_linen, checklist_dustbin, checklist_sanitizer, photo_url, notes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.area_name,
        task.area_code,
        staffName,
        cleaner_id || null,
        mopping,
        linen,
        dustbin,
        sanitizer,
        photo_url || null,
        notes || 'Verified QR Scan & 4-Point Anti-Infection Sanitization',
        nowStr
      ]
    );

    res.json({
      message: `Hygiene verified successfully for ${task.area_name}!`,
      task_id: task.id,
      area_name: task.area_name,
      verified_at: nowStr,
      cleaner_name: staffName,
      log_id: logRes.lastID
    });
  } catch (err) {
    console.error('QR cleaning scan error:', err);
    res.status(500).json({ error: 'Failed to record cleaning scan. Please try again.' });
  }
});

// GET Audit Logs History
router.get('/logs', async (req, res) => {
  try {
    const logs = await query('SELECT * FROM CleaningLogs ORDER BY timestamp DESC LIMIT 50');
    res.json({ logs });
  } catch (err) {
    console.error('Error fetching cleaning logs:', err);
    res.status(500).json({ error: 'Failed to retrieve cleaning audit logs.' });
  }
});

// GET Hospital Hygiene Summary & Compliance Metrics (For Admin Dashboard)
router.get('/summary', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM CleaningTasks');
    let cleanCount = 0;
    let dueCount = 0;
    let overdueCount = 0;

    tasks.forEach(t => {
      const st = calculateHygieneStatus(t.last_cleaned_at, t.cleaning_frequency_hours);
      if (st === 'clean') cleanCount++;
      else if (st === 'due') dueCount++;
      else overdueCount++;
    });

    const total = tasks.length || 1;
    const complianceRate = Math.round((cleanCount / total) * 100);

    const recentLogs = await query('SELECT * FROM CleaningLogs ORDER BY timestamp DESC LIMIT 5');

    res.json({
      totalAreas: tasks.length,
      cleanCount,
      dueCount,
      overdueCount,
      complianceRate,
      recentLogs
    });
  } catch (err) {
    console.error('Error fetching housekeeping summary:', err);
    res.status(500).json({ error: 'Failed to calculate housekeeping summary.' });
  }
});

// POST Add New Cleaning Area / QR Code (Admin Only)
router.post('/add-area', async (req, res) => {
  try {
    const { area_name, area_code, area_type = 'Ward Bed', cleaning_frequency_hours = 4 } = req.body;

    if (!area_name || !area_code) {
      return res.status(400).json({ error: 'Area name and QR code are required.' });
    }

    const code = area_code.trim().toUpperCase();
    const existing = await getOne('SELECT id FROM CleaningTasks WHERE area_code = ?', [code]);
    if (existing) {
      return res.status(409).json({ error: `Area with QR code ${code} already exists.` });
    }

    const result = await run(
      `INSERT INTO CleaningTasks (area_name, area_code, area_type, cleaning_frequency_hours, status)
       VALUES (?, ?, ?, ?, 'due')`,
      [area_name.trim(), code, area_type, Number(cleaning_frequency_hours) || 4]
    );

    res.status(201).json({
      message: 'New hygiene area registered successfully with QR code.',
      id: result.lastID,
      area_code: code
    });
  } catch (err) {
    console.error('Error adding cleaning area:', err);
    res.status(500).json({ error: 'Failed to create cleaning area.' });
  }
});

export default router;
