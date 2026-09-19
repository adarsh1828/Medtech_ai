import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Shield, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function HospitalSettingsModal({ isOpen, onClose, hospitalInfo, onSaveSuccess }) {
  const [form, setForm] = useState({
    hospital_name: '',
    tagline: '',
    address: '',
    contact_phone: '',
    emergency_phone: '',
    email: '',
    license_number: '',
    currency_symbol: '₹',
    currency_code: 'INR'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hospitalInfo) {
      setForm({
        hospital_name: hospitalInfo.hospital_name || '',
        tagline: hospitalInfo.tagline || '',
        address: hospitalInfo.address || '',
        contact_phone: hospitalInfo.contact_phone || '',
        emergency_phone: hospitalInfo.emergency_phone || '',
        email: hospitalInfo.email || '',
        license_number: hospitalInfo.license_number || '',
        currency_symbol: hospitalInfo.currency_symbol || '₹',
        currency_code: hospitalInfo.currency_code || 'INR'
      });
    }
  }, [hospitalInfo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospital_name.trim()) {
      setError('Hospital name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await api.updateHospitalSettings(form);
      onSaveSuccess(res.hospital);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update hospital settings.');
    } finally {
      setSaving(false);
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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              Hospital Branding & Identity
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              White-label your hospital name across the sidebar, dashboard, and clinical prescriptions
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
          {/* Hospital Name - Prominent */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Hospital Name (Displayed Prominently) *
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. CITY MULTI-SPECIALTY HOSPITAL & RESEARCH CENTER"
              value={form.hospital_name}
              onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
              style={{ fontSize: '1rem', fontWeight: '600', color: '#38bdf8' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              This name will be displayed in large prominent text on the sidebar and on printed prescription letterheads.
            </span>
          </div>

          {/* Tagline */}
          <div className="form-group">
            <label className="form-label">Hospital Tagline / Subtitle</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Advanced Tertiary Clinical Care & 24x7 Trauma Institute"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Hospital Contact Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 (555) 019-9000"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>

            {/* Emergency Hotline */}
            <div className="form-group">
              <label className="form-label">Emergency Helpline (24x7)</label>
              <input
                type="text"
                className="form-input"
                placeholder="108 / 911"
                value={form.emergency_phone}
                onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Official Contact Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="contact@hospital.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Currency Standard */}
            <div className="form-group">
              <label className="form-label">Billing Currency Standard</label>
              <select
                className="form-input"
                value={`${form.currency_symbol}|${form.currency_code}`}
                onChange={(e) => {
                  const [sym, code] = e.target.value.split('|');
                  setForm({ ...form, currency_symbol: sym, currency_code: code });
                }}
              >
                <option value="₹|INR">₹ - INR (Indian Rupee)</option>
                <option value="$|USD">$ - USD (US Dollar)</option>
                <option value="€|EUR">€ - EUR (Euro)</option>
                <option value="£|GBP">£ - GBP (British Pound)</option>
                <option value="AED|AED">AED - UAE Dirham</option>
              </select>
            </div>

            {/* Accreditation / License */}
            <div className="form-group">
              <label className="form-label">Accreditation / License No.</label>
              <input
                type="text"
                className="form-input"
                placeholder="NABH-LIC-2026-X889"
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label">Hospital Address & Location</label>
            <textarea
              rows="2"
              className="form-textarea"
              placeholder="Plot 42, Medical Enclave, Health City, Metro Boulevard"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {saving ? (
              'Saving Hospital Branding...'
            ) : (
              <>
                <Save size={16} /> Save Hospital Branding & Update All Screens
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
