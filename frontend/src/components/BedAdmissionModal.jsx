import React, { useState, useEffect } from 'react';
import { 
  X, 
  BedDouble, 
  User, 
  HeartPulse, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Building2, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function BedAdmissionModal({ isOpen, onClose, preselectedBed, onAdmissionSuccess }) {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('Urgent / Acute Care');
  const [admissionNotes, setAdmissionNotes] = useState('');
  const [vitals, setVitals] = useState({
    bp: '120/80',
    pulse: '76',
    temp: '98.6',
    spo2: '98'
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadData();
      if (preselectedBed?.id) {
        setSelectedBedId(preselectedBed.id);
      }
    }
  }, [isOpen, preselectedBed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patRes, bedsRes] = await Promise.all([
        api.getPatients().catch(() => ({ patients: [] })),
        api.getBeds().catch(() => ({ beds: [] }))
      ]);

      const pList = patRes.patients || [];
      const bList = (bedsRes.beds || []).filter(b => b.status === 'available' || b.id === preselectedBed?.id);

      setPatients(pList);
      setBeds(bList);

      if (pList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pList[0].id);
      }
      if (bList.length > 0 && !selectedBedId && !preselectedBed?.id) {
        setSelectedBedId(bList[0].id);
      }
    } catch (err) {
      console.error('Failed to load admission prerequisites:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => String(p.id) === String(selectedPatientId));
  const selectedBed = beds.find(b => String(b.id) === String(selectedBedId)) || preselectedBed;

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBedId) {
      setError('Please select an available hospital bed.');
      return;
    }
    if (!selectedPatientId) {
      setError('Please select a patient to admit.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const compositeNote = `[${urgencyLevel}] ${diagnosis ? `${diagnosis}. ` : ''}${admissionNotes ? `${admissionNotes}. ` : ''}Vitals: BP ${vitals.bp}, Pulse ${vitals.pulse} bpm, SpO2 ${vitals.spo2}%, Temp ${vitals.temp}°F. Admitted at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

      // 1. Update Bed to Occupied
      await api.updateBed(selectedBedId, {
        status: 'occupied',
        patient_id: selectedPatientId,
        notes: compositeNote
      });

      // 2. Record initial inpatient vitals
      try {
        await api.recordPatientVitals({
          patient_id: selectedPatientId,
          patient_name: selectedPatient?.full_name || 'Inpatient',
          bed_number: selectedBed?.bed_number || 'Inpatient Bed',
          bp: vitals.bp,
          pulse: vitals.pulse,
          temp: vitals.temp,
          spo2: vitals.spo2,
          notes: `Admission Baseline Vitals • Bed ${selectedBed?.bed_number || ''} (${selectedBed?.ward_type || 'Inpatient'}) • ${diagnosis || 'Clinical Admission'}`
        });
      } catch (vitalErr) {
        console.warn('Initial vitals recording skipped:', vitalErr);
      }

      if (onAdmissionSuccess) onAdmissionSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete inpatient admission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(139, 92, 246, 0.15) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BedDouble size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-display)', margin: 0 }}>
                {t('beds.admitTitle', 'Inpatient Ward & ICU Bed Admission')}
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t('beds.admitSubtitle', 'Select registered patient, assign vacant bed, and record baseline admission vitals.')}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-icon"
            style={{ borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: '12px 24px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bed Allocation Selection */}
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)'
          }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#38bdf8' }}>
              Allocated Hospital Bed *
            </label>
            <select
              className="form-control"
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              required
            >
              {beds.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bed_number} — {b.ward_type} (Floor {b.floor_number || 1}) [{b.status === 'available' ? 'Vacant / Sterilized' : 'Selected'}]
                </option>
              ))}
            </select>
          </div>

          {/* Patient Search & Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
              Select Patient for Admission *
            </label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search patient by name, phone, or email..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
            </div>

            <div style={{
              maxHeight: '130px',
              overflowY: 'auto',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.15)'
            }}>
              {filteredPatients.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No matching registered patients found.
                </div>
              ) : (
                filteredPatients.map(p => {
                  const isSelected = String(selectedPatientId) === String(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ fontWeight: isSelected ? '700' : '500', color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                        {p.full_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({p.gender || 'N/A'}, Blood: {p.blood_group || 'N/A'})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.phone || p.email}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clinical Reason & Urgency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
                Primary Clinical Reason / Diagnosis *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Acute Coronary Syndrome / Post-Op Recovery"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
                Admission Urgency Priority
              </label>
              <select
                className="form-control"
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value)}
              >
                <option value="Routine Admission">Routine Inpatient</option>
                <option value="Urgent / Acute Care">⚠️ Urgent / Acute Care</option>
                <option value="Critical ICU Trauma">🚨 Critical ICU Trauma</option>
                <option value="Post-Surgical Observation">Post-Surgical Observation</option>
              </select>
            </div>
          </div>

          {/* Admission Vitals Intake */}
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '8px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartPulse size={14} /> Baseline Admission Vitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>BP (mmHg)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Pulse (bpm)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>SpO2 (%)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Temp (°F)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
              Attending Nursing / Clinical Instructions
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Hourly vitals monitoring, oxygen support on standby, NPO until morning..."
              value={admissionNotes}
              onChange={(e) => setAdmissionNotes(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <CheckCircle2 size={16} /> {submitting ? 'Admitting Patient...' : 'Confirm Inpatient Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
