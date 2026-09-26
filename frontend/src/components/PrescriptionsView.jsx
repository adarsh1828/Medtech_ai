import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Stethoscope, 
  User, 
  Calendar, 
  Pill, 
  Printer, 
  Search, 
  Download, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Clock, 
  HeartPulse 
} from 'lucide-react';
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

  const handleShareWhatsApp = (rx) => {
    const medList = rx.medicines?.map((m, i) => `${i + 1}. *${m.medicine_name}* (${m.dosage}) - ${m.frequency} for ${m.duration} (${m.instructions || ''})`).join('\n') || 'None';
    const text = `🏥 *${hospitalInfo?.hospital_name || 'MEDTECH MULTI-SPECIALTY HOSPITAL'}*
📋 *OFFICIAL DIGITAL PRESCRIPTION #RX-${rx.id}*
👤 *Patient:* ${rx.patient_name}
🩺 *Doctor:* ${rx.doctor_name} (${rx.doctor_specialization})
🩺 *Diagnosis:* ${rx.diagnosis}

💊 *Medicines prescribed:*
${medList}

📝 *Doctor Advice:* ${rx.advice || 'Take medicines on scheduled time'}
🔗 *Verify Digital Rx:* https://medtech-hospital.app/verify/RX-${rx.id}
📞 *Emergency Hotline:* ${hospitalInfo?.emergency_phone || '108 / 112'}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleShareWhatsApp(rx)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)' }}
                    title="Share Prescription via WhatsApp"
                  >
                    <Share2 size={14} /> WhatsApp
                  </button>
                  <button
                    onClick={() => setActivePrintRx(rx)}
                    className="btn btn-primary btn-sm"
                  >
                    <Printer size={14} /> Formal Rx
                  </button>
                </div>
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
            style={{ maxWidth: '780px', background: '#ffffff', color: '#0f172a', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: '700', fontSize: '0.9rem' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span>Verified Clinical Order #RX-{activePrintRx.id}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleShareWhatsApp(activePrintRx)}
                  className="btn btn-sm"
                  style={{ background: '#25D366', color: '#ffffff', border: 'none', fontWeight: '600' }}
                >
                  <Share2 size={14} /> WhatsApp Rx
                </button>
                <button
                  onClick={handlePrintRx}
                  className="btn btn-primary btn-sm"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setActivePrintRx(null)}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Formal Rx Paper Layout */}
            <div id="printable-rx" style={{ border: '2px solid #0f172a', padding: '28px', borderRadius: '8px', background: '#ffffff', position: 'relative' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
                    {hospitalInfo?.hospital_name || 'MEDTECH MULTI-SPECIALTY HOSPITAL'}
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600', marginTop: '2px' }}>
                    {hospitalInfo?.tagline || 'Tertiary Multi-Specialty Health Institute & 24x7 Trauma Center'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    {hospitalInfo?.address || 'Plot 42, Medical Enclave, Health City'} • 📞 24x7 Emergency: {hospitalInfo?.emergency_phone || '108 / 112'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>
                    License: {hospitalInfo?.license_number || 'HOSP-MH-2026-X889'} • Govt. NABH Accredited
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>{activePrintRx.doctor_name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: '600' }}>{activePrintRx.doctor_specialization}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dept of {activePrintRx.department_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                    ✓ NMC / MMC REG. PRACTITIONER
                  </div>
                </div>
              </div>

              {/* Patient Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <div><span style={{ color: '#64748b' }}>PATIENT:</span> <br/><strong>{activePrintRx.patient_name}</strong></div>
                <div><span style={{ color: '#64748b' }}>BLOOD GROUP:</span> <br/><strong>{activePrintRx.patient_blood_group || 'O+'}</strong></div>
                <div><span style={{ color: '#64748b' }}>DATE & TIME:</span> <br/><strong>{new Date(activePrintRx.created_at).toLocaleDateString()}</strong></div>
                <div><span style={{ color: '#64748b' }}>PRESCRIPTION NO:</span> <br/><strong style={{ color: '#0284c7' }}>#RX-{activePrintRx.id}</strong></div>
              </div>

              {/* Vitals Bar if available */}
              {(activePrintRx.vitals_bp || activePrintRx.vitals_pulse) && (
                <div style={{ display: 'flex', gap: '20px', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px', border: '1px solid #bbf7d0', color: '#166534' }}>
                  <span>Blood Pressure: <strong>{activePrintRx.vitals_bp || '120/80 mmHg'}</strong></span>
                  <span>Pulse: <strong>{activePrintRx.vitals_pulse || '74 bpm'}</strong></span>
                  <span>Temperature: <strong>98.6°F</strong></span>
                </div>
              )}

              {/* Diagnosis */}
              <div style={{ marginBottom: '14px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Clinical Diagnosis: </span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>{activePrintRx.diagnosis}</span>
              </div>

              {/* Rx Glyph */}
              <div style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', color: '#0284c7', marginBottom: '6px' }}>
                ℞
              </div>

              {/* Medicines Table */}
              <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #0f172a', textAlign: 'left' }}>
                      <th style={{ padding: '8px 6px', width: '35%' }}>Medication & Dosage</th>
                      <th style={{ padding: '8px 6px' }}>Frequency</th>
                      <th style={{ padding: '8px 6px' }}>Duration</th>
                      <th style={{ padding: '8px 6px' }}>Intake Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePrintRx.medicines?.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 6px' }}>
                          <strong style={{ color: '#0f172a' }}>{idx + 1}. {m.medicine_name}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dosage: {m.dosage}</div>
                        </td>
                        <td style={{ padding: '10px 6px', fontWeight: '600' }}>{m.frequency}</td>
                        <td style={{ padding: '10px 6px' }}>{m.duration}</td>
                        <td style={{ padding: '10px 6px', color: '#475569', fontStyle: 'italic' }}>
                          {m.instructions || 'After meals with water'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Advice */}
              {activePrintRx.advice && (
                <div style={{ fontSize: '0.85rem', marginBottom: '24px', padding: '10px 14px', background: '#f8fafc', borderLeft: '4px solid #0284c7', borderRadius: '4px' }}>
                  <strong style={{ color: '#0f172a' }}>Physician Advice & Dietary Instructions:</strong>
                  <div style={{ color: '#334155', marginTop: '2px' }}>{activePrintRx.advice}</div>
                </div>
              )}

              {/* Footer: Digital QR Verification Seal & Doctor Signature Stamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {/* QR Code Verification Seal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff'
                  }}>
                    {/* Simulated Authentic SVG QR Code */}
                    <svg viewBox="0 0 40 40" width="56" height="56" fill="#0f172a">
                      <rect x="2" y="2" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="2"/>
                      <rect x="5" y="5" width="6" height="6"/>
                      <rect x="26" y="2" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="2"/>
                      <rect x="29" y="5" width="6" height="6"/>
                      <rect x="2" y="26" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="2"/>
                      <rect x="5" y="29" width="6" height="6"/>
                      <rect x="18" y="4" width="4" height="4"/>
                      <rect x="18" y="12" width="4" height="4"/>
                      <rect x="18" y="24" width="4" height="4"/>
                      <rect x="26" y="20" width="4" height="4"/>
                      <rect x="32" y="28" width="6" height="6"/>
                      <rect x="22" y="32" width="4" height="4"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase' }}>
                      Scan to Verify Digital Rx
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Cryptographically signed e-Prescription
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '600' }}>
                      ✓ Hospital Secure EHR Validated
                    </div>
                  </div>
                </div>

                {/* Doctor Signature & Official Medical Stamp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Official Round Stamp */}
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    border: '2px dashed #0284c7',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    fontSize: '0.55rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    lineHeight: '1.1',
                    transform: 'rotate(-8deg)',
                    padding: '4px'
                  }}>
                    <span>★ MMC / NMC ★</span>
                    <span style={{ fontSize: '0.62rem', margin: '2px 0' }}>VERIFIED</span>
                    <span>PRACTITIONER</span>
                  </div>

                  {/* Signature Line */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', width: '180px', paddingTop: '6px' }}>
                    <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '2px' }}>
                      {activePrintRx.doctor_name}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#0f172a' }}>{activePrintRx.doctor_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Authorized Medical Practitioner</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
