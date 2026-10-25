import express from 'express';
import { authenticateToken, requireRole, generateToken } from '../middleware/auth.js';
import { query, getOne } from '../db.js';
import { snapshot, hospitalDate, sessionAction, entryAction, sessionFor, fail } from '../services/opd.js';

const router = express.Router();
router.use(authenticateToken);
const handle = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (error) { console.error('OPD:', error.message); res.status(error.status || 500).json({ error: error.status ? error.message : 'OPD update failed. Refresh and retry.' }); }
};
router.use((req, res, next) => {
  if (req.user.role === 'opd_display') {
    if (req.user.displayDate !== hospitalDate()) return res.status(403).json({ error: 'Display link expired. Ask reception for today’s link.' });
    req.query.period = req.user.displayPeriod;
  }
  next();
});
router.post('/display-token', requireRole(['admin', 'staff']), handle(async (req, res) => {
  if (!['morning', 'evening'].includes(req.body.period)) fail('Choose a valid session.', 400);
  res.json({ token: generateToken({ role: 'opd_display', displayDate: hospitalDate(), displayPeriod: req.body.period }) });
}));
router.get('/doctors', handle(async (req, res) => {
  const doctors = await query(`SELECT d.id, d.full_name, d.specialization, d.room_number,
    s.id AS session_id, s.state, s.period, s.primary_user_id, s.backup_user_id
    FROM Doctors d LEFT JOIN OPDSessions s ON s.doctor_id = d.id AND s.session_date = ? AND s.period = ?
    WHERE d.status = 'approved' OR d.status IS NULL ORDER BY d.full_name`, [hospitalDate(), req.query.period || 'morning']);
  res.json({ doctors });
}));
router.get('/assistants', requireRole(['admin']), handle(async (req, res) => {
  res.json({ assistants: await query("SELECT id, full_name, role FROM Users WHERE role IN ('staff','nurse','admin') ORDER BY full_name") });
}));
router.get('/tracker', handle(async (req, res) => {
  let { doctor_id, period } = req.query;
  const today = hospitalDate();
  if (req.user.role === 'patient' && !doctor_id) {
    const appointment = await getOne(`SELECT a.* FROM Appointments a JOIN Patients p ON p.id = a.patient_id
      WHERE p.user_id = ? AND a.appointment_date = ? ORDER BY CASE WHEN a.status IN ('completed','cancelled') THEN 1 ELSE 0 END, a.id LIMIT 1`, [req.user.userId, today]);
    if (appointment) { doctor_id = appointment.doctor_id; period ||= sessionFor(appointment.time_slot); }
  }
  if (req.user.role === 'doctor') doctor_id = (await getOne('SELECT id FROM Doctors WHERE user_id = ?', [req.user.userId]))?.id;
  if (!doctor_id) doctor_id = (await getOne("SELECT id FROM Doctors WHERE status = 'approved' OR status IS NULL ORDER BY id LIMIT 1"))?.id;
  if (!doctor_id) fail('No available doctors.', 404);
  res.json(await snapshot(req.user, Number(doctor_id), today, period || 'morning', true));
}));
router.get('/session', requireRole(['admin','staff','nurse','doctor']), handle(async (req, res) => {
  res.json(await snapshot(req.user, Number(req.query.doctor_id), req.query.date || hospitalDate(), req.query.period || 'morning'));
}));
router.post('/sessions/:id/action', requireRole(['admin','staff','nurse']), handle(async (req, res) => {
  await sessionAction(req.user, Number(req.params.id), req.body);
  res.json({ message: 'Session updated.' });
}));
router.post('/appointments/:id/action', requireRole(['admin','staff','nurse']), handle(async (req, res) => {
  await entryAction(req.user, Number(req.params.id), req.body.action, req.body.version, req.body.reason);
  res.json({ message: 'Queue updated.' });
}));
export default router;
