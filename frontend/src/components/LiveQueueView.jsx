import React, { useEffect, useState } from 'react';
import { api } from '../api';
import LiveOPDTracker from './LiveOPDTracker';
import './opd.css';

export default function LiveQueueView({ user, displayToken }) {
  const [doctors, setDoctors] = useState([]);
  const [period, setPeriod] = useState('morning');
  const [error, setError] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  useEffect(() => {
    let disposed = false;
    const load = () => api.getOPDDoctors(period, displayToken).then(result => { if (!disposed) { setDoctors(result.doctors); setError(''); } }).catch(e => !disposed && setError(e.message));
    load(); const timer = setInterval(load, 15000);
    return () => { disposed = true; clearInterval(timer); };
  }, [period, displayToken]);
  return <section className="opd-desk"><div className="opd-row"><h2>Live OPD Hall Display</h2>{!displayToken && <label>Session<select value={period} onChange={e => setPeriod(e.target.value)}><option value="morning">Morning / AM</option><option value="evening">Afternoon & evening / PM</option></select></label>}<button className="btn btn-outline" onClick={() => { const request = document.documentElement.requestFullscreen?.(); request?.catch(() => setError('Fullscreen is unavailable in this browser.')); }}>Fullscreen</button></div>{!displayToken && <div className="opd-row"><button className="btn btn-outline" onClick={async () => { try { const result = await api.createOPDDisplayToken(period); setDisplayUrl(`${window.location.origin}/?opdDisplay=1#token=${encodeURIComponent(result.token)}`); } catch(e) { setError(e.message); } }}>Create read-only TV link</button>{displayUrl && <a className="btn btn-primary" href={displayUrl} target="_blank" rel="noreferrer">Open dedicated TV display</a>}</div>}<p>Follow the called token and room. Names and clinical information are hidden.</p>{error && <div role="alert" className="opd-notice opd-warning">{error}</div>}<div className="opd-grid">{doctors.map(doctor => <LiveOPDTracker key={`${doctor.id}:${period}`} user={user} displayToken={displayToken} displayOnly doctorId={doctor.id} period={period} />)}</div></section>;
}
