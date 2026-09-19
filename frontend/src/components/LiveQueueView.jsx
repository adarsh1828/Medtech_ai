import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Stethoscope, 
  Building2, 
  UserCheck, 
  Activity, 
  Sparkles,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { api } from '../api';

export default function LiveQueueView({ user, hospitalInfo }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const prevActiveTokenRef = useRef(null);

  useEffect(() => {
    loadLiveQueue();
    const interval = setInterval(() => {
      loadLiveQueue();
      setCurrentTime(new Date().toLocaleTimeString());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadLiveQueue = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [apptsRes, docsRes] = await Promise.all([
        api.getAppointments(`date=${today}`),
        api.getDoctors()
      ]);

      const appts = apptsRes.appointments || [];
      setAppointments(appts);
      setDoctors(docsRes.doctors || []);

      // Check if there is a newly active "in_consultation" appointment
      const activeAppt = appts.find(a => a.status === 'in_consultation') || appts.find(a => a.status === 'confirmed') || appts.find(a => a.status === 'scheduled');
      if (activeAppt && activeAppt.token_number !== prevActiveTokenRef.current) {
        if (prevActiveTokenRef.current !== null && soundEnabled) {
          playHospitalChime();
        }
        prevActiveTokenRef.current = activeAppt.token_number;
        setLastAnnouncedToken(activeAppt.token_number);
      }
    } catch (err) {
      console.error('Failed to load queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pure Web Audio API synthesized dual-tone hospital chime (Ding-Dong)
  const playHospitalChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Tone 2: 440 Hz (A4)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.35);
      gain2.gain.setValueAtTime(0.3, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked:', e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Group appointments
  const inConsultationList = appointments.filter(a => a.status === 'in_consultation');
  const upcomingScheduled = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed');
  const activeNowServing = inConsultationList[0] || upcomingScheduled[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top TV Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            <Radio size={14} className="heartbeat-icon" /> LIVE OPD BROADCAST
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Hospital Waiting Lounge Display
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: '700', color: '#38bdf8' }}>
            {currentTime}
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playHospitalChime();
            }}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: soundEnabled ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: soundEnabled ? '#38bdf8' : 'var(--text-muted)'
            }}
            title={soundEnabled ? 'Chime sound active on token call' : 'Sound muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? 'Audio Chime ON' : 'Muted'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Exit TV Mode' : 'Full Screen TV'}
          </button>
        </div>
      </div>

      {/* BIG TV HERO DISPLAY: NOW SERVING */}
      <div style={{
        background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.18) 0%, rgba(15, 23, 42, 0.95) 75%)',
        border: '2px solid rgba(6, 182, 212, 0.4)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 30px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 10px 40px -10px rgba(6, 182, 212, 0.25)'
      }}>
        <div style={{
          fontSize: '0.9rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: '800',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} /> CURRENTLY CONSULTING / NOW SERVING
        </div>

        {activeNowServing ? (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: '4.8rem',
              fontWeight: '900',
              fontFamily: 'var(--font-mono)',
              lineHeight: '1',
              color: '#ffffff',
              textShadow: '0 0 35px rgba(6, 182, 212, 0.6), 0 0 10px rgba(56, 189, 248, 0.8)',
              animation: 'pulse 2.5s infinite ease-in-out'
            }}>
              TOKEN #{activeNowServing.token_number}
            </div>

            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginTop: '12px' }}>
              Patient: <span style={{ color: '#38bdf8' }}>{activeNowServing.patient_name}</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '16px',
              padding: '10px 24px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '1rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
                <Stethoscope size={18} color="#34d399" /> {activeNowServing.doctor_name}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: '700' }}>
                <Building2 size={18} /> {activeNowServing.doctor_room || 'Room 101'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: '#94a3b8' }}>
                {activeNowServing.department_name}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No active consultation at this moment. Next patient token will be displayed automatically.
          </div>
        )}
      </div>

      {/* Grid: Doctor Cabin Status & Upcoming Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Active Doctor Cabin Chambers */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} color="#06b6d4" /> Consultation Rooms Status
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>
              {doctors.filter(d => d.is_on_duty).length} DOCTORS ON DUTY
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {doctors.map(doc => {
              const docActive = inConsultationList.find(a => a.doctor_id === doc.id);
              const docWaiting = upcomingScheduled.filter(a => a.doctor_id === doc.id).length;

              return (
                <div
                  key={doc.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {doc.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {doc.room_number || 'Cabin'} • {doc.specialization}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {docActive ? (
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        fontWeight: '800',
                        fontSize: '0.85rem'
                      }}>
                        TOKEN #{docActive.token_number}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '0.75rem',
                        color: doc.is_on_duty ? 'var(--text-muted)' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {doc.is_on_duty ? `${docWaiting} in queue` : 'Off Duty'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next in Queue List */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#fbbf24" /> Next Tokens in Queue
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {upcomingScheduled.length} Waiting
            </span>
          </div>

          {upcomingScheduled.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              All queued patients have been attended to.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingScheduled.slice(0, 6).map((appt, idx) => (
                <div
                  key={appt.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: idx === 0 ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: idx === 0 ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      color: idx === 0 ? '#38bdf8' : 'var(--text-primary)',
                      width: '32px'
                    }}>
                      #{appt.token_number}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{appt.patient_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{appt.doctor_name}</div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: idx === 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: idx === 0 ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: '600'
                  }}>
                    {idx === 0 ? 'NEXT UP' : `Position #${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
