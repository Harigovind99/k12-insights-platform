import client from './client';

// ─── Individual named exports (used by hooks) ─────────────────────────────────

export const getAttendanceSummary = (params) =>
  client.get('/attendance/summary', { params }).then(r => r.data);

export const getAttendanceMetrics = getAttendanceSummary;   // alias

export const getSchoolBreakdown = (params) =>
  client.get('/attendance/schools', { params }).then(r => r.data);

export const getMonthlyTrend = (params) =>
  client.get('/attendance/trend', { params }).then(r => r.data);

export const getAbsenceByDOW = (params) =>
  client.get('/attendance/dow', { params }).then(r => r.data);

export const getChronicAbsentees = (params) =>
  client.get('/attendance/chronic', { params }).then(r => r.data);

export const getRiskDistribution = (params) =>
  client.get('/attendance/risk', { params }).then(r => r.data);

export const getQuarterlyRisk = (params) =>
  client.get('/attendance/quarterly', { params }).then(r => r.data);

export const getTruancyList = (params) =>
  client.get('/attendance/truancy', { params }).then(r => r.data);

// ─── Default export (backward compat) ────────────────────────────────────────
const attendanceApi = {
  getAttendanceSummary,
  getAttendanceMetrics,
  getSchoolBreakdown,
  getMonthlyTrend,
  getAbsenceByDOW,
  getChronicAbsentees,
  getRiskDistribution,
  getQuarterlyRisk,
  getTruancyList,
};

export default attendanceApi;
