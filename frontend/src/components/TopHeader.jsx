import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  LogOut, 
  Plus, 
  Shield, 
  Stethoscope, 
  UserCheck, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  Building2, 
  Globe, 
  Check, 
  Sun, 
  Moon,
  Search,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  HeartPulse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function TopHeader({ 
  user, 
  onQuickLogin, 
  onLogout, 
  onOpenLogin, 
  onOpenBookModal, 
  onOpenHospitalSettings, 
  onOpenSearch, 
  onOpenEmergency,
  isSidebarCollapsed, 
  onToggleSidebar 
}) {
  const { language, setLanguage, t, supportedLanguages, currentLangMeta } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [timeStr, setTimeStr] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle clicking outside of the language dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="badge badge-rose"><Shield size={12} /> {t('header.admin', 'ADMIN')}</span>;
      case 'doctor':
        return <span className="badge badge-cyan"><Stethoscope size={12} /> {t('header.doctor', 'DOCTOR')}</span>;
      case 'patient':
        return <span className="badge badge-emerald"><UserCheck size={12} /> {t('header.patient', 'PATIENT')}</span>;
      default:
        return null;
    }
  };

  return (
    <header className="top-header">
      {/* Left: Sidebar Fold/Expand Toggle & Mobile Brand & Live Clock */}
      <div className="top-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Unfold Sidebar (Expand Menu)" : "Fold Sidebar (Maximize Dashboard)"}
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {/* Mobile Brand Title (visible only on mobile <= 768px) */}
        <div className="show-on-mobile-flex" style={{ alignItems: 'center', gap: '6px' }}>
          <HeartPulse size={18} color="var(--primary)" className="heartbeat-icon" />
          <span style={{
            fontWeight: '800',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap'
          }}>
            MedTech AI
          </span>
        </div>

        {/* Desktop Live Clock */}
        <div className="hide-on-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span className="telemetry-beacon-live" />
          <Clock size={14} color="var(--primary)" />
          <span>{timeStr || t('header.liveClock', 'LIVE')}</span>
        </div>

        {/* Desktop NABH Badge */}
        <div className="hide-on-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          fontSize: '0.72rem',
          fontWeight: '700',
          color: '#38bdf8',
          letterSpacing: '0.03em'
        }}>
          <span>NABH LEVEL-1 • 24x7 CLINICAL OPS</span>
        </div>
      </div>

      {/* Right: Actions & User Info & Language Selector */}
      <div className="top-header-actions">
        
        {/* Global Spotlight Search Button - Desktop Only */}
        <button
          onClick={onOpenSearch}
          className="hide-on-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Spotlight Search (Ctrl + K)"
        >
          <Search size={14} color="var(--primary)" />
          <span>Search...</span>
          <kbd style={{
            fontSize: '0.65rem',
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            Ctrl K
          </kbd>
        </button>

        {/* Language Selector Dropdown */}
        <div style={{ position: 'relative' }} ref={langDropdownRef}>
          <button
            id="language-selector-btn"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isLangDropdownOpen ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isLangDropdownOpen ? 'rgba(6, 182, 212, 0.5)' : 'var(--border-subtle)'}`,
              padding: '6px 9px',
              borderRadius: '8px',
              color: isLangDropdownOpen ? '#38bdf8' : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={t('header.languages', 'Language')}
          >
            <Globe size={15} color="var(--primary)" className="hide-on-mobile" />
            <span style={{ fontSize: '0.9rem' }}>{currentLangMeta?.flag}</span>
            <span className="hide-on-mobile" style={{ fontWeight: '600' }}>{currentLangMeta?.nativeLabel}</span>
            <ChevronDown size={14} style={{ opacity: 0.7, transform: isLangDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {isLangDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '165px',
              backgroundColor: '#0d1524',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '10px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              padding: '6px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '4px 8px 6px'
              }}>
                {t('header.languages', 'Select Language')}
              </div>

              {supportedLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                      color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? '600' : '400',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.95rem' }}>{lang.flag}</span>
                      <span>{lang.nativeLabel}</span>
                    </div>
                    {isSelected && <Check size={14} color="#38bdf8" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Day / Night Mode Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: isDark ? '#fbbf24' : '#0284c7',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Hospital Settings - Desktop Only */}
        {user?.role === 'admin' && (
          <button
            onClick={onOpenHospitalSettings}
            className="btn btn-outline btn-sm hide-on-mobile"
            style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
            title="Configure Hospital Name and White-label Branding"
          >
            <Building2 size={15} /> {t('header.hospitalSettings', 'Hospital Settings')}
          </button>
        )}

        {/* 24x7 Emergency SOS Button */}
        <button
          onClick={onOpenEmergency}
          style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '0.78rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(225, 29, 72, 0.35)',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          title="24x7 Ambulance & Emergency Trauma Center"
        >
          <span className="telemetry-beacon-emergency" />
          <span className="hide-on-mobile">🚨 SOS 108</span>
          <span className="show-on-mobile-inline">🚨 108</span>
        </button>

        {/* Book Appointment - Desktop Only (Mobile has it on Dashboard & Bottom Nav) */}
        <button
          onClick={onOpenBookModal}
          className="btn btn-primary btn-sm hide-on-mobile"
        >
          <Plus size={16} /> {t('header.bookAppointment', 'Book Appointment')}
        </button>

        {/* User Account / Auth Section */}
        {user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            padding: '4px 8px',
            borderRadius: '10px',
            flexShrink: 0
          }}>
            {/* Desktop user full name & badge */}
            <div className="hide-on-mobile" style={{ textAlign: 'right', paddingRight: '4px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName || user.email}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                {getRoleBadge(user.role)}
              </div>
            </div>

            {/* Mobile compact role avatar circle */}
            <div className="show-on-mobile-flex" style={{ alignItems: 'center' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: user.role === 'admin' ? 'rgba(244, 63, 94, 0.2)' : user.role === 'doctor' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: `1px solid ${user.role === 'admin' ? '#f43f5e' : user.role === 'doctor' ? '#06b6d4' : '#10b981'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: user.role === 'admin' ? '#fb7185' : user.role === 'doctor' ? '#38bdf8' : '#34d399'
              }}
              title={`${user.fullName || user.email} (${user.role})`}
              >
                {(user.fullName?.[0] || user.role?.[0] || 'U').toUpperCase()}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline btn-sm"
              style={{ padding: '6px', color: 'var(--text-muted)', minHeight: 'unset', height: '30px', width: '30px' }}
              title={t('header.signOut', 'Sign Out')}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="btn btn-outline btn-sm"
            style={{ padding: '6px 12px', minHeight: 'unset', height: '32px' }}
          >
            <User size={15} /> <span className="hide-on-mobile">{t('header.signIn', 'Sign In')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
