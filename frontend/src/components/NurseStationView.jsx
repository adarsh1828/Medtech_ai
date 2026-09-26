import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  UserCheck, 
  Plus, 
  Search, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  RefreshCw,
  X,
  Stethoscope
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function NurseStationView({ user, hospitalInfo }) {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('medications'); // 'medications' | 'vitals' | 'handover'
  const [medications, setMedications] = useState([]);
  const [vitalsList, setVitalsList] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Administer dose modal state
  const [selectedMed, setSelectedMed] = useState(null);
  const [isDoseModalOpen, setIsDoseModalOpen] = useState(false);
  const [doseVitals, setDoseVitals] = useState({
    bp: '120/80',
    pulse: '76',
    temp: '98.4',
    spo2: '99',
    notes: 'Vitals stable. Medication administered per physician dosage schedule.'
  });
  const [submittingDose, setSubmittingDose] = useState(false);

  // New vitals modal state
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    patient_name: 'Elena Rodriguez',
    bed_number: 'Bed 101',
    bp: '120/80',
    pulse: '75',
    temp: '98.6',
    spo2: '99',
    sugar: '110',
    notes: 'Normal clinical baseline.'
  });

  // Shift Handover state
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    outgoing_nurse_name: user?.fullName || 'Sister Sunita Sharma',
    incoming_nurse_name: '',
    ward_name: 'General Ward & ICU',
    shift_name: 'Day Shift (08:00 AM - 04:00 PM)',
    critical_patients_notes: 'Bed 101 - Antibiotic IV complete. ICU Bed 1 - Enoxaparin scheduled 03:00 PM. No code red incidents.'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [medsRes, vitalsRes, handoversRes] = await Promise.all([
        api.getMedicationSchedules(),
        api.getPatientVitals(),
        api.getShiftHandovers()
      ]);
      setMedications(medsRes.medications || []);
      setVitalsList(vitalsRes.vitals || []);
      setHandovers(handoversRes.handovers || []);
    } catch (err) {
      console.error('Failed to load nurse station data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDoseModal = (med) => {
    setSelectedMed(med);
    setIsDoseModalOpen(true);
  };

  const handleConfirmDose = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;

    setSubmittingDose(true);
    try {
      // 1. Mark medication as administered
      await api.administerMedication(selectedMed.id, {
        nurse_name: user?.fullName || 'Staff Nurse',
        notes: doseVitals.notes
      });

      // 2. Also record clinical vitals concurrently
      await api.recordPatientVitals({
        patient_id: selectedMed.patient_id,
        patient_name: selectedMed.patient_name,
        bed_number: selectedMed.bed_number,
        nurse_id: user?.nurseId || user?.id,
        nurse_name: user?.fullName || 'Staff Nurse',
        bp: doseVitals.bp,
        pulse: doseVitals.pulse,
        temp: doseVitals.temp,
        spo2: doseVitals.spo2,
        notes: `Dose administered: ${selectedMed.medicine_name} (${selectedMed.dosage}). ${doseVitals.notes}`
      });

      await loadData();
      setIsDoseModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to record dose');
    } finally {
      setSubmittingDose(false);
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    try {
      await api.recordPatientVitals({
        ...vitalsForm,
        nurse_id: user?.nurseId || user?.id,
        nurse_name: user?.fullName || 'Staff Nurse'
      });
      await loadData();
      setIsAddVitalsOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to record vitals');
    }
  };

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    if (!handoverForm.incoming_nurse_name) {
      alert('Please specify the incoming nurse accepting the handover.');
      return;
    }
    try {
      await api.submitShiftHandover(handoverForm);
      await loadData();
      setIsHandoverOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to submit shift handover');
    }
  };

  const pendingMeds = medications.filter(m => m.status === 'pending');
  const givenMeds = medications.filter(m => m.status === 'given');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease-out' }}>
      
      {/* Top Banner: Nurse Station & Clinical Telemetry */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px' }}>
            <HeartPulse size={14} className="heartbeat-icon" /> CLINICAL NURSE STATION • 24x7 INPATIENT MONITORING
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Ward & Medication Command
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '640px', marginTop: '4px' }}>
            Anti-negligence medication timers, vital signs tracking, and digital shift accountability handover.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddVitalsOpen(true)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Activity size={16} color="var(--primary)" /> Record Patient Vitals
          </button>
          <button
            onClick={() => setIsHandoverOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={16} /> Shift Handover Lock
          </button>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Pending Medication Doses</div>
              <div className="stat-value" style={{ color: pendingMeds.length > 0 ? '#fbbf24' : '#34d399' }}>
                {pendingMeds.length}
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Doses Administered Today</div>
              <div className="stat-value" style={{ color: '#34d399' }}>{givenMeds.length}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Vitals Logs Recorded</div>
              <div className="stat-value">{vitalsList.length}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Digital Shift Handovers</div>
              <div className="stat-value">{handovers.length}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('medications')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'medications' ? '1px solid var(--primary)' : '1px solid transparent',
            background: activeSubTab === 'medications' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'medications' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          💊 Medication Schedules ({pendingMeds.length} Due)
        </button>

        <button
          onClick={() => setActiveSubTab('vitals')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'vitals' ? '1px solid var(--primary)' : '1px solid transparent',
            background: activeSubTab === 'vitals' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'vitals' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          📊 Patient Vitals Telemetry ({vitalsList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('handover')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'handover' ? '1px solid var(--primary)' : '1px solid transparent',
            background: activeSubTab === 'handover' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'handover' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          🤝 Shift Handover Logs ({handovers.length})
        </button>
      </div>

      {/* Tab 1: Medication Schedules & Timers */}
      {activeSubTab === 'medications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {medications.map(med => {
              const isGiven = med.status === 'given';

              return (
                <div
                  key={med.id}
                  className="glass-card"
                  style={{
                    border: isGiven ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
                    background: isGiven ? 'rgba(16, 185, 129, 0.03)' : 'rgba(245, 158, 11, 0.04)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                        {med.bed_number || 'General Ward'}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {med.patient_name}
                      </h4>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      background: isGiven ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isGiven ? '#34d399' : '#fbbf24',
                      border: `1px solid ${isGiven ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      {isGiven ? '✅ ADMINISTERED' : '🟡 DUE DOSE'}
                    </span>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {med.medicine_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '600', marginTop: '2px' }}>
                      Dosage: {med.dosage} • Time: {med.scheduled_time}
                    </div>
                    {med.doctor_name && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Prescribing Physician: {med.doctor_name}
                      </div>
                    )}
                  </div>

                  {isGiven ? (
                    <div style={{ fontSize: '0.78rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', padding: '8px', borderRadius: '6px' }}>
                      ✓ Given at {new Date(med.given_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {med.given_by_nurse}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenDoseModal(med)}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', fontWeight: '700' }}
                    >
                      Administer Dose & Verify Vitals
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Patient Vitals Table */}
      {activeSubTab === 'vitals' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Patient Clinical Vitals Telemetry</h3>
            <button onClick={() => setIsAddVitalsOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> New Vitals Entry
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Patient</th>
                  <th>Bed Number</th>
                  <th>Blood Pressure</th>
                  <th>Pulse</th>
                  <th>Temp</th>
                  <th>SpO2</th>
                  <th>Blood Sugar</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {vitalsList.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: '600' }}>{v.patient_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{v.bed_number}</td>
                    <td style={{ fontWeight: '700', color: '#38bdf8' }}>{v.bp}</td>
                    <td>{v.pulse}</td>
                    <td>{v.temp}</td>
                    <td style={{ fontWeight: '700', color: '#34d399' }}>{v.spo2}</td>
                    <td>{v.sugar || '-'}</td>
                    <td>{v.nurse_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Shift Handover Logs */}
      {activeSubTab === 'handover' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Digital Shift Handover Audit Trail</h3>
            <button onClick={() => setIsHandoverOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Transfer Shift Handover
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {handovers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No shift handovers logged yet.
              </div>
            ) : (
              handovers.map(h => (
                <div
                  key={h.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-cyan">{h.ward_name}</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{h.shift_name}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong>Clinical Notes:</strong> {h.critical_patients_notes}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} /> Handed over by <strong>{h.outgoing_nurse_name}</strong> to <strong>{h.incoming_nurse_name}</strong> (Digitally Locked)
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Administer Dose & Verify Vitals */}
      {isDoseModalOpen && selectedMed && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Administer Medication Dose</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedMed.patient_name} • {selectedMed.bed_number}
                </p>
              </div>
              <button onClick={() => setIsDoseModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDose} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ fontWeight: '700', color: '#38bdf8' }}>{selectedMed.medicine_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Scheduled Dosage: {selectedMed.dosage} • Time: {selectedMed.scheduled_time}
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                PATIENT VITALS VERIFICATION (औषध देण्यापूर्वी व्हायटल्स तपासणी)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">Blood Pressure (BP) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doseVitals.bp}
                    onChange={(e) => setDoseVitals({ ...doseVitals, bp: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Pulse (bpm) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doseVitals.pulse}
                    onChange={(e) => setDoseVitals({ ...doseVitals, pulse: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Oxygen SpO2 (%) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doseVitals.spo2}
                    onChange={(e) => setDoseVitals({ ...doseVitals, spo2: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Temperature (°F)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doseVitals.temp}
                    onChange={(e) => setDoseVitals({ ...doseVitals, temp: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Nurse Observation Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={doseVitals.notes}
                  onChange={(e) => setDoseVitals({ ...doseVitals, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsDoseModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingDose} className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  {submittingDose ? 'Recording...' : 'Confirm Dose Administered'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Patient Vitals */}
      {isAddVitalsOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Record Patient Clinical Vitals</h3>
              <button onClick={() => setIsAddVitalsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordVitals} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={vitalsForm.patient_name}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, patient_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">Bed Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vitalsForm.bed_number}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bed_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Blood Pressure (BP) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vitalsForm.bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Pulse (bpm)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vitalsForm.pulse}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">SpO2 (%)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vitalsForm.spo2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Temp (°F)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vitalsForm.temp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Blood Sugar (mg/dL)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vitalsForm.sugar}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, sugar: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Clinical Observations</label>
                <input
                  type="text"
                  className="form-input"
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsAddVitalsOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Save Vitals to Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Shift Handover */}
      {isHandoverOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Digital Shift Handover Transfer</h3>
              <button onClick={() => setIsHandoverOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Outgoing Nurse (Sign-off) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={handoverForm.outgoing_nurse_name}
                  onChange={(e) => setHandoverForm({ ...handoverForm, outgoing_nurse_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Incoming Nurse (Taking Charge) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={handoverForm.incoming_nurse_name}
                  onChange={(e) => setHandoverForm({ ...handoverForm, incoming_nurse_name: e.target.value })}
                  placeholder="e.g. Sister Priya Kulkarni"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label className="form-label">Ward / Unit *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={handoverForm.ward_name}
                    onChange={(e) => setHandoverForm({ ...handoverForm, ward_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Shift Type *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={handoverForm.shift_name}
                    onChange={(e) => setHandoverForm({ ...handoverForm, shift_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Critical Patient Status & Pending Doses *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={handoverForm.critical_patients_notes}
                  onChange={(e) => setHandoverForm({ ...handoverForm, critical_patients_notes: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsHandoverOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: '700' }}>
                  Lock Shift Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
