import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Activity, 
  Plus, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  FileText, 
  Search, 
  Filter, 
  Check, 
  Compass, 
  Radio, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import LiveOPDTracker from './LiveOPDTracker';

export default function AppointmentsView({ user, onOpenBookModal, onOpenConsultation, onOpenPrescription }) {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showTracker, setShowTracker] = useState(true);

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const loadAppointments = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.getAppointments();
      setAppointments(res.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();

    // Auto-refresh appointments every 7 seconds to keep everyone in sync
    const interval = setInterval(() => {
      loadAppointments(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [user]);

  const handleUpdateStatus = async (id, newStatus, customRemark = '') => {
    setActionLoading(id);
    try {
      await api.updateAppointmentStatus(id, newStatus, customRemark);
      await loadAppointments(true);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;
    const matchesSearch = 
      appt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.reason_for_visit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.completion_remark?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate status counts for quick pills
  const statusCounts = {
    all: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    in_consultation: appointments.filter(a => a.status === 'in_consultation').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              {isPatient ? t('nav.myAppointments', 'My Appointments & Health') : t('appointments.title', 'Clinical Appointments & OPD Queue')}
            </h2>
            <button
              onClick={() => setShowTracker(!showTracker)}
              style={{
                background: showTracker ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#38bdf8',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Compass size={14} />
              <span>{showTracker ? (t('common.close', 'Hide Tracker')) : (t('nav.liveQueue', 'Open Live OPD Tracker'))}</span>
              {showTracker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            {t('appointments.subtitle', 'Manage outpatient visits, live consultation tokens, vitals, and physician schedules.')}
          </p>
        </div>

        <button
          onClick={onOpenBookModal}
          className="btn btn-primary"
        >
          <Plus size={16} /> {t('appointments.bookNewBtn', 'Book New Appointment')}
        </button>
      </div>

      {/* Live "Where is my train" OPD Tracker Hero Component */}
      {showTracker && (
        <LiveOPDTracker
          user={user}
          onOpenConsultation={onOpenConsultation}
          onOpenPrescription={onOpenPrescription}
        />
      )}

      {/* Filter & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px'
      }}>
        {/* Status Pills with Dynamic Counts */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { key: 'all', label: t('common.all', 'All') },
            { key: 'scheduled', label: t('common.scheduled', 'Scheduled') },
            { key: 'confirmed', label: t('common.confirmed', 'Confirmed') },
            { key: 'in_consultation', label: t('appointments.inConsultationTab', 'In Consultation') },
            { key: 'completed', label: t('common.completed', 'Completed') },
            { key: 'cancelled', label: t('common.cancelled', 'Cancelled') }
          ].map(({ key, label }) => {
            const count = statusCounts[key] || 0;
            const isSelected = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                  color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  background: isSelected ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#fff' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('appointments.searchPlaceholder', 'Search patient, doctor, remark...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '0.85rem', height: '38px' }}
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          {t('common.loading', 'Loading clinical appointments...')}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Calendar size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{t('appointments.noAppointments', 'No clinical appointments found')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {t('appointments.subtitle', 'No visits found for the selected filter.')}
          </p>
          <button
            onClick={onOpenBookModal}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '16px' }}
          >
            {t('appointments.bookNewBtn', 'Book New Appointment')}
          </button>
        </div>
      ) : (
        <div className="appointments-grid">
          {filteredAppointments.map((appt) => {
            const isCompleted = appt.status === 'completed';
            const isInCabin = appt.status === 'in_consultation';

            return (
              <div
                key={appt.id}
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  border: isCompleted 
                    ? '1.5px solid rgba(16, 185, 129, 0.4)' 
                    : isInCabin 
                    ? '1.5px solid rgba(6, 182, 212, 0.5)' 
                    : '1px solid var(--border-subtle)',
                  background: isCompleted 
                    ? 'var(--card-highlight-completed)' 
                    : isInCabin 
                    ? 'var(--card-highlight-cabin)' 
                    : undefined
                }}
              >
                {/* Card Top: Token & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: isInCabin ? 'var(--accent-cyan-bg)' : 'var(--accent-cyan-bg)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: 'var(--accent-cyan)'
                    }}>
                      TOKEN #{appt.token_number}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      APT-{appt.id}
                    </span>
                  </div>

                  {/* Enhanced Status Badges */}
                  {isCompleted ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1.5px solid rgba(16, 185, 129, 0.5)',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      letterSpacing: '0.02em',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                    }}>
                      <CheckCircle2 size={14} /> तपासणी पूर्ण (Done)
                    </span>
                  ) : isInCabin ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: 'rgba(6, 182, 212, 0.2)',
                      border: '1.5px solid rgba(6, 182, 212, 0.5)',
                      color: '#38bdf8',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      animation: 'pulse 2s infinite'
                    }}>
                      <Radio size={14} /> 🩺 केबिनमध्ये तपासणी चालू
                    </span>
                  ) : (
                    <span className={`badge ${
                      appt.status === 'confirmed' ? 'badge-cyan' :
                      appt.status === 'scheduled' ? 'badge-amber' : 'badge-rose'
                    }`}>
                      {appt.status === 'confirmed' ? 'निश्चित (Waiting)' : appt.status}
                    </span>
                  )}
                </div>

                {/* Patient & Doctor info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                      रुग्ण तपशील (Patient)
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {appt.patient_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Blood: <strong style={{ color: '#fb7185' }}>{appt.patient_blood_group || 'N/A'}</strong> • {appt.patient_gender}
                    </div>
                    {appt.patient_allergies && appt.patient_allergies !== 'None' && (
                      <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '2px' }}>
                        ⚠️ Allergies: {appt.patient_allergies}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                      उपचार करणारे डॉक्टर (Physician)
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {appt.doctor_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {appt.department_name} (रूम {appt.doctor_room})
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.825rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>{appt.appointment_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>{appt.time_slot}</span>
                  </div>
                </div>

                {/* Reason for visit */}
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>तक्रार / कारण: </span>
                  {appt.reason_for_visit}
                </div>

                {/* COMPLETED REMARK BANNER (Prominent for Admin, Reception & Doctor) */}
                {isCompleted && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '800' }}>
                      <CheckCircle2 size={16} />
                      <span>तपासणी पूर्ण शेरा (Admin Remark):</span>
                    </div>
                    <div style={{ color: '#f0fdf4', marginTop: '3px', fontWeight: '600' }}>
                      {appt.completion_remark || 'तपासणी यशस्वीरित्या पूर्ण झाली (Consultation Completed)'}
                    </div>
                    {appt.completed_at && (
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.72rem', marginTop: '4px' }}>
                        पूर्ण झालेली वेळ: {new Date(appt.completed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                )}

                {/* IN-CABIN LIVE CONSULTATION BANNER */}
                {isInCabin && (
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: '800' }}>
                      <Radio size={16} className="animate-spin" />
                      <span>डॉक्टरांच्या केबिनमध्ये तपासणी सुरू आहे</span>
                    </div>
                    {appt.consultation_started_at && (
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.74rem', marginTop: '3px' }}>
                        सुरू झालेली वेळ: {new Date(appt.consultation_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}

                {/* Patient Vitals (if recorded) */}
                {(appt.vitals_bp || appt.vitals_pulse) && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(6, 182, 212, 0.05)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>
                    {appt.vitals_bp && <div>BP: <strong>{appt.vitals_bp}</strong></div>}
                    {appt.vitals_pulse && <div>Pulse: <strong>{appt.vitals_pulse}</strong></div>}
                    {appt.vitals_temp && <div>Temp: <strong>{appt.vitals_temp}</strong></div>}
                    {appt.vitals_weight && <div>Weight: <strong>{appt.vitals_weight}</strong></div>}
                  </div>
                )}

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                  {/* Call to Doctor Cabin (For Doctor & Admin) */}
                  {(appt.status === 'scheduled' || appt.status === 'confirmed') && (isDoctor || isAdmin) && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'in_consultation', 'डॉक्टरांच्या केबिनमध्ये तपासणी सुरू')}
                      disabled={actionLoading === appt.id}
                      className="btn btn-cyan btn-sm"
                      style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem' }}
                      title="Call into Cabin"
                    >
                      <Stethoscope size={14} /> केबिनमध्ये बोलवा (Call In)
                    </button>
                  )}

                  {/* In Cabin Actions: Write Prescription or Mark Complete */}
                  {isInCabin && (isDoctor || isAdmin) && (
                    <>
                      <button
                        onClick={() => onOpenConsultation(appt)}
                        className="btn btn-emerald btn-sm"
                        style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem' }}
                      >
                        <Stethoscope size={14} /> प्रिस्क्रिप्शन & तपासणी पूर्ण करा
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'completed', 'तपासणी यशस्वीरित्या पूर्ण झाली (Consultation Completed)')}
                        disabled={actionLoading === appt.id}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)', fontSize: '0.8rem' }}
                        title="Mark Completed directly"
                      >
                        <Check size={14} /> पूर्ण झाले
                      </button>
                    </>
                  )}

                  {/* Confirmation button for scheduled */}
                  {appt.status === 'scheduled' && (isAdmin || isDoctor) && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                      disabled={actionLoading === appt.id}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.4)' }}
                    >
                      <Check size={14} /> हजर नोंदवा (Confirm)
                    </button>
                  )}

                  {/* View Prescription if completed */}
                  {isCompleted && (
                    <button
                      onClick={() => onOpenPrescription(appt.id)}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)', fontWeight: '600' }}
                    >
                      <FileText size={14} /> प्रिस्क्रिप्शन पहा (View Rx)
                    </button>
                  )}

                  {/* Cancel button */}
                  {appt.status !== 'cancelled' && !isCompleted && !isInCabin && (
                    <button
                      onClick={() => {
                        if (window.confirm('तुम्हाला ही अपॉइंटमेंट रद्द करायची आहे का? (Are you sure you want to cancel this appointment?)')) {
                          handleUpdateStatus(appt.id, 'cancelled', isPatient ? 'रुग्णाकडून रद्द करण्यात आले (Cancelled by patient)' : 'अपॉइंटमेंट रद्द केली');
                        }
                      }}
                      disabled={actionLoading === appt.id}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Cancel Appointment"
                    >
                      <XCircle size={14} /> <span>रद्द करा</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
