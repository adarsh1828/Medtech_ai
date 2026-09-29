import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../medtech.db');

console.log('Connecting to SQLite at:', dbPath);
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const getOne = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row || null);
  });
});

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

async function migrate() {
  console.log('Starting migration to 20 Indian doctors with pending approval...');

  const salt = await bcrypt.genSalt(10);
  const docHash = await bcrypt.hash('Doctor@123', salt);
  const rameshHash = await bcrypt.hash('Ramesh@123', salt);

  // 1. Departments definition
  const departmentsData = [
    { name: 'General Medicine', code: 'GENM', description: 'Primary ambulatory care, acute illness assessment, and chronic disease management', floor: 1, head: 'Dr. Ramesh Ganeshrao Surye', icon: 'Stethoscope' },
    { name: 'Cardiology', code: 'CARD', description: 'Advanced cardiovascular diagnostics, interventions, and coronary care', floor: 3, head: 'Dr. Rajesh Deshmukh', icon: 'Heart' },
    { name: 'Neurology', code: 'NEUR', description: 'Comprehensive brain, spinal cord, and neuro-muscular clinical care', floor: 4, head: 'Dr. Arjun Mehta', icon: 'Brain' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Joint replacements, trauma, sports medicine, and spinal stabilization', floor: 2, head: 'Dr. Vikram Malhotra', icon: 'Bone' },
    { name: 'Gynecology & Obstetrics', code: 'GYN', description: 'Women healthcare, high-risk pregnancy, and advanced laparoscopic gynecology', floor: 2, head: 'Dr. Sunita Kulkarni', icon: 'Baby' },
    { name: 'Pediatrics', code: 'PED', description: 'Infant, child, and adolescent healthcare with specialized neonatal support', floor: 1, head: 'Dr. Anand Joshi', icon: 'Baby' },
    { name: 'Dermatology', code: 'DERM', description: 'Comprehensive clinical dermatology, trichology, and laser procedures', floor: 1, head: 'Dr. Pooja Sharma', icon: 'Sparkles' },
    { name: 'General Surgery', code: 'SURG', description: 'Minimally invasive laparoscopic, GI, and emergency surgical interventions', floor: 3, head: 'Dr. Milind Patil', icon: 'Activity' },
    { name: 'Ophthalmology', code: 'OPHT', description: 'Cataract, refractive surgery, glaucoma management, and retina clinic', floor: 1, head: 'Dr. Deepa Iyer', icon: 'Eye' },
    { name: 'ENT', code: 'ENT', description: 'Advanced ear, nose, throat diagnostics, endoscopy, and head-neck surgeries', floor: 1, head: 'Dr. Sanjay Verma', icon: 'Volume2' },
    { name: 'Endocrinology', code: 'ENDO', description: 'Specialized metabolic health, type 1 & 2 diabetes, and thyroid management', floor: 2, head: 'Dr. Neha Choudhary', icon: 'Activity' },
    { name: 'Pulmonology', code: 'PULM', description: 'Asthma, COPD, sleep apnea, interventional bronchoscopy, and post-COVID care', floor: 2, head: 'Dr. Pradeep Jadhav', icon: 'Wind' },
    { name: 'Nephrology', code: 'NEPH', description: 'Hemodialysis, acute kidney injury, chronic kidney disease, and transplant care', floor: 4, head: 'Dr. Snehal Gaikwad', icon: 'ShieldAlert' },
    { name: 'Gastroenterology', code: 'GAST', description: 'Therapeutic endoscopy, colonoscopy, hepatology, and digestive disorders', floor: 4, head: 'Dr. Rohan Kadam', icon: 'Compass' },
    { name: 'Psychiatry', code: 'PSYC', description: 'Mental wellness, anxiety, depression, addiction recovery, and psychotherapy', floor: 1, head: 'Dr. Anjali Pawar', icon: 'Smile' },
    { name: 'Oncology', code: 'ONCO', description: 'Comprehensive cancer therapy, precision chemotherapy, and palliative care', floor: 5, head: 'Dr. Suresh Nair', icon: 'Shield' },
    { name: 'Urology', code: 'UROL', description: 'Endourology, laser lithotripsy for kidney stones, and prostate care', floor: 3, head: 'Dr. Vivek Shinde', icon: 'Activity' },
    { name: 'Radiology', code: 'RAD', description: 'Digital X-ray, 128-slice CT scan, 3T MRI, 4D Ultrasound, and imaging guided biopsies', floor: 1, head: 'Dr. Meera Nambiar', icon: 'Scan' },
    { name: 'Emergency Medicine', code: 'EMER', description: '24/7 Level-1 trauma resuscitation, acute cardiac care, and emergency triage', floor: 1, head: 'Dr. Nitin Bhosale', icon: 'Siren' },
    { name: 'Pathology', code: 'PATH', description: 'Automated clinical hematology, biochemistry, microbiology, and molecular diagnostics', floor: 1, head: 'Dr. Kavita Salunke', icon: 'Microscope' }
  ];

  const deptMap = {};
  for (const dep of departmentsData) {
    const existing = await getOne('SELECT id FROM Departments WHERE code = ?', [dep.code]);
    if (existing) {
      await run(
        'UPDATE Departments SET name = ?, description = ?, floor_number = ?, head_doctor_name = ?, icon_name = ? WHERE id = ?',
        [dep.name, dep.description, dep.floor, dep.head, dep.icon, existing.id]
      );
      deptMap[dep.code] = existing.id;
    } else {
      const res = await run(
        'INSERT INTO Departments (name, code, description, floor_number, head_doctor_name, icon_name) VALUES (?, ?, ?, ?, ?, ?)',
        [dep.name, dep.code, dep.description, dep.floor, dep.head, dep.icon]
      );
      deptMap[dep.code] = res.lastID;
    }
  }

  // 2. Prepare 20 Indian doctors list
  const indianDoctors = [
    {
      fullName: 'Dr. Ramesh Ganeshrao Surye',
      email: 'rameshgsurya@gmail.com',
      passwordHash: rameshHash,
      phone: '+91 7875723205',
      deptCode: 'GENM',
      qualification: 'MBBS, BHMS',
      specialization: 'General Physician & Family Medicine',
      experienceYears: 18,
      roomNumber: 'Room 101',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 300.00
    },
    {
      fullName: 'Dr. Rajesh Deshmukh',
      email: 'dr.rajesh@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98201 55667',
      deptCode: 'CARD',
      qualification: 'MD, DM (Cardiology), FACC',
      specialization: 'Interventional Cardiology & Preventive Health',
      experienceYears: 16,
      roomNumber: 'Room 301',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 700.00
    },
    {
      fullName: 'Dr. Arjun Mehta',
      email: 'dr.arjun@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98201 66778',
      deptCode: 'NEUR',
      qualification: 'MBBS, DM (Neurology), Stroke Specialist',
      specialization: 'Neurovascular & Cognitive Disorders',
      experienceYears: 15,
      roomNumber: 'Room 408',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 800.00
    },
    {
      fullName: 'Dr. Vikram Malhotra',
      email: 'dr.vikram@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98201 77889',
      deptCode: 'ORTH',
      qualification: 'MBBS, MS (Orthopedics), Joint Replacement Fellow',
      specialization: 'Spine, Trauma & Joint Reconstruction',
      experienceYears: 14,
      roomNumber: 'Room 205',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 600.00
    },
    {
      fullName: 'Dr. Sunita Kulkarni',
      email: 'dr.sunita@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98201 88990',
      deptCode: 'GYN',
      qualification: 'MBBS, MD, DGO (OB-GYN)',
      specialization: 'High-Risk Pregnancy & Laparoscopic Gynae Surgery',
      experienceYears: 13,
      roomNumber: 'Room 202',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 500.00
    },
    {
      fullName: 'Dr. Anand Joshi',
      email: 'dr.anand@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98201 99001',
      deptCode: 'PED',
      qualification: 'MBBS, MD (Pediatrics), DCH',
      specialization: 'Neonatology & Pediatric Critical Care',
      experienceYears: 12,
      roomNumber: 'Room 105',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 450.00
    },
    {
      fullName: 'Dr. Pooja Sharma',
      email: 'dr.pooja@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 11223',
      deptCode: 'DERM',
      qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      specialization: 'Clinical Dermatology & Laser Aesthetics',
      experienceYears: 9,
      roomNumber: 'Room 108',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 500.00
    },
    {
      fullName: 'Dr. Milind Patil',
      email: 'dr.milind@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 22334',
      deptCode: 'SURG',
      qualification: 'MBBS, MS (General Surgery), FIAGES',
      specialization: 'Advanced Laparoscopic & GI Surgery',
      experienceYears: 17,
      roomNumber: 'Room 304',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 650.00
    },
    {
      fullName: 'Dr. Deepa Iyer',
      email: 'dr.deepa@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 33445',
      deptCode: 'OPHT',
      qualification: 'MBBS, MS (Ophthalmology), FICO',
      specialization: 'Cataract, Refractive & Vitreo-Retinal Surgery',
      experienceYears: 11,
      roomNumber: 'Room 110',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 400.00
    },
    {
      fullName: 'Dr. Sanjay Verma',
      email: 'dr.sanjay@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 44556',
      deptCode: 'ENT',
      qualification: 'MBBS, MS (Otorhinolaryngology)',
      specialization: 'Endoscopic Sinus Surgery & Micro Ear Surgery',
      experienceYears: 14,
      roomNumber: 'Room 112',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 450.00
    },
    {
      fullName: 'Dr. Neha Choudhary',
      email: 'dr.neha@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 55667',
      deptCode: 'ENDO',
      qualification: 'MBBS, MD (Medicine), DM (Endocrinology)',
      specialization: 'Diabetology, Thyroid & Metabolic Disorders',
      experienceYears: 10,
      roomNumber: 'Room 206',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 600.00
    },
    {
      fullName: 'Dr. Pradeep Jadhav',
      email: 'dr.pradeep@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 66778',
      deptCode: 'PULM',
      qualification: 'MBBS, MD (Pulmonary Medicine), DTCD',
      specialization: 'Interventional Pulmonology, Asthma & Sleep Apnea',
      experienceYears: 13,
      roomNumber: 'Room 208',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 550.00
    },
    {
      fullName: 'Dr. Snehal Gaikwad',
      email: 'dr.snehal@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 77889',
      deptCode: 'NEPH',
      qualification: 'MBBS, MD, DM (Nephrology)',
      specialization: 'Dialysis, Renal Failure & Kidney Transplant',
      experienceYears: 12,
      roomNumber: 'Room 401',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 750.00
    },
    {
      fullName: 'Dr. Rohan Kadam',
      email: 'dr.rohan@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 88990',
      deptCode: 'GAST',
      qualification: 'MBBS, MD, DM (Medical Gastroenterology)',
      specialization: 'Hepatology, Therapeutic Endoscopy & IBD',
      experienceYears: 11,
      roomNumber: 'Room 405',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 700.00
    },
    {
      fullName: 'Dr. Anjali Pawar',
      email: 'dr.anjali@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98202 99001',
      deptCode: 'PSYC',
      qualification: 'MBBS, MD (Psychiatry), DPM',
      specialization: 'Adult Psychiatry, Anxiety & Neurocognitive Rehabilitation',
      experienceYears: 9,
      roomNumber: 'Room 115',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 500.00
    },
    {
      fullName: 'Dr. Suresh Nair',
      email: 'dr.suresh@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98203 11223',
      deptCode: 'ONCO',
      qualification: 'MBBS, MD (Radiotherapy), DM (Medical Oncology)',
      specialization: 'Precision Oncology, Immunotherapy & Chemotherapy',
      experienceYears: 18,
      roomNumber: 'Room 501',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 900.00
    },
    {
      fullName: 'Dr. Vivek Shinde',
      email: 'dr.vivek@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98203 22334',
      deptCode: 'UROL',
      qualification: 'MBBS, MS (Surgery), MCh (Urology)',
      specialization: 'Endourology, Kidney Stones & Uro-Oncology',
      experienceYears: 15,
      roomNumber: 'Room 308',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 700.00
    },
    {
      fullName: 'Dr. Meera Nambiar',
      email: 'dr.meera@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98203 33445',
      deptCode: 'RAD',
      qualification: 'MBBS, MD (Radio-Diagnosis), PDCC',
      specialization: 'Cross-Sectional Imaging, MRI & Doppler Ultrasonography',
      experienceYears: 14,
      roomNumber: 'Room B-02 (Radiology Suite)',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 500.00
    },
    {
      fullName: 'Dr. Nitin Bhosale',
      email: 'dr.nitin@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98203 44556',
      deptCode: 'EMER',
      qualification: 'MBBS, MD (Emergency Medicine), FEM',
      specialization: 'Trauma Resuscitation & Critical Care Toxicology',
      experienceYears: 11,
      roomNumber: 'Emergency Casualty Triage 1',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 500.00
    },
    {
      fullName: 'Dr. Kavita Salunke',
      email: 'dr.kavita@medtech.ai',
      passwordHash: docHash,
      phone: '+91 98203 55667',
      deptCode: 'PATH',
      qualification: 'MBBS, MD (Pathology)',
      specialization: 'Histopathology, Hematology & Molecular Diagnostics',
      experienceYears: 13,
      roomNumber: 'Central Diagnostic Lab Suite',
      shiftTimings: '09:00 AM - 05:00 PM',
      fee: 350.00
    }
  ];

  // First, find foreign doctors so we can reassign their appointments safely before deletion
  const foreignEmails = ['dr.sarah@medtech.ai', 'dr.emily@medtech.ai', 'dr.marcus@medtech.ai'];
  
  // Re-link any existing appointments / prescriptions to Dr. Rajesh Deshmukh or Dr. Ramesh Surye
  // Let's first ensure Dr. Rajesh Deshmukh User and Doctor record exist
  let rajeshUser = await getOne('SELECT id FROM Users WHERE email = ?', ['dr.rajesh@medtech.ai']);
  if (!rajeshUser) {
    const res = await run("INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)", [
      'dr.rajesh@medtech.ai', docHash, 'Dr. Rajesh Deshmukh', '+91 98201 55667'
    ]);
    rajeshUser = { id: res.lastID };
  }
  let rajeshDoc = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [rajeshUser.id]);
  if (!rajeshDoc) {
    const res = await run(
      `INSERT INTO Doctors (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending')`,
      [rajeshUser.id, 'Dr. Rajesh Deshmukh', deptMap['CARD'], 'MD, DM (Cardiology), FACC', 'Interventional Cardiology & Preventive Health', 16, 'Room 301', '09:00 AM - 05:00 PM', 700.0]
    );
    rajeshDoc = { id: res.lastID };
  }

  for (const fEmail of foreignEmails) {
    const fUser = await getOne('SELECT id FROM Users WHERE email = ?', [fEmail]);
    if (fUser) {
      const fDoc = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [fUser.id]);
      if (fDoc) {
        console.log(`Re-assigning records of foreign doctor ${fEmail} (doc_id: ${fDoc.id}) to Dr. Rajesh Deshmukh (doc_id: ${rajeshDoc.id})...`);
        await run('UPDATE Appointments SET doctor_id = ? WHERE doctor_id = ?', [rajeshDoc.id, fDoc.id]);
        await run('UPDATE Prescriptions SET doctor_id = ? WHERE doctor_id = ?', [rajeshDoc.id, fDoc.id]);
        await run('DELETE FROM Doctors WHERE id = ?', [fDoc.id]);
      }
      await run('DELETE FROM Users WHERE id = ?', [fUser.id]);
    }
  }

  // Also remove Dr. Arthur Pendelton if present in Doctors
  const arthurDoc = await getOne("SELECT d.id, u.id as user_id FROM Doctors d JOIN Users u ON d.user_id = u.id WHERE u.email = 'admin@medtech.ai'");
  if (arthurDoc) {
    await run('DELETE FROM Doctors WHERE id = ?', [arthurDoc.id]);
  }

  // 3. Now Register each of the 20 Indian Doctors with 'pending' status
  for (const doc of indianDoctors) {
    const deptId = deptMap[doc.deptCode];
    if (!deptId) {
      console.error(`Department code not found: ${doc.deptCode}`);
      continue;
    }

    // Check or insert User
    let u = await getOne('SELECT id FROM Users WHERE email = ?', [doc.email]);
    if (u) {
      await run(
        'UPDATE Users SET password_hash = ?, full_name = ?, phone = ?, role = ? WHERE id = ?',
        [doc.passwordHash, doc.fullName, doc.phone, 'doctor', u.id]
      );
    } else {
      const res = await run(
        "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)",
        [doc.email, doc.passwordHash, doc.fullName, doc.phone]
      );
      u = { id: res.lastID };
    }

    // Check or insert Doctor record
    const existingDoc = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [u.id]);
    if (existingDoc) {
      await run(
        `UPDATE Doctors SET
          full_name = ?,
          department_id = ?,
          qualification = ?,
          specialization = ?,
          experience_years = ?,
          room_number = ?,
          shift_timings = ?,
          is_on_duty = 0,
          consultation_fee = ?,
          status = 'pending',
          approved_at = NULL
         WHERE id = ?`,
        [
          doc.fullName,
          deptId,
          doc.qualification,
          doc.specialization,
          doc.experienceYears,
          doc.roomNumber,
          doc.shiftTimings,
          doc.fee,
          existingDoc.id
        ]
      );
    } else {
      await run(
        `INSERT INTO Doctors 
          (user_id, full_name, department_id, qualification, specialization, experience_years, room_number, shift_timings, is_on_duty, consultation_fee, status, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending', NULL)`,
        [
          u.id,
          doc.fullName,
          deptId,
          doc.qualification,
          doc.specialization,
          doc.experienceYears,
          doc.roomNumber,
          doc.shiftTimings,
          doc.fee
        ]
      );
    }
  }

  // 4. Verification output
  const allDocs = await query(`
    SELECT d.id, d.full_name, dep.name as department, d.qualification, d.specialization, u.email, d.status, d.is_on_duty
    FROM Doctors d
    LEFT JOIN Departments dep ON d.department_id = dep.id
    JOIN Users u ON d.user_id = u.id
    ORDER BY d.id ASC
  `);

  console.log(`\nMigration completed! Total doctors in database: ${allDocs.length}`);
  console.table(allDocs.map(d => ({
    ID: d.id,
    Name: d.full_name,
    Dept: d.department,
    Email: d.email,
    Status: d.status,
    OnDuty: d.is_on_duty
  })));

  db.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
