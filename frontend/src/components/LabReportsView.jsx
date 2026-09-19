import React, { useState, useEffect } from 'react';
import { FlaskConical, Calendar, User, Stethoscope, CheckCircle2, Clock, Activity, FileText } from 'lucide-react';
import { api } from '../api';

export default function LabReportsView({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getLabReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error('Failed to load lab reports:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
          Diagnostic Laboratory Reports
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Pathology, biochemistry, and diagnostic imaging results
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading laboratory records...
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <FlaskConical size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3>No Diagnostic Reports Found</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
          {reports.map((rpt) => {
            const isCompleted = rpt.status === 'completed';

            return (
              <div
                key={rpt.id}
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: `3px solid ${isCompleted ? '#10b981' : '#f59e0b'}`
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                      {rpt.category || 'Diagnostic'}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {rpt.test_name}
                    </h3>
                  </div>

                  <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-amber'}`}>
                    {rpt.status}
                  </span>
                </div>

                {/* Patient & Doctor metadata */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PATIENT</div>
                    <div style={{ fontWeight: '600' }}>{rpt.patient_name}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>ORDERING DOCTOR</div>
                    <div style={{ fontWeight: '600' }}>{rpt.doctor_name || 'Attending Physician'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>TEST DATE</div>
                    <div style={{ color: 'var(--text-primary)' }}>{rpt.test_date}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>LAB CODE</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{rpt.test_code || 'LAB-001'}</div>
                  </div>
                </div>

                {/* Result Value Box */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Observed Diagnostic Value
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {rpt.result_value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Reference Range: <span style={{ color: 'var(--text-secondary)' }}>{rpt.reference_range}</span>
                  </div>
                </div>

                {/* Remarks */}
                {rpt.remarks && (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    <strong>Clinical Remarks: </strong> {rpt.remarks}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
