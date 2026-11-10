import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import './opd.css';
import { 
  Volume2, 
  VolumeX, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Tv,
  FileText,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';

export default function LiveOPDTracker({ 
  user, 
  onOpenPrescription, 
  displayToken, 
  displayOnly = false, 
  doctorId: fixedDoctorId, 
  period: fixedPeriod 
}) {
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
    api.getOPDDoctors()
      .then(result => !disposed && setDoctors(result.doctors))
      .catch(e => !disposed && setError(e.message));
    return () => { disposed = true; };
  }, [displayOnly]);

  useEffect(() => {
    let disposed = false;
    let timer;
    lastCall.current = null;
    setData(null);
    setError('');
    setUpdated(null);

    const load = async () => {
      try {
        const result = await api.getOPDTracker(selectedDoctor, selectedPeriod, displayToken);
        if (disposed) return;
        setData(result);
        setUpdated(new Date());
        setError('');

        const current = result.currently_consulting;
        const key = current?.queue_state === 'called' && result.session.state === 'running' 
          ? `${result.session.id}:${current.id}:${current.called_at}` 
          : '';

        if (key && lastCall.current && key !== lastCall.current && soundRef.current && audioContext.current) {
          const context = audioContext.current;
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.frequency.value = 587; // high pitch chime
          gain.gain.setValueAtTime(0.18, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.75);
          osc.connect(gain);
          gain.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + 0.75);
        }

        if (key) lastCall.current = key;
        else if (lastCall.current === null) lastCall.current = 'initial';
      } catch (e) {
        if (!disposed) setError(e.message);
      } finally {
        if (!disposed) timer = setTimeout(load, 6000);
      }
    };

    load();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [selectedDoctor, selectedPeriod, displayToken]);

  useEffect(() => () => {
    audioContext.current?.close();
  }, []);

  const toggleSound = async () => {
    try {
      if (!sound) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext.current ||= new Audio();
        await audioContext.current.resume();
      }
      soundRef.current = !sound;
      setSound(!sound);
    } catch {
      setError('Enable sound through your browser audio settings.');
    }
  };

  const session = data?.session;
  const own = data?.patient_appointment;
  const current = data?.currently_consulting;
  const waiting = data?.queue_list.filter(q => q.queue_state === 'waiting') || [];
  const running = session?.state === 'running';

  const statusText = !session
    ? 'Connecting to OPD telemetry...'
    : session.state === 'paused'
    ? 'Doctor temporarily unavailable · OPD paused'
    : session.state === 'closed'
    ? 'OPD session concluded'
    : session.state === 'not_started'
    ? 'OPD has not started yet'
    : 'OPD Active & Consulting';

  const patientStatus = !own
    ? 'No appointment in this session'
    : own.queue_state === 'booked'
    ? 'Please check in with the OPD assistant on arrival'
    : own.queue_state === 'skipped'
    ? 'You were absent when called. Report to the assistant to rejoin.'
    : own.queue_state === 'called'
    ? '🚨 Your token has been called! Report to the cabin immediately.'
    : own.queue_state === 'cancelled'
    ? 'Appointment cancelled'
    : own.queue_state === 'completed'
    ? 'Visit completed'
    : own.queue_state === 'in_consultation'
    ? (running ? 'Your consultation is in progress inside the cabin' : 'Your consultation is interrupted and preserved')
    : `Ahead of you: ${data.patients_ahead} patients. Watch the queue screen.`;

  return (
    <section className="opd-desk opd-card" aria-label="Live OPD tracker">
      {/* Header bar */}
      <div className="opd-row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Tv size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
              {displayOnly ? data?.doctor.full_name || 'Specialist OPD' : 'थेट ओपीडी ट्रॅकर · Live OPD Tracker'}
            </h3>
            <span className="opd-muted">
              {updated ? `Updated at ${updated.toLocaleTimeString()}` : 'Connecting...'}
            </span>
          </div>
        </div>

        <button 
          className="btn btn-outline btn-sm" 
          onClick={toggleSound}
          style={{ gap: '6px', fontWeight: '600' }}
        >
          {sound ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} />}
          <span>{sound ? 'Chime Active' : 'Enable Chime'}</span>
        </button>
      </div>

      {/* Selectors */}
      {!displayOnly && (
        <div className="opd-row">
          <label>
            Doctor
            <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setPeriod(''); }}>
              <option value="">{isPatient ? 'My appointment today' : 'Select doctor'}</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>)}
            </select>
          </label>
          <label>
            Session
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="">{isPatient ? 'My appointment session' : 'Morning / AM'}</option>
              <option value="morning">Morning / AM</option>
              <option value="evening">Afternoon & evening / PM</option>
            </select>
          </label>
        </div>
      )}

      {/* Errors & Notices */}
      {error && (
        <div className="opd-notice opd-warning" role="alert">
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Connection unavailable. Displayed information may be outdated. Retrying automatically.
        </div>
      )}

      <div className={`opd-notice ${!running ? 'opd-warning' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className={running ? "telemetry-beacon-live" : "telemetry-beacon-emergency"} />
        <div style={{ flex: 1 }}>
          <strong>{statusText}</strong>
          {session?.state === 'paused' && (
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              {session.expected_return 
                ? `${Date.parse(session.expected_return) < Date.parse(data.server_time) ? 'Return delayed. Previous estimate:' : 'Expected return:'} ${new Date(session.expected_return).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Waiting for staff confirmation.` 
                : 'Return time not confirmed. Waiting estimate is unavailable.'}
            </p>
          )}
          {session?.state === 'closed' && (
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Contact reception desk to reschedule any pending visit.
            </p>
          )}
        </div>
      </div>

      {data && (
        <>
          {/* Doctor Details Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}>
            <Stethoscope size={15} color="#06b6d4" />
            <strong style={{ color: 'var(--text-primary)' }}>{data.doctor.full_name}</strong>
            <span>•</span>
            <span>{data.doctor.specialization}</span>
            <span>•</span>
            <span style={{ color: '#38bdf8', fontWeight: '700' }}>{data.doctor.room_number ? `Room ${data.doctor.room_number}` : 'Cabin'}</span>
            <span>•</span>
            <span>{session.period === 'morning' ? 'Morning Shift' : 'Evening Shift'} ({session.session_date})</span>
          </div>

          {/* KPI Display Grid */}
          <div className="opd-grid">
            {/* Card 1: Currently In Cabin / Called */}
            <div className="opd-card" style={{
              background: current?.queue_state === 'called' 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)' 
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: current?.queue_state === 'called' 
                ? '1px solid rgba(245, 158, 11, 0.5)' 
                : '1px solid rgba(6, 182, 212, 0.35)'
            }}>
              <span>
                {!running && current 
                  ? 'Preserved patient' 
                  : current?.queue_state === 'called' 
                  ? '📢 CALLED TOKEN · REPORT TO CABIN' 
                  : '🟢 CURRENTLY IN CABIN'}
              </span>
              <strong className="opd-metric" style={{
                color: current?.queue_state === 'called' ? '#fbbf24' : '#38bdf8'
              }}>
                {current ? `#${current.token_number}` : '—'}
              </strong>
              <p>
                {!current 
                  ? 'No patient currently called or in consultation' 
                  : current.queue_state === 'called' 
                  ? 'Awaiting patient entry inside doctor room' 
                  : running 
                  ? 'Consultation in progress' 
                  : 'Consultation interrupted'}
              </p>
            </div>

            {/* Card 2: Next Waiting Token */}
            <div className="opd-card">
              <span>
                {isPatient && !displayOnly ? 'YOUR ALLOTTED TOKEN' : 'NEXT WAITING TOKEN'}
              </span>
              <strong className="opd-metric">
                {isPatient && !displayOnly 
                  ? own ? `#${own.token_number}` : '—' 
                  : data.next_waiting ? `#${data.next_waiting.token_number}` : '—'}
              </strong>
              <p>
                {isPatient && !displayOnly 
                  ? patientStatus 
                  : `${waiting.length} checked-in patients waiting in queue`}
              </p>
            </div>

            {/* Card 3: Estimated Wait (Patients Only) */}
            {isPatient && !displayOnly && (
              <div className="opd-card">
                <span>ESTIMATED WAIT TIME</span>
                <strong className="opd-metric">
                  {data.estimated_wait_range 
                    ? `${data.estimated_wait_range[0]}–${data.estimated_wait_range[1]} min` 
                    : 'Awaiting update'}
                </strong>
                <p>
                  {own?.queue_state === 'waiting' && running 
                    ? 'Approximate; actual consultation times may vary.' 
                    : 'Estimate appears once checked in and OPD is running.'}
                </p>
              </div>
            )}
          </div>

          {/* Patient Journey Visual Stepper */}
          {isPatient && !displayOnly && own && !['cancelled', 'skipped'].includes(own.queue_state) && (
            <div className="opd-track">
              {['Token booked', 'Checked in / waiting', 'In cabin', 'Visit finished'].map((step, index) => (
                <span className={data.journey_step === index + 1 ? 'current' : ''} key={step}>
                  {data.journey_step === index + 1 && <span className="telemetry-beacon-live" />}
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          )}

          {/* Actual Serving Order Ticker */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={15} color="var(--primary)" />
              <strong style={{ fontSize: '0.85rem' }}>पुढील टोकन क्रम (Serving Order):</strong>
            </div>
            <div className="opd-track" style={{ margin: '8px 0' }}>
              {waiting.slice(0, 10).map((q, index) => (
                <span key={q.id}>
                  {index + 1}. Token #{q.token_number}
                </span>
              ))}
              {!waiting.length && <p style={{ color: 'var(--text-muted)' }}>कोणताही रुग्ण सध्या प्रतीक्षेत नाही.</p>}
            </div>
          </div>

          {/* Completed Prescription Link */}
          {isPatient && own?.queue_state === 'completed' && (
            <div style={{ marginTop: '12px' }}>
              {own.prescription_id ? (
                <button className="btn btn-primary" onClick={() => onOpenPrescription?.(own.id)}>
                  <FileText size={16} /> View Digital Prescription
                </button>
              ) : (
                <p className="opd-muted">Visit finished · prescription has not been issued yet.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
