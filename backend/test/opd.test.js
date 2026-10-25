import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

// Never open the developer's hospital database or cloud account in tests.
process.env.MEDTECH_TEST_DB = ':memory:';
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_URL;
delete process.env.TURSO_AUTH_TOKEN;
const { query, getOne, run, transaction, db } = await import('../src/db.js');
const { initializeOPD, sessionForDoctor, snapshot, entryAction, sessionAction, hospitalDate } = await import('../src/services/opd.js');
const { generateToken } = await import('../src/middleware/auth.js');
const { default: opdRouter } = await import('../src/routes/opd.js');
const { default: appointmentsRouter } = await import('../src/routes/appointments.js');
const { default: prescriptionsRouter } = await import('../src/routes/prescriptions.js');

test('assistant-owned OPD lifecycle, concurrency, return fairness and API permissions', async t => {
  for (const sql of [
    'CREATE TABLE Users (id INTEGER PRIMARY KEY, full_name TEXT, role TEXT)',
    'CREATE TABLE Departments (id INTEGER PRIMARY KEY, name TEXT, floor_number INTEGER)',
    'CREATE TABLE Doctors (id INTEGER PRIMARY KEY, user_id INTEGER, full_name TEXT, specialization TEXT, room_number TEXT, department_id INTEGER, status TEXT)',
    'CREATE TABLE Patients (id INTEGER PRIMARY KEY, user_id INTEGER, full_name TEXT, dob TEXT, gender TEXT, blood_group TEXT, allergies TEXT, phone TEXT)',
    `CREATE TABLE Appointments (id INTEGER PRIMARY KEY, patient_id INTEGER, doctor_id INTEGER, department_id INTEGER, appointment_date TEXT, time_slot TEXT, token_number INTEGER,
      status TEXT CHECK(status IN ('scheduled','confirmed','in_consultation','completed','cancelled')), reason_for_visit TEXT,
      consultation_started_at TEXT, completed_at TEXT, completion_remark TEXT, vitals_bp TEXT, vitals_pulse TEXT, vitals_temp TEXT, vitals_weight TEXT)`,
    'CREATE TABLE Prescriptions (id INTEGER PRIMARY KEY, appointment_id INTEGER UNIQUE, patient_id INTEGER, doctor_id INTEGER, diagnosis TEXT, clinical_notes TEXT, advice TEXT, follow_up_date TEXT)',
    'CREATE TABLE Medicines (id INTEGER PRIMARY KEY, prescription_id INTEGER, medicine_name TEXT, dosage TEXT, frequency TEXT, duration TEXT, instructions TEXT)'
  ]) await run(sql);
  await initializeOPD();
  for (const [id, role] of [[1,'admin'],[2,'staff'],[3,'staff'],[4,'doctor'],[5,'patient'],[6,'cleaning'],[7,'doctor']]) {
    await run('INSERT INTO Users VALUES (?, ?, ?)', [id, `Account ${id}`, role]);
  }
  await run("INSERT INTO Departments VALUES (1, 'Medicine', 1)");
  await run("INSERT INTO Doctors VALUES (1, 4, 'Dr One', 'Medicine', '101', 1, 'approved'), (2, 7, 'Dr Two', 'Medicine', '102', 1, 'approved')");
  for (let id = 1; id <= 9; id++) {
    await run('INSERT INTO Patients (id, user_id, full_name) VALUES (?, ?, ?)', [id, id === 1 ? 5 : 100 + id, `Private Patient ${id}`]);
    await run(`INSERT INTO Appointments (id, patient_id, doctor_id, department_id, appointment_date, time_slot, token_number, status, reason_for_visit)
      VALUES (?, ?, 1, 1, ?, ?, ?, 'scheduled', 'Private diagnosis')`, [id, id, hospitalDate(), id === 9 ? '02:00 PM' : '09:00 AM', 100 + id]);
  }
  const admin = { role: 'admin', userId: 1 };
  const primary = { role: 'staff', userId: 2 };
  const backup = { role: 'staff', userId: 3 };
  const patient = { role: 'patient', userId: 5 };
  const session = await transaction(() => sessionForDoctor(1));
  const current = () => getOne('SELECT * FROM OPDSessions WHERE id = ?', [session.id]);
  const version = async () => (await current()).version;
  const action = async (id, name, who = primary) => entryAction(who, id, name, await version());
  const control = async (name, who = primary, extra = {}) => sessionAction(who, session.id, { action: name, version: await version(), ...extra });

  await t.test('requires assigned operators and explicit control', async () => {
    await assert.rejects(() => action(1, 'check_in'), /assigned/);
    await control('assign', admin, { primary_user_id: 2, backup_user_id: 3 });
    await assert.rejects(() => action(1, 'check_in'), /Take control/);
    await control('take_control');
    await action(1, 'check_in');
    await assert.rejects(() => action(1, 'call'), /unavailable/);
    await control('start');
    for (let id = 2; id <= 8; id++) await action(id, 'check_in');
  });
  await t.test('skip and returned patients preserve tokens and alternate fairly', async () => {
    await action(1, 'call'); await action(1, 'skip');
    await action(2, 'call'); await action(2, 'patient_in');
    await action(3, 'skip');
    await action(1, 'return'); await action(3, 'return');
    const data = await snapshot(primary, 1);
    assert.deepEqual(data.queue_list.filter(q => q.queue_state === 'waiting').map(q => q.id), [4, 1, 5, 3, 6, 7, 8]);
    assert.equal(data.queue_list.find(q => q.id === 1).token_number, 101);
    const own = await snapshot(patient, 1, hospitalDate(), 'morning', true);
    assert.equal(own.patients_ahead, 2);
    assert.ok(own.estimated_wait_range);
    await assert.rejects(() => action(1, 'call'), /current patient/);
  });
  await t.test('pause keeps current patient, freezes active duration and hides ETA', async () => {
    await run('UPDATE OPDEntries SET active_started_at = ? WHERE appointment_id = 2', [new Date(Date.now() - 120000).toISOString()]);
    await control('pause', primary, { reason: 'VIP meeting' });
    const paused = await snapshot(patient, 1, hospitalDate(), 'morning', true);
    assert.equal(paused.currently_consulting.id, 2);
    assert.equal(paused.estimated_wait_mins, null);
    assert.equal(paused.session.pause_reason, undefined);
    assert.equal(paused.currently_consulting.patient_name, undefined);
    assert.equal(paused.queue_list[0].reason_for_visit, undefined);
    const entry = await getOne('SELECT * FROM OPDEntries WHERE appointment_id = 2');
    assert.ok(entry.active_seconds >= 119);
    assert.equal(entry.active_started_at, null);
    await action(6, 'skip'); await action(6, 'return');
    await assert.rejects(() => action(2, 'finish'), /Resume/);
    await assert.rejects(() => action(4, 'call'), /unavailable/);
    await control('resume');
    assert.ok((await getOne('SELECT active_started_at FROM OPDEntries WHERE appointment_id = 2')).active_started_at);
  });
  await t.test('backup takeover rejects old operator and stale updates', async () => {
    const old = await version();
    await control('take_control', backup);
    await assert.rejects(() => action(2, 'finish'), /Take control/);
    await assert.rejects(() => entryAction(backup, 2, 'finish', old), /Queue changed/);
    await action(2, 'finish', backup);
    await control('take_control');
  });
  await t.test('concurrent calls have one winner and cannot bypass serving order', async () => {
    await assert.rejects(() => action(1, 'call'), /displayed queue order/);
    const v = await version();
    const results = await Promise.allSettled([entryAction(primary, 4, 'call', v), entryAction(primary, 4, 'call', v)]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((await query("SELECT * FROM OPDEntries WHERE state IN ('called','in_consultation')")).length, 1);
    const before = (await getOne('SELECT called_at FROM OPDEntries WHERE appointment_id = 4')).called_at;
    await action(4, 'recall');
    assert.ok((await getOne('SELECT called_at FROM OPDEntries WHERE appointment_id = 4')).called_at >= before);
    await action(4, 'patient_in');
  });
  await t.test('separate sessions cannot consult the same doctor simultaneously', async () => {
    const evening = await transaction(() => sessionForDoctor(1, hospitalDate(), 'evening'));
    await sessionAction(admin, evening.id, { action: 'assign', version: 0, primary_user_id: 2 });
    await sessionAction(admin, evening.id, { action: 'start', version: 1 });
    await entryAction(admin, 9, 'check_in', 2);
    await assert.rejects(() => entryAction(admin, 9, 'call', 3), /current patient/);
    await assert.rejects(() => snapshot(primary, 2), /assigned/);
  });

  const app = express(); app.use(express.json());
  app.use('/api/opd', opdRouter); app.use('/api/appointments', appointmentsRouter); app.use('/api/prescriptions', prescriptionsRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, who, body, method = 'POST') => {
    const response = await fetch(base + path, { method: body ? method : 'GET', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${generateToken(who)}` }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  try {
    await t.test('HTTP endpoints restrict queue mutation, clinical data and old bypasses', async () => {
      assert.equal((await request('/opd/appointments/4/action', patient, {action:'finish',version:await version()})).status, 403);
      assert.equal((await request('/appointments/4/status', {role:'doctor',userId:4}, {status:'completed'}, 'PATCH')).status, 403);
      assert.equal((await request('/appointments', {role:'cleaning',userId:6})).status, 403);
      assert.equal((await request('/appointments/4', patient)).status, 403);
      assert.equal((await request('/appointments/4/vitals', patient, {bp:'120/80'}, 'PATCH')).status, 403);
      const tracker = await request('/opd/tracker', patient);
      assert.equal(tracker.status, 200);
      assert.equal(tracker.body.patient_appointment.id, 1);
      assert.ok(!tracker.body.queue_list.some(row => row.patient_name || row.reason_for_visit));
      assert.equal((await request('/opd/session?doctor_id=1', patient)).status, 403);
    });
    await t.test('TV tokens are read-only, hide clinical data and expire at hospital midnight', async () => {
      const issued = await request('/opd/display-token', admin, {period:'morning'});
      assert.equal(issued.status, 200);
      const tvToken = issued.body.token;
      const tv = async path => {
        const response = await fetch(base + path, {headers:{Authorization:`Bearer ${tvToken}`}});
        return {status:response.status,body:await response.json()};
      };
      assert.equal((await tv('/opd/tracker?doctor_id=1')).status, 200);
      assert.equal((await tv('/prescriptions')).status, 403);
      assert.equal((await tv('/appointments')).status, 403);
      assert.equal((await tv('/opd/session?doctor_id=1')).status, 403);
      const expired = await request('/opd/tracker?doctor_id=1', {role:'opd_display',displayDate:'2020-01-01',displayPeriod:'morning'});
      assert.equal(expired.status, 403);
      assert.equal(hospitalDate(new Date('2026-10-25T18:29:59Z')), '2026-10-25');
      assert.equal(hospitalDate(new Date('2026-10-25T18:30:00Z')), '2026-10-26');
    });
    await t.test('Rx is atomic, enforces ownership and never advances the physical queue', async () => {
      await run("CREATE TRIGGER reject_test_medicine BEFORE INSERT ON Medicines WHEN NEW.medicine_name = 'FAIL_TEST' BEGIN SELECT RAISE(ABORT, 'Simulated medicine storage failure'); END");
      const payload = {appointment_id:4, patient_id:4, diagnosis:'Diagnosis', medicines:[{medicine_name:'FAIL_TEST',dosage:'1'}]};
      assert.equal((await request('/prescriptions', {role:'doctor',userId:4}, payload)).status, 500);
      assert.equal(await getOne('SELECT id FROM Prescriptions WHERE appointment_id = 4'), null);
      assert.equal((await getOne('SELECT status FROM Appointments WHERE id = 4')).status, 'in_consultation');
      assert.equal((await request('/prescriptions', {role:'doctor',userId:7}, {...payload,medicines:[]})).status, 403);
      assert.equal((await request('/prescriptions', {role:'doctor',userId:4}, {...payload,medicines:[]})).status, 201);
      assert.equal((await getOne('SELECT state FROM OPDEntries WHERE appointment_id = 4')).state, 'in_consultation');
      assert.equal((await request('/prescriptions', {role:'doctor',userId:4}, {...payload,medicines:[]})).status, 409);
      await action(4, 'finish');
    });
    await t.test('booking allocates unique tokens under concurrency', async () => {
      const book = {doctor_id:2,department_id:1,patient_id:1,appointment_date:hospitalDate(),time_slot:'09:00 AM'};
      const results = await Promise.all([request('/appointments/book', admin, book), request('/appointments/book', admin, book)]);
      assert.deepEqual(results.map(r => r.status), [201,201]);
      assert.notEqual(results[0].body.token_number, results[1].body.token_number);
    });
    await t.test('closed sessions block return/calling and allow explicit cancellation', async () => {
      await action(3, 'skip');
      await control('close');
      await assert.rejects(() => action(3, 'return'), /Session closed/);
      await action(3, 'cancel');
      assert.equal((await getOne('SELECT status FROM Appointments WHERE id = 3')).status, 'cancelled');
      const rejected = await request('/appointments/book', admin, {doctor_id:1,department_id:1,patient_id:1,appointment_date:hospitalDate(),time_slot:'09:00 AM'});
      assert.equal(rejected.status, 409);
      const own = await snapshot(patient, 1, hospitalDate(), 'morning', true);
      assert.equal(own.session.state, 'closed');
      assert.equal(own.estimated_wait_mins, null);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => db.close(resolve));
  }
});
