import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Sparkles, 
  HeartPulse, 
  ShieldCheck, 
  Clock, 
  Building2, 
  BedDouble, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

const WARDS = [
  'ICU',
  'Emergency',
  'General Ward',
  'Semi-Private',
  'Pediatric Ward',
  'Operation Theatre (OT)',
  'Cardiac Care Unit (CCU)',
  'Maternity & NICU'
];

const SHIFTS = [
  '08:00 AM - 04:00 PM (Morning)',
  '04:00 PM - 12:00 AM (Evening)',
  '12:00 AM - 08:00 AM (Night)'
];

export default function StaffDutyDispatchModal({ isOpen, onClose, initialTab = 'nurse', onUpdateSuccess }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab); // 'nurse' | 'housekeeping'
  
  // Nurse state
  const [nurses, setNurses] = useState([]);
  const [nurseLoading, setNurseLoading] = useState(false);
  const [editingNurse, setEditingNurse] = useState(null);
  const [nurseForm, setNurseForm] = useState({
    assigned_ward: 'ICU',
    shift_timings: '08:00 AM - 04:00 PM (Morning)',
    is_on_duty: true
  });
  const [savingNurse, setSavingNurse] = useState(false);

  // Housekeeping state
  const [cleaners, setCleaners] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    area_name: 'ICU Isolation Cabin 1',
    area_code: 'QR-ICU-01',
    cleaner_id: '',
    cleaner_name: '',
    priority: 'urgent',
    notes: 'Post-discharge terminal sterilization required before admission.'
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setNurseLoading(true);
    setDispatchLoading(true);
    try {
      const [nurseRes, cleanerRes, tasksRes] = await Promise.all([
        api.getAdminNurses().catch(() => ({ nurses: [] })),
        api.getAdminCleaners().catch(() => ({ cleaners: [] })),
        api.getAdminCleaningTasks().catch(() => ({ tasks: [] }))
      ]);

      const nList = nurseRes.nurses || [];
      const cList = cleanerRes.cleaners || [];
      setNurses(nList);
      setCleaners(cList);
      setTasks(tasksRes.tasks || []);

      if (cList.length > 0 && !taskForm.cleaner_id) {
        setTaskForm(prev => ({
          ...prev,
          cleaner_id: cList[0].id,
          cleaner_name: cList[0].full_name
        }));
      }
    } catch (err) {
      console.error('Error loading duty data:', err);
    } finally {
      setNurseLoading(false);
      setDispatchLoading(false);
    }
  };

  const handleEditNurse = (nurse) => {
    setEditingNurse(nurse);
    setNurseForm({
      assigned_ward: nurse.assigned_ward || 'ICU',
      shift_timings: nurse.shift_timings || '08:00 AM - 04:00 PM (Morning)',
      is_on_duty: nurse.is_on_duty === 1
    });
  };

  const handleSaveNurseDuty = async (e) => {
    e.preventDefault();
    if (!editingNurse) return;

    setSavingNurse(true);
    try {
      await api.assignNurseDuty(editingNurse.id, nurseForm);
      setMessage(`Sister ${editingNurse.full_name} assigned to ${nurseForm.assigned_ward} successfully!`);
      setTimeout(() => setMessage(''), 4000);
      setEditingNurse(null);
      await loadAllData();
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      alert(err.message || 'Failed to update nurse duty assignment.');
    } finally {
      setSavingNurse(false);
    }
  };

  const handleDispatchTask = async (e) => {
    e.preventDefault();
    if (!taskForm.area_name || !taskForm.cleaner_id) {
      alert('Please select both an area and a sanitation staff member.');
      return;
    }

    setSavingTask(true);
    try {
      await api.dispatchCleaningTask(taskForm);
      setMessage(`Cleaning task dispatched to ${taskForm.cleaner_name} successfully!`);
      setTimeout(() => setMessage(''), 4000);
      setTaskForm(prev => ({
        ...prev,
        notes: ''
      }));
      await loadAllData();
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      alert(err.message || 'Failed to dispatch cleaning task.');
    } finally {
      setSavingTask(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        background: 'var(--bg-elevated, #111827)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                padding: '6px',
                borderRadius: '8px',
                display: 'inline-flex'
              }}>
                <ShieldCheck size={20} />
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                हॉस्पिटल ड्युटी वाटप केंद्र (Hospital Staff Duty & Task Dispatcher)
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              नर्स वॉर्ड/ICU अ‍ॅलोकेशन आणि सफाई कामगारांना कामाचे वाटप (Admin Operations Control)
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Notification Banner */}
        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '10px 24px',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} /> {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'rgba(0, 0, 0, 0.2)',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('nurse')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'nurse' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'nurse' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <HeartPulse size={16} /> 1. नर्स वॉर्ड/ICU वाटप (Nurse Duty Roster)
            <span style={{
              background: 'rgba(6, 182, 212, 0.2)',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {nurses.filter(n => n.is_on_duty === 1).length} On Duty
            </span>
          </button>

          <button
            onClick={() => setActiveTab('housekeeping')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'housekeeping' ? '2px solid #34d399' : '2px solid transparent',
              color: activeTab === 'housekeeping' ? '#34d399' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} /> 2. सफाई काम वाटप (Housekeeping Dispatch)
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {cleaners.filter(c => c.is_on_duty === 1).length} Active Staff
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: NURSE WARD / ICU ALLOCATION */}
          {activeTab === 'nurse' && (
            <div>
              {/* Quick Summary Pill Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: '700', textTransform: 'uppercase' }}>
                    🚨 ICU Wards
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f87171', marginTop: '2px' }}>
                    {nurses.filter(n => n.assigned_ward?.includes('ICU') && n.is_on_duty === 1).length} Nurses On Duty
                  </div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: '700', textTransform: 'uppercase' }}>
                    ⚡ Emergency Trauma
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fbbf24', marginTop: '2px' }}>
                    {nurses.filter(n => n.assigned_ward?.includes('Emergency') && n.is_on_duty === 1).length} Nurses On Duty
                  </div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>
                    🏥 General & Pediatric Wards
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>
                    {nurses.filter(n => (n.assigned_ward?.includes('General') || n.assigned_ward?.includes('Pediatric')) && n.is_on_duty === 1).length} Nurses On Duty
                  </div>
                </div>
              </div>

              {/* Editing Form when a nurse is selected */}
              {editingNurse && (
                <form onSubmit={handleSaveNurseDuty} style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '12px',
                  padding: '18px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={18} /> ड्युटी बदला: {editingNurse.full_name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingNurse(null)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      Cancel
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        नियुक्त वॉर्ड / ICU (Assign Ward):
                      </label>
                      <select
                        value={nurseForm.assigned_ward}
                        onChange={(e) => setNurseForm({ ...nurseForm, assigned_ward: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          color: '#fff',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.88rem'
                        }}
                      >
                        {WARDS.map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        शिफ्ट वेळ (Shift Timing):
                      </label>
                      <select
                        value={nurseForm.shift_timings}
                        onChange={(e) => setNurseForm({ ...nurseForm, shift_timings: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          color: '#fff',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.88rem'
                        }}
                      >
                        {SHIFTS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        ड्युटी स्टेटस (On Duty):
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', height: '42px' }}>
                        <button
                          type="button"
                          onClick={() => setNurseForm({ ...nurseForm, is_on_duty: true })}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: nurseForm.is_on_duty ? '#10b981' : 'var(--border-subtle)',
                            background: nurseForm.is_on_duty ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            color: nurseForm.is_on_duty ? '#34d399' : 'var(--text-muted)',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          🟢 On Duty
                        </button>
                        <button
                          type="button"
                          onClick={() => setNurseForm({ ...nurseForm, is_on_duty: false })}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: !nurseForm.is_on_duty ? '#f43f5e' : 'var(--border-subtle)',
                            background: !nurseForm.is_on_duty ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                            color: !nurseForm.is_on_duty ? '#fb7185' : 'var(--text-muted)',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          ⚪ Off Duty
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <button
                      type="submit"
                      disabled={savingNurse}
                      className="btn btn-primary"
                      style={{ fontSize: '0.88rem', padding: '10px 20px', gap: '8px' }}
                    >
                      <CheckCircle2 size={16} /> {savingNurse ? 'Saving...' : 'ड्युटी अपडेट करा (Save Assignment)'}
                    </button>
                  </div>
                </form>
              )}

              {/* Nurses Table */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 2fr 1fr 1fr',
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}>
                  <div>Nurse Details</div>
                  <div>Assigned Ward / ICU</div>
                  <div>Shift Timings</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Action</div>
                </div>

                {nurseLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw className="spin" size={24} style={{ margin: '0 auto 8px' }} />
                    Loading Nursing Staff Directory...
                  </div>
                ) : nurses.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No nurses registered yet.
                  </div>
                ) : (
                  nurses.map((nurse) => (
                    <div
                      key={nurse.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 2fr 1fr 1fr',
                        padding: '14px 18px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{nurse.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {nurse.phone || nurse.email}
                        </div>
                      </div>

                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          background: nurse.assigned_ward?.includes('ICU')
                            ? 'rgba(239, 68, 68, 0.15)'
                            : nurse.assigned_ward?.includes('Emergency')
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(6, 182, 212, 0.15)',
                          color: nurse.assigned_ward?.includes('ICU')
                            ? '#f87171'
                            : nurse.assigned_ward?.includes('Emergency')
                            ? '#fbbf24'
                            : '#38bdf8'
                        }}>
                          <Building2 size={12} /> {nurse.assigned_ward || 'General Ward'}
                        </span>
                      </div>

                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {nurse.shift_timings || '08:00 AM - 04:00 PM'}
                      </div>

                      <div>
                        {nurse.is_on_duty === 1 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#34d399',
                            fontWeight: '600',
                            fontSize: '0.75rem'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                            On Duty
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Off Duty
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleEditNurse(nurse)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Reassign
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HOUSEKEEPING TASK DISPATCHER */}
          {activeTab === 'housekeeping' && (
            <div>
              {/* Dispatch New Task Form */}
              <form onSubmit={handleDispatchTask} style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ fontWeight: '700', fontSize: '0.98rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Send size={18} /> नवीन स्वच्छता कार्य वाटप (Assign Cleaning Task to Staff)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      जागा / वॉर्ड / बेड (Cleaning Area/Bed):
                    </label>
                    <select
                      value={taskForm.area_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = tasks.find(t => t.area_name === val);
                        setTaskForm({
                          ...taskForm,
                          area_name: val,
                          area_code: match ? match.area_code : `QR-${val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10)}`
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        color: '#fff',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <option value="ICU Isolation Cabin 1">ICU Isolation Cabin 1 (QR-ICU-01)</option>
                      <option value="ICU Isolation Cabin 2">ICU Isolation Cabin 2 (QR-ICU-02)</option>
                      <option value="General Ward - Bed 101">General Ward - Bed 101 (QR-WARD-A-101)</option>
                      <option value="General Ward - Bed 102">General Ward - Bed 102 (QR-WARD-A-102)</option>
                      <option value="Emergency Trauma Bay 1">Emergency Trauma Bay 1 (QR-ER-BAY-01)</option>
                      <option value="1st Floor Central Patient Restroom">1st Floor Central Restroom (QR-RESTROOM-01)</option>
                      <option value="Operation Theatre (OT-1)">Operation Theatre (OT-1)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      सफाई कर्मचारी (Assign To Cleaner):
                    </label>
                    <select
                      value={taskForm.cleaner_id}
                      onChange={(e) => {
                        const c = cleaners.find(cl => String(cl.id) === e.target.value);
                        setTaskForm({
                          ...taskForm,
                          cleaner_id: e.target.value,
                          cleaner_name: c ? c.full_name : ''
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        color: '#fff',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.88rem'
                      }}
                    >
                      {cleaners.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.is_on_duty === 1 ? 'On Duty' : 'Off Duty'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      प्राधान्य (Priority Level):
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        color: '#fff',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <option value="urgent">🔴 Urgent (डिस्चार्ज नंतरचे निर्जंतुकीकरण)</option>
                      <option value="high">🟠 High Priority (वॉर्ड फेरफटका)</option>
                      <option value="routine">🟢 Routine (नियमित स्वच्छता)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    सूचना व मार्गदर्शन (Instructions / Notes):
                  </label>
                  <input
                    type="text"
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                    placeholder="उदा. बेडशीट बदला, सॅनिटायझर रिफिल करा, व मजला फिनाईलने पुसा"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button
                    type="submit"
                    disabled={savingTask}
                    className="btn btn-primary"
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      fontSize: '0.88rem',
                      padding: '10px 20px',
                      gap: '8px'
                    }}
                  >
                    <Send size={16} /> {savingTask ? 'Dispatching...' : 'काम वाटप करा (Dispatch Task)'}
                  </button>
                </div>
              </form>

              {/* Live Tasks Board */}
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                चालू स्वच्छता कामे (Active Dispatched Tasks & Progress)
              </div>

              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1fr',
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}>
                  <div>Area & Instructions</div>
                  <div>Assigned Cleaner</div>
                  <div>Priority</div>
                  <div>Work Status</div>
                  <div style={{ textAlign: 'right' }}>Hygiene Status</div>
                </div>

                {dispatchLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw className="spin" size={24} style={{ margin: '0 auto 8px' }} />
                    Loading Task Records...
                  </div>
                ) : tasks.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No cleaning tasks found.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1fr',
                        padding: '14px 18px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{task.area_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Code: {task.area_code} • {task.notes || 'Routine cleaning'}
                        </div>
                      </div>

                      <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {task.assigned_cleaner_name || task.last_cleaned_by || 'Unassigned'}
                      </div>

                      <div>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          background: task.priority === 'urgent'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : task.priority === 'high'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                          color: task.priority === 'urgent'
                            ? '#f87171'
                            : task.priority === 'high'
                            ? '#fbbf24'
                            : '#34d399'
                        }}>
                          {task.priority || 'routine'}
                        </span>
                      </div>

                      <div>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: task.task_status === 'completed'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : task.task_status === 'in_progress'
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                          color: task.task_status === 'completed'
                            ? '#34d399'
                            : task.task_status === 'in_progress'
                            ? '#38bdf8'
                            : '#fbbf24'
                        }}>
                          {task.task_status === 'completed'
                            ? '✓ पूर्ण (Completed)'
                            : task.task_status === 'in_progress'
                            ? '⏳ सुरू आहे (In-Progress)'
                            : '🟡 प्रलंबित (Pending)'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: task.status === 'clean' ? '#34d399' : task.status === 'due' ? '#fbbf24' : '#f87171'
                        }}>
                          {task.status?.toUpperCase() || 'DUE'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <button
            onClick={loadAllData}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.8rem', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh Roster
          </button>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
