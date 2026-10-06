import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getOne } from './db.js';

import authRouter from './routes/auth.js';
import departmentsRouter from './routes/departments.js';
import doctorsRouter from './routes/doctors.js';
import patientsRouter from './routes/patients.js';
import appointmentsRouter from './routes/appointments.js';
import prescriptionsRouter from './routes/prescriptions.js';
import labReportsRouter from './routes/labReports.js';
import bedsRouter from './routes/beds.js';
import adminRouter from './routes/admin.js';
import billingRouter from './routes/billing.js';
import aiRouter from './routes/ai.js';
import housekeepingRouter from './routes/housekeeping.js';
import nurseRouter from './routes/nurse.js';
import emergencyRouter from './routes/emergency.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// Vercel Serverless rewrite path normalization
app.use((req, res, next) => {
  const matchedPath = req.headers['x-matched-path'] || req.url;
  if (matchedPath && matchedPath.startsWith('/api') && !req.url.startsWith('/api')) {
    req.url = matchedPath;
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Middleware & Strict CORS
const allowedOrigins = [
  'https://medtech-ai.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Cross-Origin Request Blocked by Medtech Security Policy.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Ensure database is initialized before handling requests (essential for Vercel Serverless)
let dbInitPromise = null;
const ensureDb = () => {
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
};

app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await ensureDb();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database initialization error: ' + err.message });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/lab-reports', labReportsRouter);
app.use('/api/beds', bedsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);
app.use('/api/ai', aiRouter);
app.use('/api/housekeeping', housekeepingRouter);
app.use('/api/nurse', nurseRouter);
app.use('/api/emergency-sos', emergencyRouter);

// Public Hospital Info (White-labeling with fast in-memory cache)
let cachedHospital = null;
let lastHospitalFetch = 0;
const HOSPITAL_CACHE_TTL = 60 * 1000;

app.get('/api/hospital', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedHospital && (now - lastHospitalFetch < HOSPITAL_CACHE_TTL)) {
      return res.json({ hospital: cachedHospital });
    }
    const hospital = await getOne('SELECT * FROM HospitalSettings WHERE id = 1');
    if (hospital) {
      cachedHospital = hospital;
      lastHospitalFetch = now;
    }
    res.json({ hospital });
  } catch (err) {
    console.error('Error fetching hospital info:', err);
    res.status(500).json({ error: 'Failed to retrieve hospital information.' });
  }
});

// Health check

app.get('/api/health', async (req, res) => {
  const isTurso = Boolean((process.env.TURSO_DATABASE_URL || process.env.TURSO_URL) && process.env.TURSO_AUTH_TOKEN);
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MedTech AI Hospital Management System API',
    turso_connected: isTurso,
    turso_env_keys: Object.keys(process.env).filter(k => k.toLowerCase().includes('turso'))
  });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error. Please try again.' });
});

// Boot database and start listener locally (on Vercel, requests are handled serverlessly via ensureDb)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`=============================================`);
        console.log(` MedTech AI Hospital API running on port ${PORT}`);
        console.log(` URL: http://localhost:${PORT}/api/health`);
        console.log(`=============================================`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

export default app;
