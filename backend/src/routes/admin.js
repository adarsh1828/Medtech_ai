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

    // Pending Staff Approvals (Doctors, Nurses, Cleaning Staff)
    const pendingDocsRow = await getOne(`SELECT COUNT(*) as count FROM Doctors WHERE status = 'pending'`);
    const pendingDoctorsCount = pendingDocsRow?.count || 0;

    const pendingNursesRow = await getOne(`SELECT COUNT(*) as count FROM Nurses WHERE status = 'pending'`);
    const pendingNursesCount = pendingNursesRow?.count || 0;

    const pendingCleanersRow = await getOne(`SELECT COUNT(*) as count FROM HousekeepingStaff WHERE status = 'pending'`);
    const pendingCleanersCount = pendingCleanersRow?.count || 0;

    const totalPendingStaff = pendingDoctorsCount + pendingNursesCount + pendingCleanersCount;

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
        pendingNursesCount,
        pendingCleanersCount,
        totalPendingStaff,
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

// GET all pending staff registration requests (Doctors, Nurses, Cleaning Staff)
router.get('/pending-staff', async (req, res) => {
  try {
    const pendingDoctors = await query(`
      SELECT d.*, dep.name as department_name, dep.code as department_code, u.email, u.phone, u.created_at as registered_at
      FROM Doctors d
      LEFT JOIN Departments dep ON d.department_id = dep.id
      JOIN Users u ON d.user_id = u.id
      WHERE d.status = 'pending'
      ORDER BY d.id DESC
    `);

    const pendingNurses = await query(`
      SELECT n.*, dep.name as department_name, u.email, u.phone, u.created_at as registered_at
      FROM Nurses n
      LEFT JOIN Departments dep ON n.department_id = dep.id
      JOIN Users u ON n.user_id = u.id
      WHERE n.status = 'pending'
      ORDER BY n.id DESC
    `);

    const pendingCleaners = await query(`
      SELECT h.*, u.email, u.phone, u.created_at as registered_at
      FROM HousekeepingStaff h
      JOIN Users u ON h.user_id = u.id
      WHERE h.status = 'pending'
      ORDER BY h.id DESC
    `);

    res.json({
      pendingDoctors: pendingDoctors || [],
      pendingNurses: pendingNurses || [],
      pendingCleaners: pendingCleaners || [],
      totalPending: (pendingDoctors?.length || 0) + (pendingNurses?.length || 0) + (pendingCleaners?.length || 0)
    });
  } catch (err) {
    console.error('Error fetching pending staff:', err);
    res.status(500).json({ error: 'Failed to retrieve pending staff applications.' });
  }
});

// POST Approve or Reject any staff member (Doctor, Nurse, Cleaner)
router.post('/approve-staff', async (req, res) => {
  try {
    const { staffType, id, action } = req.body;
    if (!staffType || !id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid staffType, id, and action (approve/reject) are required.' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const onDuty = action === 'approve' ? 1 : 0;

    if (staffType === 'doctor') {
      const doc = await getOne('SELECT id, full_name, user_id FROM Doctors WHERE id = ?', [id]);
      if (!doc) return res.status(404).json({ error: 'Doctor not found.' });
      await run('UPDATE Doctors SET status = ?, approved_at = CURRENT_TIMESTAMP, is_on_duty = ? WHERE id = ?', [newStatus, onDuty, id]);
      try {
        await run(
          `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [req.user?.id || null, req.user?.email || 'admin', action === 'approve' ? 'STAFF_APPROVED' : 'STAFF_REJECTED', req.ip || '127.0.0.1', req.headers['user-agent'] || 'System', `Admin updated doctor ${doc.full_name} status to ${newStatus}`]
        );
      } catch (e) {}
      return res.json({ message: `Doctor Dr. ${doc.full_name} has been ${newStatus}.`, staffType, id, status: newStatus });
    }

    if (staffType === 'nurse') {
      const nurse = await getOne('SELECT id, full_name, user_id FROM Nurses WHERE id = ?', [id]);
      if (!nurse) return res.status(404).json({ error: 'Nurse not found.' });
      await run('UPDATE Nurses SET status = ?, approved_at = CURRENT_TIMESTAMP, is_on_duty = ? WHERE id = ?', [newStatus, onDuty, id]);
      try {
        await run(
          `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [req.user?.id || null, req.user?.email || 'admin', action === 'approve' ? 'STAFF_APPROVED' : 'STAFF_REJECTED', req.ip || '127.0.0.1', req.headers['user-agent'] || 'System', `Admin updated nurse ${nurse.full_name} status to ${newStatus}`]
        );
      } catch (e) {}
      return res.json({ message: `Staff Nurse ${nurse.full_name} has been ${newStatus}.`, staffType, id, status: newStatus });
    }

    if (staffType === 'cleaning') {
      const cleaner = await getOne('SELECT id, full_name, user_id FROM HousekeepingStaff WHERE id = ?', [id]);
      if (!cleaner) return res.status(404).json({ error: 'Sanitation staff not found.' });
      await run('UPDATE HousekeepingStaff SET status = ?, approved_at = CURRENT_TIMESTAMP, is_on_duty = ? WHERE id = ?', [newStatus, onDuty, id]);
      try {
        await run(
          `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [req.user?.id || null, req.user?.email || 'admin', action === 'approve' ? 'STAFF_APPROVED' : 'STAFF_REJECTED', req.ip || '127.0.0.1', req.headers['user-agent'] || 'System', `Admin updated cleaner ${cleaner.full_name} status to ${newStatus}`]
        );
      } catch (e) {}
      return res.json({ message: `Sanitation staff ${cleaner.full_name} has been ${newStatus}.`, staffType, id, status: newStatus });
    }

    return res.status(400).json({ error: 'Unknown staffType.' });
  } catch (err) {
    console.error('Error approving staff:', err);
    res.status(500).json({ error: 'Failed to process staff approval.' });
  }
});

// PUT Approve nurse registration
router.put('/nurses/:id/approve', async (req, res) => {
  try {
    const nurseId = req.params.id;
    const nurse = await getOne('SELECT id, full_name FROM Nurses WHERE id = ?', [nurseId]);
    if (!nurse) return res.status(404).json({ error: 'Nurse application not found.' });

    await run("UPDATE Nurses SET status = 'approved', approved_at = CURRENT_TIMESTAMP, is_on_duty = 1 WHERE id = ?", [nurseId]);
    res.json({ message: `Staff Nurse ${nurse.full_name} approved successfully!`, status: 'approved' });
  } catch (err) {
    console.error('Error approving nurse:', err);
    res.status(500).json({ error: 'Failed to approve nurse.' });
  }
});

// PUT Reject nurse registration
router.put('/nurses/:id/reject', async (req, res) => {
  try {
    const nurseId = req.params.id;
    const nurse = await getOne('SELECT id, full_name FROM Nurses WHERE id = ?', [nurseId]);
    if (!nurse) return res.status(404).json({ error: 'Nurse application not found.' });

    await run("UPDATE Nurses SET status = 'rejected', is_on_duty = 0 WHERE id = ?", [nurseId]);
    res.json({ message: `Staff Nurse ${nurse.full_name} application rejected.`, status: 'rejected' });
  } catch (err) {
    console.error('Error rejecting nurse:', err);
    res.status(500).json({ error: 'Failed to reject nurse.' });
  }
});

// PUT Approve cleaning staff registration
router.put('/cleaning/:id/approve', async (req, res) => {
  try {
    const cleanerId = req.params.id;
    const cleaner = await getOne('SELECT id, full_name FROM HousekeepingStaff WHERE id = ?', [cleanerId]);
    if (!cleaner) return res.status(404).json({ error: 'Sanitation staff not found.' });

    await run("UPDATE HousekeepingStaff SET status = 'approved', approved_at = CURRENT_TIMESTAMP, is_on_duty = 1 WHERE id = ?", [cleanerId]);
    res.json({ message: `Sanitation staff ${cleaner.full_name} approved successfully!`, status: 'approved' });
  } catch (err) {
    console.error('Error approving cleaning staff:', err);
    res.status(500).json({ error: 'Failed to approve sanitation staff.' });
  }
});

// PUT Reject cleaning staff registration
router.put('/cleaning/:id/reject', async (req, res) => {
  try {
    const cleanerId = req.params.id;
    const cleaner = await getOne('SELECT id, full_name FROM HousekeepingStaff WHERE id = ?', [cleanerId]);
    if (!cleaner) return res.status(404).json({ error: 'Sanitation staff not found.' });

    await run("UPDATE HousekeepingStaff SET status = 'rejected', is_on_duty = 0 WHERE id = ?", [cleanerId]);
    res.json({ message: `Sanitation staff ${cleaner.full_name} application rejected.`, status: 'rejected' });
  } catch (err) {
    console.error('Error rejecting cleaning staff:', err);
    res.status(500).json({ error: 'Failed to reject sanitation staff.' });
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

// GET all nurses for Admin Duty & Ward Dispatch
router.get('/nurses', async (req, res) => {
  try {
    const nurses = await query(`
      SELECT n.*, u.email, u.phone, dep.name as department_name, dep.code as department_code
      FROM Nurses n
      JOIN Users u ON n.user_id = u.id
      LEFT JOIN Departments dep ON n.department_id = dep.id
      ORDER BY n.is_on_duty DESC, n.assigned_ward ASC, n.full_name ASC
    `);

    // Grouping by ward for quick summary
    const wardCounts = nurses.reduce((acc, curr) => {
      const w = curr.assigned_ward || 'Unassigned';
      acc[w] = (acc[w] || 0) + (curr.is_on_duty ? 1 : 0);
      return acc;
    }, {});

    res.json({
      nurses,
      totalNurses: nurses.length,
      onDutyCount: nurses.filter(n => n.is_on_duty === 1).length,
      wardCounts
    });
  } catch (err) {
    console.error('Error fetching admin nurses:', err);
    res.status(500).json({ error: 'Failed to retrieve nursing staff directory.' });
  }
});

// PATCH assign Nurse to Ward/ICU, Shift & Duty Status (Admin Duty Dispatcher)
router.patch('/nurses/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_ward, shift_timings, is_on_duty, notes } = req.body;

    const nurse = await getOne('SELECT * FROM Nurses WHERE id = ?', [id]);
    if (!nurse) {
      return res.status(404).json({ error: 'Nurse record not found.' });
    }

    const newWard = assigned_ward !== undefined ? assigned_ward.trim() : nurse.assigned_ward;
    const newShift = shift_timings !== undefined ? shift_timings.trim() : nurse.shift_timings;
    const newDuty = is_on_duty !== undefined ? (is_on_duty ? 1 : 0) : nurse.is_on_duty;

    await run(
      `UPDATE Nurses
       SET assigned_ward = ?,
           shift_timings = ?,
           is_on_duty = ?
       WHERE id = ?`,
      [newWard, newShift, newDuty, id]
    );

    // Audit log
    try {
      await run(
        `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user?.id || null,
          req.user?.email || 'admin',
          'NURSE_DUTY_ASSIGNED',
          req.ip || '127.0.0.1',
          req.headers['user-agent'] || 'System',
          `Admin assigned Nurse ${nurse.full_name} to ${newWard} (${newShift}) [On Duty: ${newDuty === 1 ? 'YES' : 'NO'}]`
        ]
      );
    } catch (e) {}

    const updated = await getOne(
      `SELECT n.*, u.email, u.phone FROM Nurses n JOIN Users u ON n.user_id = u.id WHERE n.id = ?`,
      [id]
    );

    res.json({
      message: `Nurse ${nurse.full_name} assigned to ${newWard} (${newShift}) successfully!`,
      nurse: updated
    });
  } catch (err) {
    console.error('Error updating nurse assignment:', err);
    res.status(500).json({ error: 'Failed to update nurse assignment.' });
  }
});

// GET all Cleaning Staff for Admin Dispatch & Housekeeping Roster
router.get('/cleaners', async (req, res) => {
  try {
    const cleaners = await query(`
      SELECT h.*, u.email, u.phone,
        (SELECT COUNT(*) FROM CleaningTasks WHERE (assigned_cleaner_id = h.id OR assigned_cleaner_name = h.full_name) AND task_status != 'completed') as active_tasks_count
      FROM HousekeepingStaff h
      JOIN Users u ON h.user_id = u.id
      ORDER BY h.is_on_duty DESC, h.full_name ASC
    `);

    res.json({
      cleaners,
      totalCleaners: cleaners.length,
      onDutyCount: cleaners.filter(c => c.is_on_duty === 1).length
    });
  } catch (err) {
    console.error('Error fetching admin cleaners:', err);
    res.status(500).json({ error: 'Failed to retrieve housekeeping staff.' });
  }
});

// PATCH assign Cleaning Staff to Area, Shift & Duty Status
router.patch('/cleaners/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_area, shift_timings, is_on_duty } = req.body;

    const cleaner = await getOne('SELECT * FROM HousekeepingStaff WHERE id = ?', [id]);
    if (!cleaner) {
      return res.status(404).json({ error: 'Cleaning staff record not found.' });
    }

    const newArea = assigned_area !== undefined ? assigned_area.trim() : cleaner.assigned_area;
    const newShift = shift_timings !== undefined ? shift_timings.trim() : cleaner.shift_timings;
    const newDuty = is_on_duty !== undefined ? (is_on_duty ? 1 : 0) : cleaner.is_on_duty;

    await run(
      `UPDATE HousekeepingStaff
       SET assigned_area = ?,
           shift_timings = ?,
           is_on_duty = ?
       WHERE id = ?`,
      [newArea, newShift, newDuty, id]
    );

    // Audit log
    try {
      await run(
        `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user?.id || null,
          req.user?.email || 'admin',
          'CLEANER_DUTY_ASSIGNED',
          req.ip || '127.0.0.1',
          req.headers['user-agent'] || 'System',
          `Admin assigned Sanitation Staff ${cleaner.full_name} to ${newArea} (${newShift}) [On Duty: ${newDuty === 1 ? 'YES' : 'NO'}]`
        ]
      );
    } catch (e) {}

    const updated = await getOne(
      `SELECT h.*, u.email, u.phone FROM HousekeepingStaff h JOIN Users u ON h.user_id = u.id WHERE h.id = ?`,
      [id]
    );

    res.json({
      message: `Sanitation Staff ${cleaner.full_name} assigned to ${newArea} successfully!`,
      cleaner: updated
    });
  } catch (err) {
    console.error('Error assigning cleaning staff:', err);
    res.status(500).json({ error: 'Failed to assign cleaning staff.' });
  }
});

// POST Admin Dispatches a Cleaning Task to Specific Cleaner
router.post('/cleaning-tasks', async (req, res) => {
  try {
    const { area_name, area_code, area_type = 'Ward Bed', cleaner_id, cleaner_name, priority = 'routine', notes, cleaning_frequency_hours = 4 } = req.body;

    if (!area_name) {
      return res.status(400).json({ error: 'Area name or room/bed identifier is required.' });
    }

    // Auto-generate code if not provided
    const code = (area_code && area_code.trim()) 
      ? area_code.trim().toUpperCase() 
      : `TASK-${Date.now().toString().slice(-6)}`;

    // Check if task with this area_code already exists
    let existing = await getOne('SELECT id FROM CleaningTasks WHERE area_code = ?', [code]);
    let taskId = null;

    if (existing) {
      // Re-dispatch existing task
      taskId = existing.id;
      await run(
        `UPDATE CleaningTasks
         SET area_name = ?,
             area_type = ?,
             assigned_cleaner_id = ?,
             assigned_cleaner_name = ?,
             priority = ?,
             task_status = 'pending',
             status = 'due',
             notes = ?
         WHERE id = ?`,
        [area_name.trim(), area_type, cleaner_id || null, cleaner_name || 'Staff Cleaner', priority, notes || 'Admin Dispatched Cleaning Task', taskId]
      );
    } else {
      // Insert new task
      const result = await run(
        `INSERT INTO CleaningTasks (area_name, area_code, area_type, cleaning_frequency_hours, assigned_cleaner_id, assigned_cleaner_name, priority, task_status, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'due', ?)`,
        [area_name.trim(), code, area_type, Number(cleaning_frequency_hours) || 4, cleaner_id || null, cleaner_name || 'Staff Cleaner', priority, notes || 'Admin Dispatched Cleaning Task']
      );
      taskId = result.lastID;
    }

    const task = await getOne('SELECT * FROM CleaningTasks WHERE id = ?', [taskId]);

    res.status(201).json({
      message: `Cleaning task dispatched to ${cleaner_name || 'staff'} successfully!`,
      task
    });
  } catch (err) {
    console.error('Error dispatching cleaning task:', err);
    res.status(500).json({ error: 'Failed to dispatch cleaning task.' });
  }
});

// GET all Cleaning Tasks for Admin Control
router.get('/cleaning-tasks', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM CleaningTasks ORDER BY CASE priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 ELSE 3 END, created_at DESC');
    res.json({ tasks });
  } catch (err) {
    console.error('Error fetching admin cleaning tasks:', err);
    res.status(500).json({ error: 'Failed to retrieve cleaning tasks.' });
  }
});

export default router;

