import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  Building2, 
  UserCheck, 
  QrCode, 
  PhoneCall, 
  Award, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HospitalPitchBar({ user, onQuickLogin, onOpenEmergency }) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(null);

  const handleRoleSwitch = async (roleType, email, password) => {
    if (user?.role === roleType) return;
    setSwitchingRole(roleType);
    try {
      await onQuickLogin(email, password);
    } catch (err) {
      console.error('Failed to switch role demo:', err);
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <div style={{
      marginBottom: '20px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.07) 50%, rgba(139, 92, 246, 0.09) 100%)',
      border: '1px solid rgba(6, 182, 212, 0.28)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Top Banner Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '800',
            letterSpacing: '0.04em',
            padding: '3px 9px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.4)'
          }}>
            <Sparkles size={13} />
            <span>HOSPITAL ENTERPRISE SUITE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            <span className="telemetry-beacon-live" />
            <span>Live Sales Demonstration Mode:</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '0.8rem' }}>
              Switch perspectives instantly during doctor or trustee presentation
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? (
              <><span>Hide Switcher</span> <ChevronUp size={14} /></>
            ) : (
              <><span>Show Demo Switcher</span> <ChevronDown size={14} /></>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content: 1-Click Role Switchers & Killer Hospital Selling Points */}
      {isExpanded && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Role Switcher Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px'
          }}>
            {/* 1. Admin Role */}
            <div 
              onClick={() => handleRoleSwitch('admin', 'admin@medtech.ai', 'admin123')}
              style={{
                background: user?.role === 'admin' 
                  ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.18) 0%, rgba(244, 63, 94, 0.06) 100%)' 
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${user?.role === 'admin' ? 'rgba(244, 63, 94, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: user?.role === 'admin' ? '0 4px 16px rgba(244, 63, 94, 0.2)' : 'none'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: user?.role === 'admin' ? '#f43f5e' : 'rgba(244, 63, 94, 0.15)',
                color: user?.role === 'admin' ? '#fff' : '#fb7185',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Building2 size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Hospital Director (Admin)
                  </div>
                  {user?.role === 'admin' && (
                    <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: '800' }}>ACTIVE</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                  Live bed map, revenue, doctor review & queue TV
                </div>
              </div>
            </div>

            {/* 2. Doctor Role */}
            <div 
              onClick={() => handleRoleSwitch('doctor', 'dr.sarah@medtech.ai', 'doctor123')}
              style={{
                background: user?.role === 'doctor' 
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(6, 182, 212, 0.06) 100%)' 
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${user?.role === 'doctor' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: user?.role === 'doctor' ? '0 4px 16px rgba(6, 182, 212, 0.2)' : 'none'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: user?.role === 'doctor' ? '#06b6d4' : 'rgba(6, 182, 212, 0.15)',
                color: user?.role === 'doctor' ? '#fff' : '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Stethoscope size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Senior Physician (Doctor)
                  </div>
                  {user?.role === 'doctor' && (
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '800' }}>ACTIVE</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                  OPD queue, digital Rx with QR & WhatsApp share
                </div>
              </div>
            </div>

            {/* 3. Patient Role */}
            <div 
              onClick={() => handleRoleSwitch('patient', 'elena.rodriguez@email.com', 'patient123')}
              style={{
                background: user?.role === 'patient' 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.06) 100%)' 
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${user?.role === 'patient' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: user?.role === 'patient' ? '0 4px 16px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: user?.role === 'patient' ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                color: user?.role === 'patient' ? '#fff' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCheck size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Patient Health Portal
                  </div>
                  {user?.role === 'patient' && (
                    <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: '800' }}>ACTIVE</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                  Digital Rx verification, live token track, lab records
                </div>
              </div>
            </div>
          </div>

          {/* Hospital Selling Points & Accreditation Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
                <ShieldCheck size={14} /> <strong>NABH & ABDM Standards</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34d399' }}>
                <QrCode size={14} /> <strong>NMC-Stamped Digital Rx</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#22c55e' }}>
                <PhoneCall size={14} /> <strong>1-Click WhatsApp Delivery</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#fb7185' }}>
                <Flame size={14} /> <strong>24x7 Ambulance SOS 108</strong>
              </span>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Built for Modern Multispecialty Hospitals & Doctor Clinics
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
