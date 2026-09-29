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
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  AlertTriangle
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
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [doctorPendingApproval, setDoctorPendingApproval] = useState(false);
  const [registeredDoctorEmail, setRegisteredDoctorEmail] = useState('');
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState(null);
  const [loginSecurityInfo, setLoginSecurityInfo] = useState(null); // { remainingAttempts, isLocked, lockedMinutes, attemptCount }

  // 2FA OTP state for Doctor Registration
  const [docOtp, setDocOtp] = useState('');
  const [docOtpSent, setDocOtpSent] = useState(false);
  const [docOtpVerified, setDocOtpVerified] = useState(false);
  const [sendingDocOtp, setSendingDocOtp] = useState(false);
  const [verifyingDocOtp, setVerifyingDocOtp] = useState(false);
  const [docOtpHint, setDocOtpHint] = useState('');
  const [docOtpTimer, setDocOtpTimer] = useState(0);

  // Forgot Password / Reset state
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotOtpTimer, setForgotOtpTimer] = useState(0);
  const [forgotOtpHint, setForgotOtpHint] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

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

  // Nurse Registration state
  const [nurseForm, setNurseForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    assigned_ward: 'General Ward & ICU',
    qualification: 'B.Sc Nursing / GNM',
    shift_timings: '08:00 AM - 04:00 PM'
  });

  // Cleaning Staff Registration state
  const [cleanerForm, setCleanerForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    assigned_area: 'General Ward, ICU & Restrooms',
    shift_timings: '07:00 AM - 03:00 PM'
  });

  // Hospital Staff Registration state
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Reception & Patient Coordinator',
    department: 'Front Desk & Patient Services',
    shift_timings: '09:00 AM - 05:00 PM'
  });

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

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setLoginSecurityInfo(null);
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      if (err.pendingApproval || err.status === 'pending') {
        setPendingApprovalNotice({
          title: 'अर्ज प्रशासकीय मान्यतेसाठी प्रलंबित आहे (Pending Approval)',
          message: err.message || 'तुमचा अर्ज हॉस्पिटल प्रशासकाच्या मान्यतेसाठी प्रलंबित आहे. ॲडमिनने मान्यता दिल्यानंतरच तुम्ही लॉगिन करू शकाल.',
          email: email
        });
      } else {
        if (err.data && (err.data.remainingAttempts !== undefined || err.data.isLocked)) {
          setLoginSecurityInfo({
            remainingAttempts: err.data.remainingAttempts,
            attemptCount: err.data.attemptCount,
            isLocked: err.data.isLocked,
            lockedMinutes: err.data.lockedMinutes || 15
          });
        } else {
          setLoginSecurityInfo(null);
        }
        setError(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (role, demoEmail, demoPassword) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoginSecurityInfo(null);
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

  useEffect(() => {
    let interval = null;
    if (docOtpTimer > 0) {
      interval = setInterval(() => {
        setDocOtpTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [docOtpTimer]);

  useEffect(() => {
    let interval = null;
    if (forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotOtpTimer]);

  const handleSendDocOtp = async () => {
    if (!docForm.email || !docForm.email.includes('@')) {
      setError('Please enter a valid professional email address first.');
      return;
    }
    setSendingDocOtp(true);
    setError('');
    try {
      const res = await api.sendOtp(docForm.email, 'doctor_registration');
      setDocOtpSent(true);
      setDocOtpVerified(false);
      setDocOtpHint(res.demoOtp || '');
      setDocOtpTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setSendingDocOtp(false);
    }
  };

  const handleVerifyDocOtp = async () => {
    if (!docOtp || docOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setVerifyingDocOtp(true);
    setError('');
    try {
      await api.verifyOtp(docForm.email, docOtp.trim(), 'doctor_registration');
      setDocOtpVerified(true);
      setDocOtpHint('');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingDocOtp(false);
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
      const res = await api.registerDoctor({ ...docForm });
      if (res.pendingApproval) {
        setPendingApprovalNotice({
          title: 'डॉक्टर नोंदणी अर्ज दाखल झाला! (Physician Application Submitted)',
          message: 'तुमचा डॉक्टर अर्ज प्रशासकीय पडताळणीसाठी पाठवण्यात आला आहे. हॉस्पिटल ॲडमिनिस्ट्रेटरने मंजुरी दिल्यावर तुमचे लॉगिन सुरू होईल.',
          email: docForm.email
        });
        setTab('login');
        return;
      }
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

  const handleRegisterNurse = async (e) => {
    e.preventDefault();
    if (!nurseForm.full_name || !nurseForm.email || !nurseForm.password) {
      setError('Please fill in all mandatory nurse fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.registerNurse(nurseForm);
      if (res.pendingApproval) {
        setPendingApprovalNotice({
          title: 'परिचारिका (Nurse) नोंदणी अर्ज दाखल झाला!',
          message: 'तुमचा स्टाफ नर्स अर्ज प्रशासकीय पडताळणीसाठी पाठवण्यात आला आहे. हॉस्पिटल ॲडमिनिस्ट्रेटरने मंजुरी दिल्यावर तुमचे लॉगिन सुरू होईल.',
          email: nurseForm.email
        });
        setTab('login');
        return;
      }
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Nurse registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCleaning = async (e) => {
    e.preventDefault();
    if (!cleanerForm.full_name || !cleanerForm.email || !cleanerForm.password) {
      setError('Please fill in all mandatory housekeeping fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.registerCleaning(cleanerForm);
      if (res.pendingApproval) {
        setPendingApprovalNotice({
          title: 'स्वच्छता कर्मचारी नोंदणी अर्ज दाखल झाला!',
          message: 'तुमचा स्वच्छता कर्मचारी अर्ज प्रशासकीय पडताळणीसाठी पाठवण्यात आला आहे. हॉस्पिटल ॲडमिनिस्ट्रेटरने मंजुरी दिल्यावर तुमचे लॉगिन सुरू होईल.',
          email: cleanerForm.email
        });
        setTab('login');
        return;
      }
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Cleaning staff registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.full_name || !staffForm.email || !staffForm.password) {
      setError('Please fill in all mandatory hospital staff fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.registerStaff(staffForm);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Hospital staff registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    setForgotLoading(true);
    setError('');
    setForgotSuccess('');
    try {
      const res = await api.sendOtp(forgotEmail.trim(), 'forgot_password');
      setForgotStep(2);
      setForgotOtpTimer(60);
      setForgotOtpHint(res.demoOtp || '');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setForgotLoading(true);
    setError('');
    try {
      await api.verifyOtp(forgotEmail.trim(), forgotOtp.trim(), 'forgot_password');
      setForgotStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }
    setForgotLoading(true);
    setError('');
    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        new_password: newPassword
      });
      setForgotSuccess(res.message || 'Password reset successfully!');
      setEmail(forgotEmail.trim());
      setPassword('');
      setTimeout(() => {
        setTab('login');
        setForgotStep(1);
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setForgotLoading(false);
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
      <div className="ambient-orb-cyan" style={{
        position: 'absolute',
        top: '-12%',
        left: '-8%',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(75px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div className="ambient-orb-purple" style={{
        position: 'absolute',
        bottom: '-12%',
        right: '-8%',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(75px)',
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
      <main className="auth-main-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        flex: 1,
        zIndex: 2
      }}>
        <div className="auth-split-layout">
          {/* Left Hero Telemetry Panel (Visible on Desktop >= 1024px) */}
          <div className="hide-on-mobile" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            paddingRight: '12px'
          }}>
            {/* Live Hospital Telemetry Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              width: 'fit-content'
            }}>
              <span className="telemetry-beacon-live" />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em' }}>
                🟢 24/7 CLINICAL OS • NABH LEVEL-1 ACCREDITED
              </span>
            </div>

            {/* Futuristic Hero Title */}
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '800',
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: '12px'
              }}>
                Smart Clinical <br />
                <span style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Hospital Operating System
                </span>
              </h1>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                maxWidth: '480px'
              }}>
                A paperless, enterprise-grade clinical management ecosystem featuring AI symptom triage, digital e-prescriptions with drug-drug contraindication shields, and live OPD queue broadcasting.
              </p>
            </div>

            {/* Live Cardiac Waveform Display Card */}
            <div className="glass-card-futuristic" style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HeartPulse size={22} color="#10b981" className="heartbeat-icon" />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10b981' }}>
                    PATIENT CARE TELEMETRY
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Active Vitals Monitoring & OPD Tokens
                  </div>
                </div>
              </div>

              {/* Animated ECG Waveform */}
              <svg width="120" height="28" viewBox="0 0 120 28" fill="none" style={{ overflow: 'visible' }}>
                <path
                  d="M0 14 H30 L36 3 L44 25 L52 2 L60 26 L66 10 L72 14 H120"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ecg-monitor-line"
                />
              </svg>
            </div>

            {/* 4 Feature Telemetry Micro-Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              maxWidth: '490px'
            }}>
              <div className="glass-card-futuristic" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={16} color="#38bdf8" />
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    AI Clinical Triage
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Automated symptom severity analysis & drug contraindication warnings.
                </div>
              </div>

              <div className="glass-card-futuristic" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Activity size={16} color="#34d399" />
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Zero-Wait Queue
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Live waiting hall token broadcasting with Web Audio chimes.
                </div>
              </div>

              <div className="glass-card-futuristic" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Building2 size={16} color="#f59e0b" />
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    UPI QR Settlement
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Instant digital payments in ₹ INR via PhonePe, GPay, Paytm.
                </div>
              </div>

              <div className="glass-card-futuristic" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Shield size={16} color="#fb7185" />
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Cyber Hardened
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  10-attempt lockout, audit logs & idle session auto-clearance.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Authentication Card */}
          <div style={{
            width: '100%',
            maxWidth: tab === 'login' ? '540px' : '680px',
            margin: '0 auto',
            transition: 'max-width 0.25s ease'
          }}>
            {/* Main Card */}
            <div className="glass-card auth-card-wrapper" style={{
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: '1px solid rgba(6, 182, 212, 0.45)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.1)'
            }}>
            {/* Header / Lock or Key Badge */}
            {tab === 'forgot_password' ? (
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  marginBottom: '12px'
                }}>
                  <KeyRound size={26} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Password Recovery / पासवर्ड रीसेट
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Secure 3-step verification to reset your medical portal password
                </p>
              </div>
            ) : (
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
            )}

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
                    onClick={() => handleSelectPreset('patient', 'rahul@medtech.ai', 'patient123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 6px',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: selectedRole === 'patient' ? '2px solid #34d399' : '1px solid rgba(16, 185, 129, 0.3)',
                      background: selectedRole === 'patient' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'patient' ? '0 0 12px rgba(52, 211, 153, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <UserCheck size={18} color="#34d399" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#34d399' }}>
                      👤 Patient
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Rahul P.
                    </span>
                  </button>

                  {/* Doctor Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('doctor', 'rameshgsurya@gmail.com', 'Ramesh@123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 6px',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: selectedRole === 'doctor' ? '2px solid #38bdf8' : '1px solid rgba(6, 182, 212, 0.3)',
                      background: selectedRole === 'doctor' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'doctor' ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Stethoscope size={18} color="#38bdf8" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#38bdf8' }}>
                      🩺 Doctor
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Dr. Ramesh S.
                    </span>
                  </button>

                  {/* Nurse Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('nurse', 'nurse@medtech.ai', 'nurse123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 6px',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: selectedRole === 'nurse' ? '2px solid #818cf8' : '1px solid rgba(129, 140, 248, 0.3)',
                      background: selectedRole === 'nurse' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(129, 140, 248, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'nurse' ? '0 0 12px rgba(129, 140, 248, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <HeartPulse size={18} color="#818cf8" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#818cf8' }}>
                      👩‍⚕️ Nurse
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Sister Sunita
                    </span>
                  </button>

                  {/* Cleaning Staff Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('cleaning', 'cleaner@medtech.ai', 'cleaner123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 6px',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: selectedRole === 'cleaning' ? '2px solid #fbbf24' : '1px solid rgba(245, 158, 11, 0.3)',
                      background: selectedRole === 'cleaning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'cleaning' ? '0 0 12px rgba(251, 191, 36, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Sparkles size={18} color="#fbbf24" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fbbf24' }}>
                      🧹 Cleaning
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Ramesh S.
                    </span>
                  </button>

                  {/* Staff Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('staff', 'staff@medtech.ai', 'staff123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 6px',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: selectedRole === 'staff' ? '2px solid #f97316' : '1px solid rgba(249, 115, 22, 0.3)',
                      background: selectedRole === 'staff' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'staff' ? '0 0 12px rgba(249, 115, 22, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Building2 size={18} color="#f97316" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#f97316' }}>
                      🏢 Staff
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Priya D.
                    </span>
                  </button>

                  {/* Admin Demo */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('admin', 'adarsh@medtech.ai', 'admin123')}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 6px',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: selectedRole === 'admin' ? '2px solid #fb7185' : '1px solid rgba(244, 63, 94, 0.3)',
                      background: selectedRole === 'admin' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.04)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRole === 'admin' ? '0 0 12px rgba(251, 113, 133, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Shield size={18} color="#fb7185" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fb7185' }}>
                      🛡️ Admin
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Adarsh S.
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
                      {selectedRole === 'patient' && '👤 Rahul Patil (Patient) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'doctor' && '🩺 Dr. Rajesh Deshmukh (Doctor) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'nurse' && '👩‍⚕️ Sister Sunita Sharma (Staff Nurse) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'cleaning' && '🧹 Ramesh Shinde (Sanitation Staff) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'staff' && '🏢 Priya Deshmukh (Hospital Staff & Reception) चे क्रेडेंशियल्स भरले आहेत.'}
                      {selectedRole === 'admin' && '🛡️ Adarsh Surya (Admin & Medical Director) चे क्रेडेंशियल्स भरले आहेत.'}
                      {' '}लॉगिन करण्यासाठी खालील <strong>"Sign In to Hospital Portal"</strong> बटण दाबा.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Tabs or Forgot Password Flow Header */}
            {tab === 'forgot_password' ? (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); setForgotSuccess(''); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ← Back to Sign In / लॉगिनकडे परत जा
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Step {forgotStep} of 3
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    background: forgotStep >= 1 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: forgotStep >= 1 ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    color: forgotStep >= 1 ? '#38bdf8' : 'var(--text-muted)'
                  }}>
                    1. Email
                  </div>
                  <div style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    background: forgotStep >= 2 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: forgotStep >= 2 ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    color: forgotStep >= 2 ? '#38bdf8' : 'var(--text-muted)'
                  }}>
                    2. 6-Digit OTP
                  </div>
                  <div style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    background: forgotStep >= 3 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: forgotStep >= 3 ? '1px solid #34d399' : '1px solid var(--border-subtle)',
                    color: forgotStep >= 3 ? '#34d399' : 'var(--text-muted)'
                  }}>
                    3. New Password
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '20px',
                overflowX: 'auto',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); setForgotSuccess(''); }}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: tab === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
                    color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: tab === 'login' ? '700' : '500',
                    fontSize: '0.82rem',
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
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                👤 {t('auth.patientReg', 'Patient')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('doctor_register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'doctor_register' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: tab === 'doctor_register' ? '#38bdf8' : 'var(--text-secondary)',
                  fontWeight: tab === 'doctor_register' ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🩺 {t('auth.doctorReg', 'Doctor')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('nurse_register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'nurse_register' ? '2px solid #818cf8' : '2px solid transparent',
                  color: tab === 'nurse_register' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: tab === 'nurse_register' ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                👩‍⚕️ Nurse
              </button>
              <button
                type="button"
                onClick={() => { setTab('cleaning_register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'cleaning_register' ? '2px solid #fbbf24' : '2px solid transparent',
                  color: tab === 'cleaning_register' ? '#fbbf24' : 'var(--text-secondary)',
                  fontWeight: tab === 'cleaning_register' ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🧹 Cleaning
              </button>
              <button
                type="button"
                onClick={() => { setTab('staff_register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'staff_register' ? '2px solid #f97316' : '2px solid transparent',
                  color: tab === 'staff_register' ? '#f97316' : 'var(--text-secondary)',
                  fontWeight: tab === 'staff_register' ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🏢 Staff
              </button>
              <button
                type="button"
                onClick={() => { setTab('admin_register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'admin_register' ? '2px solid #fb7185' : '2px solid transparent',
                  color: tab === 'admin_register' ? '#fb7185' : 'var(--text-secondary)',
                  fontWeight: tab === 'admin_register' ? '700' : '500',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🛡️ Admin
              </button>
            </div>
          )}

            {/* Pending Approval Notice Banner */}
            {pendingApprovalNotice && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <ShieldAlert size={22} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fbbf24', marginBottom: '4px' }}>
                    {pendingApprovalNotice.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {pendingApprovalNotice.message}
                  </div>
                  {pendingApprovalNotice.email && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      नोंदणीकृत ईमेल: <strong>{pendingApprovalNotice.email}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Banner with Brute-Force Rate Limiting Countdown & IP Block Warning */}
            {error && (
              <div style={{
                background: loginSecurityInfo?.isLocked ? 'rgba(239, 68, 68, 0.14)' : 'rgba(244, 63, 94, 0.12)',
                border: loginSecurityInfo?.isLocked ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '10px',
                padding: '14px 16px',
                color: loginSecurityInfo?.isLocked ? '#fca5a5' : '#fb7185',
                fontSize: '0.85rem',
                marginBottom: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: loginSecurityInfo?.isLocked ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <ShieldAlert size={20} color={loginSecurityInfo?.isLocked ? '#ef4444' : '#f43f5e'} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', lineHeight: '1.45' }}>{error}</div>

                    {/* Warning countdown badge when remaining attempts < 10 */}
                    {loginSecurityInfo && !loginSecurityInfo.isLocked && loginSecurityInfo.remainingAttempts !== undefined && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '8px',
                        color: '#fbbf24',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle size={15} />
                            ⚠️ चेतावणी: तुमच्याकडे अजून {loginSecurityInfo.remainingAttempts} प्रयत्न शिल्लक आहेत!
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.25)',
                            color: '#fef08a'
                          }}>
                            {loginSecurityInfo.remainingAttempts}/10 संधी
                          </span>
                        </div>

                        {/* Attempt dots indicator */}
                        <div style={{ display: 'flex', gap: '4px', margin: '4px 0' }}>
                          {[...Array(10)].map((_, idx) => {
                            const isFailed = idx < (10 - loginSecurityInfo.remainingAttempts);
                            return (
                              <div
                                key={idx}
                                style={{
                                  flex: 1,
                                  height: '5px',
                                  borderRadius: '3px',
                                  background: isFailed ? '#ef4444' : 'rgba(255, 255, 255, 0.18)',
                                  boxShadow: isFailed ? '0 0 6px rgba(239, 68, 68, 0.6)' : 'none',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            );
                          })}
                        </div>

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          🔒 <strong>सायबर सुरक्षा नियम:</strong> १० वेळा चुकीचा पासवर्ड प्रविष्ट केल्यास तुमचा IP ॲड्रेस १५ मिनिटांसाठी ब्लॉक केला जाईल.
                        </div>
                      </div>
                    )}

                    {/* Account / IP Locked Badge */}
                    {loginSecurityInfo?.isLocked && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        background: 'rgba(220, 38, 38, 0.22)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={16} color="#ef4444" />
                          🚫 सायबर सुरक्षा: IP ॲड्रेस तात्पुरता ब्लॉक केला आहे!
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                          सलग १० वेळा चुकीचा पासवर्ड टाकल्यामुळे सायबर सुरक्षेसाठी तुमचा IP पुढील <strong>{loginSecurityInfo.lockedMinutes || 15} मिनिटांसाठी</strong> ब्लॉक करण्यात आला आहे.
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px' }}>
                          💡 पासवर्ड आठवत नसल्यास खालील <strong>"पासवर्ड विसरलात का? (Forgot Password)"</strong> वर क्लिक करून OTP द्वारे त्वरित रीसेट करू शकता.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ height: '42px', paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: showPassword ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'color 0.15s ease'
                      }}
                      title={showPassword ? "Hide Password / पासवर्ड लपवा" : "Show Password / पासवर्ड पाहा"}
                      aria-label={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot_password');
                        setForgotStep(1);
                        setForgotEmail(email || '');
                        setError('');
                        setForgotSuccess('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '4px 0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <KeyRound size={13} /> Forgot Password? / पासवर्ड विसरलात?
                    </button>
                  </div>
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

            {/* Success Banner (for reset password & other actions) */}
            {forgotSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Forgot Password 3-Step Wizard */}
            {tab === 'forgot_password' && (
              <div>
                {/* STEP 1: Enter Registered Email */}
                {forgotStep === 1 && (
                  <form onSubmit={handleSendForgotOtp}>
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px'
                    }}>
                      नोंदणीकृत ईमेल प्रविष्ट करा. पासवर्ड रीसेट करण्यासाठी आम्ही ६-अंकी व्हेरिफिकेशन OTP पाठवू.
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} color="var(--primary)" /> Registered Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="e.g. staff@medtech.ai or doctor@medtech.ai"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        style={{ height: '42px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.92rem', fontWeight: '600' }}
                    >
                      {forgotLoading ? 'Checking & Sending OTP...' : 'Send Verification OTP Code →'}
                    </button>
                  </form>
                )}

                {/* STEP 2: Verify 6-digit OTP */}
                {forgotStep === 2 && (
                  <form onSubmit={handleVerifyForgotOtp}>
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px'
                    }}>
                      ६-अंकी कोड <strong>{forgotEmail}</strong> वर पाठवला आहे. (Valid for 10 minutes)
                    </div>

                    {forgotOtpHint && (
                      <div
                        onClick={() => setForgotOtp(forgotOtpHint)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px dashed #fbbf24',
                          color: '#fbbf24',
                          fontSize: '0.78rem',
                          marginBottom: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>⚡ <strong>Instant Demo OTP:</strong> {forgotOtpHint}</span>
                        <span style={{ textDecoration: 'underline' }}>Auto-Fill</span>
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <KeyRound size={14} color="var(--primary)" /> 6-Digit OTP Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        className="form-input"
                        placeholder="123456"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{
                          height: '46px',
                          fontSize: '1.25rem',
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'center',
                          letterSpacing: '0.3em'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Change Email ID
                      </button>

                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        disabled={forgotOtpTimer > 0 || forgotLoading}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: forgotOtpTimer > 0 ? 'var(--text-muted)' : '#38bdf8',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: forgotOtpTimer > 0 ? 'default' : 'pointer'
                        }}
                      >
                        {forgotOtpTimer > 0 ? `Resend Code in ${forgotOtpTimer}s` : 'Resend Code'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.92rem', fontWeight: '600' }}
                    >
                      {forgotLoading ? 'Verifying OTP...' : 'Verify Code & Set New Password →'}
                    </button>
                  </form>
                )}

                {/* STEP 3: Set New Password */}
                {forgotStep === 3 && (
                  <form onSubmit={handleResetPasswordSubmit}>
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: '0.82rem',
                      color: '#34d399',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircle2 size={16} />
                      <span>OTP Verified! Enter a new secure password for <strong>{forgotEmail}</strong>.</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label">New Password (नवीन पासवर्ड) *</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          className="form-input"
                          placeholder="Min. 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{ height: '42px', paddingRight: '42px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: showForgotNewPassword ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px'
                          }}
                        >
                          {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '18px' }}>
                      <label className="form-label">Confirm New Password (पासवर्डची पुन्हा खात्री करा) *</label>
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ height: '42px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {forgotLoading ? 'Updating Password...' : 'Save & Reset Password'}
                    </button>
                  </form>
                )}
              </div>
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
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        style={{ paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: showRegPassword ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'color 0.15s ease'
                        }}
                        title={showRegPassword ? "Hide Password / पासवर्ड लपवा" : "Show Password / पासवर्ड पाहा"}
                        aria-label={showRegPassword ? "Hide Password" : "Show Password"}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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
              doctorPendingApproval ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 20px',
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '12px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#38bdf8'
                  }}>
                    <Shield size={32} />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    नोंदणी अर्ज सुरक्षित दाखल झाला!
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: '600', marginBottom: '14px' }}>
                    Awaiting Hospital Administrator Approval
                  </p>
                  
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto 20px' }}>
                    सुरक्षेच्या कारणास्तव आणि रुग्णांच्या डेटा सुरक्षिततेसाठी, ॲडमिन कडून तुमच्या प्रमाणपत्रांची व माहितीची पडताळणी झाल्यानंतरच डॉक्टर पोर्टल सक्रिय केले जाईल.
                  </p>

                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    marginBottom: '20px'
                  }}>
                    नोंदणीकृत ईमेल: <strong style={{ color: 'var(--text-primary)' }}>{registeredDoctorEmail}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDoctorPendingApproval(false);
                      setTab('login');
                      setEmail(registeredDoctorEmail);
                      setPassword('');
                      setError('');
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    लॉगिन पृष्ठावर जा (Go to Login)
                  </button>
                </div>
              ) : (
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
                  <Shield size={20} color="#38bdf8" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <strong>सुरक्षा सूचना:</strong> नवीन नोंदणीकृत डॉक्टरांचे खाते हॉस्पिटल ॲडमिनच्या मंजुरीनंतरच (Approval) सक्रिय होईल.
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

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Professional Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="dr.ramesh@medtech.ai"
                      value={docForm.email}
                      onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={docForm.password}
                        onChange={(e) => setDocForm({ ...docForm, password: e.target.value })}
                        style={{ paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: showRegPassword ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'color 0.15s ease'
                        }}
                        title={showRegPassword ? "Hide Password / पासवर्ड लपवा" : "Show Password / पासवर्ड पाहा"}
                        aria-label={showRegPassword ? "Hide Password" : "Show Password"}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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
                  {loading ? 'Submitting Application...' : 'Submit Physician Application for Admin Review'}
                </button>
              </form>
              )
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
                      placeholder="e.g. Dr. Ramesh Surye"
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
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        style={{ paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: showRegPassword ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'color 0.15s ease'
                        }}
                        title={showRegPassword ? "Hide Password / पासवर्ड लपवा" : "Show Password / पासवर्ड पाहा"}
                        aria-label={showRegPassword ? "Hide Password" : "Show Password"}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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

            {/* 5. Nurse Registration Tab */}
            {tab === 'nurse_register' && (
              <form onSubmit={handleRegisterNurse}>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <HeartPulse size={20} color="#818cf8" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Staff Nurse Portal • Live Medication Administration, Patient Vitals Monitoring & Digital Shift Handovers.
                  </div>
                </div>

                <div className="responsive-two-col">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nurse Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Sister Sunita Sharma"
                      value={nurseForm.full_name}
                      onChange={(e) => setNurseForm({ ...nurseForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="nurse@hospital.org"
                      value={nurseForm.email}
                      onChange={(e) => setNurseForm({ ...nurseForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={nurseForm.password}
                        onChange={(e) => setNurseForm({ ...nurseForm, password: e.target.value })}
                        style={{ paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: showRegPassword ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px'
                        }}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98765 00000"
                      value={nurseForm.phone}
                      onChange={(e) => setNurseForm({ ...nurseForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Ward / Department *</label>
                    <select
                      className="form-select"
                      value={nurseForm.assigned_ward}
                      onChange={(e) => setNurseForm({ ...nurseForm, assigned_ward: e.target.value })}
                    >
                      <option value="General Ward & ICU">General Ward & ICU</option>
                      <option value="ICU & Critical Care">ICU & Critical Care</option>
                      <option value="Emergency & Triage">Emergency & Triage</option>
                      <option value="Pediatric Ward">Pediatric Ward</option>
                      <option value="Surgical Recovery (OT)">Surgical Recovery (OT)</option>
                      <option value="Maternity Ward">Maternity Ward</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nursing Qualification</label>
                    <select
                      className="form-select"
                      value={nurseForm.qualification}
                      onChange={(e) => setNurseForm({ ...nurseForm, qualification: e.target.value })}
                    >
                      <option value="B.Sc Nursing">B.Sc Nursing</option>
                      <option value="GNM (General Nursing & Midwifery)">GNM (General Nursing & Midwifery)</option>
                      <option value="Post-Basic B.Sc Nursing">Post-Basic B.Sc Nursing</option>
                      <option value="M.Sc Critical Care Nursing">M.Sc Critical Care Nursing</option>
                      <option value="ANM">ANM</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Shift Timings</label>
                    <select
                      className="form-select"
                      value={nurseForm.shift_timings}
                      onChange={(e) => setNurseForm({ ...nurseForm, shift_timings: e.target.value })}
                    >
                      <option value="Morning Shift (08:00 AM - 04:00 PM)">Morning Shift (08:00 AM - 04:00 PM)</option>
                      <option value="Evening Shift (04:00 PM - 12:00 AM)">Evening Shift (04:00 PM - 12:00 AM)</option>
                      <option value="Night Shift (12:00 AM - 08:00 AM)">Night Shift (12:00 AM - 08:00 AM)</option>
                      <option value="General Shift (09:00 AM - 05:00 PM)">General Shift (09:00 AM - 05:00 PM)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-indigo"
                  style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600' }}
                >
                  {loading ? 'Registering Staff Nurse...' : 'Register Nurse & Open Clinical Station'}
                </button>
              </form>
            )}

            {/* 6. Housekeeping / Cleaning Staff Registration Tab */}
            {tab === 'cleaning_register' && (
              <form onSubmit={handleRegisterCleaning}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Sparkles size={20} color="#fbbf24" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Hospital Sanitation & Housekeeping • Physical QR Inspection, Anti-Negligence Checklist & Area Audit Logs.
                  </div>
                </div>

                <div className="responsive-two-col">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Staff Member Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Ramesh Shinde"
                      value={cleanerForm.full_name}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="cleaner@hospital.org"
                      value={cleanerForm.email}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={cleanerForm.password}
                        onChange={(e) => setCleanerForm({ ...cleanerForm, password: e.target.value })}
                        style={{ paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: showRegPassword ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px'
                        }}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98765 11111"
                      value={cleanerForm.phone}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Cleaning Zone *</label>
                    <select
                      className="form-select"
                      value={cleanerForm.assigned_area}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, assigned_area: e.target.value })}
                    >
                      <option value="General Ward & Restrooms">General Ward & Restrooms</option>
                      <option value="ICU & Critical Care Sterile Zone">ICU & Critical Care Sterile Zone</option>
                      <option value="Emergency & Trauma Unit">Emergency & Trauma Unit</option>
                      <option value="OPD Corridors & Waiting Areas">OPD Corridors & Waiting Areas</option>
                      <option value="Operation Theatre Complex">Operation Theatre Complex</option>
                      <option value="Bio-waste & Sanitization Dept">Bio-waste & Sanitization Dept</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Assigned Shift</label>
                    <select
                      className="form-select"
                      value={cleanerForm.shift_timings}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, shift_timings: e.target.value })}
                    >
                      <option value="Morning Shift (07:00 AM - 03:00 PM)">Morning Shift (07:00 AM - 03:00 PM)</option>
                      <option value="Evening Shift (03:00 PM - 11:00 PM)">Evening Shift (03:00 PM - 11:00 PM)</option>
                      <option value="Night Shift (11:00 PM - 07:00 AM)">Night Shift (11:00 PM - 07:00 AM)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {loading ? 'Registering Cleaning Staff...' : 'Register Cleaning Staff & Start QR Audits'}
                </button>
              </form>
            )}

            {/* Staff Registration Form */}
            {tab === 'staff_register' && (
              <form onSubmit={handleRegisterStaff}>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Building2 size={20} color="#f97316" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Hospital Front Desk & Operational Staff • Reception, Patient Queue, Ward Beds & Billing Invoices.
                  </div>
                </div>

                <div className="responsive-two-col">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Priya Deshmukh"
                      value={staffForm.full_name}
                      onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="priya.staff@medtech.ai"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        style={{ paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: showRegPassword ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px'
                        }}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98200 66773"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation / Role *</label>
                    <select
                      className="form-select"
                      value={staffForm.designation}
                      onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    >
                      <option value="Reception & Patient Coordinator">Reception & Patient Coordinator</option>
                      <option value="Billing & Discharge Executive">Billing & Discharge Executive</option>
                      <option value="OPD Desk Officer">OPD Desk Officer</option>
                      <option value="Diagnostic Lab Assistant">Diagnostic Lab Assistant</option>
                      <option value="Hospital Operations Assistant">Hospital Operations Assistant</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hospital Department *</label>
                    <select
                      className="form-select"
                      value={staffForm.department}
                      onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    >
                      <option value="Front Desk & Patient Services">Front Desk & Patient Services</option>
                      <option value="Accounts & Billing Department">Accounts & Billing Department</option>
                      <option value="Outpatient (OPD) Desk">Outpatient (OPD) Desk</option>
                      <option value="Central Registration">Central Registration</option>
                      <option value="General Administration">General Administration</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Shift</label>
                    <select
                      className="form-select"
                      value={staffForm.shift_timings}
                      onChange={(e) => setStaffForm({ ...staffForm, shift_timings: e.target.value })}
                    >
                      <option value="Morning Shift (08:00 AM - 04:00 PM)">Morning Shift (08:00 AM - 04:00 PM)</option>
                      <option value="Regular Shift (09:00 AM - 05:00 PM)">Regular Shift (09:00 AM - 05:00 PM)</option>
                      <option value="Evening Shift (01:00 PM - 09:00 PM)">Evening Shift (01:00 PM - 09:00 PM)</option>
                      <option value="Night Shift (09:00 PM - 07:00 AM)">Night Shift (09:00 PM - 07:00 AM)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {loading ? 'Registering Staff Member...' : 'Register Hospital Staff Account'}
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
      </div>
      </main>
    </div>
  );
}
