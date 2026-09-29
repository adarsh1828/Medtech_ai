import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../medtech.db');

console.log('Connecting to SQLite for Staff Migration at:', dbPath);
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

async function migrateStaff() {
  console.log('Seeding 60 Nurses and 20 Cleaning Staff with Pending Approval Status...');

  const salt = await bcrypt.genSalt(10);
  const nurseHash = await bcrypt.hash('Nurse@123', salt);
  const cleanHash = await bcrypt.hash('Clean@123', salt);

  // Female Nurses (30)
  const femaleNurses = [
    { name: 'Sister Sunita Sharma', email: 'nurse.sunita@medtech.ai', ward: 'ICU Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44551', deptCode: 'GENM' },
    { name: 'Sister Anita Deshmukh', email: 'nurse.anita@medtech.ai', ward: 'Emergency Trauma Care', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44552', deptCode: 'EMER' },
    { name: 'Sister Priya Kulkarni', email: 'nurse.priya@medtech.ai', ward: 'Maternity & NICU', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44553', deptCode: 'GYN' },
    { name: 'Sister Kavita Patil', email: 'nurse.kavita@medtech.ai', ward: 'Cardiac Care Unit (CCU)', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44554', deptCode: 'CARD' },
    { name: 'Sister Manisha Jadhav', email: 'nurse.manisha@medtech.ai', ward: 'Pediatric Ward', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44555', deptCode: 'PED' },
    { name: 'Sister Rekha Shinde', email: 'nurse.rekha@medtech.ai', ward: 'General Female Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44556', deptCode: 'GENM' },
    { name: 'Sister Pooja Gaikwad', email: 'nurse.pooja@medtech.ai', ward: 'Operation Theatre (OT)', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44557', deptCode: 'SURG' },
    { name: 'Sister Sneha More', email: 'nurse.sneha@medtech.ai', ward: 'Orthopedic Recovery', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44558', deptCode: 'ORTH' },
    { name: 'Sister Swati Chavan', email: 'nurse.swati@medtech.ai', ward: 'Dialysis Unit', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44559', deptCode: 'NEPH' },
    { name: 'Sister Deepali Pawar', email: 'nurse.deepali@medtech.ai', ward: 'Oncology Day Care', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44560', deptCode: 'ONCO' },
    { name: 'Sister Neha Salunke', email: 'nurse.neha@medtech.ai', ward: 'Surgical Post-Op', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44561', deptCode: 'SURG' },
    { name: 'Sister Shilpa Joshi', email: 'nurse.shilpa@medtech.ai', ward: 'Neurology ICU', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44562', deptCode: 'NEUR' },
    { name: 'Sister Archana Sawant', email: 'nurse.archana@medtech.ai', ward: 'Burn & Trauma Ward', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44563', deptCode: 'EMER' },
    { name: 'Sister Rohini Jagtap', email: 'nurse.rohini@medtech.ai', ward: 'Labor Room Suite', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44564', deptCode: 'GYN' },
    { name: 'Sister Usha Raut', email: 'nurse.usha@medtech.ai', ward: 'Geriatric Care Ward', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44565', deptCode: 'GENM' },
    { name: 'Sister Vandana Bhosale', email: 'nurse.vandana@medtech.ai', ward: 'Isolation Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44566', deptCode: 'GENM' },
    { name: 'Sister Jyoti Kamble', email: 'nurse.jyoti@medtech.ai', ward: 'Cardiac Recovery', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44567', deptCode: 'CARD' },
    { name: 'Sister Rupali Thorat', email: 'nurse.rupali@medtech.ai', ward: 'General Ward Floor 2', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44568', deptCode: 'GENM' },
    { name: 'Sister Vaishali Tambe', email: 'nurse.vaishali@medtech.ai', ward: 'Step-down ICU', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44569', deptCode: 'EMER' },
    { name: 'Sister Meenal Kadam', email: 'nurse.meenal@medtech.ai', ward: 'Pediatric NICU', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44570', deptCode: 'PED' },
    { name: 'Sister Komal Wagh', email: 'nurse.komal@medtech.ai', ward: 'Day Surgery Unit', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44571', deptCode: 'SURG' },
    { name: 'Sister Sonali Nikam', email: 'nurse.sonali@medtech.ai', ward: 'Cath Lab Triage', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44572', deptCode: 'CARD' },
    { name: 'Sister Pallavi Ghadge', email: 'nurse.pallavi@medtech.ai', ward: 'Post-Natal Ward', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44573', deptCode: 'GYN' },
    { name: 'Sister Shital Mohite', email: 'nurse.shital@medtech.ai', ward: 'High Dependency Unit (HDU)', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44574', deptCode: 'GENM' },
    { name: 'Sister Madhuri Suryavanshi', email: 'nurse.madhuri@medtech.ai', ward: 'Nephrology Care', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44575', deptCode: 'NEPH' },
    { name: 'Sister Reshma Shaikh', email: 'nurse.reshma@medtech.ai', ward: 'Gastro Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44576', deptCode: 'GAST' },
    { name: 'Sister Chhaya Mane', email: 'nurse.chhaya@medtech.ai', ward: 'ENT & Eye Recovery', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44577', deptCode: 'ENT' },
    { name: 'Sister Bharati Sutar', email: 'nurse.bharati@medtech.ai', ward: 'Emergency Casualty', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44578', deptCode: 'EMER' },
    { name: 'Sister Smita Bhalerao', email: 'nurse.smita@medtech.ai', ward: 'Chest & TB Ward', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44579', deptCode: 'PULM' },
    { name: 'Sister Sarika Ingale', email: 'nurse.sarika@medtech.ai', ward: 'Executive Suite Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44580', deptCode: 'GENM' }
  ];

  // Male Nurses (30)
  const maleNurses = [
    { name: 'Brother Rahul Shinde', email: 'nurse.rahul.s@medtech.ai', ward: 'Emergency Casualty', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44581', deptCode: 'EMER' },
    { name: 'Brother Sachin Patil', email: 'nurse.sachin.p@medtech.ai', ward: 'Medical ICU (MICU)', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44582', deptCode: 'GENM' },
    { name: 'Brother Amit Deshmukh', email: 'nurse.amit.d@medtech.ai', ward: 'Surgical ICU (SICU)', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44583', deptCode: 'SURG' },
    { name: 'Brother Ganesh Jadhav', email: 'nurse.ganesh.j@medtech.ai', ward: 'Ortho Trauma Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44584', deptCode: 'ORTH' },
    { name: 'Brother Manoj Kulkarni', email: 'nurse.manoj.k@medtech.ai', ward: 'Neuro Trauma ICU', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44585', deptCode: 'NEUR' },
    { name: 'Brother Nitin Pawar', email: 'nurse.nitin.p@medtech.ai', ward: 'Operation Theatre (OT Male Lead)', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44586', deptCode: 'SURG' },
    { name: 'Brother Sagar Gaikwad', email: 'nurse.sagar.g@medtech.ai', ward: 'Cardiac Emergency', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44587', deptCode: 'CARD' },
    { name: 'Brother Vikas More', email: 'nurse.vikas.m@medtech.ai', ward: 'Dialysis Day Care', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44588', deptCode: 'NEPH' },
    { name: 'Brother Ajay Chavan', email: 'nurse.ajay.c@medtech.ai', ward: 'Male Surgical Ward', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44589', deptCode: 'SURG' },
    { name: 'Brother Sandeep Salunke', email: 'nurse.sandeep.s@medtech.ai', ward: 'Urology Post-Op', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44590', deptCode: 'UROL' },
    { name: 'Brother Pravin Joshi', email: 'nurse.pravin.j@medtech.ai', ward: 'Burn Unit Critical Care', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44591', deptCode: 'EMER' },
    { name: 'Brother Mahesh Sawant', email: 'nurse.mahesh.s@medtech.ai', ward: 'High Dependency Unit (HDU)', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44592', deptCode: 'GENM' },
    { name: 'Brother Prashant Jagtap', email: 'nurse.prashant.j@medtech.ai', ward: 'Male Medical Ward', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44593', deptCode: 'GENM' },
    { name: 'Brother Atul Raut', email: 'nurse.atul.r@medtech.ai', ward: 'Acute Stroke Unit', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44594', deptCode: 'NEUR' },
    { name: 'Brother Deepak Bhosale', email: 'nurse.deepak.b@medtech.ai', ward: 'Oncology Inpatient', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44595', deptCode: 'ONCO' },
    { name: 'Brother Vishal Kamble', email: 'nurse.vishal.k@medtech.ai', ward: 'Isolation Ward', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44596', deptCode: 'GENM' },
    { name: 'Brother Kiran Thorat', email: 'nurse.kiran.t@medtech.ai', ward: 'Fracture & Plaster Bay', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44597', deptCode: 'ORTH' },
    { name: 'Brother Santosh Tambe', email: 'nurse.santosh.t@medtech.ai', ward: 'General Male Ward 3', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44598', deptCode: 'GENM' },
    { name: 'Brother Chetan Kadam', email: 'nurse.chetan.k@medtech.ai', ward: 'Pulmonology Ward', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44599', deptCode: 'PULM' },
    { name: 'Brother Rohan Wagh', email: 'nurse.rohan.w@medtech.ai', ward: 'Cath Lab Observation', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44600', deptCode: 'CARD' },
    { name: 'Brother Suraj Nikam', email: 'nurse.suraj.n@medtech.ai', ward: 'Nephro Ward', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44601', deptCode: 'NEPH' },
    { name: 'Brother Swapnil Ghadge', email: 'nurse.swapnil.g@medtech.ai', ward: 'Post-Surgery Step-down', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44602', deptCode: 'SURG' },
    { name: 'Brother Nilesh Mohite', email: 'nurse.nilesh.m@medtech.ai', ward: 'Emergency Triage 2', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44603', deptCode: 'EMER' },
    { name: 'Brother Ashish Suryavanshi', email: 'nurse.ashish.s@medtech.ai', ward: 'Critical Spine Care', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44604', deptCode: 'ORTH' },
    { name: 'Brother Dinesh Shaikh', email: 'nurse.dinesh.s@medtech.ai', ward: 'Day Care Infusion', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44605', deptCode: 'ONCO' },
    { name: 'Brother Tushar Mane', email: 'nurse.tushar.m@medtech.ai', ward: 'Gastric Care ICU', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44606', deptCode: 'GAST' },
    { name: 'Brother Sunil Sutar', email: 'nurse.sunil.s@medtech.ai', ward: 'ENT Trauma Care', shift: '11:00 PM - 07:00 AM', phone: '+91 98200 44607', deptCode: 'ENT' },
    { name: 'Brother Ravindra Bhalerao', email: 'nurse.ravindra.b@medtech.ai', ward: 'Casualty Resuscitation', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44608', deptCode: 'EMER' },
    { name: 'Brother Avinash Ingale', email: 'nurse.avinash.i@medtech.ai', ward: 'Respiratory Care Unit', shift: '03:00 PM - 11:00 PM', phone: '+91 98200 44609', deptCode: 'PULM' },
    { name: 'Brother Vinod Kale', email: 'nurse.vinod.k@medtech.ai', ward: 'Executive Ward Triage', shift: '07:00 AM - 03:00 PM', phone: '+91 98200 44610', deptCode: 'GENM' }
  ];

  // Cleaning Staff (20)
  const cleaningStaff = [
    { name: 'Ramesh Shinde', email: 'cleaner.ramesh@medtech.ai', area: 'ICU & Critical Care Suites', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77881' },
    { name: 'Suresh Kamble', email: 'cleaner.suresh@medtech.ai', area: 'Emergency & Casualty Triage', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77882' },
    { name: 'Ganesh Pawar', email: 'cleaner.ganesh@medtech.ai', area: 'Operation Theatre (OT-1 & OT-2)', shift: '10:00 PM - 06:00 AM', phone: '+91 98200 77883' },
    { name: 'Prakash Jadhav', email: 'cleaner.prakash@medtech.ai', area: 'General Ward Floor 1', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77884' },
    { name: 'Shantaram More', email: 'cleaner.shantaram@medtech.ai', area: 'General Ward Floor 2', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77885' },
    { name: 'Sunita Gaikwad', email: 'cleaner.sunita@medtech.ai', area: 'Maternity & Labor Ward', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77886' },
    { name: 'Kamalbai Shinde', email: 'cleaner.kamalbai@medtech.ai', area: 'Pediatric & NICU Wards', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77887' },
    { name: 'Anil Chavan', email: 'cleaner.anil@medtech.ai', area: 'Central OPD Waiting Halls', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77888' },
    { name: 'Sanjay Salunke', email: 'cleaner.sanjay@medtech.ai', area: 'Pathology Lab & Blood Bank', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77889' },
    { name: 'Vijay Joshi', email: 'cleaner.vijay@medtech.ai', area: 'Radiology & MRI Suite', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77890' },
    { name: 'Dilip Sawant', email: 'cleaner.dilip@medtech.ai', area: 'Dialysis Center & CCU', shift: '10:00 PM - 06:00 AM', phone: '+91 98200 77891' },
    { name: 'Ashok Jagtap', email: 'cleaner.ashok@medtech.ai', area: 'Emergency Ambulance Bays', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77892' },
    { name: 'Rekhabai Raut', email: 'cleaner.rekhabai@medtech.ai', area: 'Central Patient Restrooms (Floor 1-3)', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77893' },
    { name: 'Mohan Bhosale', email: 'cleaner.mohan@medtech.ai', area: 'Biomedical Waste Storage Area', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77894' },
    { name: 'Laxman Thorat', email: 'cleaner.laxman@medtech.ai', area: 'Pharmacy & Medicine Stores', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77895' },
    { name: 'Shobhabai Tambe', email: 'cleaner.shobhabai@medtech.ai', area: 'Female Deluxe Rooms & Cabins', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77896' },
    { name: 'Pandurang Kadam', email: 'cleaner.pandurang@medtech.ai', area: 'Hospital Corridors & Lift Lobbies', shift: '10:00 PM - 06:00 AM', phone: '+91 98200 77897' },
    { name: 'Bhimrao Wagh', email: 'cleaner.bhimrao@medtech.ai', area: 'Cafeteria & Staff Common Areas', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77898' },
    { name: 'Savitabai Nikam', email: 'cleaner.savitabai@medtech.ai', area: 'Day Care Infusion & Chemo Bay', shift: '02:00 PM - 10:00 PM', phone: '+91 98200 77899' },
    { name: 'Baburao Mohite', email: 'cleaner.baburao@medtech.ai', area: 'Hospital Entry, Reception & Parking', shift: '06:00 AM - 02:00 PM', phone: '+91 98200 77900' }
  ];

  // Fetch departments mapping
  const depts = await query('SELECT id, code FROM Departments');
  const deptMap = {};
  depts.forEach(d => { deptMap[d.code] = d.id; });
  const defaultDeptId = deptMap['GENM'] || 1;

  // 1. Process 60 Nurses
  const allNurses = [...femaleNurses, ...maleNurses];
  for (const n of allNurses) {
    let u = await getOne('SELECT id FROM Users WHERE email = ?', [n.email]);
    if (u) {
      await run('UPDATE Users SET password_hash = ?, full_name = ?, phone = ?, role = ? WHERE id = ?', [
        nurseHash, n.name, n.phone, 'nurse', u.id
      ]);
    } else {
      const res = await run(
        "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'nurse', ?, ?)",
        [n.email, nurseHash, n.name, n.phone]
      );
      u = { id: res.lastID };
    }

    const deptId = deptMap[n.deptCode] || defaultDeptId;
    const existingNurse = await getOne('SELECT id FROM Nurses WHERE user_id = ?', [u.id]);
    if (existingNurse) {
      await run(
        `UPDATE Nurses SET full_name = ?, department_id = ?, shift_timings = ?, assigned_ward = ?, qualification = ?, phone = ?, is_on_duty = 0, status = 'pending', approved_at = NULL WHERE id = ?`,
        [n.name, deptId, n.shift, n.ward, 'B.Sc Nursing / GNM', n.phone, existingNurse.id]
      );
    } else {
      await run(
        `INSERT INTO Nurses (user_id, full_name, department_id, shift_timings, assigned_ward, qualification, phone, is_on_duty, status, approved_at)
         VALUES (?, ?, ?, ?, ?, 'B.Sc Nursing / GNM', ?, 0, 'pending', NULL)`,
        [u.id, n.name, deptId, n.shift, n.ward, n.phone]
      );
    }
  }

  // 2. Process 20 Cleaning Staff
  for (const c of cleaningStaff) {
    let u = await getOne('SELECT id FROM Users WHERE email = ?', [c.email]);
    if (u) {
      await run('UPDATE Users SET password_hash = ?, full_name = ?, phone = ?, role = ? WHERE id = ?', [
        cleanHash, c.name, c.phone, 'cleaning', u.id
      ]);
    } else {
      const res = await run(
        "INSERT INTO Users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'cleaning', ?, ?)",
        [c.email, cleanHash, c.name, c.phone]
      );
      u = { id: res.lastID };
    }

    const existingCleaner = await getOne('SELECT id FROM HousekeepingStaff WHERE user_id = ?', [u.id]);
    if (existingCleaner) {
      await run(
        `UPDATE HousekeepingStaff SET full_name = ?, assigned_area = ?, shift_timings = ?, phone = ?, is_on_duty = 0, status = 'pending', approved_at = NULL WHERE id = ?`,
        [c.name, c.area, c.shift, c.phone, existingCleaner.id]
      );
    } else {
      await run(
        `INSERT INTO HousekeepingStaff (user_id, full_name, assigned_area, shift_timings, phone, is_on_duty, status, approved_at)
         VALUES (?, ?, ?, ?, ?, 0, 'pending', NULL)`,
        [u.id, c.name, c.area, c.shift, c.phone]
      );
    }
  }

  const nurseCount = await getOne("SELECT COUNT(*) as count FROM Nurses WHERE status = 'pending'");
  const cleanerCount = await getOne("SELECT COUNT(*) as count FROM HousekeepingStaff WHERE status = 'pending'");

  console.log(`\nSuccessfully migrated!`);
  console.log(`Total Pending Nurses: ${nurseCount?.count || 0}`);
  console.log(`Total Pending Cleaning Staff: ${cleanerCount?.count || 0}`);

  db.close();
}

migrateStaff().catch(err => {
  console.error('Staff migration failed:', err);
  process.exit(1);
});
