import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  FileText, 
  HeartPulse, 
  FlaskConical, 
  Calendar, 
  Pill, 
  Stethoscope, 
  Clock, 
  ShieldAlert, 
  Printer, 
  RefreshCw, 
  Building2, 
  CheckCircle2,
  Activity,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function PatientEMRModal({ isOpen, onClose, patientId, patientName }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'prescriptions' | 'vitals' | 'labs'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && patientId) {
      loadPatientEMR();
    }
  }, [isOpen, patientId]);

  const loadPatientEMR = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPatientProfile(patientId);
      setProfileData(res);
    } catch (err) {
      console.error('Failed to load patient EMR record:', err);
      setError(err.message || 'Could not load electronic medical record.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const patient = profileData?.patient || {};
  const appointments = profileData?.appointments || [];
  const prescriptions = profileData?.prescriptions || [];
  const labReports = profileData?.labReports || [];
  const vitals = profileData?.vitals || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#818cf8" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-display)', margin: 0 }}>
                {t('emr.title', 'Patient Electronic Health Record (EMR / EHR)')}
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {patient.full_name || patientName} • {patient.gender || 'Patient'} • Blood Group: <strong style={{ color: '#fb7185' }}>{patient.blood_group || 'N/A'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-outline btn-sm"
              style={{ gap: '6px' }}
            >
              <Printer size={14} /> Print Summary
            </button>
            <button 
              onClick={onClose}
              className="btn btn-icon"
              style={{ borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div style={{
          display: 'flex',
          padding: '8px 24px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '10px'
        }}>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'summary' ? '1px solid var(--primary)' : '1px solid transparent',
              background: activeTab === 'summary' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'summary' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <User size={14} /> Clinical Profile & Vitals
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'prescriptions' ? '1px solid #818cf8' : '1px solid transparent',
              background: activeTab === 'prescriptions' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'prescriptions' ? '#818cf8' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Pill size={14} /> Prescriptions & Rx ({prescriptions.length})
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'labs' ? '1px solid #34d399' : '1px solid transparent',
              background: activeTab === 'labs' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              color: activeTab === 'labs' ? '#34d399' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FlaskConical size={14} /> Lab Tests & Diagnostics ({labReports.length})
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'vitals' ? '1px solid #f59e0b' : '1px solid transparent',
              background: activeTab === 'vitals' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'vitals' ? '#f59e0b' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <HeartPulse size={14} /> Vitals Timeline ({vitals.length})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 10px' }} />
              Loading patient electronic record...
            </div>
          ) : error ? (
            <div style={{ padding: '20px', color: '#f87171', textAlign: 'center' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 10px' }} />
              {error}
            </div>
          ) : activeTab === 'summary' ? (
            /* Summary & Allergies & Recent Activity */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Patient Key Metrics Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Blood Group</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fb7185', marginTop: '4px' }}>
                    {patient.blood_group || 'Unknown'}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gender & DOB</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {patient.gender || 'N/A'} • {patient.dob || 'DOB N/A'}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Phone</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#38bdf8', marginTop: '4px' }}>
                    {patient.phone || 'N/A'}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emergency Contact</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f59e0b', marginTop: '4px' }}>
                    {patient.emergency_contact || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Known Allergies Alert */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: patient.allergies && !patient.allergies.toLowerCase().includes('none')
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(52, 211, 153, 0.1)',
                border: patient.allergies && !patient.allergies.toLowerCase().includes('none')
                  ? '1px solid rgba(239, 68, 68, 0.35)'
                  : '1px solid rgba(52, 211, 153, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShieldAlert size={22} color={patient.allergies && !patient.allergies.toLowerCase().includes('none') ? '#f87171' : '#34d399'} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: patient.allergies && !patient.allergies.toLowerCase().includes('none') ? '#f87171' : '#34d399' }}>
                    Drug Allergies & Hypersensitivity Flags:
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {patient.allergies || 'No known drug allergies reported. Patient allergy profile clean.'}
                  </div>
                </div>
              </div>

              {/* Chronic Medical History */}
              <div className="glass-card" style={{ padding: '18px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 8px 0', color: '#38bdf8' }}>
                  Medical History Summary & Chronic Conditions
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {patient.medical_history_summary || 'No prior chronic conditions recorded in primary admission profile.'}
                </p>
              </div>

              {/* Consultation History */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                  Recent Doctor Consultations & Appointments ({appointments.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appointments.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No prior appointments recorded.
                    </div>
                  ) : (
                    appointments.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                            {a.doctor_name} • <span style={{ color: '#38bdf8' }}>{a.department_name}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Reason: {a.reason_for_visit}
                          </div>
                          {a.completion_remark && (
                            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '2px' }}>
                              Remark: {a.completion_remark}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: a.status === 'completed' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                            color: a.status === 'completed' ? '#34d399' : '#38bdf8'
                          }}>
                            {a.status.toUpperCase()}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {a.appointment_date} ({a.appointment_time})
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'prescriptions' ? (
            /* Prescriptions History Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {prescriptions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No digital prescriptions issued for this patient.
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="glass-card"
                    style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontWeight: '800', color: '#38bdf8', fontSize: '0.9rem' }}>
                          Rx #{rx.id}
                        </span>
                        <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                        <strong style={{ fontSize: '0.88rem' }}>{rx.doctor_name}</strong> ({rx.department_name || 'Specialist'})
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {new Date(rx.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                      <strong>Diagnosis:</strong> <span style={{ color: '#f87171' }}>{rx.diagnosis}</span>
                    </div>

                    {rx.clinical_notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                        Clinical Notes: {rx.clinical_notes}
                      </div>
                    )}

                    {/* Prescribed Medicines Table */}
                    <div style={{
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        <div>Medicine</div>
                        <div>Dosage</div>
                        <div>Frequency</div>
                        <div>Duration</div>
                      </div>

                      {rx.medicines?.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr',
                            padding: '8px 12px',
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#38bdf8' }}>{m.medicine_name}</div>
                          <div>{m.dosage}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{m.frequency}</div>
                          <div>{m.duration}</div>
                        </div>
                      ))}
                    </div>

                    {rx.advice && (
                      <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#34d399' }}>
                        💡 Doctor's Advice: {rx.advice}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'labs' ? (
            /* Lab Reports Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {labReports.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No lab diagnostic tests recorded.
                </div>
              ) : (
                labReports.map((lab) => (
                  <div
                    key={lab.id}
                    className="glass-card"
                    style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FlaskConical size={16} /> {lab.test_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        Result: <strong>{lab.result_value || 'Pending'}</strong> • Normal Range: <span style={{ color: 'var(--text-muted)' }}>{lab.reference_range || 'N/A'}</span>
                      </div>
                      {lab.remarks && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Remarks: {lab.remarks}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399'
                      }}>
                        Completed
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {lab.test_date}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Vitals History Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {vitals.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No clinical vitals recorded yet.
                </div>
              ) : (
                vitals.map((v) => (
                  <div
                    key={v.id}
                    className="glass-card"
                    style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Blood Pressure</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f87171' }}>{v.bp || '120/80'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pulse Rate</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f59e0b' }}>{v.pulse || '72'} bpm</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Oxygen SpO2</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8' }}>{v.spo2 || '98'}%</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Temperature</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#34d399' }}>{v.temp || '98.6'}°F</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recorded At</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                        {new Date(v.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
