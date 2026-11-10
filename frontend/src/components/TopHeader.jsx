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
  HeartPulse,
  Activity,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function TopHeader({ 
  user, 
  onQuickLogin, 
  onLogout, 
  onOpenLogin, 
  onOpenBookModal, 
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
    switch (role) {
      case 'staff':
        return <span className="badge badge-cyan"><UserCheck size={11} /> OPD ASSISTANT</span>;
      case 'admin':
        return <span className="badge badge-rose"><Shield size={11} /> {t('header.admin', 'ADMIN')}</span>;
      case 'doctor':
        return <span className="badge badge-cyan"><Stethoscope size={11} /> {t('header.doctor', 'DOCTOR')}</span>;
      case 'nurse':
        return <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}><HeartPulse size={11} /> NURSE</span>;
      case 'cleaning':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}><Sparkles size={11} /> CLEANING</span>;
      case 'patient':
        return <span className="badge badge-emerald"><UserCheck size={11} /> {t('header.patient', 'PATIENT')}</span>;
      default:
        return null;
    }
  };

  return (
    <header className="top-header">
      {/* Left: Sidebar Toggle, Mobile Brand, Live Clock & ECG */}
      <div className="top-header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Unfold Sidebar (Expand Menu)" : "Fold Sidebar (Maximize Dashboard)"}
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Mobile Brand Title (visible only on mobile <= 768px) */}
        <div className="show-on-mobile-flex" style={{ alignItems: 'center', gap: '8px' }}>
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
          <span className="telemetry-beacon-live" style={{ width: '7px', height: '7px' }} />
        </div>

        {/* Desktop Live Clock */}
        <div className="header-clock-pill hide-on-mobile">
          <span className="telemetry-beacon-live" />
          <Clock size={13} color="var(--primary)" />
          <span className="tabular-clock-digits">{timeStr || t('header.liveClock', 'LIVE')}</span>
        </div>

        {/* Desktop Animated ECG Monitor & NABH Badge */}
        <div className="header-ecg-pill hide-on-mobile">
          <svg width="44" height="16" viewBox="0 0 44 16" fill="none" style={{ overflow: 'visible' }}>
            <path
              d="M0 8 H10 L13 2 L17 14 L21 1 L25 15 L28 6 L31 8 H44"
              stroke="#06b6d4"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ecg-monitor-line"
            />
          </svg>
          <span className="ecg-pill-label">NABH LEVEL-1 • 24x7 CLINICAL NETWORK</span>
        </div>
      </div>

      {/* Right: Actions, Language, Emergency SOS & User Profile */}
      <div className="top-header-actions">
        {/* Global Spotlight Search Button */}
        <button
          onClick={onOpenSearch}
          className="header-search-btn hide-on-mobile"
          title="Spotlight Global Search (Ctrl + K / ⌘K)"
        >
          <Search size={14} className="search-icon" />
          <span>Search...</span>
          <kbd className="search-kbd-shortcut">
            Ctrl K
          </kbd>
        </button>

        {/* Language Selector Dropdown */}
        <div className="header-dropdown-wrap" ref={langDropdownRef}>
          <button
            id="language-selector-btn"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className={`header-lang-btn ${isLangDropdownOpen ? 'active' : ''}`}
            title={t('header.languages', 'Language')}
          >
            <Globe size={15} color="var(--primary)" className="hide-on-mobile" />
            <span className="lang-flag">{currentLangMeta?.flag}</span>
            <span className="hide-on-mobile lang-name">{currentLangMeta?.nativeLabel}</span>
            <ChevronDown size={13} className={`lang-chevron ${isLangDropdownOpen ? 'rotated' : ''}`} />
          </button>

          {isLangDropdownOpen && (
            <div className="header-dropdown-menu">
              <div className="header-dropdown-title">
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
                    className={`header-dropdown-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="dropdown-item-content">
                      <span className="dropdown-flag">{lang.flag}</span>
                      <span>{lang.nativeLabel}</span>
                    </div>
                    {isSelected && <Check size={14} className="selected-check" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Theme Toggle (Day / Night Mode) */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="header-theme-toggle"
          title={isDark ? 'Switch to Crisp Day Mode' : 'Switch to Obsidian Night Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={16} className="sun-icon" /> : <Moon size={16} className="moon-icon" />}
        </button>

        {/* 24x7 Emergency SOS Button */}
        <button
          onClick={onOpenEmergency}
          className="header-sos-btn"
          title="24x7 Emergency Trauma & Ambulance Alert"
        >
          <span className="telemetry-beacon-emergency" />
          <span className="hide-on-mobile">🚨 SOS 108</span>
          <span className="show-on-mobile-inline">🚨 108</span>
        </button>

        {/* Book Appointment CTA (Desktop only) */}
        <button
          onClick={onOpenBookModal}
          className="btn btn-primary btn-sm header-book-btn hide-on-mobile"
        >
          <Plus size={15} />
          <span>{t('header.bookAppointment', 'Book Appointment')}</span>
        </button>

        {/* User Account / Auth Section */}
        {user ? (
          <div className="header-user-chip">
            <div className="header-user-meta hide-on-mobile">
              <div className="user-name-title">
                {user.fullName || user.email}
              </div>
              <div className="user-badge-wrap">
                {getRoleBadge(user.role)}
              </div>
            </div>

            {/* Mobile avatar */}
            <div className="show-on-mobile-flex">
              <div className={`user-avatar-circle role-${user.role}`}>
                {(user.fullName?.[0] || user.role?.[0] || 'U').toUpperCase()}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="header-logout-btn"
              title={t('header.signOut', 'Sign Out')}
              aria-label="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="btn btn-outline btn-sm header-signin-btn"
          >
            <User size={14} />
            <span className="hide-on-mobile">{t('header.signIn', 'Sign In')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
