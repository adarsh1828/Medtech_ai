import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import './opd.css';

export default function LiveOPDTracker({ user, onOpenPrescription, displayToken, displayOnly = false, doctorId: fixedDoctorId, period: fixedPeriod }) {
  const [data, setData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [period, setPeriod] = useState('');
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(null);
  const [sound, setSound] = useState(false);
  const lastCall = useRef(null);
  const audioContext = useRef(null);
  const soundRef = useRef(false);
  const isPatient = user?.role === 'patient';
  const selectedDoctor = fixedDoctorId || doctorId;
  const selectedPeriod = fixedPeriod || period;
  useEffect(() => {
    if (displayOnly) return;
    let disposed = false;
    api.getOPDDoctors().then(result => !disposed && setDoctors(result.doctors)).catch(e => !disposed && setError(e.message));
    return () => { disposed = true; };
  }, [displayOnly]);
  useEffect(() => {
    let disposed = false;
    let timer;
    lastCall.current = null;
    setData(null); setError(''); setUpdated(null);
    const load = async () => {
      try {
        const result = await api.getOPDTracker(selectedDoctor, selectedPeriod, displayToken);
        if (disposed) return;
        setData(result); setUpdated(new Date()); setError('');
        const current = result.currently_consulting;
        const key = current?.queue_state === 'called' && result.session.state === 'running' ? `${result.session.id}:${current.id}:${current.called_at}` : '';
        if (key && lastCall.current && key !== lastCall.current && soundRef.current && audioContext.current) {
          const context = audioContext.current;
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.frequency.value = 587;
          gain.gain.setValueAtTime(.15, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .7);
          osc.connect(gain); gain.connect(context.destination);
          osc.start(); osc.stop(context.currentTime + .7);
        }
        if (key) lastCall.current = key;
        else if (lastCall.current === null) lastCall.current = 'initial';
      } catch (e) { if (!disposed) setError(e.message); }
      finally { if (!disposed) timer = setTimeout(load, 6000); }
    };
    load();
    return () => { disposed = true; clearTimeout(timer); };
  }, [selectedDoctor, selectedPeriod, displayToken]);
  useEffect(() => () => { audioContext.current?.close(); }, []);
  const toggleSound = async () => {
    try {
      if (!sound) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext.current ||= new Audio();
        await audioContext.current.resume();
      }
      soundRef.current = !sound; setSound(!sound);
    } catch { setError('Enable sound through your browser audio settings.'); }
  };
  const session = data?.session;
  const own = data?.patient_appointment;
  const current = data?.currently_consulting;
  const waiting = data?.queue_list.filter(q => q.queue_state === 'waiting') || [];
  const running = session?.state === 'running';
  const statusText = !session ? 'Loading OPD' : session.state === 'paused' ? 'Doctor temporarily unavailable · OPD paused' : session.state === 'closed' ? 'OPD session closed' : session.state === 'not_started' ? 'OPD has not started' : 'OPD running';
  const patientStatus = !own ? 'No appointment in this session' : own.queue_state === 'booked' ? 'Please check in with the OPD assistant on arrival' : own.queue_state === 'skipped' ? 'You were absent when called. Report to the assistant to rejoin.' : own.queue_state === 'called' ? 'Your token has been called. Please report to the cabin.' : own.queue_state === 'cancelled' ? 'Appointment cancelled' : own.queue_state === 'completed' ? 'Visit finished' : own.queue_state === 'in_consultation' ? (running ? 'Your consultation is in progress' : 'Your consultation is interrupted and preserved') : `Ahead of you: ${data.patients_ahead} patients. Follow the serving order below.`;
  return <section className="opd-desk opd-card" aria-label="Live OPD tracker">
    <div className="opd-row"><h3>{displayOnly ? data?.doctor.full_name || 'Doctor' : 'थेट ओपीडी ट्रॅकर · Live OPD Tracker'}</h3><span className="opd-muted">{updated ? `Updated ${updated.toLocaleTimeString()}` : 'Connecting…'}</span><button className="btn btn-outline" onClick={toggleSound}>{sound ? 'Mute chime' : 'Enable chime'}</button></div>
    {!displayOnly && <div className="opd-row"><label>Doctor<select value={doctorId} onChange={e => { setDoctorId(e.target.value); setPeriod(''); }}><option value="">{isPatient ? 'My appointment today' : 'Select doctor'}</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></label><label>Session<select value={period} onChange={e => setPeriod(e.target.value)}><option value="">{isPatient ? 'My appointment session' : 'Morning'}</option><option value="morning">Morning / AM</option><option value="evening">Afternoon & evening / PM</option></select></label></div>}
    {error && <div className="opd-notice opd-warning" role="alert">Connection unavailable. Displayed information may be outdated. Retrying automatically.</div>}
    <div className={`opd-notice ${!running ? 'opd-warning' : ''}`}><strong>{statusText}</strong>{session?.state === 'paused' && <p>{session.expected_return ? `${Date.parse(session.expected_return) < Date.parse(data.server_time) ? 'Return delayed. Previous estimate:' : 'Expected return:'} ${new Date(session.expected_return).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Waiting for staff confirmation.` : 'Return time not confirmed. Waiting estimate is unavailable.'}</p>}{session?.state === 'closed' && <p>Contact reception to arrange another session for a pending visit.</p>}</div>
    {data && <>
      <p>{data.doctor.full_name} · {data.doctor.specialization} · {data.doctor.room_number || 'Cabin'} · {session.period} · {session.session_date}</p>
      <div className="opd-grid">
        <div className="opd-card"><span>{!running && current ? 'Preserved patient' : current?.queue_state === 'called' ? 'Called token · report to cabin' : 'Currently in cabin'}</span><strong className="opd-metric">{current ? `#${current.token_number}` : '—'}</strong><p>{!current ? 'No patient currently called or in consultation' : current.queue_state === 'called' ? 'Awaiting patient entry' : running ? 'Consultation in progress' : 'Consultation interrupted'}</p></div>
        <div className="opd-card"><span>{isPatient && !displayOnly ? 'Your token' : 'Next waiting token'}</span><strong className="opd-metric">{isPatient && !displayOnly ? own ? `#${own.token_number}` : '—' : data.next_waiting ? `#${data.next_waiting.token_number}` : '—'}</strong><p>{isPatient && !displayOnly ? patientStatus : `${waiting.length} checked-in patients waiting`}</p></div>
        {isPatient && !displayOnly && <div className="opd-card"><span>Estimated wait</span><strong className="opd-metric">{data.estimated_wait_range ? `${data.estimated_wait_range[0]}–${data.estimated_wait_range[1]} min` : 'Awaiting update'}</strong><p>{own?.queue_state === 'waiting' && running ? 'Approximate; consultation times may vary.' : 'An estimate appears once you are checked in and OPD is running.'}</p></div>}
      </div>
      {isPatient && !displayOnly && own && !['cancelled','skipped'].includes(own.queue_state) && <div className="opd-track">{['Token booked','Checked in / waiting','In cabin','Visit finished'].map((step,index) => <span className={data.journey_step === index + 1 ? 'current' : ''} key={step}>{index + 1}. {step}</span>)}</div>}
      <div><strong>Actual serving order</strong><div className="opd-track">{waiting.slice(0, 10).map((q,index) => <span key={q.id}>{index + 1}. Token #{q.token_number}</span>)}{!waiting.length && <p>No checked-in patients waiting.</p>}</div></div>
      {isPatient && own?.queue_state === 'completed' && <p>{own.prescription_id ? <button className="btn btn-primary" onClick={() => onOpenPrescription?.(own.id)}>View prescription</button> : 'Visit finished · prescription has not been issued yet.'}</p>}
    </>}
  </section>;
}
