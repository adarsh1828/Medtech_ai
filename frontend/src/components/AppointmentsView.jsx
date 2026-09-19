import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Activity, 
  Plus, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Search,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../api';

export default function AppointmentsView({ user, onOpenBookModal, onOpenConsultation, onOpenPrescription }) {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments();
      setAppointments(res.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await api.updateAppointmentStatus(id, newStatus);
      await loadAppointments();
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
      appt.reason_for_visit?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            Appointments & Consultations
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Manage clinical queues, patient vitals, and physician consultations
          </p>
        </div>

        <button
          onClick={onOpenBookModal}
          className="btn btn-primary"
        >
          <Plus size={16} /> Schedule Appointment
        </button>
      </div>

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
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['all', 'scheduled', 'confirmed', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border-subtle)',
                background: statusFilter === st ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: statusFilter === st ? '#38bdf8' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search patient, doctor, condition..."
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
          Loading clinical appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Calendar size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>No Appointments Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            No appointments match your current filters.
          </p>
          <button
            onClick={onOpenBookModal}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '16px' }}
          >
            Book New Appointment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
          {filteredAppointments.map((appt) => {
            const isDoctor = user?.role === 'doctor';
            const isAdmin = user?.role === 'admin';
            return (
              <div
                key={appt.id}
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                {/* Card Top: Token & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#38bdf8'
                    }}>
                      TOKEN #{appt.token_number}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ID: APT-{appt.id}
                    </span>
                  </div>

                  <span className={`badge ${
                    appt.status === 'completed' ? 'badge-emerald' :
                    appt.status === 'confirmed' ? 'badge-cyan' :
                    appt.status === 'scheduled' ? 'badge-amber' : 'badge-rose'
                  }`}>
                    {appt.status}
                  </span>
                </div>

                {/* Patient & Doctor info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Patient Details
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
                      Physician
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {appt.doctor_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {appt.department_name} (Room {appt.doctor_room})
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
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Reason: </span>
                  {appt.reason_for_visit}
                </div>

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
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  {/* Doctor actions */}
                  {appt.status !== 'completed' && (isDoctor || isAdmin) && (
                    <button
                      onClick={() => onOpenConsultation(appt)}
                      className="btn btn-emerald btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Stethoscope size={14} /> Start Consultation & Rx
                    </button>
                  )}

                  {/* Confirmation button */}
                  {appt.status === 'scheduled' && (isAdmin || isDoctor) && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                      disabled={actionLoading === appt.id}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={14} /> Confirm
                    </button>
                  )}

                  {/* View Prescription if completed */}
                  {appt.status === 'completed' && (
                    <button
                      onClick={() => onOpenPrescription(appt.id)}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                    >
                      <FileText size={14} /> View Prescription
                    </button>
                  )}

                  {/* Cancel button */}
                  {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                      disabled={actionLoading === appt.id}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#fb7185' }}
                      title="Cancel Appointment"
                    >
                      <XCircle size={14} />
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
