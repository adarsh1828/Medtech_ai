# MedTech AI - Hospital Operating System

A clinical-grade Hospital Management System (HMS) developed with modern web standards, featuring clinical triage workflows, electronic prescriptions (e-Rx), live OPD waiting queue broadcasting, IPD bed management, multi-role portals, and bilingual localization (English, Marathi, Hindi).

**Live Application:** [https://medtech-ai.vercel.app](https://medtech-ai.vercel.app)

---

## Architecture & Tech Stack

### Frontend
- **Framework:** React 19 with Vite build pipeline
- **Styling:** Custom CSS design system (tokens, glassmorphism, responsive grid)
- **Icons:** Lucide React
- **Internationalization:** Context-based multi-language engine (English, मराठी, हिंदी)

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js REST API
- **Authentication:** JWT (JSON Web Tokens) with salted bcrypt password hashing
- **Security:**
  - Rate limiting & 10-attempt brute force lockout protection
  - HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`)
  - Strict CORS origin whitelisting
  - Security audit logging (`SecurityAuditLogs`)
  - 15-minute inactivity session auto-logout
- **Database:** SQLite3 for local development; Turso (LibSQL Cloud) for serverless edge deployment

---

## Core System Modules

1. **Role-Based Access Control (RBAC):**
   - **Patient Portal:** Appointments, digital prescriptions, lab reports, invoices, and triage assistance.
   - **Doctor Workstation:** OPD consultations, digital Rx with drug contraindication checks, and inpatient tracking.
   - **Administrator Command Center:** Staff approval workflows, hospital telemetry, room/bed configuration, and audit logs.
   - **Nurse Station:** Inpatient vitals, medication administration, and bed occupancy management.
   - **Sanitation Staff:** Housekeeping checklists and ward cleaning schedules.

2. **OPD & IPD Billing Engine:**
   - Pre-configured for Indian Rupee (`₹ INR`) with Indian standard formatting.
   - Dynamic UPI QR codes for instant settlement via PhonePe, Google Pay, and Paytm.
   - Print-optimized tax invoices and payment receipts (`@media print`).

3. **Live OPD Queue Broadcasting:**
   - Hall display view with token indicators and Web Audio consultation chimes.

---

## Project Setup & Local Development

### Prerequisites
- Node.js (v20+ recommended)
- npm

### 1. Clone the Repository
```bash
git clone https://github.com/adarsh1828/Medtech_ai.git
cd Medtech_ai
```

### 2. Backend Configuration & Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
The backend API server will run at `http://localhost:5000`.

### 3. Frontend Configuration & Setup
```bash
cd ../frontend
npm install
npm run dev
```
The client application will run at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

---

## REST API Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User authentication & JWT issuance | Public |
| `POST` | `/api/auth/register` | Patient registration | Public |
| `POST` | `/api/auth/register-doctor` | Doctor registration with verification | Public |
| `GET` | `/api/doctors` | List verified doctors | Authenticated |
| `GET` | `/api/appointments` | Fetch appointments by role | Authenticated |
| `POST` | `/api/appointments` | Book new consultation | Authenticated |
| `GET` | `/api/beds` | Bed occupancy matrix | Authenticated |
| `GET` | `/api/billing/invoices` | List invoices and billing records | Authenticated |
| `POST` | `/api/admin/approve-staff` | Approve/reject staff registrations | Admin |
| `GET` | `/api/health` | Service health & database connectivity | Public |

---

## Author

**Adarsh Surya**  
- Email: [adarshvsurya@gmail.com](mailto:adarshvsurya@gmail.com)  
- GitHub: [@adarsh1828](https://github.com/adarsh1828)
