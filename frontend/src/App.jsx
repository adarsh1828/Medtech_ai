import React, { useState, useEffect } from 'react';
import { api, getStoredUser, setStoredUser, setStoredToken, removeStoredToken, removeStoredUser } from './api';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DashboardView from './components/DashboardView';
import AppointmentsView from './components/AppointmentsView';
import BedsView from './components/BedsView';
import DoctorsView from './components/DoctorsView';
import PrescriptionsView from './components/PrescriptionsView';
import LabReportsView from './components/LabReportsView';
import AITriageView from './components/AITriageView';
import BillingView from './components/BillingView';
import LiveQueueView from './components/LiveQueueView';
import GlobalSearchModal from './components/GlobalSearchModal';
import BookAppointmentModal from './components/BookAppointmentModal';
import ConsultationModal from './components/ConsultationModal';
import OnboardDoctorModal from './components/OnboardDoctorModal';
import HospitalSettingsModal from './components/HospitalSettingsModal';
import EmergencySOSModal from './components/EmergencySOSModal';
import AuthPage from './components/AuthPage';
import NurseStationView from './components/NurseStationView';
import HousekeepingView from './components/HousekeepingView';
import { 
  Calendar, 
  FileText, 
  FlaskConical, 
  Receipt, 
  Sparkles, 
  BedDouble, 
  LayoutDashboard, 
  Tv, 
  Stethoscope,
  HeartPulse,
  QrCode,
  ShieldAlert,
  Clock
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [activeTab, setActiveTab] = useState(() => {
    const stored = getStoredUser();
    if (!stored) return 'dashboard';
    if (stored.role === 'nurse') return 'nurse-station';
    if (stored.role === 'cleaning') return 'housekeeping';
    if (stored.role === 'patient' || stored.role === 'doctor' || stored.role === 'staff') return 'appointments';
    return 'dashboard';
  });
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('medtech_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('medtech_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(prev => !prev);
    } else {
      toggleSidebarCollapse();
    }
  };

  // Modals state
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isOnboardDoctorOpen, setIsOnboardDoctorOpen] = useState(false);
  const [isHospitalSettingsOpen, setIsHospitalSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Selection states for modal triggers
  const [activeConsultationAppt, setActiveConsultationAppt] = useState(null);
  const [preselectedDeptId, setPreselectedDeptId] = useState(null);
  const [preselectedDocId, setPreselectedDocId] = useState(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);

  // Key refresh trigger for data synchronization
  const [refreshKey, setRefreshKey] = useState(0);

  // Security Hardening: Inactivity Auto-Logout (15 mins total, 14 mins warning)
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState(60);
  const lastActiveTimeRef = React.useRef(Date.now());

  useEffect(() => {
    loadHospitalInfo();
    const stored = getStoredUser();
    if (!stored && user) {
      setUser(null);
    }


    // Global shortcut Ctrl+K for search
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Guard activeTab based on user role to prevent accessing unauthorized views
  useEffect(() => {
    if (!user) return;
    if (user.role === 'nurse') {
      const allowed = ['nurse-station', 'beds', 'prescriptions', 'lab-reports'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('nurse-station');
      }
    } else if (user.role === 'cleaning') {
      const allowed = ['housekeeping'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('housekeeping');
      }
    } else if (user.role === 'staff') {
      const allowed = ['appointments', 'live-queue', 'beds', 'billing', 'prescriptions', 'lab-reports'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('appointments');
      }
    } else if (user.role === 'patient') {
      const allowed = ['appointments', 'prescriptions', 'lab-reports', 'billing', 'ai-triage'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('appointments');
      }
    } else if (user.role === 'doctor') {
      const allowed = ['appointments', 'prescriptions', 'beds', 'lab-reports', 'ai-triage', 'nurse-station'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('appointments');
      }
    }
  }, [user, activeTab]);

  const loadHospitalInfo = async () => {
    try {
      const res = await api.getHospitalInfo();
      if (res?.hospital) {
        setHospitalInfo(res.hospital);
      }
    } catch (err) {
      console.error('Failed to load hospital info:', err);
    }
  };

  const handleLoginSuccess = (loggedUser, hospital) => {
    setUser(loggedUser);
    if (hospital) {
      setHospitalInfo(hospital);
    }
    if (loggedUser.role === 'nurse') {
      setActiveTab('nurse-station');
    } else if (loggedUser.role === 'cleaning') {
      setActiveTab('housekeeping');
    } else if (loggedUser.role === 'patient' || loggedUser.role === 'doctor') {
      setActiveTab('appointments');
    } else {
      setActiveTab('dashboard');
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleQuickLogin = async (email, password) => {
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      if (res.user.role === 'nurse') {
        setActiveTab('nurse-station');
      } else if (res.user.role === 'cleaning') {
        setActiveTab('housekeeping');
      } else if (res.user.role === 'patient' || res.user.role === 'doctor') {
        setActiveTab('appointments');
      } else {
        setActiveTab('dashboard');
      }
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Quick demo login error:', err);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    removeStoredUser();
    setUser(null);
    setShowIdleWarning(false);
    setActiveTab('dashboard');
  };

  const handleExtendSession = () => {
    lastActiveTimeRef.current = Date.now();
    setShowIdleWarning(false);
  };

  // Inactivity Auto-Logout Hook
  useEffect(() => {
    if (!user) return;

    lastActiveTimeRef.current = Date.now();

    const handleUserActivity = () => {
      // If warning modal is not displayed, register activity
      if (!showIdleWarning) {
        lastActiveTimeRef.current = Date.now();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 mins
    const WARNING_TIMEOUT = 14 * 60 * 1000;    // 14 mins

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActiveTimeRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT) {
        setShowIdleWarning(false);
        handleLogout();
      } else if (idleTime >= WARNING_TIMEOUT) {
        setShowIdleWarning(true);
        const remainingSecs = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT - idleTime) / 1000));
        setIdleSecondsRemaining(remainingSecs);
      } else {
        if (showIdleWarning) {
          setShowIdleWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(checkInterval);
    };
  }, [user, showIdleWarning]);

  const handleOpenConsultation = (appt) => {
    setActiveConsultationAppt(appt);
    setIsConsultationOpen(true);
  };

  const handleBookWithDoctor = (doc) => {
    setPreselectedDeptId(doc.department_id);
    setPreselectedDocId(doc.id);
    setIsBookOpen(true);
  };

  const handleBookWithDepartment = (deptId) => {
    setPreselectedDeptId(deptId);
    setPreselectedDocId(null);
    setIsBookOpen(true);
  };

  const handleOpenPrescriptionView = (appointmentId) => {
    setSelectedPrescriptionId(appointmentId);
    setActiveTab('prescriptions');
  };

  const triggerDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // If user is not logged in, display full-screen AuthPage
  if (!user) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        hospitalInfo={hospitalInfo}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        hospitalInfo={hospitalInfo}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <TopHeader
          user={user}
          onQuickLogin={handleQuickLogin}
          onLogout={handleLogout}
          onOpenHospitalSettings={() => setIsHospitalSettingsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onOpenBookModal={() => {
            setPreselectedDeptId(null);
            setPreselectedDocId(null);
            setIsBookOpen(true);
          }}
        />

        <main className="content-inner" key={refreshKey}>
          {activeTab === 'dashboard' && user?.role === 'admin' && (
            <DashboardView
              user={user}
              setActiveTab={setActiveTab}
              onOpenBookModal={() => setIsBookOpen(true)}
              onOpenEmergency={() => setIsEmergencyOpen(true)}
            />
          )}

          {activeTab === 'live-queue' && (user?.role === 'admin' || user?.role === 'staff') && (
            <LiveQueueView
              user={user}
              hospitalInfo={hospitalInfo}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              user={user}
              hospitalInfo={hospitalInfo}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              user={user}
              onOpenBookModal={() => setIsBookOpen(true)}
              onOpenConsultation={handleOpenConsultation}
              onOpenPrescription={handleOpenPrescriptionView}
            />
          )}

          {activeTab === 'beds' && (
            <BedsView
              user={user}
            />
          )}

          {activeTab === 'doctors' && user?.role === 'admin' && (
            <DoctorsView
              user={user}
              hospitalInfo={hospitalInfo}
              onBookWithDoctor={handleBookWithDoctor}
              onOpenOnboardDoctor={() => setIsOnboardDoctorOpen(true)}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              user={user}
              selectedPrescriptionId={selectedPrescriptionId}
              hospitalInfo={hospitalInfo}
            />
          )}

          {activeTab === 'lab-reports' && (
            <LabReportsView
              user={user}
            />
          )}

          {activeTab === 'ai-triage' && (
            <AITriageView
              onBookWithDepartment={handleBookWithDepartment}
            />
          )}

          {activeTab === 'nurse-station' && (
            <NurseStationView
              user={user}
              hospitalInfo={hospitalInfo}
            />
          )}

          {activeTab === 'housekeeping' && (
            <HousekeepingView
              user={user}
              hospitalInfo={hospitalInfo}
            />
          )}

          {/* Safe fallback for any unmatched or restricted activeTab */}
          {((activeTab === 'dashboard' && user?.role !== 'admin') ||
            (activeTab === 'live-queue' && user?.role !== 'admin' && user?.role !== 'staff') ||
            (activeTab === 'doctors' && user?.role !== 'admin')) && (
            <AppointmentsView
              user={user}
              onOpenBookModal={() => setIsBookOpen(true)}
              onOpenConsultation={handleOpenConsultation}
              onOpenPrescription={handleOpenPrescriptionView}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <HospitalSettingsModal
        isOpen={isHospitalSettingsOpen}
        onClose={() => setIsHospitalSettingsOpen(false)}
        hospitalInfo={hospitalInfo}
        onSaveSuccess={(updated) => {
          setHospitalInfo(updated);
          triggerDataRefresh();
        }}
      />

      <OnboardDoctorModal
        isOpen={isOnboardDoctorOpen}
        onClose={() => setIsOnboardDoctorOpen(false)}
        onSuccess={() => {
          triggerDataRefresh();
          setActiveTab('doctors');
        }}
      />

      <BookAppointmentModal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        user={user}
        preselectedDeptId={preselectedDeptId}
        preselectedDocId={preselectedDocId}
        onBookingSuccess={() => {
          triggerDataRefresh();
          setActiveTab('appointments');
        }}
      />

      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => {
          setIsConsultationOpen(false);
          setActiveConsultationAppt(null);
        }}
        appointment={activeConsultationAppt}
        onSuccess={() => {
          triggerDataRefresh();
          setActiveTab('prescriptions');
        }}
      />

      <EmergencySOSModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        hospitalInfo={hospitalInfo}
        user={user}
      />

      {/* Inactivity Auto-Logout Security Modal */}
      {showIdleWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={32} color="#fbbf24" />
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#fbbf24', fontWeight: '800' }}>
                सत्र सुरक्षा चेतावणी (Auto-Logout Warning)
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                सुरक्षा कारणास्तव, १४ मिनिटांपासून कोणतीही हालचाल नसल्याने तुमचे सत्र आपोआप बंद (Auto-Logout) होणार आहे.
              </p>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldAlert size={20} color="#fbbf24" />
              <span style={{ fontSize: '0.92rem', color: '#fef08a', fontWeight: '700' }}>
                सत्र बंद होण्यास उर्वरित वेळ: {idleSecondsRemaining} सेकंद
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                  color: '#fb7185'
                }}
              >
                लॉगआउट करा
              </button>
              <button
                type="button"
                onClick={handleExtendSession}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}
              >
                सत्र सुरू ठेवा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Smartphones <= 768px) */}
      <nav className="mobile-bottom-nav">
        {user?.role === 'patient' && (
          <>
            <button
              className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={18} />
              <span>Visits</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <FileText size={18} />
              <span>Rx</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'lab-reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('lab-reports')}
            >
              <FlaskConical size={18} />
              <span>Labs</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              <Receipt size={18} />
              <span>Bills</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'ai-triage' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-triage')}
            >
              <Sparkles size={18} />
              <span>AI</span>
            </button>
          </>
        )}

        {user?.role === 'doctor' && (
          <>
            <button
              className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={18} />
              <span>OPD</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <FileText size={18} />
              <span>Rx</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'beds' ? 'active' : ''}`}
              onClick={() => setActiveTab('beds')}
            >
              <BedDouble size={18} />
              <span>Beds</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'lab-reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('lab-reports')}
            >
              <FlaskConical size={18} />
              <span>Labs</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'ai-triage' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-triage')}
            >
              <Sparkles size={18} />
              <span>AI</span>
            </button>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <button
              className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Center</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'live-queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('live-queue')}
            >
              <Tv size={18} />
              <span>Queue</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={18} />
              <span>OPD</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              <Receipt size={18} />
              <span>Bills</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <Stethoscope size={18} />
              <span>Staff</span>
            </button>
          </>
        )}

        {user?.role === 'nurse' && (
          <>
            <button
              className={`mobile-nav-item ${activeTab === 'nurse-station' ? 'active' : ''}`}
              onClick={() => setActiveTab('nurse-station')}
            >
              <HeartPulse size={18} />
              <span>Station</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'beds' ? 'active' : ''}`}
              onClick={() => setActiveTab('beds')}
            >
              <BedDouble size={18} />
              <span>Beds</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <FileText size={18} />
              <span>Rx Meds</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'lab-reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('lab-reports')}
            >
              <FlaskConical size={18} />
              <span>Labs</span>
            </button>
          </>
        )}

        {user?.role === 'cleaning' && (
          <>
            <button
              className={`mobile-nav-item ${activeTab === 'housekeeping' ? 'active' : ''}`}
              onClick={() => setActiveTab('housekeeping')}
            >
              <QrCode size={18} />
              <span>QR Clean</span>
            </button>
          </>
        )}

        {user?.role === 'staff' && (
          <>
            <button
              className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={18} />
              <span>Visits</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'live-queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('live-queue')}
            >
              <Tv size={18} />
              <span>Queue</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              <Receipt size={18} />
              <span>Bills</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'beds' ? 'active' : ''}`}
              onClick={() => setActiveTab('beds')}
            >
              <BedDouble size={18} />
              <span>Beds</span>
            </button>
            <button
              className={`mobile-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <FileText size={18} />
              <span>Rx</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
