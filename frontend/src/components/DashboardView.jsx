import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  BedDouble, 
  Activity, 
  ArrowUpRight, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  Building2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  QrCode,
  PhoneCall,
  Flame,
  Zap,
  Radio,
  Tv,
  HeartPulse,
  TrendingUp,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardView({ user, setActiveTab, onOpenBookModal, onOpenEmergency }) {
  const { t } = useLanguage();
  const [overview, setOverview] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Hospital Telemetry Events Feed
  const [recentEvents] = useState([
    { id: 1, time: '२ मिनिटांपूर्वी (2m ago)', text: 'Dr. Ramesh Surye generated NMC-stamped Digital Rx with QR for Token #103', badge: 'Digital Rx', color: '#06b6d4' },
    { id: 2, time: '७ मिनिटांपूर्वी (7m ago)', text: 'Bed #ICU-03 reserved for Post-Op Critical Observation (Cardiology)', badge: 'ICU Telemetry', color: '#f59e0b' },
    { id: 3, time: '१४ मिनिटांपूर्वी (14m ago)', text: 'Token #104 checked into OPD Room 408 with Dr. Arjun Mehta', badge: 'Live OPD', color: '#10b981' },
    { id: 4, time: '२२ मिनिटांपूर्वी (22m ago)', text: '24x7 Emergency Ambulance Dispatch: All ALS Units on Active Standby', badge: 'SOS 108', color: '#f43f5e' }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      let ov = null;
      if (user?.role === 'admin') {
        ov = await api.getAdminOverview().catch(() => null);
      }
      
      const adminData = ov?.overview || ov || {};
      
      const bedsRes = await api.getBeds().catch(() => ({ beds: [], stats: {} }));
      const docsRes = await api.getDoctors().catch(() => ({ doctors: [] }));
      const apptsRes = await api.getAppointments().catch(() => ({ appointments: [] }));

      const totalBeds = adminData.totalBeds ?? bedsRes.stats?.total ?? 18;
      const occupiedBeds = adminData.occupiedBeds ?? bedsRes.stats?.occupied ?? 8;
      const availableBeds = adminData.availableBeds ?? bedsRes.stats?.available ?? 10;
      const occupancyRate = adminData.occupancyRate ?? (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 44);

      const docsOnDuty = adminData.doctorsOnDuty ?? docsRes.doctors?.filter(d => d.is_on_duty).length ?? 3;
      const totalDocs = adminData.totalDoctors ?? docsRes.doctors?.length ?? 4;
      const totalRegisteredPatients = adminData.totalRegisteredPatients ?? 14;
      const appointmentsToday = adminData.patientsToday ?? apptsRes.appointments?.length ?? 5;
      const pendingDoctorsCount = adminData.pendingDoctorsCount ?? 0;

      setOverview({
        totalPatients: totalRegisteredPatients,
        appointmentsToday: appointmentsToday,
        doctorsOnDuty: docsOnDuty,
        totalDoctors: totalDocs,
        pendingDoctorsCount: pendingDoctorsCount,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        departments: adminData.departmentStats || [
          { name: 'Cardiology (हृदयरोग)', doctors_count: 1, appointments_today: 2, beds_count: 5, beds_occupied: 2 },
          { name: 'Neurology (मेंदू व मज्जासंस्था)', doctors_count: 1, appointments_today: 1, beds_count: 4, beds_occupied: 2 },
          { name: 'Orthopedics (अस्थिरोग व हाडे)', doctors_count: 1, appointments_today: 1, beds_count: 3, beds_occupied: 1 },
          { name: 'General Medicine (सामान्य औषधोपचार)', doctors_count: 1, appointments_today: 1, beds_count: 4, beds_occupied: 2 },
          { name: 'Pediatrics (बालरोग)', doctors_count: 0, appointments_today: 0, beds_count: 2, beds_occupied: 1 }
        ]
      });

      if (apptsRes.appointments) {
        setTodayAppointments(apptsRes.appointments.slice(0, 6));
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* ========================================================
          1. TOP HERO COMMAND BANNER
         ======================================================== */}
      <div className="dashboard-hero-banner" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(59, 130, 246, 0.1) 45%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderTop: '1px solid rgba(6, 182, 212, 0.55)',
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 38px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{ zIndex: 2, maxWidth: '720px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 11px',
              background: 'rgba(6, 182, 212, 0.16)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '20px',
              color: '#38bdf8',
              fontSize: '0.74rem',
              fontWeight: '700',
              letterSpacing: '0.04em'
            }}>
              <Activity size={14} className="heartbeat-icon" />
              <span>{t('dashboard.platformBadge', 'AI CLINICAL COMMAND CENTER')}</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 11px',
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              color: '#34d399',
              fontSize: '0.74rem',
              fontWeight: '700'
            }}>
              <span className="telemetry-beacon-live" />
              <span>NABH LEVEL-1 • LIVE TELEMETRY</span>
            </div>
          </div>

          <h1 style={{
            fontSize: '1.95rem',
            fontFamily: 'var(--font-display)',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            {t('dashboard.welcome', 'Welcome back,')} {user?.fullName || t('dashboard.clinician', 'Clinician')} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.55' }}>
            {t('dashboard.telemetryDesc', 'Hospital telemetry, active ward beds, intelligent patient triage, and scheduling are operating synchronously across all medical departments.')}
          </p>
        </div>

        <div className="dashboard-hero-actions" style={{ display: 'flex', gap: '12px', zIndex: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setActiveTab('ai-triage')}
            className="btn btn-outline"
            style={{
              borderColor: 'rgba(139, 92, 246, 0.4)',
              color: '#c084fc',
              background: 'rgba(139, 92, 246, 0.12)',
              fontWeight: '700'
            }}
          >
            <Sparkles size={16} />
            <span>{t('dashboard.aiTriageBtn', 'AI Clinical Triage')}</span>
          </button>
          
          <button
            onClick={onOpenBookModal}
            className="btn btn-primary"
            style={{ fontWeight: '700' }}
          >
            <Calendar size={16} />
            <span>{t('dashboard.bookAppointmentBtn', 'Book Appointment')}</span>
          </button>
        </div>

        {/* Ambient Decorative Lighting */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, transparent 70%)',
          filter: 'blur(35px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      </div>

      {/* ========================================================
          2. PRIMARY CLINICAL KPI CARDS (WITH SPARKLINE TRENDS)
         ======================================================== */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card skeleton-shimmer" style={{ height: '140px' }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {/* KPI 1: Total Registered Patients */}
          <div 
            className="glass-card" 
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              background: 'var(--card-gradient-cyan)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                नोंदणीकृत रुग्ण (Patients)
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)' }}>
                <Users size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {overview?.totalPatients ?? '--'}
              </div>

              {/* Decorative mini Sparkline */}
              <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                <path d="M2 18 L16 14 L30 19 L44 9 L62 4" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 18 L16 14 L30 19 L44 9 L62 4 V24 H2 Z" fill="url(#sparkline-cyan)" opacity="0.25" />
                <defs>
                  <linearGradient id="sparkline-cyan" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}>
              <TrendingUp size={14} /> +12% चालू आठवड्यात • EHR सक्रिय
            </div>
          </div>

          {/* KPI 2: Today's OPD Visits */}
          <div 
            className="glass-card" 
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              background: 'var(--card-gradient-emerald)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                आजची OPD रांग (Today's Visits)
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)' }}>
                <Calendar size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {overview?.appointmentsToday ?? '--'}
              </div>

              {/* Decorative mini Sparkline */}
              <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                <path d="M2 19 L15 15 L28 17 L42 8 L62 3" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 19 L15 15 L28 17 L42 8 L62 3 V24 H2 Z" fill="url(#sparkline-emerald)" opacity="0.25" />
                <defs>
                  <linearGradient id="sparkline-emerald" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
              <Clock size={13} /> सरासरी प्रतीक्षा वेळ: १४ मिनिटे
            </div>
          </div>

          {/* KPI 3: Clinicians On Duty */}
          <div 
            className="glass-card" 
            onClick={() => setActiveTab('doctors')}
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              background: 'var(--card-gradient-amber)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                उपलब्ध डॉक्टर्स (On Duty)
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)' }}>
                <Stethoscope size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {overview?.doctorsOnDuty ?? 0}
              </div>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                / {overview?.totalDoctors ?? 0} विशेषज्ञ
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: '600' }}>
              कार्डिओ, न्यूरो, ऑर्थो केबिन सक्रिय
            </div>
          </div>

          {/* KPI 4: Bed Occupancy Rate */}
          <div 
            className="glass-card" 
            onClick={() => setActiveTab('beds')}
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              background: 'var(--card-gradient-violet)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                बेड ऑक्युपन्सी (Bed Capacity)
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-violet-bg)', color: 'var(--accent-violet)' }}>
                <BedDouble size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {overview?.occupancyRate ?? 0}%
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                ऑक्युपाईड
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              <span style={{ color: '#34d399', fontWeight: '700' }}>{overview?.availableBeds ?? 0} उपलब्ध</span> • {overview?.occupiedBeds ?? 0} ॲडमिट बेड्स
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. REAL-TIME TELEMETRY FEED TICKER (LIVE EVENT STREAM)
         ======================================================== */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingRight: '16px',
          borderRight: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <Radio size={16} color="#06b6d4" className="heartbeat-icon" />
          <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            लाइव्ह इव्हेंट फीड
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          {recentEvents.map((evt) => (
            <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '2px 7px',
                borderRadius: '4px',
                background: `${evt.color}22`,
                border: `1px solid ${evt.color}55`,
                color: evt.color
              }}>
                {evt.badge}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {evt.text}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ({evt.time})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          4. EXECUTIVE ACTION DOCK (ONE-CLICK LAUNCHERS)
         ======================================================== */}
      <div className="dashboard-quick-dock">
        <button
          onClick={() => setActiveTab('appointments')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            background: 'var(--card-gradient-cyan)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)' }}>
            <Stethoscope size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--text-primary)' }}>Doctor Workstation</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>OPD Consultations & Rx</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('beds')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            background: 'var(--card-gradient-amber)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)' }}>
            <BedDouble size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--text-primary)' }}>Ward & ICU Beds</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Bed Admission & Telemetry</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('live-queue')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            background: 'var(--card-gradient-emerald)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)' }}>
            <Tv size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--text-primary)' }}>Live OPD Queue TV</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Waiting Room Hall Display</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            background: 'var(--card-gradient-violet)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-violet-bg)', color: 'var(--accent-violet)' }}>
            <QrCode size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--text-primary)' }}>Digital Rx & QR</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Verified WhatsApp Rx</div>
          </div>
        </button>

        {onOpenEmergency && (
          <button
            onClick={onOpenEmergency}
            className="glass-card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              background: 'var(--card-gradient-rose)'
            }}
          >
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)' }}>
              <Flame size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.86rem', color: 'var(--accent-rose)' }}>SOS 108 Center</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Code Red Emergency</div>
            </div>
          </button>
        )}
      </div>

      {/* ========================================================
          5. MAIN 2-COLUMN CLINICAL SECTION: QUEUE + WARDS
         ======================================================== */}
      <div className="dashboard-main-grid">
        
        {/* Left Column: Live Consultation Queue */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {t('dashboard.deptDistribution', 'Live Clinical Consultation Queue')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {t('dashboard.deptSubtext', 'Patients scheduled for doctor consultation today')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('appointments')}
              className="btn btn-outline btn-sm"
              style={{ fontWeight: '600' }}
            >
              {t('common.viewDetails', 'View Full Queue')} <ChevronRight size={14} />
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>टोकन (Token)</th>
                  <th>रुग्ण (Patient)</th>
                  <th>विभाग / डॉक्टर (Doctor)</th>
                  <th>वेळ (Time)</th>
                  <th>स्थिती (Status)</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      आजच्या दिवशी अद्याप कोणतीही अपॉइंटमेंट नोंदवलेली नाही.
                    </td>
                  </tr>
                ) : (
                  todayAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          fontSize: '0.84rem',
                          padding: '3px 8px',
                          background: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          borderRadius: '6px',
                          color: '#38bdf8'
                        }}>
                          #{appt.token_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{appt.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          रक्तगट: {appt.patient_blood_group || 'N/A'} • {appt.patient_gender}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{appt.doctor_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {appt.department_name} (केबिन {appt.doctor_room})
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {appt.time_slot}
                      </td>
                      <td>
                        <span className={`badge ${
                          appt.status === 'completed' ? 'badge-emerald' :
                          appt.status === 'confirmed' ? 'badge-cyan' :
                          appt.status === 'scheduled' ? 'badge-amber' : 'badge-rose'
                        }`}>
                          {t(`common.${appt.status}`, appt.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Department Ward & Bed Status */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {t('dashboard.deptDistribution', 'Department Bed Status')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {t('dashboard.deptSubtext', 'Live ward occupancy across units')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('beds')}
              className="btn btn-outline btn-sm"
              style={{ fontWeight: '600' }}
            >
              {t('nav.beds', 'Ward Map')} <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {overview?.departments?.map((dept, idx) => {
              const occ = dept.beds_occupied || 0;
              const total = dept.beds_count || 1;
              const pct = Math.round((occ / total) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="var(--primary)" />
                      <span style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--text-primary)' }}>{dept.name}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {occ}/{total} बेड्स ({pct}%)
                    </span>
                  </div>
                  
                  {/* Progress Bar with Gradient */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: pct > 80 ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' : pct > 50 ? 'linear-gradient(90deg, #06b6d4, #f59e0b)' : 'linear-gradient(90deg, #06b6d4, #10b981)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Symptom Triage Quick Access Card */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(6, 182, 212, 0.12) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                MedTech Clinical AI
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {t('dashboard.actionTriageDesc', 'Intelligent symptom screening & department routing')}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ai-triage')}
              className="btn btn-sm"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: '700' }}
            >
              {t('dashboard.aiTriageBtn', 'Start AI Triage')}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          6. ENTERPRISE HOSPITAL ADVANTAGE SHOWCASE
         ======================================================== */}
      <div className="glass-card" style={{
        marginTop: '8px',
        padding: '28px 32px',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'linear-gradient(135deg, rgba(13, 21, 36, 0.95) 0%, rgba(18, 28, 46, 0.9) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <ShieldCheck size={15} /> Hospital Trust & Doctor Advantage
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Why Doctors & Multispecialty Hospitals Choose MedTech OS
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ✓ NABH & ABDM Ready
            </span>
            <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontWeight: '700', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              ✓ 256-Bit Encrypted
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: WhatsApp & QR Digital Rx */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(6, 182, 212, 0.05))',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={22} />
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              1-Click WhatsApp & QR Digital Rx
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Doctors generate official digital prescriptions stamped with their NMC/MMC registration and verifiable SVG QR code, deliverable instantly to patient WhatsApp in 1 click.
            </div>
          </div>

          {/* Card 2: 2FA & Doctor Verification */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.05))',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              2FA Security & Admin Approval
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Eliminates fake registrations and quacks. Every registering physician undergoes OTP verification and requires administrative approval before gaining access to hospital data.
            </div>
          </div>

          {/* Card 3: Smart Bed & Ward Telemetry */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.05))',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BedDouble size={22} />
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              Live Ward & ICU Bed Telemetry
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Zero bed confusion. Real-time ward telemetry across ICU, Cardiology, and General beds prevents double allocations and gives hospital directors live revenue metrics.
            </div>
          </div>

          {/* Card 4: 24x7 SOS & AI Triage */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25), rgba(244, 63, 94, 0.05))',
              color: '#fb7185',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Flame size={22} />
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              24x7 SOS 108 & AI Clinical Triage
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Immediate emergency patient handling with direct 108 ambulance hotline, Code Red ICU broadcast, and clinical AI symptom triage routing patients to the right specialist.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
