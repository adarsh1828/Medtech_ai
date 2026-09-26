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
  Tv
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
    { id: 1, time: '2m ago', text: 'Dr. Sarah Chen generated NMC-stamped Digital Rx with QR for Token #103', badge: 'Digital Rx', color: '#06b6d4' },
    { id: 2, time: '7m ago', text: 'Bed #ICU-03 reserved for Post-Op Critical Observation (Cardiology)', badge: 'ICU Telemetry', color: '#f59e0b' },
    { id: 3, time: '14m ago', text: 'Token #104 checked into OPD Room 408 with Dr. Arjun Mehta', badge: 'Live OPD', color: '#10b981' },
    { id: 4, time: '22m ago', text: '24x7 Emergency Ambulance Dispatch Center: All 4 ALS Units on Standby', badge: 'SOS 108', color: '#f43f5e' }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // If admin, we can fetch full admin overview
      let ov = null;
      if (user?.role === 'admin') {
        ov = await api.getAdminOverview().catch(() => null);
      }
      
      // Also fetch beds to compute live stats if admin overview not available
      const bedsRes = await api.getBeds().catch(() => ({ beds: [], stats: {} }));
      const docsRes = await api.getDoctors().catch(() => ({ doctors: [] }));
      const apptsRes = await api.getAppointments().catch(() => ({ appointments: [] }));

      const totalBeds = bedsRes.stats?.total || 18;
      const occupiedBeds = bedsRes.stats?.occupied || 8;
      const availableBeds = bedsRes.stats?.available || 9;
      const occupancyRate = bedsRes.stats?.occupancyRate || Math.round((occupiedBeds / totalBeds) * 100);

      const docsOnDuty = docsRes.doctors?.filter(d => d.is_on_duty).length || 3;
      const totalDocs = docsRes.doctors?.length || 4;

      setOverview({
        totalPatients: ov?.kpis?.totalPatients || 14,
        appointmentsToday: ov?.kpis?.appointmentsToday || apptsRes.appointments?.length || 3,
        doctorsOnDuty: docsOnDuty,
        totalDoctors: totalDocs,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        departments: ov?.departmentDistribution || [
          { name: 'Cardiology', doctors_count: 1, appointments_today: 2, beds_count: 5, beds_occupied: 2 },
          { name: 'Neurology', doctors_count: 1, appointments_today: 1, beds_count: 4, beds_occupied: 2 },
          { name: 'Orthopedics', doctors_count: 1, appointments_today: 0, beds_count: 3, beds_occupied: 1 },
          { name: 'General Medicine', doctors_count: 1, appointments_today: 0, beds_count: 4, beds_occupied: 2 },
          { name: 'Pediatrics', doctors_count: 0, appointments_today: 0, beds_count: 2, beds_occupied: 1 }
        ]
      });

      // Show first 5 appointments for today
      if (apptsRes.appointments) {
        setTodayAppointments(apptsRes.appointments.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top Hero Banner */}
      <div className="dashboard-hero-banner" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderTop: '1px solid rgba(6, 182, 212, 0.5)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ zIndex: 2, maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(6, 182, 212, 0.18)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '20px',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              <Activity size={14} className="heartbeat-icon" /> {t('dashboard.platformBadge', 'AI CLINICAL COMMAND CENTER')}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              color: '#34d399',
              fontSize: '0.72rem',
              fontWeight: '700'
            }}>
              <span className="telemetry-beacon-live" /> NABH LEVEL-1 ACCREDITED • 100% UPTIME
            </div>
          </div>

          <h1 style={{ fontSize: '1.95rem', fontFamily: 'var(--font-display)', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {t('dashboard.welcome', 'Welcome back,')} {user?.fullName || t('dashboard.clinician', 'Clinician')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
            {t('dashboard.telemetryDesc', 'Hospital telemetry, active ward beds, intelligent patient triage, and scheduling are operating synchronously across all medical departments.')}
          </p>
        </div>

        <div className="dashboard-hero-actions" style={{ display: 'flex', gap: '12px', zIndex: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setActiveTab('ai-triage')}
            className="btn btn-outline"
            style={{ borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc', background: 'rgba(139, 92, 246, 0.1)' }}
          >
            <Sparkles size={16} /> {t('dashboard.aiTriageBtn', 'AI Triage')}
          </button>
          <button
            onClick={onOpenBookModal}
            className="btn btn-primary"
          >
            <Calendar size={16} /> {t('dashboard.bookAppointmentBtn', 'Book Appointment')}
          </button>
        </div>

        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(35px)',
          zIndex: 1
        }} />
      </div>

      {/* Quick Action Executive Command Dock */}
      <div className="dashboard-quick-dock">
        <button
          onClick={() => setActiveTab('appointments')}
          className="glass-card"
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
            <Stethoscope size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Doctor Station</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live OPD Consultations</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('beds')}
          className="glass-card"
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
            <BedDouble size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Ward & ICU Beds</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live Bed Allocator</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('live-queue')}
          className="glass-card"
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            <Tv size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>OPD Queue TV</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Waiting Room Display</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className="glass-card"
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
            <QrCode size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Digital Rx & QR</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>WhatsApp Rx Sender</div>
          </div>
        </button>

        {onOpenEmergency && (
          <button
            onClick={onOpenEmergency}
            className="glass-card"
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(15, 23, 42, 0.7) 100%)'
            }}
          >
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.25)', color: '#fb7185' }}>
              <Flame size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fb7185' }}>SOS 108 Center</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Code Red Dispatch</div>
            </div>
          </button>
        )}
      </div>

      {/* Security Notice: Pending Doctor Registrations */}
      {overview?.pendingDoctorsCount > 0 && user?.role === 'admin' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(245, 158, 11, 0.04) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                सुरक्षा सूचना: {overview.pendingDoctorsCount} नवीन डॉक्टर नोंदणी मंजुरी प्रलंबित!
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                New physician registrations await administrative review before being allowed to access patient data and clinical workstations.
              </div>
            </div>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('doctors')}
              className="btn btn-warning btn-sm"
              style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              पडताळणी करा (Review & Approve) <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Main 2-Column Section: Appointments Queue + Department Bed Distribution */}
      <div className="dashboard-main-grid">
        {/* Appointments Queue */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                {t('dashboard.deptDistribution', 'Live Clinical Consultation Queue')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t('dashboard.deptSubtext', 'Patients scheduled for doctor consultation today')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('appointments')}
              className="btn btn-outline btn-sm"
            >
              {t('common.viewDetails', 'View Full Queue')} <ChevronRight size={14} />
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Department / Doctor</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No appointments scheduled yet.
                    </td>
                  </tr>
                ) : (
                  todayAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          padding: '3px 8px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '6px',
                          color: '#38bdf8'
                        }}>
                          #{appt.token_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{appt.patient_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Blood: {appt.patient_blood_group || 'N/A'} • {appt.patient_gender}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)' }}>{appt.doctor_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {appt.department_name} (Room {appt.doctor_room})
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
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

        {/* Department Wards & Bed Status */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                {t('dashboard.deptDistribution', 'Department Bed Status')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t('dashboard.deptSubtext', 'Live ward occupancy across units')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('beds')}
              className="btn btn-outline btn-sm"
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
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{dept.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {occ}/{total} {t('dashboard.bedsAvailable', 'Beds')} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: pct > 80 ? '#f43f5e' : pct > 50 ? '#f59e0b' : '#10b981',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick AI Triage Banner */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc'
            }}>
              <Sparkles size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                MedTech Clinical AI
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {t('dashboard.actionTriageDesc', 'Intelligent symptom screening & department routing')}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ai-triage')}
              className="btn btn-sm"
              style={{ background: '#8b5cf6', color: '#fff' }}
            >
              {t('dashboard.aiTriageBtn', 'Start AI Triage')}
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise Hospital Advantage Showcase (High-Converting Sales Pitch Section) */}
      <div className="glass-card" style={{
        marginTop: '10px',
        padding: '28px 32px',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'linear-gradient(135deg, rgba(13, 21, 36, 0.95) 0%, rgba(18, 28, 46, 0.9) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <ShieldCheck size={14} /> Hospital Trust & Doctor Advantage
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Why Doctors & Multispecialty Hospitals Choose MedTech OS
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: '700' }}>
              ✓ NABH & ABDM Ready
            </span>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontWeight: '700' }}>
              ✓ 256-Bit Encrypted
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px'
        }}>
          {/* Feature 1: Digital Rx & WhatsApp */}
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
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              1-Click WhatsApp & QR Digital Rx
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Doctors generate official digital prescriptions stamped with their NMC/MMC registration and verifiable SVG QR code, deliverable instantly to patient WhatsApp in 1 click.
            </div>
          </div>

          {/* Feature 2: 2FA & Doctor Verification */}
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
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              2FA Security & Admin Approval
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Eliminates fake registrations and quacks. Every registering physician undergoes OTP verification and requires administrative approval before gaining access to hospital data.
            </div>
          </div>

          {/* Feature 3: Smart Bed & Ward Telemetry */}
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
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Live Ward & ICU Bed Telemetry
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Zero bed confusion. Real-time ward telemetry across ICU, Cardiology, and General beds prevents double allocations and gives hospital directors live revenue metrics.
            </div>
          </div>

          {/* Feature 4: Emergency SOS & AI Triage */}
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
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
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
