import { query, getOne, run } from './db.js';

export async function seedRichPrototypeData() {
  console.log('🏥 Calibrating rich prototype demo data (Prescriptions, Lab Reports, Vitals, Queue)...');

  try {
    // 0. Ensure required tables exist
    await run(`
      CREATE TABLE IF NOT EXISTS EmergencyIncidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        phone TEXT,
        emergency_type TEXT NOT NULL,
        priority TEXT DEFAULT 'LEVEL_1_CRITICAL',
        location TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'dispatched', 'resolved')),
        dispatched_at DATETIME,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    await run(`
      CREATE TABLE IF NOT EXISTS ShiftHandovers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outgoing_nurse_name TEXT NOT NULL,
        incoming_nurse_name TEXT NOT NULL,
        ward_name TEXT NOT NULL,
        shift_name TEXT NOT NULL,
        critical_patients_notes TEXT,
        handover_status TEXT DEFAULT 'accepted',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // Lookup Doctors
    const docRamesh = await getOne("SELECT id, full_name, department_id FROM Doctors WHERE full_name LIKE '%Ramesh%' LIMIT 1");
    const docRajesh = await getOne("SELECT id, full_name, department_id FROM Doctors WHERE full_name LIKE '%Rajesh%' LIMIT 1");
    const docArjun = await getOne("SELECT id, full_name, department_id FROM Doctors WHERE full_name LIKE '%Arjun%' LIMIT 1");
    const docVikram = await getOne("SELECT id, full_name, department_id FROM Doctors WHERE full_name LIKE '%Vikram%' LIMIT 1");
    const docSunita = await getOne("SELECT id, full_name, department_id FROM Doctors WHERE full_name LIKE '%Sunita%' LIMIT 1");

    // Lookup Patients
    const patRahul = await getOne("SELECT id, full_name FROM Patients WHERE full_name LIKE '%Rahul Patil%' LIMIT 1");
    const patShravan = await getOne("SELECT id, full_name FROM Patients WHERE full_name LIKE '%Shravan%' LIMIT 1");
    const patSunita = await getOne("SELECT id, full_name FROM Patients WHERE full_name LIKE '%Sunita Patil%' LIMIT 1");
    const patAdarsh = await getOne("SELECT id, full_name FROM Patients WHERE full_name LIKE '%Adarsh%' LIMIT 1");
    const patElena = await getOne("SELECT id, full_name FROM Patients WHERE full_name LIKE '%Elena%' LIMIT 1");
    const patJames = await getOne("SELECT id, full_name FROM Patients WHERE full_name LIKE '%James%' LIMIT 1");

    const today = new Date().toISOString().split('T')[0];

    // 1. Seed Extra LabTests if missing
    let testCbc = await getOne("SELECT id FROM LabTests WHERE test_code = 'CBC-01'");
    let testLipid = await getOne("SELECT id FROM LabTests WHERE test_code = 'LIP-02'");
    let testHba1c = await getOne("SELECT id FROM LabTests WHERE test_code = 'HBA1C'");
    let testEcg = await getOne("SELECT id FROM LabTests WHERE test_code = 'ECG-04'");
    let testCreat = await getOne("SELECT id FROM LabTests WHERE test_code = 'REN-05'");

    let testTsh = await getOne("SELECT id FROM LabTests WHERE test_code = 'TSH-06'");
    if (!testTsh) {
      const res = await run(
        `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
         VALUES ('Thyroid Stimulating Hormone (TSH)', 'TSH-06', 'Biochemistry', '0.40 - 4.20', 'uIU/mL', 'Ultrasensitive chemiluminescent thyroid function assessment')`
      );
      testTsh = { id: res.lastID };
    }

    let testLft = await getOne("SELECT id FROM LabTests WHERE test_code = 'LFT-07'");
    if (!testLft) {
      const res = await run(
        `INSERT INTO LabTests (test_name, test_code, category, normal_range, units, description)
         VALUES ('Liver Function Test Panel (LFT)', 'LFT-07', 'Biochemistry', 'SGOT: 10-40, SGPT: 7-56, Bilirubin: 0.2-1.2', 'U/L, mg/dL', 'Comprehensive hepatic enzymes, protein, and bilirubin analysis')`
      );
      testLft = { id: res.lastID };
    }

    // 2. Seed Lab Reports
    const sampleReports = [
      {
        patientId: patRahul?.id,
        testId: testCbc?.id,
        doctorId: docRamesh?.id,
        date: today,
        result: 'Hemoglobin: 13.8 g/dL | WBC: 4,800 /uL | Platelets: 2.15 Lakhs/uL | Neutrophils: 56% | Lymphocytes: 38%',
        refRange: 'Hb: 13.0 - 17.0 g/dL, WBC: 4,500 - 11,000 /uL, Platelets: 1.5 - 4.5 Lakhs/uL',
        remarks: 'Mild relative lymphocytosis suggestive of acute viral episode. Platelet indices and red cell morphology normal.'
      },
      {
        patientId: patShravan?.id,
        testId: testHba1c?.id,
        doctorId: docRajesh?.id,
        date: today,
        result: 'HbA1c: 7.2 % (Estimated Average Blood Glucose: 160 mg/dL)',
        refRange: '< 5.7 % (Normal), 5.7 - 6.4 % (Prediabetes), >= 6.5 % (Diabetic)',
        remarks: 'Elevated glycemic marker consistent with early diabetes mellitus. Therapeutic dietary modification and exercise advised.'
      },
      {
        patientId: patSunita?.id,
        testId: testCreat?.id,
        doctorId: docArjun?.id,
        date: today,
        result: 'Serum Creatinine: 0.82 mg/dL | Blood Urea Nitrogen (BUN): 14 mg/dL | eGFR: > 95 mL/min/1.73m²',
        refRange: 'Creatinine: 0.60 - 1.20 mg/dL, BUN: 7 - 20 mg/dL, eGFR: > 90 mL/min',
        remarks: 'Optimal glomerular filtration and renal function. Safe for routine pharmacotherapy.'
      },
      {
        patientId: patSunita?.id,
        testId: testTsh?.id,
        doctorId: docSunita?.id || docRamesh?.id,
        date: today,
        result: 'Serum TSH: 5.42 uIU/mL | Free T4: 1.15 ng/dL',
        refRange: 'TSH: 0.40 - 4.20 uIU/mL, Free T4: 0.8 - 1.8 ng/dL',
        remarks: 'Mild subclinical hypothyroidism with normal free thyroxine. Recommend repeat thyroid screening after 6 weeks.'
      },
      {
        patientId: patShravan?.id,
        testId: testLipid?.id,
        doctorId: docRajesh?.id,
        date: today,
        result: 'Total Cholesterol: 218 mg/dL | LDL: 138 mg/dL | HDL: 44 mg/dL | Triglycerides: 178 mg/dL',
        refRange: 'Total Chol: < 200 mg/dL, LDL: < 100 mg/dL, HDL: > 50 mg/dL, Triglycerides: < 150 mg/dL',
        remarks: 'Borderline elevated LDL and triglycerides (Dyslipidemia). Statin therapy initiated with low-fat diet.'
      },
      {
        patientId: patAdarsh?.id || patRahul?.id,
        testId: testCbc?.id,
        doctorId: docRamesh?.id,
        date: today,
        result: 'Hemoglobin: 15.2 g/dL | WBC: 6,400 /uL | Platelets: 2.80 Lakhs/uL | ESR: 8 mm/hr',
        refRange: 'Hb: 13.0 - 17.0 g/dL, WBC: 4,500 - 11,000 /uL',
        remarks: 'All hematological parameters within normal clinical limits. Excellent baseline physiological status.'
      }
    ];

    for (const r of sampleReports) {
      if (!r.patientId || !r.testId) continue;
      const exists = await getOne(
        'SELECT id FROM LabReports WHERE patient_id = ? AND test_id = ?',
        [r.patientId, r.testId]
      );
      if (!exists) {
        await run(
          `INSERT INTO LabReports (patient_id, test_id, doctor_id, test_date, status, result_value, reference_range, remarks)
           VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)`,
          [r.patientId, r.testId, r.doctorId || null, r.date, r.result, r.refRange, r.remarks]
        );
      }
    }

    // 3. Seed Realistic Prescriptions with Medicines (Doctor-Prescribed)
    const rxTemplates = [
      {
        doctor: docRamesh,
        patient: patRahul,
        token: 103,
        reason: 'Acute fever, sore throat, and dry cough for 3 days',
        timeSlot: '11:00 AM',
        vitals: { bp: '122/80', pulse: '76 bpm', temp: '99.4 F', weight: '68 kg' },
        diagnosis: 'Acute Viral Upper Respiratory Infection (URTI) with Low-grade Pyrexia',
        notes: 'Sore throat, low-grade temperature 99.4°F, mild headache. Oropharynx mildly congested without purulent exudates. Bilateral lungs clear on auscultation.',
        advice: 'Adequate hydration (warm water, 2.5L daily). Steam inhalation twice daily with tulsi/saline. Avoid cold beverages and oily foods. Rest for 3 days.',
        followUp: '2026-10-15',
        medicines: [
          { name: 'Tab. Paracetamol', dosage: '650 mg', freq: 'Thrice daily (TDS)', dur: '5 days', instructions: 'Take with water after meals when fever/body ache' },
          { name: 'Tab. Azithromycin', dosage: '500 mg', freq: 'Once daily (OD)', dur: '3 days', instructions: 'Take 1 hour before or 2 hours after lunch' },
          { name: 'Tab. Montelukast + Levocetirizine', dosage: '10mg/5mg', freq: 'Once daily (HS)', dur: '5 days', instructions: 'Take at bedtime for allergy and congestion relief' },
          { name: 'Syp. Ascoril-D Cough Formula', dosage: '10 ml', freq: 'Twice daily (BD)', dur: '5 days', instructions: 'Take after meals for dry cough' }
        ]
      },
      {
        doctor: docRajesh,
        patient: patShravan,
        token: 104,
        reason: 'Routine cardiology follow-up for episodic palpitations & blood pressure',
        timeSlot: '11:30 AM',
        vitals: { bp: '142/92', pulse: '82 bpm', temp: '98.4 F', weight: '79 kg' },
        diagnosis: 'Primary Grade-1 Essential Hypertension with Moderate Dyslipidemia',
        notes: 'Resting BP 142/92 mmHg confirmed on bilateral arms. Normal S1/S2 heart sounds, no audible murmurs or gallops. Baseline ECG shows normal sinus rhythm.',
        advice: 'Dietary Approaches to Stop Hypertension (DASH diet). Restrict dietary sodium to < 2g/day. 30 minutes brisk walking daily. Avoid tobacco and processed foods.',
        followUp: '2026-10-25',
        medicines: [
          { name: 'Tab. Telmisartan', dosage: '40 mg', freq: 'Once daily (OD)', dur: '30 days', instructions: 'Take in the morning after breakfast with water' },
          { name: 'Tab. Rosuvastatin', dosage: '10 mg', freq: 'Once daily (HS)', dur: '30 days', instructions: 'Take at bedtime after light dinner' },
          { name: 'Cap. Cholecalciferol (Vitamin D3)', dosage: '60,000 IU', freq: 'Once weekly', dur: '8 weeks', instructions: 'Take every Sunday after heavy meal with milk' }
        ]
      },
      {
        doctor: docArjun,
        patient: patSunita,
        token: 105,
        reason: 'Frequent throbbing headaches and neck heaviness after prolonged work',
        timeSlot: '12:00 PM',
        vitals: { bp: '116/76', pulse: '72 bpm', temp: '98.2 F', weight: '56 kg' },
        diagnosis: 'Chronic Tension-Type Headache with Cervicogenic Muscle Spasm',
        notes: 'Bilateral band-like squeezing head pain. Tenderness over bilateral trapezius muscles. No focal neurological deficits, normal fundus examination.',
        advice: 'Maintain ergonomic posture during laptop work. 5-minute break every hour of screen time. Adequate 7-8 hours restful sleep. Limit excess caffeine.',
        followUp: '2026-11-10',
        medicines: [
          { name: 'Tab. Naproxen + Domperidone', dosage: '500mg/10mg', freq: 'SOS (When needed)', dur: '5 days', instructions: 'Take immediately at the onset of severe headache after food' },
          { name: 'Tab. Magnesium Glycinate', dosage: '400 mg', freq: 'Once daily (HS)', dur: '30 days', instructions: 'Take at night for neuro-muscular relaxation' },
          { name: 'Tab. Pantoprazole', dosage: '40 mg', freq: 'Once daily (OD)', dur: '10 days', instructions: 'Take empty stomach in the morning 30 mins before tea/breakfast' }
        ]
      },
      {
        doctor: docVikram,
        patient: patRahul,
        token: 106,
        reason: 'Acute lower back pain following lifting heavy boxes at home',
        timeSlot: '12:30 PM',
        vitals: { bp: '120/78', pulse: '74 bpm', temp: '98.6 F', weight: '68 kg' },
        diagnosis: 'Acute Lumbar Musculoskeletal Strain (L4-L5 Spasm)',
        notes: 'Sudden onset low back pain with paravertebral muscle spasm. Straight Leg Raising (SLR) test negative bilaterally, deep tendon reflexes intact.',
        advice: 'Avoid forward bending and heavy weight lifting. Use Lumbo-Sacral support belt while traveling. Moist heat pack application for 15 mins twice daily.',
        followUp: '2026-10-18',
        medicines: [
          { name: 'Tab. Aceclofenac + Paracetamol + Thiocolchicoside', dosage: '100mg/325mg/4mg', freq: 'Twice daily (BD)', dur: '5 days', instructions: 'Take after breakfast and dinner' },
          { name: 'Volini / Diclofenac Pain Relief Gel', dosage: 'Topical application', freq: 'Thrice daily', dur: '7 days', instructions: 'Apply gently over lower back without vigorous massage' },
          { name: 'Tab. Calcium Carbonate + Vitamin D3', dosage: '500mg/250IU', freq: 'Once daily (OD)', dur: '15 days', instructions: 'Take with lunch' }
        ]
      },
      {
        doctor: docRamesh,
        patient: patAdarsh || patRahul,
        token: 107,
        reason: 'Recurrent morning sneezing, clear runny nose, and dry throat tickle',
        timeSlot: '01:00 PM',
        vitals: { bp: '118/76', pulse: '72 bpm', temp: '98.2 F', weight: '70 kg' },
        diagnosis: 'Seasonal Allergic Rhinitis & Pharyngitis',
        notes: 'Nasal mucosal edema with clear watery rhinorrhea. Oropharynx mild erythema without tonsillar enlargement. Normal respiratory examination.',
        advice: 'Avoid dust exposure, wear mask outdoors. Drink warm fluids. Steam inhalation before sleeping.',
        followUp: '2026-10-20',
        medicines: [
          { name: 'Tab. Fexofenadine', dosage: '120 mg', freq: 'Once daily (OD)', dur: '7 days', instructions: 'Take at night after food for allergic symptoms' },
          { name: 'Fluticasone Furoate Nasal Spray', dosage: '1 spray per nostril', freq: 'Once daily', dur: '14 days', instructions: 'Use in morning after clearing nasal passage' },
          { name: 'Vitamin C Chewable (Limcee)', dosage: '500 mg', freq: 'Once daily', dur: '15 days', instructions: 'Chew tablet daily after lunch' }
        ]
      }
    ];

    for (const t of rxTemplates) {
      if (!t.doctor || !t.patient) continue;

      // 3a. Ensure Completed Appointment exists for this prescription
      let appt = await getOne(
        'SELECT id FROM Appointments WHERE patient_id = ? AND doctor_id = ? AND reason_for_visit = ?',
        [t.patient.id, t.doctor.id, t.reason]
      );

      let apptId = appt?.id;
      if (!apptId) {
        const apptRes = await run(
          `INSERT INTO Appointments (
            patient_id, doctor_id, department_id, appointment_date, time_slot,
            token_number, status, reason_for_visit, vitals_bp, vitals_pulse,
            vitals_temp, vitals_weight, consultation_started_at, completed_at, completion_remark
          ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
          [
            t.patient.id,
            t.doctor.id,
            t.doctor.department_id,
            today,
            t.timeSlot,
            t.token,
            t.reason,
            t.vitals.bp,
            t.vitals.pulse,
            t.vitals.temp,
            t.vitals.weight,
            'तपासणी पूर्ण, औषधोपचार सल्ला दिला आणि ई-प्रिस्क्रिप्शन जारी करण्यात आले.'
          ]
        );
        apptId = apptRes.lastID;
      }

      // 3b. Insert Prescription if not already present
      const rxExists = await getOne(
        'SELECT id FROM Prescriptions WHERE diagnosis = ? AND patient_id = ?',
        [t.diagnosis, t.patient.id]
      );

      let prescriptionId = rxExists?.id;
      if (!prescriptionId) {
        const rxRes = await run(
          `INSERT INTO Prescriptions (appointment_id, patient_id, doctor_id, diagnosis, clinical_notes, advice, follow_up_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [apptId, t.patient.id, t.doctor.id, t.diagnosis, t.notes, t.advice, t.followUp]
        );
        prescriptionId = rxRes.lastID;

        // 3c. Insert Medicines for this prescription
        for (const med of t.medicines) {
          await run(
            `INSERT INTO Medicines (prescription_id, medicine_name, dosage, frequency, duration, instructions)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [prescriptionId, med.name, med.dosage, med.freq, med.dur, med.instructions]
          );
        }
      }
    }

    // 4. Seed Live OPD Queue Appointments (Scheduled, Confirmed, In-Consultation)
    const liveQueueAppts = [
      {
        patient: patRahul,
        doctor: docRamesh,
        token: 108,
        slot: '02:30 PM',
        status: 'scheduled',
        reason: 'Follow-up vitals and medication tolerance evaluation'
      },
      {
        patient: patShravan,
        doctor: docRajesh,
        token: 109,
        slot: '02:45 PM',
        status: 'in_consultation',
        reason: 'Ambulatory blood pressure review & treadmill stress clearance'
      },
      {
        patient: patSunita,
        doctor: docSunita || docRamesh,
        token: 110,
        slot: '03:15 PM',
        status: 'confirmed',
        reason: 'Thyroid profile discussion and preventive wellness check'
      }
    ];

    for (const lq of liveQueueAppts) {
      if (!lq.patient || !lq.doctor) continue;
      const exists = await getOne(
        'SELECT id FROM Appointments WHERE token_number = ? AND appointment_date = ?',
        [lq.token, today]
      );
      if (!exists) {
        await run(
          `INSERT INTO Appointments (
            patient_id, doctor_id, department_id, appointment_date, time_slot,
            token_number, status, reason_for_visit, vitals_bp, vitals_pulse, vitals_temp, vitals_weight
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '120/80', '72 bpm', '98.4 F', '65 kg')`,
          [lq.patient.id, lq.doctor.id, lq.doctor.department_id, today, lq.slot, lq.token, lq.status, lq.reason]
        );
      }
    }

    // 5. Seed Patient Vitals (Nurse Station)
    const vitalsLogs = [
      {
        patient: patRahul,
        bed: 'GW-302',
        nurseName: 'Sister Sunita Sharma',
        bp: '122/80 mmHg',
        pulse: '74 bpm',
        temp: '98.4 °F',
        spo2: '99%',
        sugar: '106 mg/dL',
        notes: 'Patient resting comfortably. Oral intake normal. No nausea or dizziness reported.'
      },
      {
        patient: patShravan,
        bed: 'ICU-101',
        nurseName: 'Sister Anita Deshmukh',
        bp: '138/88 mmHg',
        pulse: '82 bpm',
        temp: '98.6 °F',
        spo2: '97%',
        sugar: '144 mg/dL',
        notes: 'Continuous telemetry cardiac monitoring active. Normal sinus rhythm maintained. Stable.'
      },
      {
        patient: patSunita,
        bed: 'SP-402',
        nurseName: 'Sister Priya Kulkarni',
        bp: '116/76 mmHg',
        pulse: '70 bpm',
        temp: '98.1 °F',
        spo2: '100%',
        sugar: '98 mg/dL',
        notes: 'Headache pain score reduced to 2/10. Cervical relaxation exercises demonstrated.'
      },
      {
        patient: patElena,
        bed: 'GW-301',
        nurseName: 'Sister Kavita Patil',
        bp: '124/82 mmHg',
        pulse: '76 bpm',
        temp: '98.6 °F',
        spo2: '98%',
        sugar: '112 mg/dL',
        notes: 'Post-consultation ambulatory vitals within normal physiological limits.'
      }
    ];

    for (const v of vitalsLogs) {
      if (!v.patient) continue;
      const exists = await getOne(
        'SELECT id FROM PatientVitals WHERE patient_name = ? AND bp = ?',
        [v.patient.full_name, v.bp]
      );
      if (!exists) {
        await run(
          `INSERT INTO PatientVitals (patient_id, patient_name, bed_number, nurse_id, nurse_name, bp, pulse, temp, spo2, sugar, notes)
           VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
          [v.patient.id, v.patient.full_name, v.bed, v.nurseName, v.bp, v.pulse, v.temp, v.spo2, v.sugar, v.notes]
        );
      }
    }

    // 6. Seed Medication Administration Schedules (Nurse Station)
    const medSchedules = [
      {
        patient: patRahul,
        bed: 'GW-302',
        doctorName: docRamesh?.full_name || 'Dr. Ramesh Ganeshrao Surye',
        medName: 'Inj. Pantoprazole',
        dosage: '40mg IV',
        time: '08:00 AM',
        status: 'given',
        nurse: 'Sister Sunita Sharma',
        notes: 'Administered IV bolus slowly over 3 minutes with sterile flush.'
      },
      {
        patient: patRahul,
        bed: 'GW-302',
        doctorName: docRamesh?.full_name || 'Dr. Ramesh Ganeshrao Surye',
        medName: 'Tab. Paracetamol',
        dosage: '650mg Oral',
        time: '02:00 PM',
        status: 'pending',
        nurse: null,
        notes: 'To be given post-lunch with water.'
      },
      {
        patient: patShravan,
        bed: 'ICU-101',
        doctorName: docRajesh?.full_name || 'Dr. Rajesh Deshmukh',
        medName: 'Tab. Telmisartan',
        dosage: '40mg Oral',
        time: '09:00 AM',
        status: 'given',
        nurse: 'Sister Anita Deshmukh',
        notes: 'Administered with water. Pre-dose BP 140/90 mmHg.'
      },
      {
        patient: patShravan,
        bed: 'ICU-101',
        doctorName: docRajesh?.full_name || 'Dr. Rajesh Deshmukh',
        medName: 'Tab. Rosuvastatin',
        dosage: '10mg Oral',
        time: '09:00 PM',
        status: 'pending',
        nurse: null,
        notes: 'Bedtime lipid medication scheduled.'
      },
      {
        patient: patSunita,
        bed: 'SP-402',
        doctorName: docArjun?.full_name || 'Dr. Arjun Mehta',
        medName: 'Tab. Naproxen',
        dosage: '500mg Oral',
        time: '01:00 PM',
        status: 'pending',
        nurse: null,
        notes: 'SOS pain medication - administer if headache score > 4/10.'
      }
    ];

    for (const ms of medSchedules) {
      if (!ms.patient) continue;
      const exists = await getOne(
        'SELECT id FROM MedicationSchedules WHERE patient_name = ? AND medicine_name = ?',
        [ms.patient.full_name, ms.medName]
      );
      if (!exists) {
        await run(
          `INSERT INTO MedicationSchedules (patient_id, patient_name, bed_number, doctor_name, medicine_name, dosage, scheduled_time, status, given_at, given_by_nurse, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ms.patient.id,
            ms.patient.full_name,
            ms.bed,
            ms.doctorName,
            ms.medName,
            ms.dosage,
            ms.time,
            ms.status,
            ms.status === 'given' ? `${today} ${ms.time.replace(' AM', ':00')}` : null,
            ms.nurse,
            ms.notes
          ]
        );
      }
    }

    // 7. Seed Shift Handovers (Nurse Station)
    const handovers = [
      {
        outgoing: 'Sister Sunita Sharma',
        incoming: 'Sister Anita Deshmukh',
        ward: 'General Medical Ward (Floor 2)',
        shift: 'Day to Afternoon Shift (07:00 AM - 03:00 PM)',
        notes: 'All 8 inpatients assessed during morning rounds. Bed GW-302 (Rahul Patil) completed IV rehydration, 2 PM oral paracetamol pending. Vitals logged and stable. No code red incidents.',
        status: 'accepted'
      },
      {
        outgoing: 'Sister Kavita Patil',
        incoming: 'Brother Sagar Gaikwad',
        ward: 'Cardiac Intensive Care Unit (CICU)',
        shift: 'Afternoon to Night Shift (03:00 PM - 11:00 PM)',
        notes: 'Bed ICU-101 (Shravan Gaikwad) post-procedure continuous vitals stable. Morning Telmisartan administered, lipid profile reports delivered to Dr. Rajesh Deshmukh. Telemetry alarms verified.',
        status: 'accepted'
      }
    ];

    for (const h of handovers) {
      const exists = await getOne(
        'SELECT id FROM ShiftHandovers WHERE outgoing_nurse_name = ? AND ward_name = ?',
        [h.outgoing, h.ward]
      );
      if (!exists) {
        await run(
          `INSERT INTO ShiftHandovers (outgoing_nurse_name, incoming_nurse_name, ward_name, shift_name, critical_patients_notes, handover_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [h.outgoing, h.incoming, h.ward, h.shift, h.notes, h.status]
        );
      }
    }

    // 8. Seed Emergency SOS Incidents
    const emergencyIncidents = [
      {
        name: 'Harishankar Kulkarni',
        phone: '+91 98200 88712',
        type: 'Acute Coronary Syndrome / Retro-Sternal Chest Pain',
        priority: 'LEVEL_1_CRITICAL',
        loc: 'Hospital Main Entrance / Casualty Triage Bay 1',
        notes: '62-year-old male presenting with acute retrosternal crushing chest pain radiating to left arm with diaphoresis. Immediate ECG, oxygen (4L/min) and dual antiplatelet therapy administered.',
        status: 'dispatched',
        dispatchedAt: `${today} 09:15:00`
      },
      {
        name: 'Vijay Mhatre',
        phone: '+91 98200 99431',
        type: 'Road Traffic Accident (RTA) / Lower Limb Trauma',
        priority: 'LEVEL_2_URGENT',
        loc: 'Ambulance Bay-2 Resuscitation Area',
        notes: 'Blunt trauma to right lower limb, open laceration cleaned, sutured, and temporary splint applied. Attended by Orthopedic specialist Dr. Vikram Malhotra. Patient stabilized.',
        status: 'resolved',
        dispatchedAt: `${today} 08:30:00`,
        resolvedAt: `${today} 09:40:00`
      }
    ];

    for (const em of emergencyIncidents) {
      const exists = await getOne(
        'SELECT id FROM EmergencyIncidents WHERE patient_name = ? AND emergency_type = ?',
        [em.name, em.type]
      );
      if (!exists) {
        await run(
          `INSERT INTO EmergencyIncidents (patient_name, phone, emergency_type, priority, location, notes, status, dispatched_at, resolved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [em.name, em.phone, em.type, em.priority, em.loc, em.notes, em.status, em.dispatchedAt, em.resolvedAt || null]
        );
      }
    }

    // 9. Link Inpatient Beds with Actual Patients and Clinical Notes
    if (patShravan) {
      await run(
        `UPDATE Beds SET status = 'occupied', patient_id = ?, notes = 'Admitted under Cardiology for cardiac observation & BP titration.', admitted_at = ? WHERE bed_number = 'ICU-101'`,
        [patShravan.id, `${today} 08:30:00`]
      );
    }

    if (patRahul) {
      await run(
        `UPDATE Beds SET status = 'occupied', patient_id = ?, notes = 'Admitted under General Medicine for acute viral pyrexia & IV fluids.', admitted_at = ? WHERE bed_number = 'GW-302'`,
        [patRahul.id, `${today} 10:15:00`]
      );
    }

    if (patSunita) {
      await run(
        `UPDATE Beds SET status = 'occupied', patient_id = ?, notes = 'Observation semi-private suite for tension headache pain management.', admitted_at = ? WHERE bed_number = 'SP-402'`,
        [patSunita.id, `${today} 09:00:00`]
      );
    }

    if (patJames) {
      await run(
        `UPDATE Beds SET status = 'occupied', patient_id = ?, notes = 'Orthopedic traction rehabilitation day 3.', admitted_at = ? WHERE bed_number = 'GW-304'`,
        [patJames.id, `${today} 07:00:00`]
      );
    }

    // 10. Seed Billing Invoice #INV-2026-0004 for Rahul Patil (OPD + Lab + Medicines)
    if (patRahul && docRamesh) {
      const existingInv4 = await getOne("SELECT id FROM Invoices WHERE invoice_number = 'INV-2026-0004'");
      if (!existingInv4) {
        const inv4 = await run(
          `INSERT INTO Invoices (invoice_number, patient_id, appointment_id, doctor_id, total_amount, discount, tax, net_amount, payment_status, payment_method, transaction_ref, notes, paid_at)
           VALUES (?, ?, 3, ?, 930.00, 0.00, 46.50, 976.50, 'paid', 'upi', 'UPI/2026/9182374921', 'OPD General Medicine consultation, Complete Blood Count (CBC), and 5-day pharmacy medication pack', ?)`,
          ['INV-2026-0004', patRahul.id, docRamesh.id, `${today} 11:45:00`]
        );

        const items4 = [
          [inv4.lastID, 'General Physician Consultation (Dr. Ramesh Surye)', 'consultation', 1, 300.00, 300.00],
          [inv4.lastID, 'Complete Blood Count (CBC) Automated Panel', 'lab', 1, 350.00, 350.00],
          [inv4.lastID, 'Oral Antibiotic & Fever Pharmacy Pack (Paracetamol, Azithromycin)', 'medicine', 1, 280.00, 280.00]
        ];

        for (const item of items4) {
          await run(
            `INSERT INTO InvoiceItems (invoice_id, description, category, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            item
          );
        }
      }
    }

    console.log('✅ Rich prototype demo data successfully calibrated and populated!');
  } catch (err) {
    console.error('❌ Error during rich prototype data calibration:', err);
  }
}

// Allow direct CLI invocation: `node backend/src/seedDemoData.js`
if (process.argv[1] && process.argv[1].endsWith('seedDemoData.js')) {
  seedRichPrototypeData().then(() => {
    console.log('Seeding process complete.');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
