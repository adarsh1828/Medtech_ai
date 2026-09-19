import React, { useState, useEffect } from 'react';
import { FileText, Stethoscope, User, Calendar, Pill, Printer, Search, Download } from 'lucide-react';
import { api } from '../api';

export default function PrescriptionsView({ user, selectedPrescriptionId, hospitalInfo }) {
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activePrintRx, setActivePrintRx] = useState(null);


  useEffect(() => {
    loadPrescriptions();
  }, [user]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.getPrescriptions();
      setPrescriptions(res.prescriptions || []);
      if (selectedPrescriptionId) {
        const target = res.prescriptions?.find(p => p.id === selectedPrescriptionId || p.appointment_id === selectedPrescriptionId);
        if (target) setActivePrintRx(target);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRx = () => {
    const printElem = document.getElementById('printable-rx');
    if (!printElem) {
      window.print();
      return;
    }

    try {
      let printFrame = document.getElementById('medtech-rx-print-frame');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'medtech-rx-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Medical Prescription - RX</title>
            <style>
              @page { size: A4; margin: 12mm 15mm; }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #ffffff !important; color: #0f172a !important; margin: 0; padding: 10px; }
              table { width: 100%; border-collapse: collapse; }
            </style>
          </head>
          <body>
            ${printElem.innerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 250);
    } catch (e) {
      window.print();
    }
  };

  const filtered = prescriptions.filter((rx) => {
    return (
      rx.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      rx.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
      rx.diagnosis?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            Digital Prescriptions & Medical Orders
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Electronic pharmacotherapy records and physician clinical instructions
          </p>
        </div>

        <div style={{ minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search by patient, doctor, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading prescription records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3>No Prescriptions Found</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((rx) => (
            <div
              key={rx.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: '4px solid #06b6d4'
              }}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      color: '#38bdf8'
                    }}>
                      RX-{rx.id.toString().padStart(4, '0')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Date: {rx.created_at ? new Date(rx.created_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                    {rx.diagnosis}
                  </h3>
                </div>

                <button
                  onClick={() => setActivePrintRx(rx)}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                >
                  <Printer size={14} /> View Formal Rx
                </button>
              </div>

              {/* Patient & Doctor metadata */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient</div>
                  <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>{rx.patient_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Blood: {rx.patient_blood_group || 'N/A'} • {rx.patient_gender}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Physician</div>
                  <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>{rx.doctor_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rx.doctor_specialization} ({rx.department_name})</div>
                </div>

                {(rx.vitals_bp || rx.vitals_pulse) && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baseline Vitals</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      BP: <strong>{rx.vitals_bp || 'N/A'}</strong> • Pulse: <strong>{rx.vitals_pulse || 'N/A'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Notes & Advice */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                {rx.clinical_notes && (
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Clinical Notes: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{rx.clinical_notes}</span>
                  </div>
                )}
                {rx.advice && (
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Advice: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{rx.advice}</span>
                  </div>
                )}
              </div>

              {/* Medicines Table */}
              {rx.medicines && rx.medicines.length > 0 && (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.medicines.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Pill size={14} /> {m.medicine_name}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{m.dosage}</td>
                          <td>{m.frequency}</td>
                          <td>{m.duration}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formal Printable Rx Modal */}
      {activePrintRx && (
        <div className="modal-backdrop" onClick={() => setActivePrintRx(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '720px', background: '#ffffff', color: '#0f172a' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={handlePrintRx}
                className="btn btn-primary btn-sm"
              >
                <Printer size={14} /> Print Document
              </button>
              <button
                onClick={() => setActivePrintRx(null)}
                className="btn btn-outline btn-sm"
                style={{ color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                Close
              </button>
            </div>

            {/* Formal Rx Paper Layout */}
            <div id="printable-rx" style={{ border: '2px solid #0f172a', padding: '28px', borderRadius: '8px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                    {hospitalInfo?.hospital_name || 'MEDTECH AI HOSPITAL'}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {hospitalInfo?.tagline || 'Tertiary Multi-Specialty Health Institute'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {hospitalInfo?.address || 'Plot 42, Medical Enclave, Health City'} • Tel: {hospitalInfo?.contact_phone || '+1 (555) 019-9000'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>{activePrintRx.doctor_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{activePrintRx.doctor_specialization}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{activePrintRx.department_name}</div>
                </div>
              </div>


              {/* Patient Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                <div><strong>Patient:</strong> {activePrintRx.patient_name}</div>
                <div><strong>Blood:</strong> {activePrintRx.patient_blood_group || 'N/A'}</div>
                <div><strong>Date:</strong> {new Date(activePrintRx.created_at).toLocaleDateString()}</div>
                <div><strong>Rx Ref:</strong> #{activePrintRx.id}</div>
              </div>

              {/* Diagnosis */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>Clinical Diagnosis: </span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>{activePrintRx.diagnosis}</span>
              </div>

              {/* Rx Glyph */}
              <div style={{ fontSize: '1.8rem', fontWeight: '900', fontStyle: 'italic', color: '#0284c7', marginBottom: '10px' }}>
                ℞
              </div>

              {/* Medicines list */}
              <div style={{ marginBottom: '20px' }}>
                {activePrintRx.medicines?.map((m, idx) => (
                  <div key={idx} style={{ padding: '8px 0', borderBottom: '1px dashed #cbd5e1' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>
                      {idx + 1}. {m.medicine_name} — {m.dosage}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', marginLeft: '18px' }}>
                      Take: {m.frequency} for {m.duration} • <em>{m.instructions}</em>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advice */}
              {activePrintRx.advice && (
                <div style={{ fontSize: '0.85rem', marginBottom: '20px', padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>
                  <strong>Physician Advice:</strong> {activePrintRx.advice}
                </div>
              )}

              {/* Signature */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                <div style={{ textAlign: 'center', borderTop: '1px solid #0f172a', width: '200px', paddingTop: '6px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{activePrintRx.doctor_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Authorized Medical Practitioner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
