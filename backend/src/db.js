import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dbPath = isVercel
  ? ':memory:'
  : path.resolve(__dirname, '../../medtech.db');

const verboseSqlite = sqlite3.verbose();
export const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Configure SQLite PRAGMAs
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  if (isVercel) {
    db.run('PRAGMA journal_mode = MEMORY');
    db.run('PRAGMA synchronous = OFF');
  } else {
    db.run('PRAGMA journal_mode = WAL');
  }
});

// Promise wrappers for async/await
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Initialize schema and seed data
export async function initializeDatabase() {
  console.log('Initializing database schema...');

  // 1. Users
  await run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
      full_name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Departments
  await run(`
    CREATE TABLE IF NOT EXISTS Departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      floor_number INTEGER DEFAULT 1,
      head_doctor_name TEXT,
      icon_name TEXT DEFAULT 'HeartPulse',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Doctors
  await run(`
    CREATE TABLE IF NOT EXISTS Doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      qualification TEXT NOT NULL,
      specialization TEXT NOT NULL,
      experience_years INTEGER DEFAULT 5,
      room_number TEXT,
      shift_timings TEXT DEFAULT '09:00 AM - 05:00 PM',
      is_on_duty INTEGER DEFAULT 1,
      consultation_fee REAL DEFAULT 50.00,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES Departments(id)
    )
  `);

  // 4. Patients
  await run(`
    CREATE TABLE IF NOT EXISTS Patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      dob TEXT,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
      blood_group TEXT,
      phone TEXT,
      emergency_contact TEXT,
      address TEXT,
      allergies TEXT,
      medical_history_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `);

  // 5. Appointments
  await run(`
    CREATE TABLE IF NOT EXISTS Appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      token_number INTEGER NOT NULL,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_consultation', 'completed', 'cancelled')),
      reason_for_visit TEXT,
      vitals_bp TEXT,
      vitals_pulse TEXT,
      vitals_temp TEXT,
      vitals_weight TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES Patients(id),
      FOREIGN KEY (doctor_id) REFERENCES Doctors(id),
      FOREIGN KEY (department_id) REFERENCES Departments(id)
    )
  `);

  // 6. Prescriptions
  await run(`
    CREATE TABLE IF NOT EXISTS Prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER UNIQUE,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      diagnosis TEXT NOT NULL,
      clinical_notes TEXT,
      advice TEXT,
      follow_up_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES Appointments(id),
      FOREIGN KEY (patient_id) REFERENCES Patients(id),
      FOREIGN KEY (doctor_id) REFERENCES Doctors(id)
    )
  `);

  // 7. Medicines
  await run(`
    CREATE TABLE IF NOT EXISTS Medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      medicine_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT,
      FOREIGN KEY (prescription_id) REFERENCES Prescriptions(id) ON DELETE CASCADE
    )
  `);

  // 8. LabTests
  await run(`
    CREATE TABLE IF NOT EXISTS LabTests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_name TEXT NOT NULL UNIQUE,
      test_code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      normal_range TEXT NOT NULL,
      units TEXT NOT NULL,
      description TEXT
    )
  `);

  // 9. LabReports
  await run(`
    CREATE TABLE IF NOT EXISTS LabReports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      test_id INTEGER NOT NULL,
      doctor_id INTEGER,
      test_date TEXT NOT NULL,
      status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed')),
      result_value TEXT NOT NULL,
      reference_range TEXT NOT NULL,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES Patients(id),
      FOREIGN KEY (test_id) REFERENCES LabTests(id),
      FOREIGN KEY (doctor_id) REFERENCES Doctors(id)
    )
  `);

  // 10. Beds
  await run(`
    CREATE TABLE IF NOT EXISTS Beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bed_number TEXT NOT NULL UNIQUE,
      ward_type TEXT NOT NULL CHECK(ward_type IN ('General Ward', 'ICU', 'Emergency', 'Semi-Private', 'Pediatric Ward')),
      department_id INTEGER,
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
      patient_id INTEGER,
      admitted_at DATETIME,
      notes TEXT,
      FOREIGN KEY (department_id) REFERENCES Departments(id),
      FOREIGN KEY (patient_id) REFERENCES Patients(id)
    )
  `);

  // 11. HospitalSettings (Custom Branding / White-labeling & Currency)
  await run(`
    CREATE TABLE IF NOT EXISTS HospitalSettings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hospital_name TEXT NOT NULL,
      tagline TEXT,
      address TEXT,
      contact_phone TEXT,
      emergency_phone TEXT,
      email TEXT,
      license_number TEXT,
      currency_symbol TEXT DEFAULT '₹',
      currency_code TEXT DEFAULT 'INR',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default hospital settings if not present
  const existingSettings = await getOne('SELECT * FROM HospitalSettings WHERE id = 1');
  if (!existingSettings) {
    await run(`
      INSERT INTO HospitalSettings (id, hospital_name, tagline, address, contact_phone, emergency_phone, email, license_number, currency_symbol, currency_code)
      VALUES (1, 'CITY MULTI-SPECIALTY HOSPITAL', 'Tertiary Clinical Care & 24x7 Trauma Institute', 'Plot 42, Medical Enclave, Health City', '+91 98200 12345', '108 / 112 (24x7 Emergency)', 'contact@hospital.com', 'HOSP-MH-2026-X889', '₹', 'INR')
    `);
  }

  // Auto-migration for currency fields & INR calibration
  try {
    await run("ALTER TABLE HospitalSettings ADD COLUMN currency_symbol TEXT DEFAULT '₹'");
  } catch (e) {}
  try {
    await run("ALTER TABLE HospitalSettings ADD COLUMN currency_code TEXT DEFAULT 'INR'");
  } catch (e) {}
  await run("UPDATE HospitalSettings SET currency_symbol = COALESCE(currency_symbol, '₹'), currency_code = COALESCE(currency_code, 'INR') WHERE id = 1");

  // 12. Invoices (OPD & IPD Billing)
  await run(`
    CREATE TABLE IF NOT EXISTS Invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      appointment_id INTEGER,
      doctor_id INTEGER,
      total_amount REAL NOT NULL DEFAULT 0.0,
      discount REAL NOT NULL DEFAULT 0.0,
      tax REAL NOT NULL DEFAULT 0.0,
      net_amount REAL NOT NULL DEFAULT 0.0,
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('paid', 'pending', 'cancelled')),
      payment_method TEXT CHECK(payment_method IN ('cash', 'upi', 'card', 'insurance')),
      transaction_ref TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (patient_id) REFERENCES Patients(id),
      FOREIGN KEY (appointment_id) REFERENCES Appointments(id),
      FOREIGN KEY (doctor_id) REFERENCES Doctors(id)
    )
  `);

  // 13. InvoiceItems
  await run(`
    CREATE TABLE IF NOT EXISTS InvoiceItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('consultation', 'lab', 'bed', 'medicine', 'procedure')),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      total_price REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (invoice_id) REFERENCES Invoices(id) ON DELETE CASCADE
    )
  `);

  // Calibrate doctor fees to realistic Indian Rupee amounts (e.g. 65 -> 650)
  try {
    await run("UPDATE Doctors SET consultation_fee = consultation_fee * 10 WHERE consultation_fee > 0 AND consultation_fee < 100");
  } catch (e) {}

  // Calibrate seeded invoices to realistic Indian Rupee amounts
  try {
    await run("UPDATE Invoices SET total_amount = total_amount * 10, discount = discount * 10, tax = tax * 10, net_amount = net_amount * 10 WHERE net_amount > 0 AND net_amount < 300");
    await run("UPDATE InvoiceItems SET unit_price = unit_price * 10, total_price = total_price * 10 WHERE unit_price > 0 AND unit_price < 200");
  } catch (e) {}

  console.log('Database tables verified.');

  // Seed default clinical data if empty
  await seedDefaultData();

  // Seed invoices if empty
  await seedDefaultInvoices();
}


async function seedDefaultData() {
  const existingUsers = await getOne('SELECT COUNT(*) as count FROM Users');
  if (existingUsers && existingUsers.count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding initial clinical and hospital data...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const doctorHash = await bcrypt.hash('doctor123', salt);
  const patientHash = await bcrypt.hash('patient123', salt);

  // 1. Seed Users
  // Admin
  const adminUser = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'admin', 'Dr. Arthur Pendelton', '+1 (555) 019-2831')`,
    ['admin@medtech.ai', adminHash]
  );

  // Doctors
  const doc1User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'doctor', 'Dr. Sarah Chen, MD', '+1 (555) 302-8812')`,
    ['dr.sarah@medtech.ai', doctorHash]
  );

  const doc2User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'doctor', 'Dr. Arjun Mehta, DM', '+1 (555) 441-9923')`,
    ['dr.arjun@medtech.ai', doctorHash]
  );

  const doc3User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'doctor', 'Dr. Emily Vance, MS', '+1 (555) 872-1144')`,
    ['dr.emily@medtech.ai', doctorHash]
  );

  const doc4User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'doctor', 'Dr. Marcus Holloway, MD', '+1 (555) 901-4422')`,
    ['dr.marcus@medtech.ai', doctorHash]
  );

  // Patients
  const patient1User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'patient', 'Elena Rodriguez', '+1 (555) 672-9011')`,
    ['elena.rodriguez@email.com', patientHash]
  );

  const patient2User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'patient', 'James Wilson', '+1 (555) 789-2234')`,
    ['james.wilson@email.com', patientHash]
  );

  const patient3User = await run(
    `INSERT INTO Users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, 'patient', 'Sophia Kim', '+1 (555) 234-9988')`,
    ['sophia.kim@email.com', patientHash]
  );

  // 2. Seed Departments
  const deptCardio = await run(
    `INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Cardiology', 'CARD', 'Advanced cardiovascular diagnostics, interventions, and coronary care', 3, 'Dr. Sarah Chen, MD', 'Heart']
  );

  const deptNeuro = await run(
    `INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Neurology', 'NEUR', 'Comprehensive brain, spinal cord, and neuro-muscular clinical care', 4, 'Dr. Arjun Mehta, DM', 'Brain']
  );

  const deptOrtho = await run(
    `INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Orthopedics', 'ORTH', 'Joint replacements, trauma, sports medicine, and spinal stabilization', 2, 'Dr. Emily Vance, MS', 'Bone']
  );

  const deptPediatrics = await run(
    `INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Pediatrics', 'PED', 'Infant, child, and adolescent healthcare with specialized neonatal support', 1, 'Dr. Marcus Holloway, MD', 'Baby']
  );

  const deptGenMed = await run(
    `INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['General Medicine', 'GENM', 'Primary ambulatory care, acute illness assessment, and chronic disease management', 1, 'Dr. Arthur Pendelton', 'Stethoscope']
  );

  // 3. Seed Doctors
  const doc1 = await run(
    `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 65.00)`,
    [doc1User.lastID, 'Dr. Sarah Chen, MD', deptCardio.lastID, 'MD (Cardiology), FACC', 'Interventional Cardiology & Arrhythmia', 12, 'Room 302']
  );

  const doc2 = await run(
    `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 75.00)`,
    [doc2User.lastID, 'Dr. Arjun Mehta, DM', deptNeuro.lastID, 'DM (Neurology), Stroke Specialist', 'Neurovascular & Cognitive Disorders', 15, 'Room 408']
  );

  const doc3 = await run(
    `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 55.00)`,
    [doc3User.lastID, 'Dr. Emily Vance, MS', deptOrtho.lastID, 'MS (Orthopedics), Joint Replacement Fellow', 'Arthroscopy & Complex Joint Reconstruction', 9, 'Room 214']
  );

  const doc4 = await run(
    `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 50.00)`,
    [doc4User.lastID, 'Dr. Marcus Holloway, MD', deptPediatrics.lastID, 'MD (Pediatrics), FAAP', 'Pediatric Pulmonology & Preventive Child Health', 8, 'Room 105']
  );

  // 4. Seed Patients
  const pat1 = await run(
    `INSERT INTO Patients (user_id, full_name, dob, gender, blood_group, phone, emergency_contact, address, allergies, medical_history_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient1User.lastID,
      'Elena Rodriguez',
      '1991-04-12',
      'Female',
      'O+',
      '+1 (555) 672-9011',
      'Carlos Rodriguez (Spouse) - +1 (555) 672-9019',
      '742 Evergreen Terrace, Springfield',
      'Penicillin, Aspirin',
      'Mild hypertension diagnosed 2021; seasonal allergic rhinitis'
    ]
  );

  const pat2 = await run(
    `INSERT INTO Patients (user_id, full_name, dob, gender, blood_group, phone, emergency_contact, address, allergies, medical_history_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient2User.lastID,
      'James Wilson',
      '1983-09-24',
      'Male',
      'A-',
      '+1 (555) 789-2234',
      'Karen Wilson (Sister) - +1 (555) 789-2290',
      '1284 Oakridge Lane, Metropolis',
      'Sulfa drugs',
      'Type 2 Diabetes Mellitus (HbA1c 6.8%), Left ACL reconstruction 2019'
    ]
  );

  const pat3 = await run(
    `INSERT INTO Patients (user_id, full_name, dob, gender, blood_group, phone, emergency_contact, address, allergies, medical_history_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patient3User.lastID,
      'Sophia Kim',
      '1998-11-03',
      'Female',
      'B+',
      '+1 (555) 234-9988',
      'Hana Kim (Mother) - +1 (555) 234-9911',
      '45 Pine Needle Court, Seattle',
      'None reported',
      'No major prior hospitalizations'
    ]
  );

  // 5. Seed Lab Tests
  const test1 = await run(
    `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Hemoglobin: 12.0 - 16.0; WBC: 4.5 - 11.0', 'g/dL, 10^3/uL', 'Automated red and white cell indices']
  );

  const test2 = await run(
    `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Lipid Profile Panel', 'LIP-02', 'Biochemistry', 'Total Chol: < 200; LDL: < 100; HDL: > 50', 'mg/dL', 'Cardiovascular risk evaluation and lipid fractionation']
  );

  const test3 = await run(
    `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Glycated Hemoglobin (HbA1c)', 'HBA1C', 'Endocrinology', '< 5.7 (Normal), 5.7-6.4 (Prediabetes)', '%', '3-month weighted average blood glucose level']
  );

  const test4 = await run(
    `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['12-Lead Electrocardiogram (ECG)', 'ECG-04', 'Cardiology', 'Normal Sinus Rhythm, 60-100 bpm', 'bpm', 'Non-invasive electrical activity of the heart']
  );

  const test5 = await run(
    `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Serum Creatinine & eGFR', 'REN-05', 'Nephrology', 'Creatinine: 0.6 - 1.2; eGFR: > 90', 'mg/dL, mL/min', 'Renal functional clearance and glomerular filtration']
  );

  // 6. Seed Appointments
  const today = new Date().toISOString().split('T')[0];
  const appt1 = await run(
    `INSERT INTO Appointments (patient_id, doctor_id, department_id, appointment_date, time_slot, token_number, status, reason_for_visit, vitals_bp, vitals_pulse, vitals_temp, vitals_weight)
     VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, '124/82', '76 bpm', '98.4 F', '68 kg')`,
    [pat1.lastID, doc1.lastID, deptCardio.lastID, today, '10:00 AM', 101, 'Routine follow-up for episodic palpitations and blood pressure check']
  );

  const appt2 = await run(
    `INSERT INTO Appointments (patient_id, doctor_id, department_id, appointment_date, time_slot, token_number, status, reason_for_visit, vitals_bp, vitals_pulse, vitals_temp, vitals_weight)
     VALUES (?, ?, ?, ?, ?, ?, 'in_consultation', ?, '132/88', '82 bpm', '98.6 F', '79 kg')`,
    [pat2.lastID, doc2.lastID, deptNeuro.lastID, today, '10:30 AM', 102, 'Persistent tension headaches with visual aura in right eye']
  );

  const appt3 = await run(
    `INSERT INTO Appointments (patient_id, doctor_id, department_id, appointment_date, time_slot, token_number, status, reason_for_visit, vitals_bp, vitals_pulse, vitals_temp, vitals_weight)
     VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, '118/74', '70 bpm', '98.1 F', '58 kg')`,
    [pat3.lastID, doc1.lastID, deptCardio.lastID, today, '09:00 AM', 100, 'Pre-employment cardiology clearance and baseline vitals examination']
  );

  // 7. Seed Past Prescription for Completed Appointment 3
  const rx1 = await run(
    `INSERT INTO Prescriptions (appointment_id, patient_id, doctor_id, diagnosis, clinical_notes, advice, follow_up_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      appt3.lastID,
      pat3.lastID,
      doc1.lastID,
      'Normal Sinus Rhythm with Physiological Sinus Tachycardia on Exertion',
      'Normal S1/S2 heart sounds, no audible murmurs or gallops. Normal baseline ECG. Recommended adequate hydration.',
      'Maintain adequate hydration (2.5L daily). Limit stimulant energy drinks. Annual wellness checkup.',
      '2026-12-15'
    ]
  );

  await run(
    `INSERT INTO Medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rx1.lastID, 'Oral Hydration & Electrolyte Sachet', '1 Sachet', 'Once daily', '14 days', 'Dissolve in 500ml water every morning after breakfast']
  );

  await run(
    `INSERT INTO Medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rx1.lastID, 'Vitamin D3 & Calcium Cholecalciferol', '60,000 IU', 'Once weekly', '8 weeks', 'Take with full glass of warm milk after dinner']
  );

  // 8. Seed Lab Reports for Elena Rodriguez
  await run(
    `INSERT INTO LabReports (patient_id, test_id, doctor_id, test_date, status, result_value, reference_range, remarks)
     VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)`,
    [
      pat1.lastID,
      test2.lastID,
      doc1.lastID,
      today,
      'Total: 184 mg/dL | LDL: 98 mg/dL | HDL: 56 mg/dL',
      'Total < 200 mg/dL, LDL < 100 mg/dL',
      'Optimal lipid profile. Continue cardioprotective dietary measures.'
    ]
  );

  await run(
    `INSERT INTO LabReports (patient_id, test_id, doctor_id, test_date, status, result_value, reference_range, remarks)
     VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)`,
    [
      pat1.lastID,
      test4.lastID,
      doc1.lastID,
      today,
      'Normal Sinus Rhythm, PR interval 148ms, QRS 86ms, Rate 72 bpm',
      'Sinus Rhythm (60-100 bpm)',
      'No ST-segment abnormalities or ischemic changes noted.'
    ]
  );

  // 9. Seed Hospital Beds (Across wards)
  const bedsData = [
    // ICU
    ['ICU-101', 'ICU', deptCardio.lastID, 'occupied', pat2.lastID, 'Post-procedure cardiac monitoring'],
    ['ICU-102', 'ICU', deptCardio.lastID, 'available', null, 'Cleaned & sterilized. Ventilator ready.'],
    ['ICU-103', 'ICU', deptNeuro.lastID, 'occupied', null, 'Stroke step-down bed'],
    ['ICU-104', 'ICU', deptNeuro.lastID, 'maintenance', null, 'Routine telemetry sensor calibration'],
    // Emergency
    ['ER-201', 'Emergency', deptGenMed.lastID, 'available', null, 'Rapid triage resuscitation bay'],
    ['ER-202', 'Emergency', deptGenMed.lastID, 'available', null, 'Rapid triage observation'],
    ['ER-203', 'Emergency', deptGenMed.lastID, 'occupied', null, 'Acute trauma observation'],
    ['ER-204', 'Emergency', deptGenMed.lastID, 'available', null, 'Oxygen supply tested'],
    // General Ward
    ['GW-301', 'General Ward', deptGenMed.lastID, 'available', null, 'Standard telemetry bed'],
    ['GW-302', 'General Ward', deptGenMed.lastID, 'occupied', null, 'Post-op recovery day 2'],
    ['GW-303', 'General Ward', deptOrtho.lastID, 'available', null, 'Equipped with orthopedic traction'],
    ['GW-304', 'General Ward', deptOrtho.lastID, 'occupied', null, 'Joint rehabilitation patient'],
    ['GW-305', 'General Ward', deptCardio.lastID, 'available', null, 'Standard bed'],
    ['GW-306', 'General Ward', deptPediatrics.lastID, 'available', null, 'Standard bed'],
    // Semi-Private
    ['SP-401', 'Semi-Private', deptCardio.lastID, 'available', null, 'Deluxe monitoring twin unit'],
    ['SP-402', 'Semi-Private', deptNeuro.lastID, 'occupied', null, 'Rehabilitation monitoring'],
    // Pediatric Ward
    ['PED-501', 'Pediatric Ward', deptPediatrics.lastID, 'available', null, 'Child-friendly telemetry crib'],
    ['PED-502', 'Pediatric Ward', deptPediatrics.lastID, 'occupied', null, 'Observation pediatric unit']
  ];

  for (const b of bedsData) {
    await run(
      `INSERT INTO Beds (bed_number, ward_type, department_id, status, patient_id, notes, admitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [b[0], b[1], b[2], b[3], b[4], b[5], b[3] === 'occupied' ? today + ' 08:30:00' : null]
    );
  }

  console.log('Seed completed successfully!');
}

async function seedDefaultInvoices() {
  const existing = await getOne('SELECT COUNT(*) as count FROM Invoices');
  if (existing && existing.count > 0) {
    return;
  }

  const pat1 = await getOne('SELECT id FROM Patients LIMIT 1 OFFSET 0');
  const pat2 = await getOne('SELECT id FROM Patients LIMIT 1 OFFSET 1');
  const pat3 = await getOne('SELECT id FROM Patients LIMIT 1 OFFSET 2');
  const doc1 = await getOne('SELECT id, consultation_fee FROM Doctors LIMIT 1 OFFSET 0');
  const doc2 = await getOne('SELECT id, consultation_fee FROM Doctors LIMIT 1 OFFSET 1');

  if (!pat1 || !doc1) return;

  console.log('Seeding initial hospital billing invoices...');
  const today = new Date().toISOString().split('T')[0];

  // Invoice 1: Sophia Kim (Completed OPD + Lab + Meds) - Paid via UPI
  const inv1 = await run(
    `INSERT INTO Invoices (invoice_number, patient_id, appointment_id, doctor_id, total_amount, discount, tax, net_amount, payment_status, payment_method, transaction_ref, notes, paid_at)
     VALUES (?, ?, 3, ?, 115.00, 10.00, 5.00, 110.00, 'paid', 'upi', 'UPI/2026/8931201948', 'OPD Cardiology consultation & wellness baseline testing', ?)`,
    ['INV-2026-0001', pat3 ? pat3.id : pat1.id, doc1.id, today + ' 09:45:00']
  );

  const items1 = [
    [inv1.lastID, 'Specialist Clinical Consultation Fee', 'consultation', 1, 65.00, 65.00],
    [inv1.lastID, '12-Lead Electrocardiogram (ECG)', 'lab', 1, 35.00, 35.00],
    [inv1.lastID, 'Oral Hydration & Vitamin D3 Prescription pack', 'medicine', 1, 15.00, 15.00]
  ];
  for (const item of items1) {
    await run(
      `INSERT INTO InvoiceItems (invoice_id, description, category, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      item
    );
  }

  // Invoice 2: James Wilson (Neurology OPD & Lab) - Paid via Card
  if (pat2 && doc2) {
    const inv2 = await run(
      `INSERT INTO Invoices (invoice_number, patient_id, appointment_id, doctor_id, total_amount, discount, tax, net_amount, payment_status, payment_method, transaction_ref, notes, paid_at)
       VALUES (?, ?, 2, ?, 125.00, 0.00, 6.25, 131.25, 'paid', 'card', 'TXN-VISA-991204', 'Neurovascular assessment & biochemical profiling', ?)`,
      ['INV-2026-0002', pat2.id, doc2.id, today + ' 11:15:00']
    );

    const items2 = [
      [inv2.lastID, 'Senior Neurologist Consultation', 'consultation', 1, 75.00, 75.00],
      [inv2.lastID, 'Serum Creatinine & Electrolyte Panel', 'lab', 1, 50.00, 50.00]
    ];
    for (const item of items2) {
      await run(
        `INSERT INTO InvoiceItems (invoice_id, description, category, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        item
      );
    }
  }

  // Invoice 3: Elena Rodriguez (Scheduled OPD check) - Pending Payment
  const inv3 = await run(
    `INSERT INTO Invoices (invoice_number, patient_id, appointment_id, doctor_id, total_amount, discount, tax, net_amount, payment_status, payment_method, notes)
     VALUES (?, ?, 1, ?, 65.00, 0.00, 3.25, 68.25, 'pending', 'upi', 'Follow-up blood pressure & rhythm evaluation')`,
    ['INV-2026-0003', pat1.id, doc1.id]
  );

  await run(
    `INSERT INTO InvoiceItems (invoice_id, description, category, quantity, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [inv3.lastID, 'Cardiology Ambulatory Visit Fee', 'consultation', 1, 65.00, 65.00]
  );

  console.log('Sample hospital invoices seeded successfully.');
}

