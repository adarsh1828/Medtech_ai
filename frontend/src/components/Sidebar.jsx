import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BedDouble, 
  Stethoscope, 
  FileText, 
  FlaskConical, 
  Sparkles, 
  ShieldCheck,
  Activity,
  HeartPulse,
  Receipt,
  Tv,
  UserCheck,
  Shield,
  User
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activeTab, setActiveTab, user, hospitalInfo }) {
  const { t } = useLanguage();

  const userRole = user?.role || 'patient';

  const allNavItems = [
    { 
      id: 'dashboard', 
      label: t('nav.dashboard', 'Command Center'), 
      icon: LayoutDashboard,
      roles: ['admin'] 
    },
    { 
      id: 'live-queue', 
      label: t('nav.liveQueue', 'Live OPD Queue TV'), 
      icon: Tv, 
      badge: 'LIVE',
      roles: ['admin']
    },
    { 
      id: 'billing', 
      label: userRole === 'patient' 
        ? t('nav.myBilling', 'My Bills & Receipts') 
        : t('nav.billing', 'Billing & Invoices'), 
      icon: Receipt,
      roles: ['admin', 'patient']
    },
    { 
      id: 'appointments', 
      label: userRole === 'patient' 
        ? t('nav.myAppointments', 'My Appointments & Health') 
        : userRole === 'doctor' 
        ? t('nav.opdQueue', 'OPD Queue & Consultations') 
        : t('nav.appointments', 'Appointments & OPD'), 
      icon: Calendar,
      roles: ['admin', 'doctor', 'patient']
    },
    { 
      id: 'beds', 
      label: t('nav.beds', 'Ward & Inpatient Beds'), 
      icon: BedDouble,
      roles: ['admin', 'doctor']
    },
    { 
      id: 'doctors', 
      label: t('nav.doctors', 'Medical Staff Directory'), 
      icon: Stethoscope,
      roles: ['admin']
    },
    { 
      id: 'prescriptions', 
      label: userRole === 'patient' 
        ? t('nav.myPrescriptions', 'My Prescriptions') 
        : t('nav.prescriptions', 'Prescriptions & Rx'), 
      icon: FileText,
      roles: ['admin', 'doctor', 'patient']
    },
    { 
      id: 'lab-reports', 
      label: userRole === 'patient' 
        ? t('nav.myLabReports', 'My Lab Reports') 
        : t('nav.labReports', 'Diagnostic Labs'), 
      icon: FlaskConical,
      roles: ['admin', 'doctor', 'patient']
    },
    { 
      id: 'ai-triage', 
      label: t('nav.aiTriage', 'AI Clinical Triage'), 
      icon: Sparkles, 
      badge: 'AI',
      roles: ['admin', 'doctor', 'patient']
    },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const getRoleSectionHeader = () => {
    switch (userRole) {
      case 'patient':
        return t('brand.patientPortal', 'PATIENT HEALTH PORTAL');
      case 'doctor':
        return t('brand.doctorStation', 'PHYSICIAN CLINICAL STATION');
      case 'admin':
      default:
        return t('brand.adminCommand', 'HOSPITAL COMMAND CENTER');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontWeight: '700'
          }}>
            <Shield size={11} /> ADMIN
          </span>
        );
      case 'doctor':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#38bdf8',
            fontWeight: '700'
          }}>
            <Stethoscope size={11} /> DOCTOR
          </span>
        );
      case 'patient':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontWeight: '700'
          }}>
            <UserCheck size={11} /> PATIENT
          </span>
        );
    }
  };

  return (
    <aside style={{
      width: '270px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Powered by MedTech AI Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '20px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            fontSize: '0.68rem',
            fontWeight: '700',
            color: '#38bdf8',
            letterSpacing: '0.04em'
          }}>
            <HeartPulse className="heartbeat-icon" size={12} />
            {t('brand.poweredBy', 'POWERED BY MEDTECH AI')}
          </div>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontWeight: '700'
          }}>
            {t('brand.live', 'LIVE')}
          </span>
        </div>

        {/* Big Prominent Hospital Name */}
        <div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: '800', 
            fontSize: '1.15rem', 
            lineHeight: '1.25',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            textShadow: '0 2px 10px rgba(6, 182, 212, 0.15)'
          }}>
            {hospitalInfo?.hospital_name || t('brand.defaultHospital', 'CITY MULTI-SPECIALTY HOSPITAL')}
          </h1>
          <div style={{ 
            fontSize: '0.72rem', 
            color: 'var(--text-secondary)',
            marginTop: '3px',
            lineHeight: '1.3'
          }}>
            {hospitalInfo?.tagline || t('brand.defaultTagline', 'Tertiary Clinical Care & 24x7 Trauma Center')}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ 
          fontSize: '0.68rem', 
          fontWeight: '700', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          color: 'var(--text-muted)',
          padding: '0 12px 8px 12px' 
        }}>
          {getRoleSectionHeader()}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={18} style={{ color: isActive ? '#38bdf8' : 'var(--text-muted)' }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  color: '#fff',
                  fontWeight: '700'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile Card in Sidebar Footer */}
      {user && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(255, 255, 255, 0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: userRole === 'admin' ? 'rgba(244, 63, 94, 0.15)' : userRole === 'doctor' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${userRole === 'admin' ? '#fb7185' : userRole === 'doctor' ? '#38bdf8' : '#34d399'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: userRole === 'admin' ? '#fb7185' : userRole === 'doctor' ? '#38bdf8' : '#34d399',
            flexShrink: 0
          }}>
            {userRole === 'admin' ? <Shield size={18} /> : userRole === 'doctor' ? <Stethoscope size={18} /> : <UserCheck size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user.fullName || user.email}
            </div>
            <div style={{ marginTop: '2px' }}>
              {getRoleBadge(userRole)}
            </div>
          </div>
        </div>
      )}

      {/* Hospital Status Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#34d399' }}>
            {t('brand.statusReady', 'EMERGENCY READY')}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {t('brand.statusSubtext', 'SQLite WAL • Level-1 Trauma Active')}
        </div>
      </div>
    </aside>
  );
}
