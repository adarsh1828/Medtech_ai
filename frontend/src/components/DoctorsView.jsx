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
  UserPlus 
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency } from '../utils/currency';

export default function DoctorsView({ user, onBookWithDoctor, onOpenOnboardDoctor, hospitalInfo }) {
  const currencySymbol = hospitalInfo?.currency_symbol || '₹';
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, deptRes] = await Promise.all([
        api.getDoctors(),
        api.getDepartments()
      ]);
      setDoctors(docsRes.doctors || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            Attending Physicians & Specialists
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Board-certified clinicians, shift schedules, and department allocations
          </p>
        </div>

        <button
          onClick={onOpenOnboardDoctor}
          className="btn btn-primary"
        >
          <UserPlus size={16} /> Onboard New Doctor
        </button>
      </div>


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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
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
    </div>
  );
}
