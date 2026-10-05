import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Stethoscope, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  ArrowRight, 
  MapPin, 
  Activity, 
  Compass,
  Building2,
  CalendarCheck,
  Check
} from 'lucide-react';
import { api } from '../api';

export default function LiveOPDTracker({ user, onOpenConsultation, onOpenPrescription }) {
  const [trackerData, setTrackerData] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastChimedToken, setLastChimedToken] = useState(null);
  const [autoRefreshTime, setAutoRefreshTime] = useState(6);
  const timerRef = useRef(null);

  const loadTracker = async (docId = selectedDoctorId) => {
    try {
      const res = await api.getLiveQueueTracker(docId);
      setTrackerData(res);
      if (!selectedDoctorId && res.doctor?.id) {
        setSelectedDoctorId(res.doctor.id);
      }

      // Check if sound chime needed
      const currentToken = res.currently_consulting?.token_number;
      if (currentToken && currentToken !== lastChimedToken) {
        if (lastChimedToken !== null && soundEnabled) {
          playAudioChime();
        }
        setLastChimedToken(currentToken);
      }
    } catch (err) {
      console.warn('Failed to load tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracker(selectedDoctorId);

    // Auto-refresh interval (every 6 seconds)
    const interval = setInterval(() => {
      loadTracker(selectedDoctorId);
      setAutoRefreshTime(6);
    }, 6000);

    const countdown = setInterval(() => {
      setAutoRefreshTime(prev => (prev > 1 ? prev - 1 : 6));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [selectedDoctorId, soundEnabled]);

  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Bell 1: 587 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);

      // Bell 2: 440 Hz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.3);
      gain2.gain.setValueAtTime(0.25, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 1.1);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  };

  if (loading && !trackerData) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={18} className="animate-spin" color="var(--primary)" />
          <span>ओपीडी लाईव्ह ट्रॅकर लोड होत आहे... (Loading Live OPD Tracker)</span>
        </div>
      </div>
    );
  }

  const {
    doctor,
    patient_appointment,
    currently_consulting,
    last_completed,
    next_waiting,
    patients_ahead = 0,
    estimated_wait_mins = 0,
    journey_step = 1,
    queue_list = [],
    active_doctors = []
  } = trackerData || {};

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  // "Where is my train" Journey Stations
  const stations = [
    {
      id: 1,
      title: 'टोकन नोंदणी',
      subtitle: 'Token Booked',
      desc: patient_appointment ? `Token #${patient_appointment.token_number}` : 'नोंदणीकृत',
      isCompleted: journey_step >= 1,
      isCurrent: journey_step === 1
    },
    {
      id: 2,
      title: 'ओपीडी लाउंज',
      subtitle: 'OPD Waiting',
      desc: patient_appointment?.status === 'confirmed' ? 'दवाखान्यात हजर' : 'वेटिंग रूम',
      isCompleted: journey_step >= 2,
      isCurrent: journey_step === 2
    },
    {
      id: 3,
      title: 'डॉक्टर केबिन',
      subtitle: 'In Doctor Cabin',
      desc: currently_consulting ? `Token #${currently_consulting.token_number} चालू` : 'तपासणी कक्ष',
      isCompleted: journey_step >= 3,
      isCurrent: journey_step === 3
    },
    {
      id: 4,
      title: 'तपासणी पूर्ण',
      subtitle: 'Consultation Done',
      desc: patient_appointment?.status === 'completed' ? 'प्रिस्क्रिप्शन तयार ✅' : 'औषधोपचार चिठ्ठी',
      isCompleted: journey_step >= 4,
      isCurrent: journey_step === 4
    }
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0b1329 0%, #0f1c3f 50%, #081126 100%)',
      border: '1.5px solid rgba(6, 182, 212, 0.35)',
      borderRadius: '20px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 45px -15px rgba(6, 182, 212, 0.25), 0 0 20px rgba(6, 182, 212, 0.1) inset',
      color: '#fff'
    }}>
      {/* Background ambient decorative glow */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Banner: Where Is My Train Metaphor Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '16px',
        marginBottom: '20px'
      }}>
        {/* Left: Brand Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.15rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#fff'
              }}>
                थेट ओपीडी ट्रॅकर • Live Clinic Tracker
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '0.7rem',
                fontWeight: '800',
                letterSpacing: '0.05em'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 1.5s infinite'
                }} />
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              "Where is my train" प्रमाणे डॉक्टरांची सध्याची तपासणी व तुमचा नंबर ट्रॅक करा
            </div>
          </div>
        </div>

        {/* Right Controls: Doctor selector + Audio chime toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {activeDoctors.length > 1 && (
            <select
              value={selectedDoctorId || doctor?.id || ''}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {activeDoctors.map((doc) => (
                <option key={doc.id} value={doc.id} style={{ background: '#0b1329', color: '#fff' }}>
                  {doc.full_name} ({doc.specialization})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playAudioChime();
            }}
            style={{
              background: soundEnabled ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${soundEnabled ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              padding: '6px 12px',
              color: soundEnabled ? '#38bdf8' : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Audio notification chime when token changes"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'आवाज चालू' : 'मूक'}</span>
          </button>

          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <RefreshCw size={12} className="animate-spin" /> {autoRefreshTime}s
          </div>
        </div>
      </div>

      {/* Main Track Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Currently In Cabin (Current Station) */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '14px',
          padding: '16px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            fontWeight: '700',
            color: '#34d399',
            letterSpacing: '0.05em'
          }}>
            <span>डॉक्टर केबिन (Active Now)</span>
            <Stethoscope size={16} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{
              fontSize: '1.9rem',
              fontWeight: '900',
              fontFamily: 'var(--font-mono)',
              color: '#10b981',
              lineHeight: 1.1
            }}>
              {currently_consulting ? `TOKEN #${currently_consulting.token_number}` : 'केबिन रिकामी'}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '600',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currently_consulting ? `रुग्ण: ${currently_consulting.patient_name}` : 'पुढील रुग्णाची वाट पाहत आहे'}
            </div>
          </div>
        </div>

        {/* Card 2: Your Token (Your Destination Station) */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1.5px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '14px',
          padding: '16px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            fontWeight: '700',
            color: '#38bdf8',
            letterSpacing: '0.05em'
          }}>
            <span>{isPatient ? 'तुमचा टोकन नंबर' : 'पुढील टोकन (Next Up)'}</span>
            <CalendarCheck size={16} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{
              fontSize: '1.9rem',
              fontWeight: '900',
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              lineHeight: 1.1
            }}>
              {isPatient 
                ? (patient_appointment ? `TOKEN #${patient_appointment.token_number}` : 'नोंदणी नाही')
                : (next_waiting ? `TOKEN #${next_waiting.token_number}` : 'वेटिंग नाही')}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '600',
              marginTop: '4px'
            }}>
              {isPatient
                ? (patient_appointment ? `${patient_appointment.time_slot} • ${patient_appointment.status}` : 'आज भेट नाही')
                : (next_waiting ? `रुग्ण: ${next_waiting.patient_name}` : 'सर्व पूर्ण झाले')}
            </div>
          </div>
        </div>

        {/* Card 3: Distance / Patients Ahead */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '14px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            fontWeight: '700',
            color: '#fbbf24',
            letterSpacing: '0.05em'
          }}>
            <span>{isPatient ? 'तुमच्या पुढे असलेले रुग्ण' : 'वेटिंग रूम रुग्ण'}</span>
            <Users size={16} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{
              fontSize: '1.9rem',
              fontWeight: '900',
              fontFamily: 'var(--font-mono)',
              color: '#f59e0b',
              lineHeight: 1.1
            }}>
              {isPatient ? `${patientsAhead} रुग्ण` : `${queue_list.filter(q => q.status !== 'completed').length} रुग्ण`}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '600',
              marginTop: '4px'
            }}>
              {isPatient
                ? (patientsAhead === 0 ? '🟢 आता तुमची पाळी आहे!' : `पुढे ${patientsAhead} तपासण्या शिल्लक`)
                : `आज एकूण: ${queue_list.length}`}
            </div>
          </div>
        </div>

        {/* Card 4: Estimated Time */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1.5px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '14px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            fontWeight: '700',
            color: '#c084fc',
            letterSpacing: '0.05em'
          }}>
            <span>अंदाजे लागणारा वेळ</span>
            <Clock size={16} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{
              fontSize: '1.9rem',
              fontWeight: '900',
              fontFamily: 'var(--font-mono)',
              color: '#c084fc',
              lineHeight: 1.1
            }}>
              {isPatient
                ? (journey_step >= 3 ? '0 मिनिटे' : `~${estimated_wait_mins} मिनिटे`)
                : `~${queue_list.filter(q => q.status !== 'completed').length * 8} मिनिटे`}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '600',
              marginTop: '4px'
            }}>
              सरासरी ८-१० मिनिटे प्रति रुग्ण
            </div>
          </div>
        </div>
      </div>

      {/* Visual Train Track / Station Timeline */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px 20px',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Compass size={16} color="var(--primary)" /> थेट तपासणी प्रवास ट्रॅक (Clinical Journey Stations)
        </div>

        {/* Stations Line Container */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          position: 'relative',
          gap: '8px'
        }}>
          {/* Track Line behind stations */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '12%',
            right: '12%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }}>
            {/* Progress filled line */}
            <div style={{
              height: '100%',
              width: journey_step === 1 ? '0%' : journey_step === 2 ? '33%' : journey_step === 3 ? '66%' : '100%',
              background: 'linear-gradient(90deg, #06b6d4, #10b981)',
              transition: 'width 0.4s ease',
              borderRadius: '2px',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }} />
          </div>

          {stations.map((station) => (
            <div
              key={station.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Station Circle / Train Stop */}
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: station.isCurrent
                  ? 'radial-gradient(circle, #06b6d4 0%, #0891b2 100%)'
                  : station.isCompleted
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(15, 23, 42, 0.9)',
                border: station.isCurrent
                  ? '3px solid #38bdf8'
                  : station.isCompleted
                  ? '2px solid #10b981'
                  : '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: station.isCurrent ? '#fff' : station.isCompleted ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: station.isCurrent ? '0 0 20px rgba(6, 182, 212, 0.8)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {station.isCompleted && !station.isCurrent ? (
                  <Check size={20} />
                ) : (
                  station.id
                )}
              </div>

              {/* Station Labels */}
              <div style={{ marginTop: '10px' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: station.isCurrent ? '800' : '600',
                  color: station.isCurrent ? '#38bdf8' : station.isCompleted ? '#fff' : 'rgba(255, 255, 255, 0.5)'
                }}>
                  {station.title}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '2px'
                }}>
                  {station.subtitle}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  marginTop: '4px',
                  color: station.isCurrent ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-block'
                }}>
                  {station.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor & Location Info Footer Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        padding: '12px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#fff' }}>
              {doctor?.full_name || 'उपचार करणारे डॉक्टर'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {doctor?.specialization} • {doctor?.department_name} (मजला {doctor?.floor_number || 1}, रूम नं. {doctor?.room_number || '101'})
            </div>
          </div>
        </div>

        {/* Dynamic Contextual Action / Status Banner */}
        <div>
          {isPatient && patientsAhead === 0 && journey_step < 4 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              fontWeight: '700',
              fontSize: '0.8rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              <CheckCircle2 size={16} /> कृपया डॉक्टरांच्या केबिन बाहेर सज्ज राहा (Next Turn)
            </div>
          )}

          {isPatient && patient_appointment?.status === 'completed' && (
            <button
              onClick={() => onOpenPrescription?.(patient_appointment.id)}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700' }}
            >
              <Sparkles size={14} /> औषधोपचार प्रिस्क्रिप्शन पहा (Rx Ready)
            </button>
          )}

          {(isDoctor || isAdmin) && currently_consulting && (
            <button
              onClick={() => onOpenConsultation?.(currently_consulting)}
              className="btn btn-emerald btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700' }}
            >
              <Stethoscope size={14} /> Token #{currently_consulting.token_number} तपासणी पूर्ण करा & Rx द्या
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
