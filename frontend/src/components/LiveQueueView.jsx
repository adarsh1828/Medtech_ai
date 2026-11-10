import React, { useEffect, useState } from 'react';
import { api } from '../api';
import LiveOPDTracker from './LiveOPDTracker';
import './opd.css';
import { 
  Tv, 
  Maximize2, 
  Link2, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function LiveQueueView({ user, displayToken }) {
  const [doctors, setDoctors] = useState([]);
  const [period, setPeriod] = useState('morning');
  const [error, setError] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');

  useEffect(() => {
    let disposed = false;
    const load = () => api.getOPDDoctors(period, displayToken)
      .then(result => { 
        if (!disposed) { 
          setDoctors(result.doctors || []); 
          setError(''); 
        } 
      })
      .catch(e => !disposed && setError(e.message));

    load();
    const timer = setInterval(load, 15000);
    return () => { 
      disposed = true; 
      clearInterval(timer); 
    };
  }, [period, displayToken]);

  const handleFullscreen = () => {
    const request = document.documentElement.requestFullscreen?.();
    request?.catch(() => setError('Fullscreen is unavailable in this browser.'));
  };

  const handleGenerateTVLink = async () => {
    try {
      const result = await api.createOPDDisplayToken(period);
      setDisplayUrl(`${window.location.origin}/?opdDisplay=1#token=${encodeURIComponent(result.token)}`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="opd-desk" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Broadcast Header Bar */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.25)'
          }}>
            <Tv size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Live OPD Queue TV Display</h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                <span className="telemetry-beacon-live" /> BROADCASTING
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem' }}>
              Waiting lounge digital signage. Patient names and medical data are masked for clinical privacy.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!displayToken && (
            <div style={{ minWidth: '170px' }}>
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem'
                }}
              >
                <option value="morning">Morning Shift (AM)</option>
                <option value="evening">Afternoon & Evening (PM)</option>
              </select>
            </div>
          )}

          <button className="btn btn-outline btn-sm" onClick={handleFullscreen} style={{ gap: '6px' }}>
            <Maximize2 size={15} />
            <span>Fullscreen Mode</span>
          </button>
        </div>
      </div>

      {/* Read-Only TV Setup Bar (for Reception/Admin) */}
      {!displayToken && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={handleGenerateTVLink}
            style={{ gap: '6px' }}
          >
            <Link2 size={15} />
            <span>Generate TV Signage Link</span>
          </button>

          {displayUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <input 
                type="text" 
                readOnly 
                value={displayUrl} 
                style={{ 
                  flex: 1, 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '6px', 
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan)'
                }} 
              />
              <a 
                className="btn btn-primary btn-sm" 
                href={displayUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{ gap: '6px', whiteSpace: 'nowrap' }}
              >
                <ExternalLink size={14} />
                <span>Open Dedicated TV Screen</span>
              </a>
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="opd-notice opd-warning">
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          {error}
        </div>
      )}

      {/* Grid of Doctor Consultation Rooms */}
      <div className="opd-grid">
        {doctors.length === 0 ? (
          <div className="opd-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No doctors currently scheduled for this session.</p>
          </div>
        ) : (
          doctors.map(doctor => (
            <LiveOPDTracker 
              key={`${doctor.id}:${period}`} 
              user={user} 
              displayToken={displayToken} 
              displayOnly 
              doctorId={doctor.id} 
              period={period} 
            />
          ))
        )}
      </div>
    </section>
  );
}
