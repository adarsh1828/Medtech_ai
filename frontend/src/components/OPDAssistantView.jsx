import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import './opd.css';

const labels = { booked: 'Booked · not arrived', waiting: 'Waiting', called: 'Called · awaiting entry', in_consultation: 'In cabin', skipped: 'Skipped · not present', completed: 'Visit finished', cancelled: 'Cancelled' };
export default function OPDAssistantView({ user }) {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [period, setPeriod] = useState('morning');
  const [data, setData] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [primary, setPrimary] = useState('');
  const [backup, setBackup] = useState('');
  const [reason, setReason] = useState('');
  const [returnAt, setReturnAt] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState(null);
  const generation = useRef(0);
  const isAdmin = user.role === 'admin';
  useEffect(() => {
    let disposed = false;
    api.getOPDDoctors(period).then(result => {
      if (disposed) return;
      setDoctors(result.doctors);
      setDoctorId(previous => result.doctors.some(d => String(d.id) === String(previous)) ? previous : String(result.doctors.find(d => isAdmin || [d.primary_user_id, d.backup_user_id].includes(user.id))?.id || ''));
    }).catch(e => !disposed && setError(e.message));
    if (isAdmin) api.getOPDAssistants().then(result => !disposed && setAssistants(result.assistants)).catch(e => !disposed && setError(e.message));
    return () => { disposed = true; };
  }, [period, isAdmin, user.id]);

  const load = async (id = doctorId, selectedPeriod = period, version = generation.current) => {
    if (!id) return;
    try {
      const result = await api.getOPDSession(id, selectedPeriod);
      if (generation.current !== version) return;
      setData(previous => previous?.session.id === result.session.id && previous.session.version > result.session.version ? previous : result); setUpdated(new Date()); setError('');
    } catch (e) { if (generation.current === version) setError(e.message); }
  };
  useEffect(() => {
    generation.current++;
    const version = generation.current;
    setData(null); setUpdated(null); setError('');
    load(doctorId, period, version);
    const interval = setInterval(() => load(doctorId, period, version), 6000);
    return () => { clearInterval(interval); generation.current++; };
  }, [doctorId, period]);
  useEffect(() => {
    setPrimary(String(data?.session.primary_user_id || ''));
    setBackup(String(data?.session.backup_user_id || ''));
  }, [data?.session.primary_user_id, data?.session.backup_user_id, data?.session.id]);

  const act = async (action, entry) => {
    if (busy || !data) return;
    setBusy(true); setError('');
    const version = generation.current;
    try {
      const payload = { action, version: data.session.version, reason, expected_return: returnAt ? new Date(returnAt).toISOString() : null, primary_user_id: primary, backup_user_id: backup || null };
      if (entry) await api.opdEntryAction(entry.id, payload);
      else await api.opdSessionAction(data.session.id, payload);
      await load(doctorId, period, version);
    } catch (e) {
      await load(doctorId, period, version);
      if (generation.current === version) setError(e.message);
    } finally { setBusy(false); }
  };
  const session = data?.session;
  const hasControl = isAdmin || session?.operator_user_id === user.id;
  const running = session?.state === 'running';
  const waiting = data?.queue_list.filter(q => q.queue_state === 'waiting') || [];
  const active = data?.currently_consulting;
  const button = (title, action, entry, disabled = false) => <button className="btn btn-outline opd-action" disabled={busy || !hasControl || disabled || !!error} onClick={() => act(action, entry)}>{title}</button>;

  return <section className="opd-desk">
    <div className="opd-row"><div><h2>OPD Assistant Desk</h2><p>Doctor handles clinical care. The assigned cabin assistant manages patient movement and availability.</p></div><button className="btn btn-outline" onClick={() => load()}>Refresh</button></div>
    <div className="opd-row">
      <label>Session<select aria-label="Session" value={period} onChange={e => setPeriod(e.target.value)} disabled={busy}><option value="morning">Morning / AM appointments</option><option value="evening">Afternoon & evening / PM appointments</option></select></label>
      <label>Doctor<select aria-label="Doctor" value={doctorId} onChange={e => setDoctorId(e.target.value)} disabled={busy}><option value="">Select assigned doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} · {d.room_number || 'Cabin'}{!isAdmin && ![d.primary_user_id,d.backup_user_id].includes(user.id) ? ' · not assigned' : ''}</option>)}</select></label>
      <span className="opd-muted">{updated ? `Last updated ${updated.toLocaleTimeString()}` : 'Waiting for session'}</span>
    </div>
    {error && <div className="opd-notice opd-warning" role="alert">{error} <button className="btn btn-outline" onClick={() => load()}>Reload queue</button></div>}
    {!doctorId && <div className="opd-notice">An admin must assign a primary and backup assistant for each doctor and session. Select an assigned doctor to begin.</div>}
    {session && <>
      <div className="opd-card">
        <div className="opd-row"><h3>{data.doctor.full_name} · {session.state.replaceAll('_',' ')}</h3><span>{session.session_date} · {session.period}</span></div>
        <p>Primary: {session.primary_name} · Backup: {session.backup_name} · Operating: {session.operator_name}</p>
        {isAdmin && <div className="opd-row"><label>Primary assistant<select aria-label="Primary assistant" value={primary} onChange={e => setPrimary(e.target.value)}><option value="">Choose primary</option>{assistants.map(a => <option key={a.id} value={a.id}>{a.full_name} ({a.role})</option>)}</select></label><label>Backup assistant<select aria-label="Backup assistant" value={backup} onChange={e => setBackup(e.target.value)}><option value="">No backup</option>{assistants.filter(a => String(a.id) !== primary).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select></label><button disabled={busy || !primary} className="btn btn-primary" onClick={() => act('assign')}>Save assignment</button></div>}
        {!hasControl && <div className="opd-notice">Take control before updating. A takeover stops the previous operator from changing this queue.</div>}
        <div className="opd-row">
          <button className="btn btn-primary" disabled={busy || session.operator_user_id === user.id} onClick={() => act('take_control')}>Take control / Backup takeover</button>
          {session.state === 'not_started' && button('Start OPD', 'start')}
          {running && button('Doctor unavailable · Pause now', 'pause')}
          {session.state === 'paused' && button('Doctor returned · Resume', 'resume')}
          {session.state !== 'closed' && button('Close session', 'close', null, !!active)}
        </div>
        <div className="opd-row"><label>Internal reason (optional for pause)<input value={reason} onChange={e => setReason(e.target.value)} placeholder="Emergency duty / break / meeting" maxLength={250} /></label><label>Expected return (optional)<input type="datetime-local" value={returnAt} onChange={e => setReturnAt(e.target.value)} /></label></div>
        {session.state === 'paused' && <div className="opd-notice opd-warning">Doctor temporarily unavailable. Current visit is preserved; calling and entry are blocked. {session.expected_return ? `Expected return: ${new Date(session.expected_return).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Return must be confirmed manually.` : 'Return time not yet confirmed.'}</div>}
        {session.state === 'closed' && <div className="opd-notice">Session closed. Pending patients retain their tokens. Cancel the old visit and book the agreed new session from Appointments.</div>}
        {data.stale_consultation && <div className="opd-notice opd-warning">Long consultation: verify doctor availability. The system has preserved the current patient.</div>}
      </div>
      <div className="opd-grid">
        {[
          ['Current cabin / called patient', data.queue_list.filter(q => ['called','in_consultation'].includes(q.queue_state))],
          ['Waiting · actual serving order', waiting],
          ['Skipped · awaiting return', data.queue_list.filter(q => q.queue_state === 'skipped')],
          ['Booked · check in on arrival', data.queue_list.filter(q => q.queue_state === 'booked')],
          ['Finished / cancelled', data.queue_list.filter(q => ['completed','cancelled'].includes(q.queue_state))]
        ].map(([title, rows]) => <div className="opd-card" key={title}><h3>{title} ({rows.length})</h3>{!rows.length && <p className="opd-muted">No patients</p>}{rows.map(q => <article key={q.id} className="opd-patient">
          <strong>#{q.token_number} · {q.patient_name}</strong><p>{labels[q.queue_state]}{q.returned_at ? ' · returned patient' : ''}{q.prescription_id ? ' · Rx ready' : q.queue_state === 'completed' ? ' · Rx not issued' : ''}</p>
          <div className="opd-row">
            {q.queue_state === 'booked' && button('Hajar nondva · Check in', 'check_in', q, session.state === 'closed')}
            {q.queue_state === 'waiting' && button('Call patient', 'call', q, !running || !!active || waiting[0]?.id !== q.id)}
            {q.queue_state === 'called' && button('Recall patient', 'recall', q, !running)}
            {q.queue_state === 'called' && button('Patient In', 'patient_in', q, !running)}
            {q.queue_state === 'in_consultation' && button('Patient Out · Visit finished', 'finish', q, !running)}
            {['waiting','called'].includes(q.queue_state) && button('Not present · Skip', 'skip', q, session.state === 'closed')}
            {q.queue_state === 'skipped' && button('Patient returned', 'return', q, session.state === 'closed')}
            {q.queue_state === 'waiting' && ['admin','nurse'].includes(user.role) && button('Clinical priority (reason required)', 'priority', q, !reason.trim())}
            {['booked','waiting','called','skipped'].includes(q.queue_state) && button('Cancel visit', 'cancel', q)}
          </div>
        </article>)}</div>)}
      </div>
      <details className="opd-card"><summary>Recent queue activity</summary>{data.events.map(e => <p key={e.id}>{new Date(e.created_at).toLocaleTimeString()} · {e.actor_name} · {e.action}{e.appointment_id ? ` · visit ${e.appointment_id}` : ''}{e.detail ? ` · ${e.detail}` : ''}</p>)}</details>
      <p className="opd-muted">Returned patients keep their token and join after one regular waiting patient. Multiple returned patients are separated by regular patients where available.</p>
    </>}
  </section>;
}
