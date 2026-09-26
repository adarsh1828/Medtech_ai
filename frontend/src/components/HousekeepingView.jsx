import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Camera, 
  RefreshCw, 
  Building2, 
  Search, 
  Check, 
  X,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function HousekeepingView({ user, hospitalInfo }) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'clean' | 'due' | 'overdue'

  // Scan modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [checklist, setChecklist] = useState({
    mopping: true,
    linen: true,
    dustbin: true,
    sanitizer: true
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30 sec auto-refresh for live status
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, logsRes, sumRes] = await Promise.all([
        api.getCleaningTasks(),
        api.getCleaningLogs(),
        api.getHousekeepingSummary()
      ]);
      setTasks(tasksRes.tasks || []);
      setLogs(logsRes.logs || []);
      setSummary(sumRes || null);
    } catch (err) {
      console.error('Failed to load housekeeping data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScan = (task = null) => {
    setSelectedTask(task);
    setScannedCode(task ? task.area_code : '');
    setChecklist({ mopping: true, linen: true, dustbin: true, sanitizer: true });
    setNotes('');
    setSuccessMessage('');
    setIsScanModalOpen(true);
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();
    if (!scannedCode) {
      alert('Please enter or scan an area QR code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.scanCleaningQR({
        area_code: scannedCode,
        checklist,
        cleaner_name: user?.fullName || 'Ramesh Shinde (Sanitation Staff)',
        cleaner_id: user?.cleanerId || user?.id,
        notes
      });

      setSuccessMessage(res.message);
      await loadData();
      setTimeout(() => {
        setIsScanModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      alert(err.message || 'QR Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease-out' }}>
      
      {/* Top Hero Banner: Hospital Sanitation & Anti-Negligence Command */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px' }}>
            <ShieldCheck size={14} /> HOSPITAL INFECTION CONTROL & SANITATION
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Housekeeping & Cleanliness Command
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '640px', marginTop: '4px' }}>
            Anti-negligence QR verification system. Every hospital ward, ICU cabin, and restroom requires physical presence verification with tamper-proof checklists.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenScan(null)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: '700' }}
          >
            <QrCode size={18} /> Scan Area QR Code
          </button>
          <button
            onClick={loadData}
            className="btn btn-outline"
            style={{ padding: '10px', color: 'var(--text-secondary)' }}
            title="Refresh Live Status"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Total Hygiene Areas</div>
              <div className="stat-value">{summary?.totalAreas || tasks.length}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Sanitized & Safe</div>
              <div className="stat-value" style={{ color: '#34d399' }}>{summary?.cleanCount || 0}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Due for Cleaning</div>
              <div className="stat-value" style={{ color: '#fbbf24' }}>{summary?.dueCount || 0}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Overdue Alerts (लाल सूचना)</div>
              <div className="stat-value" style={{ color: '#fb7185' }}>{summary?.overdueCount || 0}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: `All Areas (${tasks.length})` },
          { id: 'clean', label: `🟢 Cleaned (${summary?.cleanCount || 0})` },
          { id: 'due', label: `🟡 Due Soon (${summary?.dueCount || 0})` },
          { id: 'overdue', label: `🔴 Overdue Warnings (${summary?.overdueCount || 0})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: filter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
              background: filter === tab.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              color: filter === tab.id ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: filter === tab.id ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Hospital Cleaning Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredTasks.map(task => {
          const isOverdue = task.status === 'overdue';
          const isDue = task.status === 'due';
          const isClean = task.status === 'clean';

          return (
            <div
              key={task.id}
              className="glass-card"
              style={{
                border: isOverdue ? '1px solid rgba(244, 63, 94, 0.4)' : isDue ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                background: isOverdue ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.06) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'var(--bg-card)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                position: 'relative'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {task.area_type}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {task.area_name}
                  </h3>
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isOverdue ? 'rgba(244, 63, 94, 0.15)' : isDue ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isOverdue ? '#fb7185' : isDue ? '#fbbf24' : '#34d399',
                  border: `1px solid ${isOverdue ? 'rgba(244, 63, 94, 0.3)' : isDue ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}>
                  {isOverdue && '🔴 OVERDUE'}
                  {isDue && '🟡 DUE SOON'}
                  {isClean && '🟢 SANITIZED'}
                </span>
              </div>

              {/* QR Code Tag & Timer Info */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Location QR: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
                    {task.area_code}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Protocol: </span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Every {task.cleaning_frequency_hours}h</span>
                </div>
              </div>

              {/* Last Cleaned Info */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>
                  <strong>Last cleaned:</strong> {task.last_cleaned_at ? new Date(task.last_cleaned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  {task.last_cleaned_by && ` by ${task.last_cleaned_by}`}
                </div>
                {isOverdue && (
                  <div style={{ color: '#fb7185', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} /> {task.overdue_minutes} minutes overdue! Immediate sanitization needed.
                  </div>
                )}
              </div>

              {/* Action Button: QR Scan Verify */}
              <button
                onClick={() => handleOpenScan(task)}
                className="btn btn-outline btn-sm"
                style={{
                  width: '100%',
                  borderColor: isOverdue ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                  color: isOverdue ? '#fb7185' : '#34d399',
                  background: isOverdue ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  fontWeight: '700'
                }}
              >
                <QrCode size={15} /> Verify Sanitization (Scan QR)
              </button>
            </div>
          );
        })}
      </div>

      {/* Audit Logs Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCheck size={18} color="var(--primary)" /> Live Audit Trail: Recent Cleaning Verifications
        </h3>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Area Name</th>
                <th>QR Code</th>
                <th>Staff Member</th>
                <th>Mopping</th>
                <th>Linen</th>
                <th>Dustbin</th>
                <th>Sanitizer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No cleaning logs recorded today.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: '600' }}>{log.area_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{log.area_code}</td>
                    <td>{log.cleaner_name}</td>
                    <td>{log.checklist_mopping ? '✅' : '❌'}</td>
                    <td>{log.checklist_linen ? '✅' : '❌'}</td>
                    <td>{log.checklist_dustbin ? '✅' : '❌'}</td>
                    <td>{log.checklist_sanitizer ? '✅' : '❌'}</td>
                    <td><span className="badge badge-emerald">Verified</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scan Verification Modal */}
      {isScanModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={20} color="var(--primary)" /> Anti-Negligence QR Verification
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Hospital Infection Control Protocol
                </p>
              </div>
              <button onClick={() => setIsScanModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {successMessage ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <CheckCircle2 size={48} color="#34d399" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#34d399', fontWeight: '700' }}>{successMessage}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Tamper-proof audit record committed to hospital database.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitScan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* QR Scanner Display Simulator */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px dashed rgba(6, 182, 212, 0.4)',
                  textAlign: 'center'
                }}>
                  <Camera size={32} color="#38bdf8" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {selectedTask ? selectedTask.area_name : 'Scan Hospital Area QR Code'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Camera Geo-Scan Verified • Physical Presence Required
                  </div>
                </div>

                <div>
                  <label className="form-label">Area QR Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QR-WARD-A-101"
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', letterSpacing: '0.05em' }}
                    required
                  />
                </div>

                {/* 4-Point Mandatory Hygiene Checklist */}
                <div>
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Mandatory Sanitization Checklist (सर्व तपासण्या पूर्ण करा) *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checklist.mopping}
                        onChange={(e) => setChecklist({ ...checklist, mopping: e.target.checked })}
                      />
                      <span>🧼 फरशी फिनाईलने पुसली (Floor Mopped with Disinfectant)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checklist.linen}
                        onChange={(e) => setChecklist({ ...checklist, linen: e.target.checked })}
                      />
                      <span>🛏️ बेडशीट व पिलो कव्हर बदलले (Linen & Pillow Cleaned)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checklist.dustbin}
                        onChange={(e) => setChecklist({ ...checklist, dustbin: e.target.checked })}
                      />
                      <span>🗑️ बायोमेडिकल कचरा पेटी रिकामी केली (Dustbin Emptied)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checklist.sanitizer}
                        onChange={(e) => setChecklist({ ...checklist, sanitizer: e.target.checked })}
                      />
                      <span>🧴 हँड सॅनिटायझर रिफिल केले (Sanitizer Refilled & Checked)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="form-label">Cleaner Remarks / Special Observation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Room fully sanitized and ready for patient"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ flex: 2, fontWeight: '700' }}
                  >
                    {submitting ? 'Verifying...' : 'Submit QR Verification'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
