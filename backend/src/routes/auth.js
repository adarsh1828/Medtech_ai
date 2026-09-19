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

// Register Doctor (Self-Registration)
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
      consultation_fee
    } = req.body;

    if (!full_name || !email || !password || !department_id || !qualification || !specialization) {
      return res.status(400).json({
        error: 'Please provide full name, email, password, department, qualification, and specialization.'
      });
    }

    const existingUser = await getOne('SELECT id FROM Users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userResult = await run(
      "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)",
      [email.toLowerCase().trim(), password_hash, full_name.trim(), phone || null]
    );

    const docResult = await run(
      `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        userResult.lastID,
        full_name.trim(),
        Number(department_id),
        qualification.trim(),
        specialization.trim(),
        Number(experience_years) || 3,
        room_number?.trim() || 'Room 102',
        shift_timings || '09:00 AM - 05:00 PM',
        Number(consultation_fee) || 50.0
      ]
    );

    const dept = await getOne('SELECT name FROM Departments WHERE id = ?', [department_id]);

    const tokenPayload = {
      userId: userResult.lastID,
      role: 'doctor',
      doctorId: docResult.lastID,
      email: email.toLowerCase().trim(),
      fullName: full_name.trim(),
      specialization: specialization.trim(),
      departmentName: dept ? dept.name : 'Clinical Specialist',
      roomNumber: room_number?.trim() || 'Room 102',
      isOnDuty: true
    };

    const token = generateToken(tokenPayload);

    res.status(201).json({
      message: 'Doctor account registered successfully!',
      token,
      user: {
        id: userResult.lastID,
        email: email.toLowerCase().trim(),
        role: 'doctor',
        fullName: full_name.trim(),
        phone: phone || null,
        ...tokenPayload
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

// Login

router.post('/login', async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await getOne('SELECT * FROM Users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
    }

    let extraData = {};
    if (user.role === 'patient') {
      const patient = await getOne('SELECT id, blood_group, allergies FROM Patients WHERE user_id = ?', [user.id]);
      if (patient) {
        extraData.patientId = patient.id;
        extraData.bloodGroup = patient.blood_group;
      }
    } else if (user.role === 'doctor') {
      const doctor = await getOne(
        `SELECT d.id, d.specialization, d.room_number, d.is_on_duty, dep.name as department_name
         FROM Doctors d
         LEFT JOIN Departments dep ON d.department_id = dep.id
         WHERE d.user_id = ?`,
        [user.id]
      );
      if (doctor) {
        extraData.doctorId = doctor.id;
        extraData.specialization = doctor.specialization;
        extraData.departmentName = doctor.department_name;
        extraData.roomNumber = doctor.room_number;
        extraData.isOnDuty = !!doctor.is_on_duty;
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
      profile.doctor = doctor;
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
