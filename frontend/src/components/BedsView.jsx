import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  User, 
  Clock, 
  Building2, 
  RefreshCw, 
  Plus,
  HeartPulse,
  Sparkles,
  ShieldAlert,
  Send,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import StaffDutyDispatchModal from './StaffDutyDispatchModal';

const WARDS = ['All', 'ICU', 'Emergency', 'General Ward', 'Semi-Private', 'Pediatric Ward'];

export default function BedsView({ user }) {
  const { t } = useLanguage();
  const [beds, setBeds] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, maintenance: 0, occupancyRate: 0, wardBreakdown: [] });
  const [wardFilter, setWardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Dispatch modal state
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [initialDispatchTab, setInitialDispatchTab] = useState('nurse');

  useEffect(() => {
    loadBeds();
  }, []);

  const loadBeds = async () => {
    setLoading(true);
    try {
      const res = await api.getBeds();
      setBeds(res.beds || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bedId, newStatus, patientId = null) => {
    setUpdatingId(bedId);
    try {
      await api.updateBed(bedId, {
        status: newStatus,
        patient_id: patientId,
        notes: newStatus === 'available' ? 'Sterilized and ready for admission' : undefined
      });
      await loadBeds();
    } catch (err) {
      alert(err.message || 'Failed to update bed status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBeds = beds.filter((b) => {
    const matchesWard = wardFilter === 'All' || b.ward_type === wardFilter;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter.toLowerCase();
    return matchesWard && matchesStatus;
  });

  // Calculate ICU critical alert
  const icuStats = stats.wardBreakdown?.find(w => w.ward_type === 'ICU');
  const isIcuShortage = icuStats && icuStats.available <= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            {t('beds.title', 'Ward & Inpatient Bed Control Matrix')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('beds.subtitle', 'Real-time telemetry tracking of ICU, Emergency, General, and Pediatric bed occupancy.')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => {
                  setInitialDispatchTab('nurse');
                  setIsDispatchOpen(true);
                }}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <HeartPulse size={14} /> नर्स वॉर्ड/ICU वाटप (Nurse Duty)
              </button>

              <button
                onClick={() => {
                  setInitialDispatchTab('housekeeping');
                  setIsDispatchOpen(true);
                }}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#34d399', color: '#34d399', gap: '6px' }}
              >
                <Sparkles size={14} /> सफाई काम वाटप (Housekeeping)
              </button>
            </>
          )}

          <button
            onClick={loadBeds}
            className="btn btn-outline btn-sm"
            style={{ gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh Bed Grid
          </button>
        </div>
      </div>

      {/* Critical ICU Shortage Alert Banner if applicable */}
      {isIcuShortage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171',
          fontSize: '0.88rem',
          fontWeight: '600'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} />
            <span>
              ⚠️ <strong>ICU क्रिटिकल अलर्ट:</strong> ICU मध्ये सध्या फक्त <strong>{icuStats.available} रिकामे बेड (Vacant Bed)</strong> उपलब्ध आहे. आपत्कालीन परिस्थितीसाठी नवीन बेड रिकामे करा किंवा सॅनिटायझेशन पूर्ण करा.
            </span>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setInitialDispatchTab('housekeeping');
                setIsDispatchOpen(true);
              }}
              className="btn btn-sm"
              style={{ background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.78rem' }}
            >
              सफाई टास्क पाठवा
            </button>
          )}
        </div>
      )}

      {/* Overall Hospital Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            Total Registered Beds (एकूण बेड्स)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
            {stats.total || 0}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            उपलब्ध रिकामे बेड्स (Vacant Beds)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#34d399', marginTop: '4px' }}>
            {stats.available || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            दाखल करण्यासाठी सज्ज (Ready for Admission)
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderColor: 'rgba(244, 63, 94, 0.35)' }}>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
            भरलेले बेड्स (Occupied Beds)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fb7185', marginTop: '4px' }}>
            {stats.occupied || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            सध्या उपचार घेत असलेले रुग्ण
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            एकूण ऑक्युपन्सी (Occupancy Rate)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#38bdf8', marginTop: '4px' }}>
            {stats.occupancyRate || 0}%
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.occupancyRate || 0}%`, height: '100%', background: '#38bdf8' }} />
          </div>
        </div>
      </div>

      {/* WARD-WISE VACANCY MATRIX (वॉर्डनुसार रिकामे बेड्स ट्रॅकर) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
              वॉर्डनुसार रिकामे बेड्स ट्रॅकर (Live Vacant Bed Availability by Ward)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              कोणत्या वॉर्डमध्ये किती रिकामे बेड्स शिल्लक आहेत याची थेट माहिती:
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {(stats.wardBreakdown || []).map((w) => {
            const isIcu = w.ward_type === 'ICU';
            const isEmergency = w.ward_type === 'Emergency';
            const isSelected = wardFilter === w.ward_type;

            return (
              <div
                key={w.ward_type}
                onClick={() => setWardFilter(isSelected ? 'All' : w.ward_type)}
                className="glass-card"
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Accent top stripe */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: isIcu ? '#ef4444' : isEmergency ? '#f59e0b' : '#06b6d4'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                    {isIcu && '🚨 '}
                    {isEmergency && '⚡ '}
                    {w.ward_type}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#000' : 'var(--text-muted)'
                  }}>
                    {isSelected ? 'Filtered' : 'Filter'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: '900', color: w.available > 0 ? '#34d399' : '#f87171', fontFamily: 'var(--font-display)' }}>
                    {w.available}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: '700' }}>
                    रिकामे (Vacant)
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    / {w.total} एकूण
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  <span>भरलेले: <strong style={{ color: '#fb7185' }}>{w.occupied}</strong></span>
                  <span>•</span>
                  <span>मेंटेनन्स: <strong style={{ color: '#fbbf24' }}>{w.maintenance}</strong></span>
                </div>

                {/* Progress Mini Bar */}
                <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${w.total > 0 ? (w.occupied / w.total) * 100 : 0}%`,
                    height: '100%',
                    background: isIcu ? '#ef4444' : isEmergency ? '#f59e0b' : '#38bdf8'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px'
      }}>
        {/* Ward Type Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>
            WARD:
          </span>
          {WARDS.map((w) => (
            <button
              key={w}
              onClick={() => setWardFilter(w)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: wardFilter === w ? 'var(--primary)' : 'var(--border-subtle)',
                background: wardFilter === w ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: wardFilter === w ? '#38bdf8' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>
            STATUS:
          </span>
          {['All', 'Available', 'Occupied', 'Maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: statusFilter === st ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-subtle)',
                background: statusFilter === st ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: statusFilter === st ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Matrix Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading live hospital beds...
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <BedDouble size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3>No Beds Found in this Filter</h3>
        </div>
      ) : (
        <div className="beds-grid">
          {filteredBeds.map((bed) => {
            const isAvailable = bed.status === 'available';
            const isOccupied = bed.status === 'occupied';
            const isMaint = bed.status === 'maintenance';

            return (
              <div
                key={bed.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  borderTop: `3px solid ${isAvailable ? '#10b981' : isOccupied ? '#f43f5e' : '#f59e0b'}`
                }}
              >
                {/* Header: Bed Number & Ward */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em'
                    }}>
                      {bed.bed_number}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Building2 size={13} /> {bed.ward_type} • Floor {bed.floor_number || 1}
                    </div>
                  </div>

                  <span className={`badge ${
                    isAvailable ? 'badge-emerald' : isOccupied ? 'badge-rose' : 'badge-amber'
                  }`}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'currentColor'
                    }} />
                    {bed.status}
                  </span>
                </div>

                {/* Department */}
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Department: <strong style={{ color: 'var(--text-primary)' }}>{bed.department_name}</strong>
                </div>

                {/* Patient or Bed Notes */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  minHeight: '68px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  {isOccupied && bed.patient_name ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: '700' }}>
                        <User size={15} color="#38bdf8" /> {bed.patient_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Blood: <strong style={{ color: '#fb7185' }}>{bed.patient_blood_group || 'N/A'}</strong> • {bed.patient_gender}
                      </div>
                      {bed.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          Note: {bed.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {bed.notes || (isAvailable ? 'Sterilized and ready for emergency patient intake' : 'Undergoing maintenance & disinfection')}
                    </div>
                  )}
                </div>

                {/* Quick Bed Status Actions */}
                {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    {isOccupied ? (
                      <button
                        onClick={() => handleUpdateStatus(bed.id, 'available', null)}
                        disabled={updatingId === bed.id}
                        className="btn btn-emerald btn-sm"
                        style={{ flex: 1 }}
                      >
                        <CheckCircle size={14} /> Discharge & Sanitize
                      </button>
                    ) : isAvailable ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(bed.id, 'occupied', 1)}
                          disabled={updatingId === bed.id}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          Admit Patient
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(bed.id, 'maintenance', null)}
                          disabled={updatingId === bed.id}
                          className="btn btn-outline btn-sm"
                          title="Set Under Maintenance"
                        >
                          <Wrench size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(bed.id, 'available', null)}
                        disabled={updatingId === bed.id}
                        className="btn btn-emerald btn-sm"
                        style={{ flex: 1 }}
                      >
                        <CheckCircle size={14} /> Finish Maintenance
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Duty & Task Dispatcher Modal */}
      <StaffDutyDispatchModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        initialTab={initialDispatchTab}
        onUpdateSuccess={loadBeds}
      />
    </div>
  );
}
