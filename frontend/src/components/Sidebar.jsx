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
  User, 
  Building2, 
  X, 
  PanelLeftClose, 
  PanelLeftOpen,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  hospitalInfo, 
  isMobileOpen, 
  onCloseMobile, 
  isCollapsed, 
  onToggleCollapse 
}) {
  const { t } = useLanguage();

  const userRole = user?.role || 'patient';

  const allNavItems = [
    // Clinical Workflows
    { 
      id: 'opd-assistant', 
      label: 'OPD Assistant Desk', 
      icon: UserCheck, 
      roles: ['admin', 'staff', 'nurse'],
      category: 'clinical',
      badge: 'DESK'
    },
    { 
      id: 'appointments', 
      label: userRole === 'patient' 
        ? t('nav.myAppointments', 'My Appointments') 
        : userRole === 'doctor' 
        ? t('nav.opdQueue', 'OPD Queue & Visits') 
        : t('nav.appointments', 'Appointments & OPD'), 
      icon: Calendar, 
      roles: ['admin', 'doctor', 'patient', 'staff'],
      category: 'clinical'
    },
    { 
      id: 'live-queue', 
      label: t('nav.liveQueue', 'Live OPD Queue TV'), 
      icon: Tv, 
      badge: 'LIVE', 
      roles: ['admin', 'staff'],
      category: 'clinical'
    },
    { 
      id: 'nurse-station', 
      label: t('nav.nurseStation', 'Nurse Station & Meds'), 
      icon: HeartPulse, 
      badge: 'CLINICAL', 
      roles: ['nurse', 'admin', 'doctor'],
      category: 'clinical'
    },

    // Inpatient & Facilities
    { 
      id: 'beds', 
      label: t('nav.beds', 'Ward & Inpatient Beds'), 
      icon: BedDouble, 
      roles: ['admin', 'doctor', 'nurse'],
      category: 'facilities'
    },
    { 
      id: 'housekeeping', 
      label: t('nav.housekeeping', 'Housekeeping & QR'), 
      icon: Sparkles, 
      badge: 'HYGIENE', 
      roles: ['cleaning', 'admin'],
      category: 'facilities'
    },

    // Billing & Medical Records
    { 
      id: 'billing', 
      label: userRole === 'patient' 
        ? t('nav.myBilling', 'My Bills & Receipts') 
        : t('nav.billing', 'Billing & Invoices'), 
      icon: Receipt, 
      roles: ['admin', 'patient'],
      category: 'records'
    },
    { 
      id: 'prescriptions', 
      label: userRole === 'patient' 
        ? t('nav.myPrescriptions', 'My Prescriptions') 
        : t('nav.prescriptions', 'Prescriptions & Rx'), 
      icon: FileText, 
      roles: ['admin', 'doctor', 'patient', 'nurse'],
      category: 'records'
    },
    { 
      id: 'lab-reports', 
      label: userRole === 'patient' 
        ? t('nav.myLabReports', 'My Lab Reports') 
        : t('nav.labReports', 'Diagnostic Labs'), 
      icon: FlaskConical, 
      roles: ['admin', 'doctor', 'patient', 'nurse'],
      category: 'records'
    },

    // Intelligence & Administration
    { 
      id: 'ai-triage', 
      label: t('nav.aiTriage', 'AI Clinical Triage'), 
      icon: Sparkles, 
      badge: 'AI', 
      roles: ['admin', 'doctor', 'patient'],
      category: 'intelligence'
    },
    { 
      id: 'dashboard', 
      label: t('nav.dashboard', 'Command Center'), 
      icon: LayoutDashboard, 
      roles: ['admin'],
      category: 'intelligence'
    },
    { 
      id: 'doctors', 
      label: t('nav.doctors', 'Medical Staff'), 
      icon: Stethoscope, 
      roles: ['admin'],
      category: 'intelligence'
    },
  ];

  const categories = [
    { key: 'clinical', label: t('navSection.clinical', 'Clinical Operations') },
    { key: 'facilities', label: t('navSection.facilities', 'Inpatient & Wards') },
    { key: 'records', label: t('navSection.records', 'Billing & Records') },
    { key: 'intelligence', label: t('navSection.intelligence', 'Clinical AI & Admin') },
  ];

  const userNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  const getRoleBadge = (role) => {
    switch (role) {
      case 'staff':
        return <span className="badge badge-cyan">OPD ASSISTANT</span>;
      case 'admin':
        return (
          <span className="badge badge-rose">
            <Shield size={11} /> ADMIN
          </span>
        );
      case 'doctor':
        return (
          <span className="badge badge-cyan">
            <Stethoscope size={11} /> DOCTOR
          </span>
        );
      case 'nurse':
        return (
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <HeartPulse size={11} /> NURSE
          </span>
        );
      case 'cleaning':
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Sparkles size={11} /> CLEANING
          </span>
        );
      case 'patient':
      default:
        return (
          <span className="badge badge-emerald">
            <UserCheck size={11} /> PATIENT
          </span>
        );
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`app-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-top">
            {/* MedTech AI Logo Mark */}
            <div className="sidebar-brand-mark" title="MedTech AI Hospital OS">
              <div className="brand-logo-icon-wrap">
                <HeartPulse className="heartbeat-icon" size={18} />
              </div>
              {!isCollapsed && (
                <div className="brand-title-wrap">
                  <div className="brand-product-name">
                    MedTech<span className="brand-accent-text">AI</span>
                  </div>
                  <div className="brand-subtext">Clinical Hospital OS</div>
                </div>
              )}
            </div>

            {/* Desktop Collapse & Mobile Close */}
            <div className="sidebar-header-controls">
              {!isCollapsed && (
                <span className="telemetry-pill">
                  <span className="telemetry-beacon-live" />
                  <span>LIVE</span>
                </span>
              )}

              <button
                onClick={onToggleCollapse}
                className="sidebar-collapse-btn"
                title={isCollapsed ? "Expand Sidebar (Expand Menu)" : "Fold Sidebar (Compact View)"}
                aria-label="Toggle Sidebar Collapse"
              >
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>

              {isMobileOpen && (
                <button
                  onClick={onCloseMobile}
                  className="sidebar-collapse-btn mobile-close-btn"
                  title="Close Menu"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Hospital Clinical Unit Title */}
          {!isCollapsed && (
            <div className="sidebar-hospital-card">
              <div className="hospital-title">
                {hospitalInfo?.hospital_name || t('brand.defaultHospital', 'CITY MULTI-SPECIALTY HOSPITAL')}
              </div>
              <div className="hospital-tagline">
                {hospitalInfo?.tagline || t('brand.defaultTagline', 'Tertiary Clinical Care & 24x7 Trauma Center')}
              </div>
            </div>
          )}
        </div>

        {/* Categorized Navigation */}
        <div className="sidebar-nav-container">
          {categories.map((cat) => {
            const catItems = userNavItems.filter((i) => i.category === cat.key);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.key} className="sidebar-section">
                {!isCollapsed && (
                  <div className="sidebar-section-title">
                    <span>{cat.label}</span>
                  </div>
                )}

                <div className="sidebar-section-items">
                  {catItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-item-${item.id}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          onCloseMobile?.();
                        }}
                        title={item.label}
                        className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                      >
                        <span className="nav-btn-icon-wrap">
                          <Icon size={isCollapsed ? 20 : 18} />
                        </span>

                        {!isCollapsed && (
                          <span className="nav-btn-label">
                            {item.label}
                          </span>
                        )}

                        {!isCollapsed && item.badge && (
                          <span className={`nav-item-badge badge-${item.badge.toLowerCase()}`}>
                            {item.badge}
                          </span>
                        )}

                        {isActive && !isCollapsed && (
                          <ChevronRight size={13} className="nav-active-arrow" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile Card in Sidebar Footer */}
        {user && (
          <div className="sidebar-user-footer" title={user.fullName || user.email}>
            <div className={`user-avatar-badge role-${userRole}`}>
              {(user.fullName?.[0] || userRole[0] || 'U').toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="user-info-text">
                <div className="user-display-name">
                  {user.fullName || user.email}
                </div>
                <div className="user-role-badge-row">
                  {getRoleBadge(userRole)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Hospital Telemetry Footer */}
        {!isCollapsed && (
          <div className="sidebar-telemetry-footer">
            <div className="telemetry-status-row">
              <span className="telemetry-beacon-live" />
              <span className="telemetry-status-text">
                {t('brand.statusReady', 'EMERGENCY READY')}
              </span>
            </div>
            <div className="telemetry-subtext">
              {t('brand.statusSubtext', 'NABH Level-1 • SQLite WAL')}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
