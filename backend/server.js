'use strict';
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
require('dotenv').config();

const { getPool } = require('./src/config/database');
const logger       = require('./src/utils/logger');

// ─── Route imports (CommonJS — exact filenames on disk) ───────────────────────
const attendanceRoutes  = require('./src/routes/attendance');
const studentRoutes     = require('./src/routes/students');
const schoolRoutes      = require('./src/routes/schools');
const schoolYearRoutes  = require('./src/routes/schoolYears');
const assessmentRoutes  = require('./src/routes/assessments');
const interventionRoutes= require('./src/routes/interventions');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    const { getPool } = require('./src/config/database');
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    dbOk = true;
  } catch (_e) { /* db unreachable */ }
  res.json({ status: 'ok', db: dbOk });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/attendance',   attendanceRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/schools',      schoolRoutes);
app.use('/api/school-years', schoolYearRoutes);
app.use('/api/assessments',  assessmentRoutes);
app.use('/api/interventions',interventionRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await getPool();
    logger.info('Database pool initialised');
  } catch (err) {
    logger.warn('DB pool failed on startup (will retry on first request):', err.message);
  }
  app.listen(PORT, () => logger.info(`K12 backend listening on http://localhost:${PORT}`));
}

start();
