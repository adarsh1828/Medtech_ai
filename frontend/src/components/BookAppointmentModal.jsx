import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Stethoscope, Building2, User, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
  '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', 
  '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

export default function BookAppointmentModal({ isOpen, onClose, user, onBookingSuccess, preselectedDeptId, preselectedDocId }) {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:30 AM');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedDeptId) setDepartmentId(preselectedDeptId);
    if (preselectedDocId) setDoctorId(preselectedDocId);
  }, [preselectedDeptId, preselectedDocId]);

  const loadFormData = async () => {
    setLoading(true);
    try {
      const [deptRes, docsRes] = await Promise.all([
        api.getDepartments(),
        api.getDoctors()
      ]);
      setDepartments(deptRes.departments || []);
      setDoctors(docsRes.doctors || []);

      if (deptRes.departments?.length > 0 && !departmentId) {
        setDepartmentId(deptRes.departments[0].id);
      }

      // If admin, load patients list
      if (user?.role === 'admin' || user?.role === 'doctor') {
        const patsRes = await api.getPatients().catch(() => ({ patients: [] }));
        setPatients(patsRes.patients || []);
        if (patsRes.patients?.length > 0) {
          setPatientId(patsRes.patients[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load booking form data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors based on selected department
  const filteredDoctors = doctors.filter(doc => !departmentId || doc.department_id === Number(departmentId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Please select a consulting doctor.');
      return;
    }
    if (!reason.trim()) {
      setError('Please state the primary reason for consultation.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        department_id: Number(departmentId),
        doctor_id: Number(doctorId),
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        reason_for_visit: reason.trim()
      };

      if ((user?.role === 'admin' || user?.role === 'doctor') && patientId) {
        payload.patient_id = Number(patientId);
      }

      await api.bookAppointment(payload);
      onBookingSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              {t('booking.modalTitle', 'Schedule Clinical Appointment')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              {t('booking.availableSlots', 'Secure automated consultation token allocation')}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Patient Selector for Admin / Doctor */}
          {(user?.role === 'admin' || user?.role === 'doctor') && (
            <div className="form-group">
              <label className="form-label">Consulting Patient</label>
              <select
                className="form-select"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.blood_group || 'Blood N/A'}, {p.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Department */}
            <div className="form-group">
              <label className="form-label">{t('booking.selectDept', 'Clinical Department')}</label>
              <select
                className="form-select"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setDoctorId('');
                }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Floor {d.floor_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div className="form-group">
              <label className="form-label">{t('booking.selectDoctor', 'Attending Physician')}</label>
              <select
                className="form-select"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
              >
                <option value="">{t('booking.selectDoctorPrompt', 'Select Doctor...')}</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name} ({doc.specialization}) {doc.is_on_duty ? '• On Duty' : '• Off Duty'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="form-group">
            <label className="form-label">{t('booking.appointmentDate', 'Appointment Date')}</label>
            <input
              type="date"
              required
              className="form-input"
              value={appointmentDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>

          {/* Time Slot Chips */}
          <div className="form-group">
            <label className="form-label">{t('booking.timeSlot', 'Preferred Time Slot')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {TIME_SLOTS.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid',
                    borderColor: timeSlot === slot ? 'var(--primary)' : 'var(--border-subtle)',
                    background: timeSlot === slot ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: timeSlot === slot ? '#38bdf8' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: timeSlot === slot ? '700' : '500',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">{t('booking.clinicalReason', 'Reason for Visit & Symptoms')}</label>
            <textarea
              rows="3"
              required
              className="form-textarea"
              placeholder={t('booking.reasonPlaceholder', 'Describe primary symptoms, pain severity, or referral reasons...')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="btn btn-primary"
            style={{ marginTop: '8px' }}
          >
            {submitting ? t('common.loading', 'Confirming Reservation...') : t('booking.confirmBtn', 'Confirm Appointment Reservation')}
          </button>
        </form>
      </div>
    </div>
  );
}
