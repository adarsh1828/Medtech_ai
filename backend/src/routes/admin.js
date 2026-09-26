import express from 'express';
import bcrypt from 'bcryptjs';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes here require Admin role
router.use(authenticateToken, requireRole(['admin']));

// GET Admin Dashboard KPI Overview
router.get('/overview', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total Patients registered
    const totalPatientsRow = await getOne('SELECT COUNT(*) as count FROM Patients');
    const totalPatients = totalPatientsRow?.count || 0;

    // Appointments Today
    const todayApptsRow = await getOne('SELECT COUNT(*) as count FROM Appointments WHERE appointment_date = ?', [today]);
    const appointmentsToday = todayApptsRow?.count || 0;

    // Today's appointments by status
    const statusCounts = await query(
      `SELECT status, COUNT(*) as count FROM Appointments WHERE appointment_date = ? GROUP BY status`,
      [today]
    );

    // Doctors On Duty & Total Doctors (Approved only)
    const doctorStats = await getOne(
      `SELECT 
         COUNT(*) as total_doctors,
         SUM(CASE WHEN is_on_duty = 1 THEN 1 ELSE 0 END) as doctors_on_duty
       FROM Doctors WHERE status = 'approved' OR status IS NULL`
    );

    // Pending Doctor Approvals
    const pendingDocsRow = await getOne(`SELECT COUNT(*) as count FROM Doctors WHERE status = 'pending'`);
    const pendingDoctorsCount = pendingDocsRow?.count || 0;

    // Bed Occupancy
    const bedStats = await getOne(
      `SELECT 
         COUNT(*) as total_beds,
         SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
         SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds
       FROM Beds`
    );

    const totalBeds = bedStats?.total_beds || 0;
    const occupiedBeds = bedStats?.occupied_beds || 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Department Distribution
    const departmentStats = await query(`
      SELECT d.name, d.code,
        (SELECT COUNT(*) FROM Doctors WHERE department_id = d.id AND (status = 'approved' OR status IS NULL)) as doctors_count,
        (SELECT COUNT(*) FROM Appointments WHERE department_id = d.id AND appointment_date = '${today}') as appointments_today,
        (SELECT COUNT(*) FROM Beds WHERE department_id = d.id) as beds_count,
        (SELECT COUNT(*) FROM Beds WHERE department_id = d.id AND status = 'occupied') as beds_occupied
      FROM Departments d
      ORDER BY d.name
    `);

    // Recent 5 Appointments Activity
    const recentActivity = await query(`
      SELECT a.id, a.appointment_date, a.time_slot, a.token_number, a.status,
             p.full_name as patient_name,
             d.full_name as doctor_name,
             dep.name as department_name
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.id
      JOIN Doctors d ON a.doctor_id = d.id
      JOIN Departments dep ON a.department_id = dep.id
      ORDER BY a.created_at DESC
      LIMIT 6
    `);

    res.json({
      overview: {
        patientsToday: appointmentsToday,
        totalRegisteredPatients: totalPatients,
        doctorsOnDuty: doctorStats?.doctors_on_duty || 0,
        totalDoctors: doctorStats?.total_doctors || 0,
        pendingDoctorsCount,
        totalBeds,
        occupiedBeds,
        availableBeds: bedStats?.available_beds || 0,
        maintenanceBeds: bedStats?.maintenance_beds || 0,
        occupancyRate,
        appointmentsByStatus: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = curr.count;
          return acc;
        }, {}),
        departmentStats,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve hospital analytics.' });
  }
});

// POST Onboard new Doctor
router.post('/doctors', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      department_id,
      qualification,
      specialization,
      experience_years,
      room_number,
      shift_timings,
      consultation_fee
    } = req.body;

    if (!full_name || !email || !password || !department_id || !qualification || !specialization) {
      return res.status(400).json({ error: 'Please provide all required doctor credentials and credentials.' });
    }

    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)",
      [email.toLowerCase().trim(), password_hash, full_name.trim(), phone || null]
    );

    const docResult = await run(
      `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee, status, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'approved', CURRENT_TIMESTAMP)`,
      [
        userResult.lastID,
        full_name.trim(),
        department_id,
        qualification.trim(),
        specialization.trim(),
        experience_years || 1,
        room_number || 'Room 101',
        shift_timings || '09:00 AM - 05:00 PM',
        consultation_fee || 50.0
      ]
    );

    const created = await getOne(
      `SELECT d.*, dep.name as department_name, u.email, u.phone
       FROM Doctors d
       JOIN Departments dep ON d.department_id = dep.id
       JOIN Users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [docResult.lastID]
    );

    res.status(201).json({ message: 'Doctor onboarded successfully!', doctor: created });
  } catch (err) {
    console.error('Error adding doctor:', err);
    res.status(500).json({ error: 'Failed to onboard doctor.' });
  }
});

// DELETE remove doctor
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await getOne('SELECT user_id FROM Doctors WHERE id = ?', [doctorId]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Deleting from Users will cascade delete the Doctor record
    await run('DELETE FROM Users WHERE id = ?', [doctor.user_id]);

    res.json({ message: 'Doctor record removed successfully.' });
  } catch (err) {
    console.error('Error removing doctor:', err);
    res.status(500).json({ error: 'Failed to delete doctor.' });
  }
});

// GET all pending doctor registration requests
router.get('/pending-doctors', async (req, res) => {
  try {
    const pendingDoctors = await query(`
      SELECT d.*, dep.name as department_name, dep.code as department_code, u.email, u.phone, u.created_at as registered_at
      FROM Doctors d
      JOIN Departments dep ON d.department_id = dep.id
      JOIN Users u ON d.user_id = u.id
      WHERE d.status = 'pending'
      ORDER BY d.id DESC
    `);
    res.json({ pendingDoctors });
  } catch (err) {
    console.error('Error fetching pending doctors:', err);
    res.status(500).json({ error: 'Failed to retrieve pending doctor applications.' });
  }
});

// PUT Approve doctor registration
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doc = await getOne('SELECT id, user_id, full_name, status FROM Doctors WHERE id = ?', [doctorId]);
    if (!doc) {
      return res.status(404).json({ error: 'Doctor application not found.' });
    }

    await run(
      `UPDATE Doctors 
       SET status = 'approved', approved_at = CURRENT_TIMESTAMP, is_on_duty = 1 
       WHERE id = ?`,
      [doctorId]
    );

    const updatedDoc = await getOne(
      `SELECT d.*, dep.name as department_name, u.email, u.phone
       FROM Doctors d
       JOIN Departments dep ON d.department_id = dep.id
       JOIN Users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [doctorId]
    );

    res.json({
      message: `Physician Dr. ${doc.full_name} approved successfully! Their clinical portal access is now active.`,
      doctor: updatedDoc,
      doctorId: Number(doctorId),
      status: 'approved'
    });
  } catch (err) {
    console.error('Error approving doctor:', err);
    res.status(500).json({ error: 'Failed to approve doctor application.' });
  }
});

// PUT Reject doctor registration
router.put('/doctors/:id/reject', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doc = await getOne('SELECT id, user_id, full_name FROM Doctors WHERE id = ?', [doctorId]);
    if (!doc) {
      return res.status(404).json({ error: 'Doctor application not found.' });
    }

    await run(
      `UPDATE Doctors SET status = 'rejected', is_on_duty = 0 WHERE id = ?`,
      [doctorId]
    );

    res.json({
      message: `Registration application for Dr. ${doc.full_name} has been rejected.`,
      doctorId: Number(doctorId),
      status: 'rejected'
    });
  } catch (err) {
    console.error('Error rejecting doctor:', err);
    res.status(500).json({ error: 'Failed to reject doctor application.' });
  }
});

// PUT update hospital branding settings (Admin only)
router.put('/hospital-settings', async (req, res) => {
  try {
    const { hospital_name, tagline, address, contact_phone, emergency_phone, email, license_number, currency_symbol, currency_code } = req.body;

    if (!hospital_name || !hospital_name.trim()) {
      return res.status(400).json({ error: 'Hospital name cannot be empty.' });
    }

    await run(
      `UPDATE HospitalSettings
       SET hospital_name = ?, tagline = ?, address = ?, contact_phone = ?, emergency_phone = ?, email = ?, license_number = ?, currency_symbol = ?, currency_code = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [
        hospital_name.trim(),
        tagline?.trim() || null,
        address?.trim() || null,
        contact_phone?.trim() || null,
        emergency_phone?.trim() || null,
        email?.trim() || null,
        license_number?.trim() || null,
        currency_symbol?.trim() || '₹',
        currency_code?.trim() || 'INR'
      ]
    );

    const updated = await getOne('SELECT * FROM HospitalSettings WHERE id = 1');
    res.json({ message: 'Hospital branding and currency settings updated successfully!', hospital: updated });
  } catch (err) {
    console.error('Error updating hospital settings:', err);
    res.status(500).json({ error: 'Failed to update hospital settings.' });
  }
});

export default router;

