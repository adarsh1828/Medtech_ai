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
import LoginModal from './components/LoginModal';
import BookAppointmentModal from './components/BookAppointmentModal';
import ConsultationModal from './components/ConsultationModal';
import OnboardDoctorModal from './components/OnboardDoctorModal';
import HospitalSettingsModal from './components/HospitalSettingsModal';
import AuthPage from './components/AuthPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hospitalInfo, setHospitalInfo] = useState(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isOnboardDoctorOpen, setIsOnboardDoctorOpen] = useState(false);
  const [isHospitalSettingsOpen, setIsHospitalSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Selection states for modal triggers
  const [activeConsultationAppt, setActiveConsultationAppt] = useState(null);
  const [preselectedDeptId, setPreselectedDeptId] = useState(null);
  const [preselectedDocId, setPreselectedDocId] = useState(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);

  // Key refresh trigger for data synchronization
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadHospitalInfo();
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      if (stored.role === 'patient' || stored.role === 'doctor') {
        setActiveTab('appointments');
      } else {
        setActiveTab('dashboard');
      }
    } else {
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
    if (user.role === 'patient') {
      const allowed = ['appointments', 'prescriptions', 'lab-reports', 'billing', 'ai-triage'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('appointments');
      }
    } else if (user.role === 'doctor') {
      const allowed = ['appointments', 'prescriptions', 'beds', 'lab-reports', 'ai-triage'];
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
    if (loggedUser.role === 'patient' || loggedUser.role === 'doctor') {
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
      if (res.user.role === 'patient' || res.user.role === 'doctor') {
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
    setActiveTab('dashboard');
  };

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
      />

      {/* Main Content Area */}
      <div className="main-content">
        <TopHeader
          user={user}
          onQuickLogin={handleQuickLogin}
          onLogout={handleLogout}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenHospitalSettings={() => setIsHospitalSettingsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
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
            />
          )}

          {activeTab === 'live-queue' && user?.role === 'admin' && (
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
        </main>
      </div>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedUser, hospital) => {
          handleLoginSuccess(loggedUser, hospital);
        }}
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
    </div>
  );
}
