import { query, getOne, run, transaction } from '../db.js';

import { hospitalDate } from '../utils/hospitalTime.js';
export { hospitalDate };
export const sessionFor = slot => /PM/i.test(slot || '') ? 'evening' : 'morning';
export function fail(message, status = 409) { throw Object.assign(new Error(message), { status }); }
let schemaPromise;
export function initializeOPD() {
  if (!schemaPromise) schemaPromise = (async () => {
    await run(`CREATE TABLE IF NOT EXISTS OPDSessions (
      id INTEGER PRIMARY KEY, doctor_id INTEGER NOT NULL REFERENCES Doctors(id), session_date TEXT NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('morning','evening')), state TEXT NOT NULL DEFAULT 'not_started',
      primary_user_id INTEGER REFERENCES Users(id), backup_user_id INTEGER REFERENCES Users(id),
      operator_user_id INTEGER REFERENCES Users(id), version INTEGER NOT NULL DEFAULT 0,
      pause_reason TEXT, expected_return TEXT, paused_at TEXT, updated_at TEXT,
      UNIQUE(doctor_id, session_date, period))`);
    await run(`CREATE TABLE IF NOT EXISTS OPDEntries (
      appointment_id INTEGER PRIMARY KEY REFERENCES Appointments(id), doctor_id INTEGER NOT NULL, session_date TEXT NOT NULL, session_id INTEGER NOT NULL REFERENCES OPDSessions(id),
      state TEXT NOT NULL, position REAL NOT NULL, returned_at TEXT, called_at TEXT,
      active_started_at TEXT, active_seconds REAL NOT NULL DEFAULT 0, completed_at TEXT)`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS opd_one_active ON OPDEntries(doctor_id, session_date)
      WHERE state IN ('called','in_consultation')`);
    await run(`CREATE TABLE IF NOT EXISTS OPDEvents (
      id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES OPDSessions(id),
      appointment_id INTEGER, actor_id INTEGER NOT NULL, action TEXT NOT NULL, detail TEXT,
      created_at TEXT NOT NULL)`);
    await run('CREATE INDEX IF NOT EXISTS opd_order ON OPDEntries(session_id, state, position)');
  })().catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}

export async function sessionForDoctor(doctorId, date = hospitalDate(), period = 'morning') {
  if (!['morning', 'evening'].includes(period) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Invalid session date or period.', 400);
  const doctor = await getOne("SELECT id FROM Doctors WHERE id = ? AND (status = 'approved' OR status IS NULL)", [doctorId]);
  if (!doctor) fail('Doctor not found or unapproved.', 404);
  await run('INSERT OR IGNORE INTO OPDSessions (doctor_id, session_date, period) VALUES (?, ?, ?)', [doctorId, date, period]);
  const session = await getOne('SELECT * FROM OPDSessions WHERE doctor_id = ? AND session_date = ? AND period = ?', [doctorId, date, period]);
  // Import existing appointments without changing their existing status constraints.
  await run(`INSERT OR IGNORE INTO OPDEntries (appointment_id, doctor_id, session_date, session_id, state, position, active_started_at)
    SELECT id, doctor_id, appointment_date, ?, CASE WHEN status = 'in_consultation' AND id != (SELECT MIN(other.id) FROM Appointments other WHERE other.doctor_id = Appointments.doctor_id AND other.appointment_date = Appointments.appointment_date AND other.status = 'in_consultation') THEN 'waiting' ELSE CASE status WHEN 'scheduled' THEN 'booked' WHEN 'confirmed' THEN 'waiting' ELSE status END END,
      token_number, CASE WHEN status = 'in_consultation' THEN COALESCE(consultation_started_at, ?) ELSE NULL END
    FROM Appointments WHERE doctor_id = ? AND appointment_date = ?
      AND CASE WHEN UPPER(time_slot) LIKE '%PM%' THEN 'evening' ELSE 'morning' END = ?`,
  [session.id, new Date().toISOString(), doctorId, date, period]);
  return session;
}

export async function canOperate(user, session, requireControl = true) {
  if (user.role === 'admin') return;
  if (!['staff', 'nurse'].includes(user.role) || ![session.primary_user_id, session.backup_user_id].includes(user.userId)) fail('Only assigned OPD assistants can operate this session.', 403);
  if (requireControl && session.operator_user_id !== user.userId) fail('Take control of this session first.');
}
export async function canView(user, session) {
  if (user.role === 'admin') return;
  if (user.role === 'doctor') {
    const doctor = await getOne('SELECT id FROM Doctors WHERE user_id = ?', [user.userId]);
    if (doctor?.id === session.doctor_id) return;
  }
  if (['staff', 'nurse'].includes(user.role)) return canOperate(user, session, false);
  fail('Session access denied.', 403);
}
async function record(session, user, action, appointmentId, detail) {
  await run('INSERT INTO OPDEvents (session_id, appointment_id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [session.id, appointmentId || null, user.userId, action, detail || null, new Date().toISOString()]);
  await run('UPDATE OPDSessions SET version = version + 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), session.id]);
}
export async function entriesFor(session) {
  return query(`SELECT a.*, e.state AS queue_state, e.position, e.returned_at, e.called_at,
    e.active_started_at, e.active_seconds, e.completed_at AS queue_completed_at, p.full_name AS patient_name,
    (SELECT id FROM Prescriptions WHERE appointment_id = a.id) AS prescription_id
    FROM OPDEntries e JOIN Appointments a ON a.id = e.appointment_id JOIN Patients p ON p.id = a.patient_id
    WHERE e.session_id = ? ORDER BY e.position, a.id`, [session.id]);
}

export async function sessionAction(user, id, payload) {
  return transaction(async () => {
    const session = await getOne('SELECT * FROM OPDSessions WHERE id = ?', [id]);
    if (!session) fail('Session not found.', 404);
    const { action, version, primary_user_id, backup_user_id, reason, expected_return } = payload;
    await canOperate(user, session, !['assign', 'take_control'].includes(action));
    if (Number(version) !== session.version) fail('Queue changed. Refresh and try again.');
    if (action !== 'assign' && session.session_date !== hospitalDate()) fail('Only today’s OPD can be operated.');
    if (action === 'assign') {
      if (user.role !== 'admin') fail('Only admins can assign assistants.', 403);
      if (!primary_user_id || Number(primary_user_id) === Number(backup_user_id)) fail('Choose a primary assistant and a different backup.', 400);
      for (const uid of [primary_user_id, backup_user_id].filter(Boolean)) {
        const member = await getOne("SELECT id FROM Users WHERE id = ? AND role IN ('staff','nurse','admin')", [uid]);
        if (!member) fail('Invalid assistant account.', 400);
      }
      await run('UPDATE OPDSessions SET primary_user_id = ?, backup_user_id = ?, operator_user_id = NULL WHERE id = ?', [Number(primary_user_id), backup_user_id ? Number(backup_user_id) : null, id]);
    } else if (action === 'take_control') {
      await run('UPDATE OPDSessions SET operator_user_id = ? WHERE id = ?', [user.userId, id]);
    } else if (action === 'start') {
      if (session.state !== 'not_started') fail('Session already started or closed.');
      if (!session.primary_user_id) fail('Assign an OPD assistant before starting.');
      await run("UPDATE OPDSessions SET state = 'running' WHERE id = ?", [id]);
    } else if (action === 'pause') {
      if (session.state !== 'running') fail('Only a running session can be paused.');
      if (expected_return && (!Number.isFinite(Date.parse(expected_return)) || Date.parse(expected_return) <= Date.now())) fail('Expected return must be in the future.', 400);
      const now = new Date().toISOString();
      await run("UPDATE OPDEntries SET active_seconds = active_seconds + MAX(0, (julianday(?) - julianday(active_started_at)) * 86400), active_started_at = NULL WHERE session_id = ? AND state = 'in_consultation' AND active_started_at IS NOT NULL", [now, id]);
      await run("UPDATE OPDSessions SET state = 'paused', pause_reason = ?, expected_return = ?, paused_at = ? WHERE id = ?", [String(reason || 'Temporarily unavailable').slice(0, 250), expected_return || null, now, id]);
    } else if (action === 'resume') {
      if (session.state !== 'paused') fail('Session is not paused.');
      await run("UPDATE OPDSessions SET state = 'running', pause_reason = NULL, expected_return = NULL, paused_at = NULL WHERE id = ?", [id]);
      await run("UPDATE OPDEntries SET active_started_at = ? WHERE session_id = ? AND state = 'in_consultation'", [new Date().toISOString(), id]);
    } else if (action === 'close') {
      if (session.state === 'closed') fail('Session already closed.');
      const active = await getOne("SELECT appointment_id FROM OPDEntries WHERE session_id = ? AND state IN ('called','in_consultation')", [id]);
      if (active) fail('Finish or skip the current patient before closing.');
      await run("UPDATE OPDSessions SET state = 'closed' WHERE id = ?", [id]);
    } else fail('Unknown session action.', 400);
    await record(session, user, action, null, action === 'assign' ? JSON.stringify({ primary_user_id, backup_user_id }) : reason);
  });
}

export async function entryAction(user, appointmentId, action, version, reason = '') {
  return transaction(async () => {
    const appointment = await getOne('SELECT * FROM Appointments WHERE id = ?', [appointmentId]);
    if (!appointment) fail('Appointment not found.', 404);
    const session = await sessionForDoctor(appointment.doctor_id, appointment.appointment_date, sessionFor(appointment.time_slot));
    await canOperate(user, session);
    if (Number(version) !== session.version) fail('Queue changed. Refresh and try again.');
    if (session.session_date !== hospitalDate()) fail('Only today’s OPD can be operated.');
    const rows = await entriesFor(session);
    const entry = rows.find(row => row.id === Number(appointmentId));
    const now = new Date().toISOString();
    if (session.state === 'closed' && action !== 'cancel') fail('Session closed. Reschedule or cancel this visit.');
    let state;
    if (action === 'check_in') {
      if (entry.queue_state !== 'booked') fail('Patient already checked in.');
      state = 'waiting';
    } else if (action === 'call') {
      if (session.state !== 'running') fail('Doctor unavailable. Calling is paused.');
      if (entry.queue_state !== 'waiting') fail('Only a checked-in waiting patient can be called.');
      if (await getOne("SELECT appointment_id FROM OPDEntries WHERE doctor_id = ? AND session_date = ? AND state IN ('called','in_consultation')", [session.doctor_id, session.session_date])) fail('Attend to the current patient first.');
      if (rows.find(row => row.queue_state === 'waiting')?.id !== entry.id) fail('Call patients in the displayed queue order.');
      state = 'called';
      await run('UPDATE OPDEntries SET called_at = ? WHERE appointment_id = ?', [now, appointmentId]);
    } else if (action === 'recall') {
      if (session.state !== 'running' || entry.queue_state !== 'called') fail('Only the currently called patient can be recalled while OPD is running.');
      state = 'called';
      await run('UPDATE OPDEntries SET called_at = ? WHERE appointment_id = ?', [now, appointmentId]);
    } else if (action === 'patient_in') {
      if (session.state !== 'running' || entry.queue_state !== 'called') fail('Call the patient while OPD is running first.');
      state = 'in_consultation';
      await run('UPDATE OPDEntries SET active_started_at = ? WHERE appointment_id = ?', [now, appointmentId]);
    } else if (action === 'finish') {
      if (session.state !== 'running' || entry.queue_state !== 'in_consultation') fail('Resume and finish the ongoing consultation first.');
      state = 'completed';
      await run(`UPDATE OPDEntries SET completed_at = ?, active_seconds = active_seconds +
        CASE WHEN active_started_at IS NULL THEN 0 ELSE MAX(0, (julianday(?) - julianday(active_started_at)) * 86400) END,
        active_started_at = NULL WHERE appointment_id = ?`, [now, now, appointmentId]);
    } else if (action === 'skip') {
      if (!['waiting', 'called'].includes(entry.queue_state)) fail('Only a waiting or called patient can be skipped.');
      state = 'skipped';
    } else if (action === 'return') {
      if (entry.queue_state !== 'skipped') fail('This patient is not in the skipped list.');
      state = 'waiting';
      // Insert after one regular patient. Existing returned patients retain their
      // return order; another regular patient separates each returned patient.
      const waiting = rows.filter(row => row.queue_state === 'waiting');
      let index = 0;
      for (let i = 0; i < waiting.length; i++) if (waiting[i].returned_at) index = i + 1;
      if (index < waiting.length) index++;
      waiting.splice(index, 0, entry);
      for (let i = 0; i < waiting.length; i++) await run('UPDATE OPDEntries SET position = ? WHERE appointment_id = ?', [i + 1, waiting[i].id]);
      await run('UPDATE OPDEntries SET returned_at = ? WHERE appointment_id = ?', [now, appointmentId]);
    } else if (action === 'cancel') {
      if (['completed', 'cancelled', 'in_consultation'].includes(entry.queue_state)) fail('This visit cannot be cancelled.');
      state = 'cancelled';
    } else if (action === 'priority') {
      if (entry.queue_state !== 'waiting' || !String(reason).trim()) fail('A waiting patient and priority reason are required.', 400);
      if (user.role !== 'admin' && user.role !== 'nurse') fail('Clinical priority requires a nurse or admin.', 403);
      const first = rows.find(row => row.queue_state === 'waiting');
      await run('UPDATE OPDEntries SET position = ? WHERE appointment_id = ?', [(first?.position || 0) - 1, appointmentId]);
      state = 'waiting';
    } else fail('Unknown queue action.', 400);
    await run('UPDATE OPDEntries SET state = ? WHERE appointment_id = ?', [state, appointmentId]);
    const mapped = { booked: 'scheduled', waiting: 'confirmed', called: 'confirmed', skipped: 'confirmed' };
    await run(`UPDATE Appointments SET status = ?, consultation_started_at = CASE WHEN ? = 'in_consultation' THEN COALESCE(consultation_started_at, ?) ELSE consultation_started_at END,
      completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END WHERE id = ?`, [mapped[state] || state, state, now, state, now, appointmentId]);
    await record(session, user, action, appointmentId, reason);
  });
}

export async function snapshot(user, doctorId, date = hospitalDate(), period = 'morning', publicOnly = false) {
  return transaction(async () => {
    const session = await sessionForDoctor(doctorId, date, period);
    if (!publicOnly) await canView(user, session);
    const doctor = await getOne(`SELECT d.id, d.full_name, d.specialization, d.room_number, dep.name AS department_name,
      dep.floor_number FROM Doctors d LEFT JOIN Departments dep ON dep.id = d.department_id WHERE d.id = ?`, [doctorId]);
    const rows = await entriesFor(session);
    const patient = user.role === 'patient' ? await getOne('SELECT id FROM Patients WHERE user_id = ?', [user.userId]) : null;
    const own = rows.find(row => row.patient_id === patient?.id && !['completed','cancelled'].includes(row.queue_state)) || rows.find(row => row.patient_id === patient?.id) || null;
    const waiting = rows.filter(row => row.queue_state === 'waiting');
    const active = rows.find(row => ['called','in_consultation'].includes(row.queue_state));
    const ahead = own?.queue_state === 'waiting' ? Math.max(0, waiting.findIndex(row => row.id === own.id)) + (active ? 1 : 0) : 0;
    const durations = rows.filter(row => row.queue_state === 'completed' && row.active_seconds > 0).map(row => row.active_seconds / 60);
    const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 8;
    const elapsed = active ? active.active_seconds / 60 + (active.active_started_at ? Math.max(0, Date.now() - Date.parse(active.active_started_at)) / 60000 : 0) : 0;
    const estimate = own?.queue_state === 'waiting' && session.state === 'running' ? Math.ceil(Math.max(0, ahead - (active ? 1 : 0)) * average + (active ? Math.max(2, average - elapsed) : 0)) : null;
    const safe = row => row ? { id: row.id, token_number: row.token_number, queue_state: row.queue_state, status: row.status, time_slot: row.time_slot, position: row.position, called_at: row.called_at } : null;
    const names = await query('SELECT id, full_name FROM Users WHERE id IN (?, ?, ?)', [session.primary_user_id, session.backup_user_id, session.operator_user_id]);
    const name = id => names.find(row => row.id === id)?.full_name || 'Not assigned';
    const publicSession = { id: session.id, doctor_id: session.doctor_id, session_date: session.session_date, period: session.period,
      state: session.state, expected_return: session.expected_return, updated_at: session.updated_at, version: session.version };
    return {
      doctor, session: publicOnly ? publicSession : { ...session, primary_name: name(session.primary_user_id), backup_name: name(session.backup_user_id), operator_name: name(session.operator_user_id) },
      queue_list: publicOnly ? rows.map(safe) : rows,
      patient_appointment: own, currently_consulting: publicOnly ? safe(active) : active || null,
      next_waiting: publicOnly ? safe(waiting[0]) : waiting[0] || null,
      patients_ahead: ahead, estimated_wait_mins: estimate,
      estimated_wait_range: estimate === null ? null : [Math.max(0, Math.floor(estimate * .75)), Math.ceil(estimate * 1.25)],
      journey_step: own?.queue_state === 'completed' ? 4 : own?.queue_state === 'in_consultation' ? 3 : ['waiting','called','skipped'].includes(own?.queue_state) ? 2 : 1,
      stale_consultation: session.state === 'running' && active?.queue_state === 'in_consultation' && elapsed > Math.max(20, average * 2),
      server_time: new Date().toISOString(),
      events: publicOnly ? [] : await query(`SELECT e.*, u.full_name AS actor_name FROM OPDEvents e JOIN Users u ON u.id = e.actor_id WHERE session_id = ? ORDER BY e.id DESC LIMIT 30`, [session.id])
    };
  });
}
