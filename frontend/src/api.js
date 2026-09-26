// Centralized API client for MedTech AI Hospital Management
const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('medtech_token');
export const setStoredToken = (token) => localStorage.setItem('medtech_token', token);
export const removeStoredToken = () => localStorage.removeItem('medtech_token');

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('medtech_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('medtech_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('medtech_user');

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  registerDoctor: (payload) => request('/auth/register-doctor', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  registerAdmin: (payload) => request('/auth/register-admin', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  sendOtp: (email, purpose = 'doctor_registration') => request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose })
  }),
  verifyOtp: (email, otp, purpose = 'doctor_registration') => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp, purpose })
  }),
  getMe: () => request('/auth/me'),


  // Departments
  getDepartments: () => request('/departments'),

  // Doctors
  getDoctors: (params = '') => request(`/doctors${params ? `?${params}` : ''}`),
  updateDoctorDuty: (id, isOnDuty) => request(`/doctors/${id}/duty`, {
    method: 'PATCH',
    body: JSON.stringify({ is_on_duty: isOnDuty })
  }),
  onboardDoctor: (payload) => request('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deleteDoctor: (id) => request(`/admin/doctors/${id}`, {
    method: 'DELETE'
  }),
  getPendingDoctors: () => request('/admin/pending-doctors'),
  approveDoctor: (id) => request(`/admin/doctors/${id}/approve`, {
    method: 'PUT'
  }),
  rejectDoctor: (id, reason = '') => request(`/admin/doctors/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  }),


  // Patients
  getPatients: () => request('/patients'),
  getPatientProfile: (id) => request(`/patients/${id}`),

  // Appointments
  getAppointments: (query = '') => request(`/appointments${query ? `?${query}` : ''}`),
  getAppointment: (id) => request(`/appointments/${id}`),
  bookAppointment: (payload) => request('/appointments/book', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateAppointmentStatus: (id, status) => request(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  updateAppointmentVitals: (id, vitals) => request(`/appointments/${id}/vitals`, {
    method: 'PATCH',
    body: JSON.stringify(vitals)
  }),

  // Prescriptions
  getPrescriptions: (query = '') => request(`/prescriptions${query ? `?${query}` : ''}`),
  createPrescription: (payload) => request('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Lab Reports
  getLabReports: (query = '') => request(`/lab-reports${query ? `?${query}` : ''}`),

  // Beds
  getBeds: (query = '') => request(`/beds${query ? `?${query}` : ''}`),
  updateBed: (id, payload) => request(`/beds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  // Admin & Hospital Info (White-labeling)
  getAdminOverview: () => request('/admin/overview'),
  getHospitalInfo: () => request('/hospital'),
  updateHospitalSettings: (payload) => request('/admin/hospital-settings', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Billing & Invoices
  getInvoices: (query = '') => request(`/billing${query ? `?${query}` : ''}`),
  getInvoice: (id) => request(`/billing/${id}`),
  createInvoice: (payload) => request('/billing', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  payInvoice: (id, payload) => request(`/billing/${id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  // AI Suite
  runAITriage: (payload) => request('/ai/triage', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  checkDrugInteractions: (medicines) => request('/ai/check-drug-interactions', {
    method: 'POST',
    body: JSON.stringify({ medicines })
  })
};

