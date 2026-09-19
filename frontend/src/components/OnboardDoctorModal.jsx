import React, { useState, useEffect } from 'react';
import { X, UserPlus, Stethoscope, Building2, Shield, CheckCircle } from 'lucide-react';
import { api } from '../api';

export default function OnboardDoctorModal({ isOpen, onClose, onSuccess }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: 'doctor123',
    phone: '',
    department_id: '',
    qualification: '',
    specialization: '',
    experience_years: 5,
    room_number: 'Room 105',
    shift_timings: '09:00 AM - 05:00 PM',
    consultation_fee: 500.0
  });

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.getDepartments();
      const depts = res.departments || [];
      setDepartments(depts);
      if (depts.length > 0 && !form.department_id) {
        setForm(prev => ({ ...prev, department_id: depts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.qualification || !form.specialization) {
      setError('Please provide full name, email, qualification, and specialization.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.onboardDoctor({
        ...form,
        department_id: Number(form.department_id),
        experience_years: Number(form.experience_years),
        consultation_fee: Number(form.consultation_fee)
      });

      onSuccess();
      onClose();
    } catch (err) {
      // If admin endpoint fails or unauthorized, attempt registerDoctor fallback
      try {
        await api.registerDoctor({
          ...form,
          department_id: Number(form.department_id),
          experience_years: Number(form.experience_years),
          consultation_fee: Number(form.consultation_fee)
        });
        onSuccess();
        onClose();
      } catch (fallbackErr) {
        setError(fallbackErr.message || err.message || 'Failed to onboard doctor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
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

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              Onboard New Physician to Hospital
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              Register attending clinicians, assign department floor and consultation room
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Doctor Full Name (with Title) *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Dr. Priya Nair, MD, DM"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hospital Email Address *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="dr.priya@medtech.ai"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Department *</label>
              <select
                className="form-select"
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Floor {d.floor_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Contact</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (555) 789-0123"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Degree & Qualifications *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. MBBS, MD (Medicine), DM (Neuro)"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Specialization Area *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Cognitive Neurology & Stroke"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                className="form-input"
                value={form.experience_years}
                onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input
                type="number"
                min="50"
                step="50"
                className="form-input"
                value={form.consultation_fee}
                onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Room</label>
              <input
                type="text"
                className="form-input"
                placeholder="Room 205"
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shift Timings</label>
              <input
                type="text"
                className="form-input"
                placeholder="09:00 AM - 05:00 PM"
                value={form.shift_timings}
                onChange={(e) => setForm({ ...form, shift_timings: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Onboarding Physician...' : 'Confirm & Onboard Doctor to Staff'}
          </button>
        </form>
      </div>
    </div>
  );
}
