import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Stethoscope, 
  UserCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Award, 
  Building2, 
  HeartPulse, 
  Globe, 
  Sun, 
  Moon, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Activity,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function AuthPage({ onLoginSuccess, hospitalInfo }) {
  const { t, language, setLanguage, supportedLanguages, currentLangMeta } = useLanguage();
  const { toggleTheme, isDark } = useTheme();

  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'doctor_register' | 'admin_register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Patient Registration state
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    dob: '1995-04-12',
    gender: 'Female',
    blood_group: 'O+',
    allergies: 'None',
    emergency_contact: '+91 98765 43210'
  });

  // Doctor Registration state
  const [docForm, setDocForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    department_id: '',
    qualification: '',
    specialization: '',
    experience_years: 5,
    room_number: 'Room 201',
    shift_timings: '09:00 AM - 05:00 PM',
    consultation_fee: 500.0
  });

  // Admin Registration state
  const [adminForm, setAdminForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Medical Director & Chief Executive',
    hospital_name: '',
    setup_key: 'MEDTECH-ADMIN-2026'
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await api.getDepartments();
      const depts = res.departments || [];
      setDepartments(depts);
      if (depts.length > 0 && !docForm.department_id) {
        setDocForm(prev => ({ ...prev, department_id: depts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load departments in AuthPage:', err);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (role, demoEmail, demoPassword) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.register(regForm);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Patient registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    if (!docForm.full_name || !docForm.email || !docForm.password || !docForm.qualification || !docForm.specialization) {
      setError('Please fill in all mandatory physician credentials.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.registerDoctor(docForm);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Doctor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.full_name || !adminForm.email || !adminForm.password || !adminForm.setup_key) {
      setError('Please fill in all mandatory administrator fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.registerAdmin(adminForm);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user, res.hospital);
    } catch (err) {
      setError(err.message || 'Administrator registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background glowing gradients */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Bar on Login Page: Brand + Lang Selector + Theme Toggle */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10, 15, 29, 0.6)',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)'
          }}>
            <HeartPulse size={22} color="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '800',
              fontSize: '1.15rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{hospitalInfo?.hospital_name || 'CITY MULTI-SPECIALTY HOSPITAL'}</span>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38bdf8',
                fontWeight: '700'
              }}>
                MEDTECH AI
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {hospitalInfo?.tagline || 'AI-Powered Clinical Hospital Operating System'}
            </div>
          </div>
        </div>

        {/* Right side controls: Language switcher & Theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Globe size={15} color="var(--primary)" />
              <span>{currentLangMeta?.flag} {currentLangMeta?.nativeLabel}</span>
            </button>

            {isLangOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '150px',
                background: '#0d1524',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                padding: '6px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {supportedLanguages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setIsLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: language === l.code ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      color: language === l.code ? '#38bdf8' : 'var(--text-secondary)',
                      border: 'none',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: isDark ? '#fbbf24' : '#0284c7',
              cursor: 'pointer'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="auth-main-container">
        <div style={{
          width: '100%',
          maxWidth: tab === 'login' ? '540px' : '680px',
          transition: 'max-width 0.25s ease'
        }}>
          {/* Main Card */}
          <div className="glass-card auth-card-wrapper">
            {/* Header / Lock Badge */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--primary)',
                marginBottom: '12px'
              }}>
                <Lock size={26} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)' }}>
                {t('auth.portalAccess', 'Hospital Portal Authentication')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                {t('auth.loginSubtitle', 'Select your role or enter your credentials to open your medical dashboard')}
              </p>
            </div>

            {/* Instant 1-Click Demo Login Cards */}
            {tab === 'login' && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    ⚡ {t('auth.instantAccess', 'Quick Profile Credentials')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    क्लिक करा माहिती भरण्यासाठी (डायरेक्ट लॉगिन नाही)
                  </span>
                </div>

                <div className="auth-preset-grid">
                  {/* Patient Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('patient', 'elena@medtech.ai', 'patient123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 8px',
                      flexDirection: 'column',
                      gap: '5px',
                      borderRadius: '10px',
                      border: selectedRole === 'patient' ? '2px solid #34d399' : '1px solid rgba(16, 185, 129, 0.3)',
                      background: selectedRole === 'patient' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'patient' ? '0 0 12px rgba(52, 211, 153, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <UserCheck size={20} color="#34d399" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399' }}>
                      👤 Patient
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Elena Rodriguez
                    </span>
                  </button>

                  {/* Doctor Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('doctor', 'dr.sarah@medtech.ai', 'doctor123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 8px',
                      flexDirection: 'column',
                      gap: '5px',
                      borderRadius: '10px',
                      border: selectedRole === 'doctor' ? '2px solid #38bdf8' : '1px solid rgba(6, 182, 212, 0.3)',
                      background: selectedRole === 'doctor' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'doctor' ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Stethoscope size={20} color="#38bdf8" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8' }}>
                      🩺 Doctor
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Dr. Sarah Chen
                    </span>
                  </button>

                  {/* Admin Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('admin', 'admin@medtech.ai', 'admin123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 8px',
                      flexDirection: 'column',
                      gap: '5px',
                      borderRadius: '10px',
                      border: selectedRole === 'admin' ? '2px solid #fb7185' : '1px solid rgba(244, 63, 94, 0.3)',
                      background: selectedRole === 'admin' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'admin' ? '0 0 12px rgba(251, 113, 133, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Shield size={20} color="#fb7185" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fb7185' }}>
                      🛡️ Admin
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Arthur Pendelton
                    </span>
                  </button>
                </div>

                {selectedRole && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={15} color="#38bdf8" />
                    <span>
                      {selectedRole === 'patient' && '👤 Elena Rodriguez (Patient) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'doctor' && '🩺 Dr. Sarah Chen (Doctor) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'admin' && '🛡️ Arthur Pendelton (Admin) चे क्रेडेंशियल्स भरले आहेत.'}
                      {' '}लॉगिन करण्यासाठी खालील <strong>"Sign In to Hospital Portal"</strong> बटण दाबा.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '20px',
              overflowX: 'auto',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'login' ? '700' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('auth.signIn', 'Sign In')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'register' ? '2px solid #34d399' : '2px solid transparent',
                  color: tab === 'register' ? '#34d399' : 'var(--text-secondary)',
                  fontWeight: tab === 'register' ? '700' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('auth.patientReg', 'Patient Register')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('doctor_register'); setError(''); }}
                style={{
                  flex: 1.1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'doctor_register' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: tab === 'doctor_register' ? '#38bdf8' : 'var(--text-secondary)',
                  fontWeight: tab === 'doctor_register' ? '700' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Stethoscope size={14} /> {t('auth.doctorReg', 'Doctor Register')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('admin_register'); setError(''); }}
                style={{
                  flex: 1.1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'admin_register' ? '2px solid #fb7185' : '2px solid transparent',
                  color: tab === 'admin_register' ? '#fb7185' : 'var(--text-secondary)',
                  fontWeight: tab === 'admin_register' ? '700' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Shield size={14} /> {t('auth.adminReg', 'Admin Register')}
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fb7185',
                fontSize: '0.85rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Lock size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Sign In Tab */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="var(--primary)" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@medtech.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ height: '42px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} color="var(--primary)" /> Password
                  </label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ height: '42px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? 'Authenticating...' : (
                    <>
                      <span>Sign In to Hospital Portal</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. Patient Register Tab */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterPatient}>
                <div className="responsive-two-col">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Elena Rodriguez"
                      value={regForm.full_name}
                      onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="patient@example.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Password *</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      value={regForm.blood_group}
                      onChange={(e) => setRegForm({ ...regForm, blood_group: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Known Allergies</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Penicillin, Peanuts, None"
                      value={regForm.allergies}
                      onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-emerald"
                  style={{ width: '100%', marginTop: '16px', padding: '12px' }}
                >
                  {loading ? 'Creating Patient Account...' : 'Create Patient Account & Access Portal'}
                </button>
              </form>
            )}

            {/* 3. Doctor Registration Tab */}
            {tab === 'doctor_register' && (
              <form onSubmit={handleRegisterDoctor}>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Award size={20} color="#38bdf8" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Register as a clinical physician. You will have full access to OPD queues, electronic prescriptions, and drug interaction checkers.
                  </div>
                </div>

                <div className="responsive-two-col">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Doctor Full Name (with Title) *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Dr. Rajesh Sharma, MD"
                      value={docForm.full_name}
                      onChange={(e) => setDocForm({ ...docForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Professional Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="dr.rajesh@medtech.ai"
                      value={docForm.email}
                      onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Password *</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="••••••••"
                      value={docForm.password}
                      onChange={(e) => setDocForm({ ...docForm, password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Clinical Department *</label>
                    <select
                      className="form-select"
                      value={docForm.department_id}
                      onChange={(e) => setDocForm({ ...docForm, department_id: e.target.value })}
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Qualifications (Degree) *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="MBBS, MD, DM"
                      value={docForm.qualification}
                      onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Interventional Cardiology"
                      value={docForm.specialization}
                      onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={docForm.experience_years}
                      onChange={(e) => setDocForm({ ...docForm, experience_years: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">OPD Consultation Fee (₹ INR)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      className="form-input"
                      value={docForm.consultation_fee}
                      onChange={(e) => setDocForm({ ...docForm, consultation_fee: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">OPD Room Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Room 201"
                      value={docForm.room_number}
                      onChange={(e) => setDocForm({ ...docForm, room_number: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-cyan"
                  style={{ width: '100%', marginTop: '16px', padding: '12px' }}
                >
                  {loading ? 'Onboarding Doctor...' : 'Register Physician & Open Workstation'}
                </button>
              </form>
            )}

            {/* 4. Administrator Registration Tab */}
            {tab === 'admin_register' && (
              <form onSubmit={handleRegisterAdmin}>
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Shield size={20} color="#fb7185" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Administrator privileges provide full authority over clinical operations, hospital revenue, billing, staff, and live queue displays.
                  </div>
                </div>

                <div className="responsive-two-col">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Executive Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Arthur Pendelton"
                      value={adminForm.full_name}
                      onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Admin Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="admin@hospital.org"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admin Password *</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="••••••••"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Executive Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Medical Director / CEO"
                      value={adminForm.designation}
                      onChange={(e) => setAdminForm({ ...adminForm, designation: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Setup Secret Key *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="MEDTECH-ADMIN-2026"
                        value={adminForm.setup_key}
                        onChange={(e) => setAdminForm({ ...adminForm, setup_key: e.target.value })}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-rose"
                  style={{ width: '100%', marginTop: '16px', padding: '12px' }}
                >
                  {loading ? 'Authorizing Administrator...' : 'Authorize Admin & Open Command Center'}
                </button>
              </form>
            )}
          </div>

          {/* Footer info badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '18px',
            marginTop: '16px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} color="#10b981" /> 24x7 Emergency Ready
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} color="#38bdf8" /> HIPAA & HL7 Compliant
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={13} color="#a855f7" /> Multi-Tenant Role Isolation
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
