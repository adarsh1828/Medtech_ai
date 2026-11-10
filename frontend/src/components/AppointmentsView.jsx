import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Search, 
  Compass, 
  Radio, 
  ChevronDown, 
  ChevronUp,
  User,
  Activity,
  HeartPulse,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import LiveOPDTracker from './LiveOPDTracker';
import PatientEMRModal from './PatientEMRModal';

export default function AppointmentsView({ user, onOpenBookModal, onOpenConsultation, onOpenPrescription }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showTracker, setShowTracker] = useState(true);

  // Patient EMR modal state
  const [selectedPatientForEMR, setSelectedPatientForEMR] = useState(null);
  const [isEMROpen, setIsEMROpen] = useState(false);

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';

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

    const interval = setInterval(() => {
      loadAppointments(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [user]);

  const handleUpdateStatus = async (id, newStatus, customRemark = '') => {
    setActionLoading(id);
    try {
      await api.updateAppointmentStatus(id, newStatus, customRemark);
      showToast(`Appointment status updated to ${newStatus}`, 'success');
      await loadAppointments(true);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
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

  const statusCounts = {
    all: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    in_consultation: appointments.filter(a => a.status === 'in_consultation').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
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
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Compass size={14} />
              <span>{showTracker ? (t('common.close', 'Hide Live Tracker')) : (t('nav.liveQueue', 'Open Live OPD Tracker'))}</span>
              {showTracker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '3px' }}>
            {t('appointments.subtitle', 'Manage outpatient visits, live consultation tokens, vitals, and physician schedules.')}
          </p>
        </div>

        <button
          onClick={onOpenBookModal}
          className="btn btn-primary"
          style={{ fontWeight: '700' }}
        >
          <Plus size={16} /> {t('appointments.bookNewBtn', 'Book New Appointment')}
        </button>
      </div>

      {/* Live OPD Tracker Hero Component */}
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
        borderRadius: '12px',
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
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.16)' : 'transparent',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{label}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)'
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
            style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '0.85rem', height: '38px', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Appointments List / Skeletons */}
      {loading ? (
        <div className="appointments-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card skeleton-shimmer" style={{ minHeight: '220px' }} />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Calendar size={44} color="var(--primary)" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {t('appointments.noAppointments', 'No clinical appointments found')}
          </h3>
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
            const reasonLower = (appt.reason_for_visit || '').toLowerCase();
            const isCriticalTriage = 
              appt.reason_for_visit?.includes('CRITICAL') || 
              reasonLower.includes('chest pain') || 
              reasonLower.includes('छातीत') ||
              reasonLower.includes('stroke') ||
              reasonLower.includes('पक्षाघात') ||
              reasonLower.includes('heart attack');
            const isUrgentTriage = !isCriticalTriage && (
              appt.reason_for_visit?.includes('HIGH') || 
              reasonLower.includes('fracture') || 
              reasonLower.includes('फ्रॅक्चर') ||
              reasonLower.includes('asthma') ||
              reasonLower.includes('stridor')
            );

            return (
              <div
                key={appt.id}
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  border: isCriticalTriage && !isCompleted
                    ? '1.5px solid rgba(244, 63, 94, 0.55)'
                    : isCompleted 
                    ? '1.5px solid rgba(16, 185, 129, 0.4)' 
                    : isInCabin 
                    ? '1.5px solid rgba(6, 182, 212, 0.5)' 
                    : '1px solid var(--border-subtle)',
                  background: isCompleted 
                    ? 'var(--card-highlight-completed)' 
                    : isInCabin 
                    ? 'var(--card-highlight-cabin)' 
                    : isCriticalTriage
                    ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, rgba(13, 21, 36, 0.98) 100%)'
                    : undefined
                }}
              >
                {/* Card Top: Token & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      APT-{appt.id}
                    </span>

                    {/* AI Clinical Triage Urgency Priority Badges */}
                    {isCriticalTriage && !isCompleted && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(244, 63, 94, 0.2)',
                        border: '1px solid rgba(244, 63, 94, 0.6)',
                        color: '#fb7185',
                        fontSize: '0.72rem',
                        fontWeight: '800'
                      }}>
                        🔴 AI CRITICAL PRIORITY
                      </span>
                    )}
                    {isUrgentTriage && !isCompleted && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#fbbf24',
                        fontSize: '0.72rem',
                        fontWeight: '700'
                      }}>
                        🟡 AI URGENT
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
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
                      fontSize: '0.76rem',
                      fontWeight: '800'
                    }}>
                      <CheckCircle2 size={13} /> तपासणी पूर्ण (Done)
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
                      fontSize: '0.76rem',
                      fontWeight: '800'
                    }}>
                      <Radio size={13} className="heartbeat-icon" /> 🩺 केबिनमध्ये तपासणी चालू
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

                {/* Patient & Doctor Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                      रुग्ण तपशील (Patient)
                    </div>
                    <div 
                      onClick={() => {
                        setSelectedPatientForEMR({ id: appt.patient_id, name: appt.patient_name });
                        setIsEMROpen(true);
                      }}
                      style={{ fontWeight: '700', fontSize: '0.96rem', color: '#38bdf8', marginTop: '2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      title="Click to view Patient Medical History (EMR / EHR)"
                    >
                      {appt.patient_name} <FileText size={13} style={{ opacity: 0.7 }} />
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Blood: <strong style={{ color: '#fb7185' }}>{appt.patient_blood_group || 'N/A'}</strong> • {appt.patient_gender}
                    </div>
                    {appt.patient_allergies && appt.patient_allergies !== 'None' && (
                      <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '2px', fontWeight: '600' }}>
                        ⚠️ Allergies: {appt.patient_allergies}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                      उपचार करणारे डॉक्टर (Physician)
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {appt.doctor_name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
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
                  fontSize: '0.82rem'
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
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>तक्रार / कारण: </span>
                  {appt.reason_for_visit}
                </div>

                {/* Completed Remark Banner */}
                {isCompleted && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '800' }}>
                      <CheckCircle2 size={15} />
                      <span>तपासणी पूर्ण शेरा:</span>
                    </div>
                    <div style={{ color: '#f0fdf4', marginTop: '2px', fontWeight: '600' }}>
                      {appt.completion_remark || 'तपासणी यशस्वीरित्या पूर्ण झाली (Consultation Completed)'}
                    </div>
                  </div>
                )}

                {/* In-Cabin Banner */}
                {isInCabin && (
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: '800' }}>
                      <Radio size={15} className="heartbeat-icon" />
                      <span>डॉक्टरांच्या केबिनमध्ये तपासणी सुरू आहे</span>
                    </div>
                  </div>
                )}

                {/* Patient Vitals (if recorded) */}
                {(appt.vitals_bp || appt.vitals_pulse) && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '6px 10px',
                    background: 'rgba(6, 182, 212, 0.05)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {appt.vitals_bp && <div>BP: <strong>{appt.vitals_bp}</strong></div>}
                    {appt.vitals_pulse && <div>Pulse: <strong>{appt.vitals_pulse}</strong></div>}
                    {appt.vitals_temp && <div>Temp: <strong>{appt.vitals_temp}</strong></div>}
                    {appt.vitals_weight && <div>Weight: <strong>{appt.vitals_weight}</strong></div>}
                  </div>
                )}

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                  {(isInCabin || isCompleted) && isDoctor && !appt.prescription_id && (
                    <button
                      onClick={() => onOpenConsultation(appt)}
                      className="btn btn-emerald btn-sm"
                      style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem' }}
                    >
                      <Stethoscope size={14} /> प्रिस्क्रिप्शन लिहा (Write Rx)
                    </button>
                  )}

                  {appt.prescription_id && (
                    <button
                      onClick={() => onOpenPrescription(appt.id)}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)', fontWeight: '700' }}
                    >
                      <FileText size={14} /> प्रिस्क्रिप्शन पहा (View Rx)
                    </button>
                  )}

                  {isPatient && appt.status !== 'cancelled' && !isCompleted && !isInCabin && (
                    <button
                      onClick={() => {
                        if (window.confirm('तुम्हाला ही अपॉइंटमेंट रद्द करायची आहे का? (Are you sure you want to cancel this appointment?)')) {
                          handleUpdateStatus(appt.id, 'cancelled', 'रुग्णाकडून रद्द करण्यात आले (Cancelled by patient)');
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

      {/* Patient EMR Timeline Modal */}
      <PatientEMRModal
        isOpen={isEMROpen}
        onClose={() => {
          setIsEMROpen(false);
          setSelectedPatientForEMR(null);
        }}
        patientId={selectedPatientForEMR?.id}
        patientName={selectedPatientForEMR?.name}
      />
    </div>
  );
}
