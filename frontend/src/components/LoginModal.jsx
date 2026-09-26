import React, { useState, useEffect } from 'react';
import { X, Shield, Stethoscope, UserCheck, Lock, Mail, User, Phone, Award, Building2, Clock, DollarSign, KeyRound, Eye, EyeOff } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'doctor_register' | 'admin_register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    emergency_contact: '+1 555-0199'
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
    consultation_fee: 60.0
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
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      const res = await api.getDepartments();
      const depts = res.departments || [];
      setDepartments(depts);
      if (depts.length > 0 && !docForm.department_id) {
        setDocForm(prev => ({ ...prev, department_id: depts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load departments in LoginModal:', err);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
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
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
      onClose();
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
      onClose();
    } catch (err) {
      setError(err.message || 'Administrator registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: tab === 'login' ? '560px' : '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: 'var(--primary)',
            marginBottom: '10px'
          }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            MedTech AI Portal Access
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
            Multi-Tenant Hospital Identity & Clinical Operations
          </p>
        </div>

        {/* Demo Fast Login Cards */}
        {tab === 'login' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
              Instant Access Presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fillDemo('admin@medtech.ai', 'admin123')}
                className="btn btn-outline btn-sm"
                style={{ padding: '6px 4px', flexDirection: 'column', gap: '4px' }}
              >
                <Shield size={15} color="#fb7185" />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dr.sarah@medtech.ai', 'doctor123')}
                className="btn btn-outline btn-sm"
                style={{ padding: '6px 4px', flexDirection: 'column', gap: '4px' }}
              >
                <Stethoscope size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('elena@medtech.ai', 'patient123')}
                className="btn btn-outline btn-sm"
                style={{ padding: '6px 4px', flexDirection: 'column', gap: '4px' }}
              >
                <UserCheck size={15} color="#34d399" />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Patient</span>
              </button>
            </div>
          </div>
        )}

        {/* 4 Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '18px',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: tab === 'login' ? '600' : '400',
              fontSize: '0.825rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: tab === 'register' ? '600' : '400',
              fontSize: '0.825rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Patient Register
          </button>
          <button
            onClick={() => { setTab('doctor_register'); setError(''); }}
            style={{
              flex: 1.1,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'doctor_register' ? '2px solid #38bdf8' : '2px solid transparent',
              color: tab === 'doctor_register' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: tab === 'doctor_register' ? '700' : '500',
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <Stethoscope size={14} /> Doctor Register
          </button>
          <button
            onClick={() => { setTab('admin_register'); setError(''); }}
            style={{
              flex: 1.2,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'admin_register' ? '2px solid #fb7185' : '2px solid transparent',
              color: tab === 'admin_register' ? '#fb7185' : 'var(--text-secondary)',
              fontWeight: tab === 'admin_register' ? '700' : '500',
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <Shield size={14} /> Admin Register
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fb7185',
            fontSize: '0.825rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* 1. Sign In Tab */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@medtech.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
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
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Hospital Portal'}
            </button>
          </form>
        )}

        {/* 2. Patient Register Tab */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterPatient}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="john@example.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    style={{ paddingRight: '40px' }}
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
                    {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
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
                <label className="form-label">Allergies</label>
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
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? 'Registering Patient...' : 'Create Patient Account'}
            </button>
          </form>
        )}

        {/* 3. Professional Doctor Registration Tab */}
        {tab === 'doctor_register' && (
          <form onSubmit={handleRegisterDoctor}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Award size={20} color="#38bdf8" />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Register as a certified clinical physician. You will be assigned to clinical consultations and digital prescriptions upon registration.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={docForm.password}
                    onChange={(e) => setDocForm({ ...docForm, password: e.target.value })}
                    style={{ paddingRight: '40px' }}
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
                    {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Department *</label>
                <select
                  className="form-select"
                  value={docForm.department_id}
                  onChange={(e) => setDocForm({ ...docForm, department_id: e.target.value })}
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Floor {d.floor_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Contact</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 234-5678"
                  value={docForm.phone}
                  onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Qualification Degrees *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. MBBS, MD, DM (Cardiology)"
                  value={docForm.qualification}
                  onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical Specialization *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Interventional Cardiology"
                  value={docForm.specialization}
                  onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="form-input"
                  value={docForm.experience_years}
                  onChange={(e) => setDocForm({ ...docForm, experience_years: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consultation Fee ($)</label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  className="form-input"
                  value={docForm.consultation_fee}
                  onChange={(e) => setDocForm({ ...docForm, consultation_fee: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Room 204"
                  value={docForm.room_number}
                  onChange={(e) => setDocForm({ ...docForm, room_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shift Timings</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="09:00 AM - 05:00 PM"
                  value={docForm.shift_timings}
                  onChange={(e) => setDocForm({ ...docForm, shift_timings: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
            >
              {loading ? 'Registering Physician...' : 'Complete Doctor Registration & Join Staff'}
            </button>
          </form>
        )}

        {/* 4. Main Hospital Administrator Registration Tab */}
        {tab === 'admin_register' && (
          <form onSubmit={handleRegisterAdmin}>
            <div style={{
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Shield size={22} color="#fb7185" />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Register as the <strong>Hospital Super Administrator</strong>. You will hold complete operational authority over clinical staffing, patient admissions, telemetry beds, and hospital branding.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Administrator Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Dr. Arthur Pendelton / Rajiv Shah"
                  value={adminForm.full_name}
                  onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Hospital Email *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="admin@hospital.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Master Password *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    style={{ paddingRight: '40px' }}
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
                    {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Administrative Designation *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Chief Medical Officer & Director"
                  value={adminForm.designation}
                  onChange={(e) => setAdminForm({ ...adminForm, designation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 019-2831"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                />
              </div>

              {/* White-label Hospital Name during setup */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: '700', color: '#38bdf8' }}>
                  Hospital Brand Name (Displayed on System & Letterhead)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CITY MULTI-SPECIALTY HOSPITAL & RESEARCH INSTITUTE"
                  value={adminForm.hospital_name}
                  onChange={(e) => setAdminForm({ ...adminForm, hospital_name: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Entering your hospital name here will automatically white-label the software and sidebar!
                </span>
              </div>

              {/* Master Security Key */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <label className="form-label" style={{ fontWeight: '700', color: '#fb7185' }}>
                    Hospital Master Setup Security Key *
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Default license key: <code>MEDTECH-ADMIN-2026</code>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="MEDTECH-ADMIN-2026"
                    value={adminForm.setup_key}
                    onChange={(e) => setAdminForm({ ...adminForm, setup_key: e.target.value })}
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-rose"
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? 'Initializing Hospital Super Admin...' : 'Create Super Admin Account & Initialize Hospital'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
