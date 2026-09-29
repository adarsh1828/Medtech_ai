import express from 'express';
import bcrypt from 'bcryptjs';
import { query, getOne, run } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register Patient
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, dob, gender, blood_group, allergies, emergency_contact, address } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide email, password, and full name.' });
    }

    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'patient', ?, ?)",
      [email.toLowerCase().trim(), password_hash, full_name.trim(), phone || null]
    );

    const patientResult = await run(
      `INSERT INTO Patients (user_id, full_name, dob, gender, blood_group, phone, emergency_contact, address, allergies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userResult.lastID,
        full_name.trim(),
        dob || null,
        gender || 'Other',
        blood_group || null,
        phone || null,
        emergency_contact || null,
        address || null,
        allergies || 'None reported'
      ]
    );

    const token = generateToken({
      userId: userResult.lastID,
      role: 'patient',
      patientId: patientResult.lastID,
      email: email.toLowerCase().trim(),
      fullName: full_name.trim()
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userResult.lastID,
        email: email.toLowerCase().trim(),
        role: 'patient',
        fullName: full_name.trim(),
        patientId: patientResult.lastID
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete patient registration. Please try again.' });
  }
});

// POST Send OTP for 2FA Email Verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'doctor_registration' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required to receive OTP.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists when registering
    if (purpose === 'doctor_registration' || purpose === 'registration') {
      const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      }
    } else if (purpose === 'forgot_password') {
      const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
      if (!existingUser) {
        return res.status(404).json({ error: 'No hospital account found with this email address. Please check the spelling or register.' });
      }
    }

    // Generate secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryIso = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    // Delete any old OTP requests for this email and purpose
    await run('DELETE FROM OtpVerifications WHERE email = ? AND purpose = ?', [cleanEmail, purpose]);

    // Insert new OTP record (universal ISO timestamp for SQLite and LibSQL/Turso)
    await run(
      'INSERT INTO OtpVerifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [cleanEmail, otpCode, purpose, expiryIso]
    );

    console.log(`[2FA OTP] Verification code generated for ${cleanEmail} (${purpose}): ${otpCode}`);

    res.json({
      success: true,
      message: `6-digit security code sent to ${cleanEmail}. Valid for 10 minutes.`,
      email: cleanEmail,
      demoOtp: otpCode // Provided in response for easy testing in live demo
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to dispatch verification OTP.' });
  }
});

// POST Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'doctor_registration' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const record = await getOne(
      `SELECT * FROM OtpVerifications 
       WHERE email = ? AND purpose = ? AND otp_code = ? AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, purpose, cleanOtp]
    );

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check and try again.' });
    }

    await run('UPDATE OtpVerifications SET verified_at = CURRENT_TIMESTAMP WHERE id = ?', [record.id]);

    res.json({
      success: true,
      message: 'Email address verified successfully! You may now proceed.'
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP code.' });
  }
});

// POST Reset Password (Forgot Password flow)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email, verification OTP code, and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Verify OTP record exists, matches, and has not expired
    const record = await getOne(
      `SELECT * FROM OtpVerifications 
       WHERE email = ? AND purpose = 'forgot_password' AND otp_code = ? AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new OTP.' });
    }

    // Verify user exists in Users table
    const user = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email.' });
    }

    // Hash the new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // Update user password in database
    await run('UPDATE Users SET password_hash = ? WHERE id = ?', [password_hash, user.id]);

    // Clean up OTP entries for this email and purpose to prevent replay
    await run("DELETE FROM OtpVerifications WHERE email = ? AND purpose = 'forgot_password'", [cleanEmail]);

    console.log(`[Auth] Password successfully reset for user ${cleanEmail}`);

    res.json({
      success: true,
      message: 'Password reset successfully! Please sign in with your new password.'
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// Register Doctor (Self-Registration with 2FA Email Verification)
router.post('/register-doctor', async (req, res) => {
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
      consultation_fee,
      otp
    } = req.body;

    if (!full_name || !email || !password || !department_id || !qualification || !specialization) {
      return res.status(400).json({
        error: 'Please provide full name, email, password, department, qualification, and specialization.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();


    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)",
      [cleanEmail, password_hash, full_name.trim(), phone || null]
    );

    const docResult = await run(
      `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending')`,
      [
        userResult.lastID,
        full_name.trim(),
        Number(department_id),
        qualification.trim(),
        specialization.trim(),
        Number(experience_years) || 3,
        room_number?.trim() || 'Room 102',
        shift_timings || '09:00 AM - 05:00 PM',
        Number(consultation_fee) || 500.0
      ]
    );


    // SECURITY: Self-registered doctors are NOT auto-logged in.
    // They must wait for hospital administrator verification before logging in.
    res.status(201).json({
      message: 'Physician application submitted successfully! Your account is pending administrator verification. Once approved, you will be able to log in.',
      pendingApproval: true,
      user: {
        id: userResult.lastID,
        email: email.toLowerCase().trim(),
        role: 'doctor',
        fullName: full_name.trim(),
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('Doctor registration error:', err);
    res.status(500).json({ error: 'Failed to complete doctor registration. Please try again.' });
  }
});

// Register Hospital Super Admin (With Master Setup Security Key)
router.post('/register-admin', async (req, res) => {
  try {
    const { full_name, email, password, phone, designation, hospital_name, setup_key } = req.body;

    if (!full_name || !email || !password || !setup_key) {
      return res.status(400).json({
        error: 'Please provide full name, email, password, and hospital master setup key.'
      });
    }

    const MASTER_KEY = process.env.ADMIN_SETUP_KEY || 'MEDTECH-ADMIN-2026';
    if (setup_key.trim() !== MASTER_KEY) {
      return res.status(403).json({
        error: 'Invalid Hospital Master Setup Key. Authorization denied.'
      });
    }

    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const displayName = designation && designation.trim()
      ? `${full_name.trim()} (${designation.trim()})`
      : full_name.trim();

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'admin', ?, ?)",
      [email.toLowerCase().trim(), password_hash, displayName, phone || null]
    );

    // If hospital_name is provided, update HospitalSettings table
    if (hospital_name && hospital_name.trim()) {
      await run(
        `UPDATE HospitalSettings SET hospital_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [hospital_name.trim()]
      );
    }

    const hospitalSettings = await getOne('SELECT * FROM HospitalSettings WHERE id = 1');

    const tokenPayload = {
      userId: userResult.lastID,
      role: 'admin',
      email: email.toLowerCase().trim(),
      fullName: displayName
    };

    const token = generateToken(tokenPayload);

    res.status(201).json({
      message: 'Hospital Administrator registered successfully!',
      token,
      user: {
        id: userResult.lastID,
        email: email.toLowerCase().trim(),
        role: 'admin',
        fullName: displayName,
        phone: phone || null
      },
      hospital: hospitalSettings
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ error: 'Failed to complete administrator registration. Please try again.' });
  }
});

// Register Staff Nurse
router.post('/register-nurse', async (req, res) => {
  try {
    const { full_name, email, password, phone, assigned_ward, qualification, shift_timings, department_id } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'nurse', ?, ?)",
      [cleanEmail, password_hash, full_name.trim(), phone || null]
    );

    const nurseResult = await run(
      `INSERT INTO Nurses (user_id, full_name, department_id, shift_timings, assigned_ward, qualification, phone, is_on_duty, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending')`,
      [
        userResult.lastID,
        full_name.trim(),
        department_id ? Number(department_id) : 1,
        shift_timings || '08:00 AM - 04:00 PM',
        assigned_ward || 'General Ward & ICU',
        qualification || 'B.Sc Nursing / GNM',
        phone || null
      ]
    );

    res.status(201).json({
      message: 'Staff Nurse application submitted successfully! Your account is pending administrator verification. Once approved, you will be able to log in.',
      pendingApproval: true,
      user: {
        id: userResult.lastID,
        email: cleanEmail,
        role: 'nurse',
        fullName: full_name.trim(),
        nurseId: nurseResult.lastID,
        assignedWard: assigned_ward || 'General Ward & ICU',
        shiftTimings: shift_timings || '08:00 AM - 04:00 PM',
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('Nurse registration error:', err);
    res.status(500).json({ error: 'Failed to complete nurse registration. Please try again.' });
  }
});

// Register Housekeeping / Cleaning Staff
router.post('/register-cleaning', async (req, res) => {
  try {
    const { full_name, email, password, phone, assigned_area, shift_timings } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'cleaning', ?, ?)",
      [cleanEmail, password_hash, full_name.trim(), phone || null]
    );

    const cleanerResult = await run(
      `INSERT INTO HousekeepingStaff (user_id, full_name, assigned_area, shift_timings, phone, is_on_duty, status)
       VALUES (?, ?, ?, ?, ?, 0, 'pending')`,
      [
        userResult.lastID,
        full_name.trim(),
        assigned_area || 'General Ward, ICU & Restrooms',
        shift_timings || '07:00 AM - 03:00 PM',
        phone || null
      ]
    );

    res.status(201).json({
      message: 'Housekeeping & sanitation application submitted successfully! Your account is pending administrator verification. Once approved, you will be able to log in.',
      pendingApproval: true,
      user: {
        id: userResult.lastID,
        email: cleanEmail,
        role: 'cleaning',
        fullName: full_name.trim(),
        cleanerId: cleanerResult.lastID,
        assignedArea: assigned_area || 'General Ward, ICU & Restrooms',
        shiftTimings: shift_timings || '07:00 AM - 03:00 PM',
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('Housekeeping registration error:', err);
    res.status(500).json({ error: 'Failed to complete housekeeping registration. Please try again.' });
  }
});

// Register General Hospital Staff (Reception, Lab, Pharmacy, Operations)
router.post('/register-staff', async (req, res) => {
  try {
    const { full_name, email, password, phone, designation, department, shift_timings } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'staff', ?, ?)",
      [cleanEmail, password_hash, full_name.trim(), phone || null]
    );

    const staffResult = await run(
      `INSERT INTO HospitalStaff (user_id, full_name, designation, department, shift_timings, phone, is_on_duty)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        userResult.lastID,
        full_name.trim(),
        designation || 'Front Desk & Patient Services',
        department || 'General Administration',
        shift_timings || '09:00 AM - 05:00 PM',
        phone || null
      ]
    );

    const token = generateToken({
      userId: userResult.lastID,
      role: 'staff',
      staffId: staffResult.lastID,
      email: cleanEmail,
      fullName: full_name.trim(),
      designation: designation || 'Front Desk & Patient Services',
      department: department || 'General Administration'
    });

    res.status(201).json({
      message: 'Hospital Staff account registered successfully!',
      token,
      user: {
        id: userResult.lastID,
        email: cleanEmail,
        role: 'staff',
        fullName: full_name.trim(),
        staffId: staffResult.lastID,
        designation: designation || 'Front Desk & Patient Services',
        department: department || 'General Administration',
        shiftTimings: shift_timings || '09:00 AM - 05:00 PM'
      }
    });
  } catch (err) {
    console.error('Hospital staff registration error:', err);
    res.status(500).json({ error: 'Failed to complete hospital staff registration. Please try again.' });
  }
});

// Login

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const nowIso = new Date().toISOString();

    // 1. Check if IP or Account is temporarily locked and fetch user simultaneously
    const [activeLock, user] = await Promise.all([
      getOne(
        `SELECT id, locked_until FROM FailedLoginAttempts 
         WHERE (identifier = ? OR ip_address = ?) 
           AND locked_until IS NOT NULL 
           AND locked_until > ? 
         ORDER BY id DESC LIMIT 1`,
        [cleanEmail, clientIp, nowIso]
      ),
      getOne('SELECT * FROM Users WHERE email = ?', [cleanEmail])
    ]);

    if (activeLock) {
      const lockUntilStr = activeLock.locked_until.endsWith('Z') ? activeLock.locked_until : activeLock.locked_until + 'Z';
      const lockUntilMs = new Date(lockUntilStr).getTime();
      const minutesLeft = Math.max(1, Math.ceil((lockUntilMs - Date.now()) / (60 * 1000)));
      return res.status(429).json({
        error: `सुरक्षा ब्लॉक: सलग १० वेळा चुकीचा पासवर्ड टाकल्यामुळे तुमचा IP ॲड्रेस तात्पुरता ब्लॉक करण्यात आला आहे. कृपया ${minutesLeft} मिनिटांनी पुन्हा प्रयत्न करा किंवा 'Forgot Password' वापरा.`,
        isLocked: true,
        lockedMinutes: minutesLeft,
        remainingAttempts: 0
      });
    }

    let isMatch = user ? await bcrypt.compare(password, user.password_hash) : false;
    // Smart fallback: If direct match fails, try with capitalized or lowercase first letter (prevents case confusion like ramesh@123 vs Ramesh@123)
    if (!isMatch && user && password) {
      const toggled = password.charAt(0) === password.charAt(0).toUpperCase()
        ? password.charAt(0).toLowerCase() + password.slice(1)
        : password.charAt(0).toUpperCase() + password.slice(1);
      isMatch = await bcrypt.compare(toggled, user.password_hash);
    }

    if (!user || !isMatch) {
      // Find or create failed attempt record
      const existingAttempt = await getOne(
        `SELECT * FROM FailedLoginAttempts WHERE identifier = ? OR ip_address = ? ORDER BY id DESC LIMIT 1`,
        [cleanEmail, clientIp]
      );

      const count = existingAttempt ? Number(existingAttempt.attempt_count || 0) + 1 : 1;

      if (count >= 10) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        if (existingAttempt) {
          await run(
            `UPDATE FailedLoginAttempts SET attempt_count = ?, last_failed_at = CURRENT_TIMESTAMP, locked_until = ? WHERE id = ?`,
            [count, lockedUntil, existingAttempt.id]
          );
        } else {
          await run(
            `INSERT INTO FailedLoginAttempts (identifier, ip_address, attempt_count, locked_until) VALUES (?, ?, ?, ?)`,
            [cleanEmail, clientIp, count, lockedUntil]
          );
        }

        // Security Audit Log
        try {
          await run(
            `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, 'ACCOUNT_LOCKED_BRUTE_FORCE', ?, ?, 'Temporary 15m lockout after 10 failed login attempts')`,
            [user?.id || null, cleanEmail, clientIp, userAgent]
          );
        } catch (e) {}

        return res.status(429).json({
          error: 'सुरक्षा इशारा: सलग १० वेळा चुकीचा पासवर्ड टाकल्यामुळे तुमचा IP ॲड्रेस १५ मिनिटांसाठी तात्पुरता ब्लॉक करण्यात आला आहे. कृपया १५ मिनिटांनी पुन्हा प्रयत्न करा किंवा पासवर्ड रीसेट करा.',
          isLocked: true,
          lockedMinutes: 15,
          remainingAttempts: 0
        });
      } else {
        const remaining = 10 - count;
        if (existingAttempt) {
          await run(
            `UPDATE FailedLoginAttempts SET attempt_count = ?, last_failed_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [count, existingAttempt.id]
          );
        } else {
          await run(
            `INSERT INTO FailedLoginAttempts (identifier, ip_address, attempt_count) VALUES (?, ?, ?)`,
            [cleanEmail, clientIp, count]
          );
        }

        // Security Audit Log
        try {
          await run(
            `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, 'LOGIN_FAILED', ?, ?, ?)`,
            [user?.id || null, cleanEmail, clientIp, userAgent, `Failed login attempt ${count}/10`]
          );
        } catch (e) {}

        return res.status(401).json({
          error: `चुकीचा ईमेल किंवा पासवर्ड! सुरक्षेसाठी तुमच्याकडे अजून ${remaining} प्रयत्न शिल्लक आहेत, अन्यथा सायबर सुरक्षेसाठी तुमचा IP तात्पुरता ब्लॉक केला जाईल.`,
          remainingAttempts: remaining,
          attemptCount: count
        });
      }
    }

    // Login Succeeded: Non-blocking audit log and failed attempts cleanup
    run(`DELETE FROM FailedLoginAttempts WHERE identifier = ? OR ip_address = ?`, [cleanEmail, clientIp]).catch(() => {});
    run(
      `INSERT INTO SecurityAuditLogs (user_id, email, action, ip_address, user_agent, details) VALUES (?, ?, 'LOGIN_SUCCESS', ?, ?, 'Successful user session established')`,
      [user.id, cleanEmail, clientIp, userAgent]
    ).catch(() => {});

    let extraData = {};
    if (user.role === 'patient') {
      const patient = await getOne('SELECT id, blood_group, allergies FROM Patients WHERE user_id = ?', [user.id]);
      if (patient) {
        extraData.patientId = patient.id;
        extraData.bloodGroup = patient.blood_group;
      }
    } else if (user.role === 'doctor') {
      const doctor = await getOne(
        `SELECT d.id, d.specialization, d.room_number, d.is_on_duty, d.status, dep.name as department_name
         FROM Doctors d
         LEFT JOIN Departments dep ON d.department_id = dep.id
         WHERE d.user_id = ?`,
        [user.id]
      );
      if (!doctor) {
        return res.status(401).json({ error: 'Doctor profile record not found.' });
      }

      // Check approval status: Pending or Rejected doctors cannot log in
      const docStatus = doctor.status || 'approved';
      if (docStatus === 'pending') {
        return res.status(403).json({
          error: 'Your doctor registration is pending administrator approval. Please wait until the hospital administrator verifies and activates your credentials.',
          pendingApproval: true,
          status: 'pending'
        });
      }

      if (docStatus === 'rejected') {
        return res.status(403).json({
          error: 'Your doctor registration application was declined by the hospital administration. Please contact management.',
          status: 'rejected'
        });
      }

      extraData.doctorId = doctor.id;
      extraData.specialization = doctor.specialization;
      extraData.departmentName = doctor.department_name;
      extraData.roomNumber = doctor.room_number;
      extraData.isOnDuty = !!doctor.is_on_duty;
      extraData.status = docStatus;
    } else if (user.role === 'nurse') {
      const nurse = await getOne(
        `SELECT n.id, n.assigned_ward, n.shift_timings, n.qualification, n.is_on_duty, n.status, dep.name as department_name
         FROM Nurses n
         LEFT JOIN Departments dep ON n.department_id = dep.id
         WHERE n.user_id = ?`,
        [user.id]
      );
      if (nurse) {
        const nurseStatus = nurse.status || 'approved';
        if (nurseStatus === 'pending') {
          return res.status(403).json({
            error: 'Your nurse registration is pending administrator approval. Please wait until the hospital administrator verifies and activates your account.',
            pendingApproval: true,
            status: 'pending'
          });
        }
        if (nurseStatus === 'rejected') {
          return res.status(403).json({
            error: 'Your nurse registration application was declined by hospital administration.',
            status: 'rejected'
          });
        }
        extraData.nurseId = nurse.id;
        extraData.assignedWard = nurse.assigned_ward;
        extraData.shiftTimings = nurse.shift_timings;
        extraData.qualification = nurse.qualification;
        extraData.isOnDuty = !!nurse.is_on_duty;
        extraData.departmentName = nurse.department_name;
        extraData.status = nurseStatus;
      }
    } else if (user.role === 'cleaning') {
      const cleaner = await getOne(
        `SELECT id, assigned_area, shift_timings, is_on_duty, status FROM HousekeepingStaff WHERE user_id = ?`,
        [user.id]
      );
      if (cleaner) {
        const cleanerStatus = cleaner.status || 'approved';
        if (cleanerStatus === 'pending') {
          return res.status(403).json({
            error: 'Your sanitation staff registration is pending administrator approval. Please wait until verified by hospital administration.',
            pendingApproval: true,
            status: 'pending'
          });
        }
        if (cleanerStatus === 'rejected') {
          return res.status(403).json({
            error: 'Your sanitation staff registration was declined by hospital administration.',
            status: 'rejected'
          });
        }
        extraData.cleanerId = cleaner.id;
        extraData.assignedArea = cleaner.assigned_area;
        extraData.shiftTimings = cleaner.shift_timings;
        extraData.isOnDuty = !!cleaner.is_on_duty;
        extraData.status = cleanerStatus;
      }
    } else if (user.role === 'staff') {
      const staffMember = await getOne(
        `SELECT id, designation, department, shift_timings, is_on_duty FROM HospitalStaff WHERE user_id = ?`,
        [user.id]
      );
      if (staffMember) {
        extraData.staffId = staffMember.id;
        extraData.designation = staffMember.designation;
        extraData.department = staffMember.department;
        extraData.shiftTimings = staffMember.shift_timings;
        extraData.isOnDuty = !!staffMember.is_on_duty;
      }
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      fullName: user.full_name,
      ...extraData
    };

    const token = generateToken(tokenPayload);

    res.json({
      message: 'Sign-in successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        phone: user.phone,
        ...extraData
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected authentication error occurred.' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getOne('SELECT id, email, role, full_name, phone, created_at FROM Users WHERE id = ?', [req.user.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let profile = { ...user };
    if (user.role === 'patient') {
      const patient = await getOne('SELECT * FROM Patients WHERE user_id = ?', [user.id]);
      profile.patient = patient;
    } else if (user.role === 'doctor') {
      const doctor = await getOne(
        `SELECT d.*, dep.name as department_name, dep.floor_number
         FROM Doctors d
         LEFT JOIN Departments dep ON d.department_id = dep.id
         WHERE d.user_id = ?`,
        [user.id]
      );
      if (doctor && doctor.status && doctor.status !== 'approved') {
        return res.status(403).json({ error: 'Your doctor account is pending administrator approval.', pendingApproval: true });
      }
      profile.doctor = doctor;
    } else if (user.role === 'nurse') {
      const nurse = await getOne(
        `SELECT id, assigned_ward, qualification, shift_timings, is_on_duty FROM Nurses WHERE user_id = ?`,
        [user.id]
      );
      if (nurse) {
        profile.nurseId = nurse.id;
        profile.assignedWard = nurse.assigned_ward;
        profile.qualification = nurse.qualification;
        profile.shiftTimings = nurse.shift_timings;
        profile.isOnDuty = !!nurse.is_on_duty;
      }
    } else if (user.role === 'cleaning') {
      const cleaner = await getOne(
        `SELECT id, assigned_area, shift_timings, is_on_duty FROM CleaningStaff WHERE user_id = ?`,
        [user.id]
      );
      if (cleaner) {
        profile.cleanerId = cleaner.id;
        profile.assignedArea = cleaner.assigned_area;
        profile.shiftTimings = cleaner.shift_timings;
        profile.isOnDuty = !!cleaner.is_on_duty;
      }
    } else if (user.role === 'staff') {
      const staffMember = await getOne(
        `SELECT id, designation, department, shift_timings, is_on_duty FROM HospitalStaff WHERE user_id = ?`,
        [user.id]
      );
      if (staffMember) {
        profile.staffId = staffMember.id;
        profile.designation = staffMember.designation;
        profile.department = staffMember.department;
        profile.shiftTimings = staffMember.shift_timings;
        profile.isOnDuty = !!staffMember.is_on_duty;
      }
    }

    res.json({ user: profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile details.' });
  }
});

// Demo accounts list for quick preview
router.get('/demo-accounts', (req, res) => {
  res.json({
    accounts: [
      {
        role: 'admin',
        label: 'Hospital Administrator',
        email: 'admin@medtech.ai',
        password: 'admin123',
        description: 'Access hospital-wide analytics, manage wards/beds, and oversee medical staff.'
      },
      {
        role: 'doctor',
        label: 'Lead Cardiologist',
        email: 'dr.sarah@medtech.ai',
        password: 'doctor123',
        description: 'View daily patient queue, conduct live consultations, and issue digital prescriptions.'
      },
      {
        role: 'doctor',
        label: 'Senior Neurologist',
        email: 'dr.arjun@medtech.ai',
        password: 'doctor123',
        description: 'Neuro-consultation schedule, patient EHR history, and diagnosis record notes.'
      },
      {
        role: 'nurse',
        label: 'Staff Nurse',
        email: 'nurse@medtech.ai',
        password: 'nurse123',
        description: 'Vitals tracking, bed rounds, IV fluid monitoring, and doctor call assist.'
      },
      {
        role: 'cleaning',
        label: 'Sanitation & Hygiene',
        email: 'cleaner@medtech.ai',
        password: 'cleaner123',
        description: 'QR checklist verification, infection control zones, and overdue cleaning alerts.'
      },
      {
        role: 'staff',
        label: 'Front Desk & Reception Staff',
        email: 'staff@medtech.ai',
        password: 'staff123',
        description: 'Patient admissions, appointment scheduling, billing invoices, and OPD queue.'
      },
      {
        role: 'patient',
        label: 'Registered Patient',
        email: 'elena.rodriguez@email.com',
        password: 'patient123',
        description: 'Book doctor appointments with queue tokens, view prescriptions, and inspect lab tests.'
      }
    ]
  });
});

export default router;
