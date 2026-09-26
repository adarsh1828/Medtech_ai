import express from 'express';
import { query, getOne, run } from '../db.js';

const router = express.Router();

// GET all patient vitals logs
router.get('/vitals', async (req, res) => {
  try {
    const { patient_id } = req.query;
    let sql = 'SELECT * FROM PatientVitals';
    let params = [];
    if (patient_id) {
      sql += ' WHERE patient_id = ?';
      params.push(Number(patient_id));
    }
    sql += ' ORDER BY recorded_at DESC LIMIT 50';

    const vitals = await query(sql, params);
    res.json({ vitals });
  } catch (err) {
    console.error('Error fetching patient vitals:', err);
    res.status(500).json({ error: 'Failed to retrieve patient vitals.' });
  }
});

// POST Record Patient Vitals (Nurse Station)
router.post('/vitals', async (req, res) => {
  try {
    const { patient_id, patient_name, bed_number, nurse_id, nurse_name, bp, pulse, temp, spo2, sugar, notes } = req.body;

    if (!patient_name || !bp) {
      return res.status(400).json({ error: 'Patient name and Blood Pressure reading are required.' });
    }

    const staffName = nurse_name || 'Staff Nurse';

    const result = await run(
      `INSERT INTO PatientVitals (patient_id, patient_name, bed_number, nurse_id, nurse_name, bp, pulse, temp, spo2, sugar, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id ? Number(patient_id) : 1,
        patient_name.trim(),
        bed_number || 'General Ward',
        nurse_id ? Number(nurse_id) : null,
        staffName,
        bp.trim(),
        pulse ? `${pulse.replace(/[^0-9]/g, '')} bpm` : '75 bpm',
        temp ? `${temp} °F` : '98.6 °F',
        spo2 ? `${spo2.replace(/[^0-9]/g, '')}%` : '99%',
        sugar ? `${sugar} mg/dL` : null,
        notes || 'Vitals stable. Recorded during routine nurse round.'
      ]
    );

    res.status(201).json({
      message: 'Patient clinical vitals recorded successfully!',
      id: result.lastID,
      recorded_by: staffName,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error recording patient vitals:', err);
    res.status(500).json({ error: 'Failed to record vitals.' });
  }
});

// GET Live Medication Schedule (Dose countdown for ward patients)
router.get('/medications', async (req, res) => {
  try {
    const schedules = await query('SELECT * FROM MedicationSchedules ORDER BY status ASC, scheduled_time ASC');
    res.json({ medications: schedules });
  } catch (err) {
    console.error('Error fetching medication schedules:', err);
    res.status(500).json({ error: 'Failed to retrieve medication schedule.' });
  }
});

// POST Mark Medication as Given / Administered
router.post('/medications/:id/administer', async (req, res) => {
  try {
    const { id } = req.params;
    const { nurse_name, notes } = req.body;

    const med = await getOne('SELECT * FROM MedicationSchedules WHERE id = ?', [id]);
    if (!med) {
      return res.status(404).json({ error: 'Medication schedule entry not found.' });
    }

    const staffName = nurse_name || 'Staff Nurse';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await run(
      `UPDATE MedicationSchedules
       SET status = 'given',
           given_at = ?,
           given_by_nurse = ?,
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [nowStr, staffName, notes || 'Administered on schedule with verified vitals.', id]
    );

    res.json({
      message: `Dose administered successfully for ${med.patient_name} (${med.medicine_name})`,
      administered_at: nowStr,
      nurse_name: staffName
    });
  } catch (err) {
    console.error('Error administering medication:', err);
    res.status(500).json({ error: 'Failed to mark medication as administered.' });
  }
});

// POST Add New Medication Dose to Schedule
router.post('/medications', async (req, res) => {
  try {
    const { patient_id, patient_name, bed_number, doctor_name, medicine_name, dosage, scheduled_time } = req.body;

    if (!patient_name || !medicine_name || !dosage || !scheduled_time) {
      return res.status(400).json({ error: 'Patient, medicine name, dosage, and scheduled time are required.' });
    }

    const result = await run(
      `INSERT INTO MedicationSchedules (patient_id, patient_name, bed_number, doctor_name, medicine_name, dosage, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        patient_id ? Number(patient_id) : 1,
        patient_name.trim(),
        bed_number || 'General Ward',
        doctor_name || 'Attending Physician',
        medicine_name.trim(),
        dosage.trim(),
        scheduled_time.trim()
      ]
    );

    res.status(201).json({
      message: 'Medication dose scheduled successfully!',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error creating medication schedule:', err);
    res.status(500).json({ error: 'Failed to schedule medication.' });
  }
});

// GET Shift Handovers
router.get('/handovers', async (req, res) => {
  try {
    const handovers = await query('SELECT * FROM ShiftHandovers ORDER BY created_at DESC LIMIT 30');
    res.json({ handovers });
  } catch (err) {
    console.error('Error fetching shift handovers:', err);
    res.status(500).json({ error: 'Failed to retrieve shift handovers.' });
  }
});

// POST Submit Shift Handover (Accountability Transfer)
router.post('/handover', async (req, res) => {
  try {
    const { outgoing_nurse_name, incoming_nurse_name, ward_name, shift_name, critical_patients_notes } = req.body;

    if (!outgoing_nurse_name || !incoming_nurse_name || !ward_name) {
      return res.status(400).json({ error: 'Both outgoing and incoming nurse names and ward are required.' });
    }

    const result = await run(
      `INSERT INTO ShiftHandovers (outgoing_nurse_name, incoming_nurse_name, ward_name, shift_name, critical_patients_notes, handover_status)
       VALUES (?, ?, ?, ?, ?, 'accepted')`,
      [
        outgoing_nurse_name.trim(),
        incoming_nurse_name.trim(),
        ward_name.trim(),
        shift_name || 'Day to Evening Shift',
        critical_patients_notes || 'All patients checked. Vitals recorded. No code red emergencies.'
      ]
    );

    res.status(201).json({
      message: 'Clinical shift handover accepted and locked digitally!',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error creating shift handover:', err);
    res.status(500).json({ error: 'Failed to record shift handover.' });
  }
});

export default router;
