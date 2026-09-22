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
  Menu
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function TopHeader({ user, onQuickLogin, onLogout, onOpenLogin, onOpenBookModal, onOpenHospitalSettings, onOpenSearch, onToggleMobileMenu }) {
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
      {/* Left: Mobile Drawer Trigger & Live Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div style={{
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
          <Clock size={14} color="var(--primary)" />
          <span>{timeStr || t('header.liveClock', 'LIVE')}</span>
        </div>
      </div>

      {/* Right: Actions & User Info & Language Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        
        {/* Global Spotlight Search Button */}
        <button
          onClick={onOpenSearch}
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
          <span className="hide-on-mobile" style={{ display: 'inline-block' }}>Search...</span>
          <kbd className="hide-on-mobile" style={{
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
              padding: '6px 10px',
              borderRadius: '8px',
              color: isLangDropdownOpen ? '#38bdf8' : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={t('header.languages', 'Language')}
          >
            <Globe size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem' }}>{currentLangMeta?.flag}</span>
            <span style={{ fontWeight: '600' }}>{currentLangMeta?.nativeLabel}</span>
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
            width: '35px',
            height: '35px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: isDark ? '#fbbf24' : '#0284c7',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {user?.role === 'admin' && (

          <button
            onClick={onOpenHospitalSettings}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
            title="Configure Hospital Name and White-label Branding"
          >
            <Building2 size={15} /> {t('header.hospitalSettings', 'Hospital Settings')}
          </button>
        )}

        <button
          onClick={onOpenBookModal}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> {t('header.bookAppointment', 'Book Appointment')}
        </button>

        {user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px 6px 14px',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user.fullName || user.email}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                {getRoleBadge(user.role)}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline btn-sm"
              style={{ padding: '6px', color: 'var(--text-muted)' }}
              title={t('header.signOut', 'Sign Out')}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="btn btn-outline btn-sm"
          >
            <User size={15} /> {t('header.signIn', 'Sign In')}
          </button>
        )}
      </div>
    </header>
  );
}
