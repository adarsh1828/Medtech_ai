# 🏥 MedTech AI - Next-Gen Clinical Hospital Operating System

An Enterprise-grade, multi-tenant AI Hospital Management System featuring Clinical AI Triage, Real-time Drug-Drug Interaction Checking, Live OPD Waiting Hall Queue TV Broadcasting, OPD/IPD Invoicing with Indian Rupee (₹ INR) UPI QR Code payments, and Role-Based Portals for **Patients**, **Doctors**, and **Administrators**.

---

## 🌟 Key Features

### 1. 🔐 Role-Based Access & Authentication
- **Full-Screen Portal Gateway**: Secure authentication gateway preventing unauthenticated dashboard access.
- **Dedicated Role Redirection**:
  - 👤 **Patient Portal**: My Appointments, My Prescriptions, My Lab Reports, My Bills & Receipts (UPI payment), and AI Symptom Checker.
  - 🩺 **Doctor Workstation**: Live OPD Queue, Clinical Consultations, AI Drug Interaction Warning, Digital Prescriptions (Rx), and Inpatient Ward Bed tracking.
  - 🛡️ **Hospital Command Center (Admin)**: Executive KPIs, Revenue Analytics, OPD Queue TV broadcasting, Medical Staff Onboarding, Bed Manager, and Hospital Branding.

### 2. 💳 OPD & IPD Hospital Billing with UPI & Indian Rupee (₹ INR)
- Pre-configured with **₹ INR** and standard Indian numbering (`en-IN`).
- **Dynamic UPI QR Code**: Instant payments via PhonePe, GPay, Paytm with `cu=INR`.
- **Printable Tax Invoices & Receipts**: Clean `@media print` layout and off-screen print engine.

### 3. 🧠 Clinical AI Suite
- **AI Triage Engine**: Symptom severity scoring (`CRITICAL`, `HIGH`, `MODERATE`, `MILD`), diagnostic confidence, department routing, and wait time prioritization.
- **Real-Time Drug-Drug Interaction Checker**: Instant contraindication warnings when authoring electronic prescriptions (e.g. Aspirin + Warfarin, Metformin + Contrast).

### 4. 📺 Live OPD Queue TV Display
- Designed for waiting hall wall-mounted screens with giant token indicators, consultation room status, and a synthesized dual-tone audio chime (Web Audio API).

### 5. 🔍 Global Spotlight Search (`Ctrl + K`)
- Fast keyboard-navigable search across Patients, Doctors, Beds, Invoices, and Navigation shortcuts.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Lucide Icons, Pure Vanilla CSS Design System, Responsive Glassmorphism.
- **Backend**: Node.js, Express, SQLite3 (WAL Mode), JWT Authentication, bcryptjs.
- **Localization**: Multi-language support (English, मराठी, हिंदी).

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 👥 Demo Profiles

| Role | Email | Password |
| :--- | :--- | :--- |
| **Patient** | `elena@medtech.ai` | `patient123` |
| **Doctor** | `dr.sarah@medtech.ai` | `doctor123` |
| **Admin** | `admin@medtech.ai` | `admin123` |
