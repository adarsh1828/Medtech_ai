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
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency } from '../utils/currency';

export default function DoctorsView({ user, onBookWithDoctor, onOpenOnboardDoctor, hospitalInfo }) {
  const currencySymbol = hospitalInfo?.currency_symbol || '₹';
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
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
        promises.push(api.getPendingDoctors().catch(() => ({ pendingDoctors: [] })));
      }
      const [docsRes, deptRes, pendingRes] = await Promise.all(promises);
      setDoctors(docsRes.doctors || []);
      setDepartments(deptRes.departments || []);
      if (pendingRes) {
        setPendingDoctors(pendingRes.pendingDoctors || []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (docId) => {
    setApprovingId(docId);
    try {
      const res = await api.approveDoctor(docId);
      setFeedback({ type: 'success', message: res.message || 'Doctor application approved successfully!' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to approve doctor' });
    } finally {
      setApprovingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleRejectDoctor = async (docId) => {
    if (!window.confirm('Are you sure you want to decline this doctor application?')) return;
    setRejectingId(docId);
    try {
      const res = await api.rejectDoctor(docId);
      setFeedback({ type: 'info', message: res.message || 'Doctor application rejected.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reject doctor' });
    } finally {
      setRejectingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

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
            Attending Physicians & Specialists
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Board-certified clinicians, credential verification, shift schedules, and department allocations
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
            <ShieldAlert size={16} color={pendingDoctors.length > 0 ? '#fbbf24' : 'currentColor'} />
            <span>Pending Approvals</span>
            {pendingDoctors.length > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#000',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}>
                {pendingDoctors.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* PENDING DOCTORS SECTION */}
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
              <strong style={{ color: 'var(--text-primary)' }}>सुरक्षा पडताळणी (Security Verification):</strong> हे डॉक्टर्स ऑनलाइन नोंदणी केलेले आहेत. तुम्ही "Approve" करेपर्यंत ते हॉस्पिटलच्या ॲपमध्ये लॉगिन करू शकत नाहीत आणि रुग्णांच्या डेटाचा ॲक्सेस मिळवू शकत नाहीत.
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              Loading pending doctor applications...
            </div>
          ) : pendingDoctors.length === 0 ? (
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
                  {/* Header */}
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
                      <Clock size={12} /> PENDING REVIEW
                    </span>
                  </div>

                  {/* Credentials / Details */}
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

                  {/* Contact Info */}
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

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => handleApproveDoctor(pDoc.id)}
                      disabled={approvingId === pDoc.id || rejectingId === pDoc.id}
                      className="btn btn-emerald btn-sm"
                      style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                    >
                      {approvingId === pDoc.id ? 'Approving...' : (
                        <>
                          <Check size={16} /> Approve & Grant Access
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleRejectDoctor(pDoc.id)}
                      disabled={approvingId === pDoc.id || rejectingId === pDoc.id}
                      className="btn btn-rose btn-sm"
                      style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      {rejectingId === pDoc.id ? 'Declining...' : (
                        <>
                          <X size={16} /> Decline
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
