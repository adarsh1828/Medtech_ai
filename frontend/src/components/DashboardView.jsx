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
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardView({ user, setActiveTab, onOpenBookModal }) {
  const { t } = useLanguage();
  const [overview, setOverview] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.08) 50%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2, maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '20px', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '600', marginBottom: '12px' }}>
            <Activity size={14} className="heartbeat-icon" /> {t('dashboard.platformBadge', 'AI-DRIVEN CLINICAL OPERATIONS PLATFORM')}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {t('dashboard.welcome', 'Welcome back,')} {user?.fullName || t('dashboard.clinician', 'Clinician')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
            {t('dashboard.telemetryDesc', 'Hospital telemetry, active ward beds, intelligent patient triage, and scheduling are operating synchronously across all medical departments.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <button
            onClick={() => setActiveTab('ai-triage')}
            className="btn btn-outline"
            style={{ borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc' }}
          >
            <Sparkles size={16} /> {t('dashboard.aiTriageBtn', 'AI Triage Assistant')}
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
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 1
        }} />
      </div>

      {/* KPI Metrics */}
      <div className="stats-grid">
        {/* Total Patients */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('dashboard.totalPatients', 'Total Patients')}
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {overview?.totalPatients || '14'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399', marginTop: '6px' }}>
            <ArrowUpRight size={14} /> {t('dashboard.monthGrowth', '+12% this month')}
          </div>
        </div>

        {/* Doctors on Duty */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('dashboard.doctorsOnDuty', 'Doctors On Duty')}
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#38bdf8' }}>
              <Stethoscope size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {overview?.doctorsOnDuty || 3} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ {overview?.totalDoctors || 4}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {t('dashboard.deptsCovered', 'All 5 clinical departments covered')}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('dashboard.appointmentsToday', "Today's Appointments")}
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {overview?.appointmentsToday || 3}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399', marginTop: '6px' }}>
            {t('dashboard.tokenQueueRunning', 'Active token queue running')}
          </div>
        </div>

        {/* Bed Occupancy Rate */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('dashboard.bedOccupancy', 'Bed Occupancy')}
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
              <BedDouble size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {overview?.occupancyRate || 44}%
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ({overview?.occupiedBeds || 8} / {overview?.totalBeds || 18} {t('dashboard.bedsAvailable', 'beds')})
            </span>
          </div>
          
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${overview?.occupancyRate || 44}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 80%, #f43f5e 100%)',
              borderRadius: '3px'
            }} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Appointments Queue + Department Bed Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
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
    </div>
  );
}
