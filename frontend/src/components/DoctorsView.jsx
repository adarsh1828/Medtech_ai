import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Building2, 
  DollarSign, 
  Award, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  CheckCircle2, 
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Mail,
  Phone,
  AlertCircle,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency } from '../utils/currency';
import { useLanguage } from '../context/LanguageContext';

export default function DoctorsView({ user, onBookWithDoctor, onOpenOnboardDoctor, hospitalInfo }) {
  const { t } = useLanguage();
  const currencySymbol = hospitalInfo?.currency_symbol || '₹';
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [pendingNurses, setPendingNurses] = useState([]);
  const [pendingCleaners, setPendingCleaners] = useState([]);
  const [approvalCategory, setApprovalCategory] = useState('doctors'); // 'doctors' | 'nurses' | 'cleaners'
  const [viewTab, setViewTab] = useState('approved'); // 'approved' | 'pending'
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        api.getDoctors(),
        api.getDepartments()
      ];
      if (isAdmin) {
        promises.push(api.getPendingStaff().catch(() => ({ pendingDoctors: [], pendingNurses: [], pendingCleaners: [] })));
      }
      const [docsRes, deptRes, pendingRes] = await Promise.all(promises);
      setDoctors(docsRes.doctors || []);
      setDepartments(deptRes.departments || []);
      if (pendingRes) {
        setPendingDoctors(pendingRes.pendingDoctors || []);
        setPendingNurses(pendingRes.pendingNurses || []);
        setPendingCleaners(pendingRes.pendingCleaners || []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStaff = async (staffType, id) => {
    setApprovingId(`${staffType}-${id}`);
    try {
      const res = await api.approveStaff(staffType, id, 'approve');
      setFeedback({ type: 'success', message: res.message || 'Staff application approved successfully!' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve staff' });
    } finally {
      setApprovingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleRejectStaff = async (staffType, id) => {
    if (!window.confirm('Are you sure you want to decline this application?')) return;
    setRejectingId(`${staffType}-${id}`);
    try {
      const res = await api.approveStaff(staffType, id, 'reject');
      setFeedback({ type: 'info', message: res.message || 'Application declined.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to decline application' });
    } finally {
      setRejectingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleApproveDoctor = (docId) => handleApproveStaff('doctor', docId);
  const handleRejectDoctor = (docId) => handleRejectStaff('doctor', docId);

  const handleToggleDuty = async (docId, currentDuty) => {
    setTogglingId(docId);
    try {
      await api.updateDoctorDuty(docId, !currentDuty);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update duty status');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'All' || doc.department_name === selectedDept;
    const matchesSearch = 
      doc.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.qualification?.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : feedback.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? '#10b981' : feedback.type === 'error' ? '#f43f5e' : '#3b82f6'}`,
          color: feedback.type === 'success' ? '#34d399' : feedback.type === 'error' ? '#fb7185' : '#60a5fa',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            {t('doctors.title', 'Medical Staff & Specialist Directory')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('doctors.subtitle', 'Qualified physicians, consultants, department heads, and OPD shift timings.')}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenOnboardDoctor}
            className="btn btn-primary"
          >
            <UserPlus size={16} /> Onboard New Doctor
          </button>
        )}
      </div>

      {/* Admin View Switcher: Active Staff vs Pending Approvals */}
      {isAdmin && (
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px'
        }}>
          <button
            onClick={() => setViewTab('approved')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: viewTab === 'approved' ? 'var(--primary)' : 'var(--border-subtle)',
              background: viewTab === 'approved' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)',
              color: viewTab === 'approved' ? '#38bdf8' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Stethoscope size={16} />
            <span>Active Physicians ({doctors.length})</span>
          </button>

          <button
            onClick={() => setViewTab('pending')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: viewTab === 'pending' ? '#f59e0b' : 'var(--border-subtle)',
              background: viewTab === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
              color: viewTab === 'pending' ? '#fbbf24' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldAlert size={16} color={(pendingDoctors.length + pendingNurses.length + pendingCleaners.length) > 0 ? '#fbbf24' : 'currentColor'} />
            <span>Staff Approvals</span>
            {(pendingDoctors.length + pendingNurses.length + pendingCleaners.length) > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#000',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}>
                {pendingDoctors.length + pendingNurses.length + pendingCleaners.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* PENDING STAFF SECTION (DOCTORS, NURSES, SANITATION) */}
      {isAdmin && viewTab === 'pending' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ShieldAlert size={20} color="#fbbf24" />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>सुरक्षा पडताळणी (Security Verification):</strong> डॉक्टर, परिचारिका (Nurse), किंवा स्वच्छता कर्मचाऱ्याने ऑनलाइन अर्ज केल्यावर तुम्ही "Approve" करेपर्यंत ते हॉस्पिटलच्या ॲपमध्ये लॉगिन करू शकत नाहीत.
            </div>
          </div>

          {/* Sub-Tabs: Doctors vs Nurses vs Cleaners */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setApprovalCategory('doctors')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: approvalCategory === 'doctors' ? '#38bdf8' : 'var(--border-subtle)',
                background: approvalCategory === 'doctors' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                color: approvalCategory === 'doctors' ? '#38bdf8' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Stethoscope size={15} />
              <span>🩺 Doctors ({pendingDoctors.length})</span>
            </button>

            <button
              onClick={() => setApprovalCategory('nurses')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: approvalCategory === 'nurses' ? '#818cf8' : 'var(--border-subtle)',
                background: approvalCategory === 'nurses' ? 'rgba(129, 140, 248, 0.15)' : 'var(--bg-card)',
                color: approvalCategory === 'nurses' ? '#818cf8' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <HeartPulse size={15} />
              <span>👩‍⚕️ Nurses ({pendingNurses.length})</span>
            </button>

            <button
              onClick={() => setApprovalCategory('cleaners')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: approvalCategory === 'cleaners' ? '#fbbf24' : 'var(--border-subtle)',
                background: approvalCategory === 'cleaners' ? 'rgba(251, 191, 36, 0.15)' : 'var(--bg-card)',
                color: approvalCategory === 'cleaners' ? '#fbbf24' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={15} />
              <span>🧹 Sanitation Staff ({pendingCleaners.length})</span>
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              Loading pending staff applications...
            </div>
          ) : (
            <>
              {/* DOCTORS TAB */}
              {approvalCategory === 'doctors' && (
                pendingDoctors.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '56px 20px' }}>
                    <ShieldCheck size={44} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '6px' }}>
                      सर्व डॉक्टर खाती पडताळलेली आहेत!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      There are currently no doctor registration applications awaiting approval.
                    </p>
                  </div>
                ) : (
                  <div className="doctors-grid">
                    {pendingDoctors.map((pDoc) => (
                      <div
                        key={pDoc.id}
                        className="glass-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '1.18rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                              {pDoc.full_name}
                            </h3>
                            <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: '600', marginTop: '2px' }}>
                              {pDoc.specialization}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {pDoc.qualification}
                            </div>
                          </div>

                          <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> PENDING
                          </span>
                        </div>

                        <div style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          fontSize: '0.8rem'
                        }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DEPARTMENT</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pDoc.department_name}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>OPD ROOM</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pDoc.room_number || 'Room 101'}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>EXPERIENCE</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pDoc.experience_years} Years</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CONSULTATION FEE</div>
                            <div style={{ fontWeight: '600', color: '#34d399' }}>{formatCurrency(pDoc.consultation_fee || 500, currencySymbol)}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={13} color="var(--primary)" />
                            <span>{pDoc.email}</span>
                          </div>
                          {pDoc.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="var(--primary)" />
                              <span>{pDoc.phone}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                          <button
                            onClick={() => handleApproveStaff('doctor', pDoc.id)}
                            disabled={approvingId === `doctor-${pDoc.id}` || rejectingId === `doctor-${pDoc.id}`}
                            className="btn btn-emerald btn-sm"
                            style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                          >
                            {approvingId === `doctor-${pDoc.id}` ? 'Approving...' : (
                              <>
                                <Check size={16} /> Approve & Grant Access
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleRejectStaff('doctor', pDoc.id)}
                            disabled={approvingId === `doctor-${pDoc.id}` || rejectingId === `doctor-${pDoc.id}`}
                            className="btn btn-rose btn-sm"
                            style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            {rejectingId === `doctor-${pDoc.id}` ? 'Declining...' : (
                              <>
                                <X size={16} /> Decline
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* NURSES TAB */}
              {approvalCategory === 'nurses' && (
                pendingNurses.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '56px 20px' }}>
                    <ShieldCheck size={44} color="#818cf8" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '6px' }}>
                      सर्व परिचारिका (Nurse) खाती पडताळलेली आहेत!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      There are currently no nurse registration applications awaiting approval.
                    </p>
                  </div>
                ) : (
                  <div className="doctors-grid">
                    {pendingNurses.map((pNurse) => (
                      <div
                        key={pNurse.id}
                        className="glass-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          border: '1px solid rgba(129, 140, 248, 0.3)',
                          background: 'linear-gradient(180deg, rgba(129, 140, 248, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '1.18rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                              {pNurse.full_name}
                            </h3>
                            <div style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: '600', marginTop: '2px' }}>
                              👩‍⚕️ Staff Nurse
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {pNurse.qualification || 'B.Sc Nursing / GNM'}
                            </div>
                          </div>

                          <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> PENDING
                          </span>
                        </div>

                        <div style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          fontSize: '0.8rem'
                        }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ASSIGNED WARD</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pNurse.assigned_ward || 'General Ward & ICU'}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SHIFT TIMINGS</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pNurse.shift_timings || '08:00 AM - 04:00 PM'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={13} color="var(--primary)" />
                            <span>{pNurse.email}</span>
                          </div>
                          {pNurse.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="var(--primary)" />
                              <span>{pNurse.phone}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                          <button
                            onClick={() => handleApproveStaff('nurse', pNurse.id)}
                            disabled={approvingId === `nurse-${pNurse.id}` || rejectingId === `nurse-${pNurse.id}`}
                            className="btn btn-emerald btn-sm"
                            style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                          >
                            {approvingId === `nurse-${pNurse.id}` ? 'Approving...' : (
                              <>
                                <Check size={16} /> Approve Nurse
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleRejectStaff('nurse', pNurse.id)}
                            disabled={approvingId === `nurse-${pNurse.id}` || rejectingId === `nurse-${pNurse.id}`}
                            className="btn btn-rose btn-sm"
                            style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            {rejectingId === `nurse-${pNurse.id}` ? 'Declining...' : (
                              <>
                                <X size={16} /> Decline
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* CLEANERS TAB */}
              {approvalCategory === 'cleaners' && (
                pendingCleaners.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '56px 20px' }}>
                    <ShieldCheck size={44} color="#fbbf24" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '6px' }}>
                      सर्व स्वच्छता कर्मचारी खाती पडताळलेली आहेत!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      There are currently no sanitation staff registration applications awaiting approval.
                    </p>
                  </div>
                ) : (
                  <div className="doctors-grid">
                    {pendingCleaners.map((pCleaner) => (
                      <div
                        key={pCleaner.id}
                        className="glass-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '1.18rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                              {pCleaner.full_name}
                            </h3>
                            <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: '600', marginTop: '2px' }}>
                              🧹 Housekeeping & Hygiene
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              Hospital Sanitation Staff
                            </div>
                          </div>

                          <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> PENDING
                          </span>
                        </div>

                        <div style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          fontSize: '0.8rem'
                        }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ASSIGNED AREA</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pCleaner.assigned_area || 'General Ward & Restrooms'}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SHIFT TIMINGS</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pCleaner.shift_timings || '07:00 AM - 03:00 PM'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={13} color="var(--primary)" />
                            <span>{pCleaner.email}</span>
                          </div>
                          {pCleaner.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="var(--primary)" />
                              <span>{pCleaner.phone}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                          <button
                            onClick={() => handleApproveStaff('cleaning', pCleaner.id)}
                            disabled={approvingId === `cleaning-${pCleaner.id}` || rejectingId === `cleaning-${pCleaner.id}`}
                            className="btn btn-emerald btn-sm"
                            style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                          >
                            {approvingId === `cleaning-${pCleaner.id}` ? 'Approving...' : (
                              <>
                                <Check size={16} /> Approve Staff
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleRejectStaff('cleaning', pCleaner.id)}
                            disabled={approvingId === `cleaning-${pCleaner.id}` || rejectingId === `cleaning-${pCleaner.id}`}
                            className="btn btn-rose btn-sm"
                            style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            {rejectingId === `cleaning-${pCleaner.id}` ? 'Declining...' : (
                              <>
                                <X size={16} /> Decline
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      ) : (
        /* ACTIVE DOCTORS SECTION */
        <>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px'
          }}>
            {/* Department Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              {['All', ...departments.map(d => d.name)].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedDept === dept ? 'var(--primary)' : 'var(--border-subtle)',
                    background: selectedDept === dept ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    color: selectedDept === dept ? '#38bdf8' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search physician or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.85rem', height: '38px' }}
              />
            </div>
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              Loading medical staff directory...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
              <Stethoscope size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h3>No Physicians Found</h3>
            </div>
          ) : (
            <div className="doctors-grid">
              {filteredDoctors.map((doc) => {
                const isOnDuty = !!doc.is_on_duty;
                const canToggleDuty = user?.role === 'admin' || (user?.role === 'doctor' && user.doctorId === doc.id);

                return (
                  <div
                    key={doc.id}
                    className="glass-card glass-card-interactive"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      position: 'relative'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                          {doc.full_name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
                          {doc.specialization}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {doc.qualification}
                        </div>
                      </div>

                      {/* Duty status badge */}
                      <span className={`badge ${isOnDuty ? 'badge-emerald' : 'badge-rose'}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                        {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                      </span>
                    </div>

                    {/* Details Box */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      fontSize: '0.8rem'
                    }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DEPARTMENT</div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{doc.department_name}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ROOM NUMBER</div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Room {doc.room_number || '101'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>EXPERIENCE</div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{doc.experience_years} Years</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CONSULTATION FEE</div>
                        <div style={{ fontWeight: '600', color: '#34d399' }}>{formatCurrency(doc.consultation_fee || 500, currencySymbol)}</div>
                      </div>
                    </div>

                    {/* Shift timings */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <Clock size={14} color="var(--primary)" />
                      <span>Shift: {doc.shift_timings}</span>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => onBookWithDoctor(doc)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Calendar size={14} /> Book Consultation
                      </button>

                      {canToggleDuty && (
                        <button
                          onClick={() => handleToggleDuty(doc.id, isOnDuty)}
                          disabled={togglingId === doc.id}
                          className="btn btn-outline btn-sm"
                          title="Toggle Duty Status"
                        >
                          {isOnDuty ? 'Set Off-Duty' : 'Set On-Duty'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
