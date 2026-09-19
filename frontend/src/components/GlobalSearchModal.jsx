import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  User, 
  Stethoscope, 
  BedDouble, 
  Calendar, 
  FileText, 
  Receipt, 
  Sparkles, 
  ArrowRight,
  Tv
} from 'lucide-react';
import { api } from '../api';

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    patients: [],
    doctors: [],
    beds: [],
    invoices: []
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadAllSearchData();
  }, []);

  const loadAllSearchData = async () => {
    setLoading(true);
    try {
      const [patRes, docRes, bedsRes, invRes] = await Promise.all([
        api.getPatients().catch(() => ({ patients: [] })),
        api.getDoctors().catch(() => ({ doctors: [] })),
        api.getBeds().catch(() => ({ beds: [] })),
        api.getInvoices().catch(() => ({ invoices: [] }))
      ]);

      setData({
        patients: patRes.patients || [],
        doctors: docRes.doctors || [],
        beds: bedsRes.beds || [],
        invoices: invRes.invoices || []
      });
    } catch (e) {
      console.error('Error prefetching search indices:', e);
    } finally {
      setLoading(false);
    }
  };

  // Static navigation shortcuts
  const navShortcuts = [
    { type: 'navigation', label: 'Command Center Dashboard', tab: 'dashboard', icon: Sparkles },
    { type: 'navigation', label: 'Live OPD Queue TV Broadcast', tab: 'live-queue', icon: Tv },
    { type: 'navigation', label: 'Hospital Invoicing & Payments', tab: 'billing', icon: Receipt },
    { type: 'navigation', label: 'AI Clinical Triage Diagnostic', tab: 'ai-triage', icon: Sparkles },
    { type: 'navigation', label: 'Ward & ICU Bed Manager', tab: 'beds', icon: BedDouble },
    { type: 'navigation', label: 'Appointments Registry', tab: 'appointments', icon: Calendar },
    { type: 'navigation', label: 'Digital Prescriptions & Rx', tab: 'prescriptions', icon: FileText }
  ];

  // Filter results
  const q = query.toLowerCase().trim();
  let results = [];

  if (!q) {
    results = navShortcuts;
  } else {
    // 1. Matched Navigation
    navShortcuts.forEach(nav => {
      if (nav.label.toLowerCase().includes(q)) {
        results.push(nav);
      }
    });

    // 2. Matched Patients
    data.patients.forEach(p => {
      if (p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q) || p.blood_group?.toLowerCase().includes(q)) {
        results.push({
          type: 'patient',
          id: p.id,
          title: p.full_name,
          subtitle: `Patient • Blood: ${p.blood_group || 'N/A'} • Phone: ${p.phone || 'N/A'}`,
          tab: 'appointments',
          icon: User
        });
      }
    });

    // 3. Matched Doctors
    data.doctors.forEach(d => {
      if (d.full_name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q) || d.room_number?.toLowerCase().includes(q)) {
        results.push({
          type: 'doctor',
          id: d.id,
          title: d.full_name,
          subtitle: `Physician • ${d.specialization} • ${d.room_number}`,
          tab: 'doctors',
          icon: Stethoscope
        });
      }
    });

    // 4. Matched Beds
    data.beds.forEach(b => {
      if (b.bed_number?.toLowerCase().includes(q) || b.ward_type?.toLowerCase().includes(q)) {
        results.push({
          type: 'bed',
          id: b.id,
          title: `Bed ${b.bed_number} (${b.ward_type})`,
          subtitle: `Status: ${b.status?.toUpperCase()} ${b.patient_name ? `• Occupied by ${b.patient_name}` : ''}`,
          tab: 'beds',
          icon: BedDouble
        });
      }
    });

    // 5. Matched Invoices
    data.invoices.forEach(inv => {
      if (inv.invoice_number?.toLowerCase().includes(q) || inv.patient_name?.toLowerCase().includes(q)) {
        results.push({
          type: 'invoice',
          id: inv.id,
          title: `${inv.invoice_number} - ₹${Number(inv.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          subtitle: `Patient: ${inv.patient_name} • Status: ${inv.payment_status?.toUpperCase()}`,
          tab: 'billing',
          icon: Receipt
        });
      }
    });
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item) => {
    onNavigate(item.tab);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999, alignItems: 'flex-start', paddingTop: '12vh' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '620px',
          width: '95%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(6, 182, 212, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)'
        }}>
          <Search size={20} color="#06b6d4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patients, doctors, beds, invoices, or jump to section..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              fontFamily: 'inherit'
            }}
          />
          <span style={{
            fontSize: '0.7rem',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matches found for "{query}"
            </div>
          ) : (
            results.slice(0, 10).map((item, idx) => {
              const IconComp = item.icon || ArrowRight;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#38bdf8' : 'var(--text-muted)'
                    }}>
                      <IconComp size={16} />
                    </div>

                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: isSelected ? '#38bdf8' : 'var(--text-primary)'
                      }}>
                        {item.title || item.label}
                      </div>
                      {item.subtitle && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {item.type || 'NAVIGATE'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Key Hints */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Global Hospital Search</span>
        </div>
      </div>
    </div>
  );
}
