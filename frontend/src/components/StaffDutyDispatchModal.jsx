import React, { useState, useEffect } from 'react';
import { 
  X, 
  HeartPulse, 
  Sparkles, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Send, 
  ShieldCheck, 
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

const WARDS = ['ICU Ward', 'Emergency / Trauma Ward', 'General Ward', 'Semi-Private Ward', 'Pediatric Ward', 'Operation Theater (OT)'];
const SHIFTS = [
  'Day Shift (08:00 AM - 04:00 PM)',
  'Evening Shift (04:00 PM - 12:00 AM)',
  'Night Shift (12:00 AM - 08:00 AM)',
  '24x7 Emergency On-Call'
];

const CLEANING_AREAS = [
  'ICU Ward & Isolation Rooms',
  'Emergency & Trauma Ward',
  'General Ward Beds & Washrooms',
  'OPD Waiting Hall & Reception',
  'Operation Theater (OT) Sterilization',
  'Pathology Lab & Blood Collection Area',
  'Hospital Corridors & Elevators'
];

export default function StaffDutyDispatchModal({ isOpen, onClose, initialTab = 'nurse', onUpdateSuccess }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab); // 'nurse' | 'housekeeping'
  
  // Nurse state
  const [nurses, setNurses] = useState([]);
  const [selectedNurseId, setSelectedNurseId] = useState('');
  const [nurseForm, setNurseForm] = useState({
    assigned_ward: 'ICU Ward',
    shift_timings: 'Day Shift (08:00 AM - 04:00 PM)',
    is_on_duty: true
  });

  // Housekeeping state
  const [cleaners, setCleaners] = useState([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState('');
  const [cleanerForm, setCleanerForm] = useState({
    assigned_area: 'ICU Ward & Isolation Rooms',
    shift_timings: 'Day Shift (08:00 AM - 04:00 PM)',
    is_on_duty: true
  });

  // Task dispatch state
  const [taskForm, setTaskForm] = useState({
    area_name: 'ICU Ward Bed 102 Sterilization',
    area_code: 'ICU-B102',
    area_type: 'ICU Bed',
    cleaner_id: '',
    cleaner_name: '',
    priority: 'urgent',
    notes: 'Urgent deep chemical sterilization and clean bed linen replacement.'
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setMessage({ type: '', text: '' });
      loadStaffData();
    }
  }, [isOpen, initialTab]);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [nursesRes, cleanersRes] = await Promise.all([
        api.getAdminNurses().catch(() => ({ nurses: [] })),
        api.getAdminCleaners().catch(() => ({ cleaners: [] }))
      ]);

      const nList = nursesRes.nurses || [];
      const cList = cleanersRes.cleaners || [];

      setNurses(nList);
      setCleaners(cList);

      if (nList.length > 0 && !selectedNurseId) {
        setSelectedNurseId(nList[0].id);
        setNurseForm({
          assigned_ward: nList[0].assigned_ward || 'ICU Ward',
          shift_timings: nList[0].shift_timings || 'Day Shift (08:00 AM - 04:00 PM)',
          is_on_duty: nList[0].is_on_duty === 1
        });
      }

      if (cList.length > 0 && !selectedCleanerId) {
        setSelectedCleanerId(cList[0].id);
        setCleanerForm({
          assigned_area: cList[0].assigned_area || 'ICU Ward & Isolation Rooms',
          shift_timings: cList[0].shift_timings || 'Day Shift (08:00 AM - 04:00 PM)',
          is_on_duty: cList[0].is_on_duty === 1
        });
        setTaskForm(prev => ({
          ...prev,
          cleaner_id: cList[0].id,
          cleaner_name: cList[0].full_name
        }));
      }
    } catch (err) {
      console.error('Failed to load staff dispatch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNurse = (n) => {
    setSelectedNurseId(n.id);
    setNurseForm({
      assigned_ward: n.assigned_ward || 'ICU Ward',
      shift_timings: n.shift_timings || 'Day Shift (08:00 AM - 04:00 PM)',
      is_on_duty: n.is_on_duty === 1
    });
  };

  const handleSelectCleaner = (c) => {
    setSelectedCleanerId(c.id);
    setCleanerForm({
      assigned_area: c.assigned_area || 'ICU Ward & Isolation Rooms',
      shift_timings: c.shift_timings || 'Day Shift (08:00 AM - 04:00 PM)',
      is_on_duty: c.is_on_duty === 1
    });
    setTaskForm(prev => ({
      ...prev,
      cleaner_id: c.id,
      cleaner_name: c.full_name
    }));
  };

  const handleSaveNurseDuty = async (e) => {
    e.preventDefault();
    if (!selectedNurseId) return;
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.assignNurseDuty(selectedNurseId, nurseForm);
      setMessage({ type: 'success', text: res.message || 'Nurse duty updated successfully!' });
      await loadStaffData();
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update nurse assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCleanerDuty = async (e) => {
    e.preventDefault();
    if (!selectedCleanerId) return;
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.assignCleanerDuty(selectedCleanerId, cleanerForm);
      setMessage({ type: 'success', text: res.message || 'Cleaning staff duty updated successfully!' });
      await loadStaffData();
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update cleaning assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatchCleaningTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.dispatchCleaningTask(taskForm);
      setMessage({ type: 'success', text: res.message || 'Cleaning task dispatched to staff successfully!' });
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to dispatch task.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredNurses = nurses.filter(n => 
    n.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.assigned_ward?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCleaners = cleaners.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assigned_area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(99, 102, 241, 0.15) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-display)', margin: 0 }}>
                {t('staff.dispatchTitle', 'Hospital Staff Duty & Task Dispatcher')}
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t('staff.dispatchSubtitle', 'Assign nursing personnel to ICU/Wards, allocate sanitation duties, and dispatch urgent tasks.')}
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

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          padding: '8px 24px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '12px'
        }}>
          <button
            onClick={() => { setActiveTab('nurse'); setMessage({ type: '', text: '' }); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'nurse' ? '1px solid var(--primary)' : '1px solid transparent',
              background: activeTab === 'nurse' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'nurse' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <HeartPulse size={16} /> नर्स वॉर्ड/ICU वाटप ({nurses.length} Nurses)
          </button>

          <button
            onClick={() => { setActiveTab('housekeeping'); setMessage({ type: '', text: '' }); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'housekeeping' ? '1px solid #34d399' : '1px solid transparent',
              background: activeTab === 'housekeeping' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              color: activeTab === 'housekeeping' ? '#34d399' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} /> सफाई काम वाटप व टास्क ({cleaners.length} Staff)
          </button>
        </div>

        {/* Notification Banner */}
        {message.text && (
          <div style={{
            margin: '12px 24px 0 24px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: message.type === 'success' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: message.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 10px' }} />
              Loading staff roster...
            </div>
          ) : activeTab === 'nurse' ? (
            /* Nurse Tab Layout */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Column: Nurse Roster List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Select Staff Nurse
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                    {nurses.filter(n => n.is_on_duty === 1).length} currently on duty
                  </span>
                </div>

                <div style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.15)'
                }}>
                  {filteredNurses.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No registered nurses found.
                    </div>
                  ) : (
                    filteredNurses.map((n) => {
                      const isSelected = selectedNurseId === n.id;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleSelectNurse(n)}
                          style={{
                            padding: '12px 14px',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                            borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                              {n.full_name}
                            </div>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: n.is_on_duty === 1 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: n.is_on_duty === 1 ? '#34d399' : 'var(--text-muted)'
                            }}>
                              {n.is_on_duty === 1 ? 'On Duty' : 'Off Duty'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <Building2 size={12} /> {n.assigned_ward || 'General Ward'}
                            <span>•</span>
                            <Clock size={12} /> {n.shift_timings || 'Day Shift'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Assignment Form */}
              <form onSubmit={handleSaveNurseDuty} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={16} /> Assign Ward & Shift Timings
                </h4>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '6px' }}>
                    Assigned Ward / ICU Station *
                  </label>
                  <select
                    className="form-control"
                    value={nurseForm.assigned_ward}
                    onChange={(e) => setNurseForm({ ...nurseForm, assigned_ward: e.target.value })}
                    required
                  >
                    {WARDS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '6px' }}>
                    Shift Timings *
                  </label>
                  <select
                    className="form-control"
                    value={nurseForm.shift_timings}
                    onChange={(e) => setNurseForm({ ...nurseForm, shift_timings: e.target.value })}
                    required
                  >
                    {SHIFTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Active Duty Status</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nurse is currently on active clinical rotation</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={nurseForm.is_on_duty}
                    onChange={(e) => setNurseForm({ ...nurseForm, is_on_duty: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedNurseId}
                  className="btn btn-primary"
                  style={{ marginTop: 'auto', gap: '8px' }}
                >
                  <CheckCircle2 size={16} /> {submitting ? 'Saving...' : 'Confirm Ward & Shift Assignment'}
                </button>
              </form>
            </div>
          ) : (
            /* Housekeeping Tab Layout */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Column: Housekeeping Staff & Shift Assignment */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Sanitation Staff Allocation
                </h4>

                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.15)',
                  marginBottom: '14px'
                }}>
                  {filteredCleaners.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No housekeeping personnel registered.
                    </div>
                  ) : (
                    filteredCleaners.map((c) => {
                      const isSelected = selectedCleanerId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCleaner(c)}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                            borderLeft: isSelected ? '3px solid #34d399' : '3px solid transparent'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: isSelected ? '#34d399' : 'var(--text-primary)' }}>
                              {c.full_name}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: c.is_on_duty === 1 ? '#34d399' : 'var(--text-muted)' }}>
                              {c.is_on_duty === 1 ? '🟢 On Duty' : '⚪ Off Duty'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {c.assigned_area || 'General Ward'} • {c.shift_timings || 'Day Shift'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSaveCleanerDuty} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                      Assigned Cleaning Area
                    </label>
                    <select
                      className="form-control"
                      value={cleanerForm.assigned_area}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, assigned_area: e.target.value })}
                      required
                    >
                      {CLEANING_AREAS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                      Shift Timings
                    </label>
                    <select
                      className="form-control"
                      value={cleanerForm.shift_timings}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, shift_timings: e.target.value })}
                      required
                    >
                      {SHIFTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedCleanerId}
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: '#34d399', color: '#34d399' }}
                  >
                    Update Staff Shift
                  </button>
                </form>
              </div>

              {/* Right Column: Dispatch Specific Cleaning Task */}
              <form onSubmit={handleDispatchCleaningTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={16} /> तातडीने टास्क पाठवा (Dispatch Cleaning Task)
                </h4>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    Target Area & Room/Bed Code *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={taskForm.area_name}
                    onChange={(e) => setTaskForm({ ...taskForm, area_name: e.target.value })}
                    placeholder="e.g. ICU Bed 102 Disinfection"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                      QR / Area Code *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={taskForm.area_code}
                      onChange={(e) => setTaskForm({ ...taskForm, area_code: e.target.value })}
                      placeholder="e.g. ICU-B102"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                      Urgency Level
                    </label>
                    <select
                      className="form-control"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="urgent">🚨 Urgent / Emergency</option>
                      <option value="high">⚠️ High Priority</option>
                      <option value="routine">Routine Cleaning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                    Clinical Sanitation Instructions
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                    placeholder="Provide disinfection instructions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-emerald"
                  style={{ marginTop: 'auto', gap: '8px' }}
                >
                  <Send size={15} /> {submitting ? 'Dispatching...' : 'Dispatch Cleaning Task'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
