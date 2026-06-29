'use strict';
const { getPool }   = require('../config/database');
const logger        = require('../utils/logger');
const {
  buildAttendanceSummaryQuery,
  buildSchoolBreakdownQuery,
  buildMonthlyTrendQuery,
  buildAbsenceByDOWQuery,
  buildChronicAbsenteesQuery,
  buildRiskDistributionQuery,
  buildQuarterlyRiskQuery,
  buildTruancyListQuery,
} = require('../utils/sqlQueries');

/** Helper: bind common filter params onto an mssql Request */
function bindFilters(request, { schoolYear, school, grade, absenceType, threshold, month, quarter } = {}) {
  const sql = require('mssql');
  if (schoolYear)  request.input('schoolYear',  sql.NVarChar, schoolYear);
  if (school && school !== 'all') request.input('school', sql.NVarChar, school);
  if (grade  && grade  !== 'all') request.input('grade',  sql.NVarChar, grade);
  if (threshold != null)          request.input('threshold', sql.Decimal(5,2), Number(threshold));
}

// ─── Attendance Summary (KPI cards) ──────────────────────────────────────────
async function getAttendanceSummary(filters = {}) {
  logger.debug('getAttendanceSummary', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, filters);
  const query  = buildAttendanceSummaryQuery(filters);
  const result = await request.query(query);
  return result.recordset[0] || {};
}

// ─── School Breakdown ─────────────────────────────────────────────────────────
async function getSchoolBreakdown(filters = {}) {
  logger.debug('getSchoolBreakdown', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, filters);
  const query  = buildSchoolBreakdownQuery(filters);
  const result = await request.query(query);
  return result.recordset;
}

// ─── Monthly Trend ────────────────────────────────────────────────────────────
async function getMonthlyTrend(filters = {}) {
  logger.debug('getMonthlyTrend', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, filters);
  const query  = buildMonthlyTrendQuery(filters);
  const result = await request.query(query);
  return result.recordset;
}

// ─── Day-of-Week ──────────────────────────────────────────────────────────────
async function getAbsenceByDOW(filters = {}) {
  logger.debug('getAbsenceByDOW', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, filters);
  const query  = buildAbsenceByDOWQuery(filters);
  const result = await request.query(query);
  return result.recordset;
}

// ─── Chronic Absentees ────────────────────────────────────────────────────────
async function getChronicAbsentees(filters = {}) {
  logger.debug('getChronicAbsentees', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, { ...filters, threshold: filters.threshold ?? 10 });
  const query  = buildChronicAbsenteesQuery({ ...filters, threshold: filters.threshold ?? 10 });
  const result = await request.query(query);
  return result.recordset;
}

// ─── Risk Distribution ────────────────────────────────────────────────────────
async function getRiskDistribution(filters = {}) {
  logger.debug('getRiskDistribution', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, filters);
  const query  = buildRiskDistributionQuery(filters);
  const result = await request.query(query);
  return result.recordset[0] || {};
}

// ─── Quarterly Risk ───────────────────────────────────────────────────────────
async function getQuarterlyRisk(filters = {}) {
  logger.debug('getQuarterlyRisk', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, filters);
  const query  = buildQuarterlyRiskQuery(filters);
  const result = await request.query(query);
  return result.recordset;
}

// ─── Truancy List ─────────────────────────────────────────────────────────────
async function getTruancyList(filters = {}) {
  logger.debug('getTruancyList', filters);
  const pool    = await getPool();
  const request = pool.request();
  bindFilters(request, { ...filters, threshold: filters.threshold ?? 10 });
  const query  = buildTruancyListQuery({ ...filters, threshold: filters.threshold ?? 10 });
  const result = await request.query(query);
  return result.recordset;
}

module.exports = {
  getAttendanceSummary,
  getSchoolBreakdown,
  getMonthlyTrend,
  getAbsenceByDOW,
  getChronicAbsentees,
  getRiskDistribution,
  getQuarterlyRisk,
  getTruancyList,
};
