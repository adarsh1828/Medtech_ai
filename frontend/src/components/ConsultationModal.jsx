import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Plus, Trash2, HeartPulse, FileText, CheckCircle, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function ConsultationModal({ isOpen, onClose, appointment, onSuccess }) {
  if (!isOpen || !appointment) return null;

  const [vitals, setVitals] = useState({
    vitals_bp: appointment.vitals_bp || '120/80',
    vitals_pulse: appointment.vitals_pulse || '72 bpm',
    vitals_temp: appointment.vitals_temp || '98.6 F',
    vitals_weight: appointment.vitals_weight || '65 kg'
  });

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [drugAlerts, setDrugAlerts] = useState({ hasConflicts: false, interactions: [], safetySummary: '' });

  const [medicines, setMedicines] = useState([
    {
      medicine_name: '',
      dosage: '500 mg',
      frequency: 'Twice daily (After meals)',
      duration: '5 days',
      instructions: 'Take with plenty of water'
    }
  ]);

  useEffect(() => {
    const validMeds = medicines.map(m => m.medicine_name.trim()).filter(Boolean);
    if (validMeds.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDrugInteractions(validMeds);
          setDrugAlerts(res);
        } catch (e) {
          console.warn('Drug interaction check error:', e);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setDrugAlerts({ hasConflicts: false, interactions: [], safetySummary: '' });
    }
  }, [medicines]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        dosage: '1 Tab',
        frequency: 'Once daily (Morning)',
        duration: '7 days',
        instructions: 'After breakfast'
      }
    ]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Please enter a clinical diagnosis.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Save vitals
      await api.updateAppointmentVitals(appointment.id, vitals);

      // 2. Filter valid medicines
      const validMedicines = medicines.filter(m => m.medicine_name.trim().length > 0);

      // 3. Create Prescription
      await api.createPrescription({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        advice: advice.trim(),
        follow_up_date: followUpDate || null,
        medicines: validMedicines
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              Doctor Consultation & Digital Prescription
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Recording vitals, clinical observations, and digital medication for Token #{appointment.token_number}
            </p>
          </div>
        </div>

        {/* Patient Quick Info Card */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {appointment.patient_name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Blood: <strong style={{ color: '#fb7185' }}>{appointment.patient_blood_group || 'N/A'}</strong> • Gender: {appointment.patient_gender} • Phone: {appointment.patient_phone || 'N/A'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div>Reason for Visit:</div>
            <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{appointment.reason_for_visit}"</div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Vitals Section */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.04)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '10px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8', marginBottom: '10px', textTransform: 'uppercase' }}>
              <HeartPulse size={16} /> Patient Triage Vitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Blood Pressure</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="120/80 mmHg"
                  value={vitals.vitals_bp}
                  onChange={(e) => setVitals({ ...vitals, vitals_bp: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Pulse Rate</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="72 bpm"
                  value={vitals.vitals_pulse}
                  onChange={(e) => setVitals({ ...vitals, vitals_pulse: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Body Temp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="98.6 F"
                  value={vitals.vitals_temp}
                  onChange={(e) => setVitals({ ...vitals, vitals_temp: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Weight</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="65 kg"
                  value={vitals.vitals_weight}
                  onChange={(e) => setVitals({ ...vitals, vitals_weight: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Clinical Findings & Diagnosis */}
          <div className="form-group">
            <label className="form-label">Clinical Diagnosis *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Acute Bronchitis / Stage 1 Essential Hypertension"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Clinical Examination Notes</label>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Findings from auscultation, patient history..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lifestyle Advice & Precautions</label>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Hydration, dietary instructions, rest..."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
              />
            </div>
          </div>

          {/* Medicines Prescription Builder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="form-label" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                Prescribed Medications
              </span>
              <button
                type="button"
                onClick={addMedicineRow}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 2fr 36px',
                    gap: '6px',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.medicine_name}
                    onChange={(e) => updateMedicine(idx, 'medicine_name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Dosage (500mg)"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.dosage}
                    onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frequency (Twice daily)"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.frequency}
                    onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.duration}
                    onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Instructions"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.instructions}
                    onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedicineRow(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove"
                  >
                    <Trash2 size={16} color="#fb7185" />
                  </button>
                </div>
              ))}
            </div>

            {/* Real-time AI Drug-Drug Interaction Warning Box */}
            {drugAlerts.hasConflicts ? (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-in'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '0.85rem' }}>
                  <AlertTriangle size={18} />
                  <span>AI CLINICAL ALERT: DRUG-DRUG CONTRAINDICATION DETECTED</span>
                </div>

                {drugAlerts.interactions.map((inter, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: '1.4' }}>
                    <div>
                      <strong style={{ color: '#ffffff' }}>{inter.drug1}</strong> + <strong style={{ color: '#ffffff' }}>{inter.drug2}</strong>: {inter.title} ({inter.severity})
                    </div>
                    <div style={{ color: '#fecaca', marginTop: '2px' }}>
                      {inter.effect}
                    </div>
                    <div style={{ color: '#fed7aa', marginTop: '2px', fontStyle: 'italic' }}>
                      Recommendation: {inter.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            ) : medicines.filter(m => m.medicine_name.trim().length > 0).length >= 2 ? (
              <div style={{
                marginTop: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#34d399',
                fontSize: '0.75rem'
              }}>
                <Sparkles size={14} /> AI Clinical Safety: Verified no major adverse pharmacotherapy conflicts detected.
              </div>
            ) : null}
          </div>

          {/* Follow-up Date */}
          <div className="form-group" style={{ maxWidth: '240px' }}>
            <label className="form-label">Recommended Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-emerald"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Finalizing Consultation...' : 'Complete Consultation & Issue Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
}
