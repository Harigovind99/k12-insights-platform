'use strict';
const { getPool }            = require('../config/database');
const logger                 = require('../utils/logger');
const { resolveSchoolYearId } = require('../utils/yearResolver');
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

// Maps the 3-letter month abbreviation from the frontend to a SQL month number.
const MONTH_NAME_TO_NUM = {
  Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  Jan: 1, Feb: 2, Mar: 3,  Apr: 4,  May: 5,  Jun: 6,
};

// Bind common filter params. @schoolYearId is the pre-resolved GUID so SQL
// never needs the expensive CoreReports.AttendanceLetter subquery.
function bindFilters(request, { schoolYearId, schoolYear, school, grade, threshold, month } = {}) {
  const sql = require('mssql');

  request.input('schoolYearId', sql.UniqueIdentifier, schoolYearId || null);

  // @startYear / @endYear used by monthly and quarterly trend queries.
  if (schoolYear && /^\d{4}-\d{4}$/.test(schoolYear)) {
    const parts = schoolYear.split('-');
    request.input('startYear', sql.Int, parseInt(parts[0], 10));
    request.input('endYear',   sql.Int, parseInt(parts[1], 10));
  } else {
    request.input('startYear', sql.Int, null);
    request.input('endYear',   sql.Int, null);
  }

  // @schoolYear as varchar used by demographic subqueries (EL, homeless, foster).
  if (schoolYear) request.input('schoolYear', sql.NVarChar, schoolYear);

  if (school && school !== 'all') request.input('school',    sql.NVarChar,      school);
  if (grade  && grade  !== 'all') request.input('grade',     sql.NVarChar,      grade);
  if (threshold != null)          request.input('threshold', sql.Decimal(5, 2), Number(threshold));

  // @month is the numeric month (1–12) used by trend and DOW queries.
  if (month && month !== 'all') {
    const monthNum = MONTH_NAME_TO_NUM[month];
    if (monthNum) request.input('month', sql.Int, monthNum);
  }
}

// ─── Attendance Summary (KPI cards) ──────────────────────────────────────────
async function getAttendanceSummary(filters = {}) {
  logger.debug('getAttendanceSummary', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...filters, schoolYearId });
  const result = await request.query(buildAttendanceSummaryQuery(filters));
  return result.recordset[0] || {};
}

// ─── School Breakdown ─────────────────────────────────────────────────────────
async function getSchoolBreakdown(filters = {}) {
  logger.debug('getSchoolBreakdown', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...filters, schoolYearId });
  const result = await request.query(buildSchoolBreakdownQuery(filters));
  return result.recordset;
}

// ─── Monthly Trend ────────────────────────────────────────────────────────────
async function getMonthlyTrend(filters = {}) {
  logger.debug('getMonthlyTrend', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...filters, schoolYearId });
  const result = await request.query(buildMonthlyTrendQuery(filters));
  return result.recordset;
}

// ─── Day-of-Week ──────────────────────────────────────────────────────────────
async function getAbsenceByDOW(filters = {}) {
  logger.debug('getAbsenceByDOW', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...filters, schoolYearId });
  const result = await request.query(buildAbsenceByDOWQuery(filters));
  return result.recordset;
}

// ─── Chronic Absentees ────────────────────────────────────────────────────────
async function getChronicAbsentees(filters = {}) {
  logger.debug('getChronicAbsentees', filters);
  const effectiveFilters = { ...filters, threshold: filters.threshold ?? 10 };
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...effectiveFilters, schoolYearId });
  const result = await request.query(buildChronicAbsenteesQuery(effectiveFilters));
  return result.recordset;
}

// ─── Risk Distribution ────────────────────────────────────────────────────────
async function getRiskDistribution(filters = {}) {
  logger.debug('getRiskDistribution', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...filters, schoolYearId });
  const result = await request.query(buildRiskDistributionQuery(filters));
  return result.recordset[0] || {};
}

// ─── Quarterly Risk ───────────────────────────────────────────────────────────
async function getQuarterlyRisk(filters = {}) {
  logger.debug('getQuarterlyRisk', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...filters, schoolYearId });
  const result = await request.query(buildQuarterlyRiskQuery(filters));
  return result.recordset;
}

// ─── Truancy List ─────────────────────────────────────────────────────────────
async function getTruancyList(filters = {}) {
  logger.debug('getTruancyList', filters);
  const effectiveFilters = { ...filters, threshold: filters.threshold ?? 10 };
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const request      = pool.request();
  bindFilters(request, { ...effectiveFilters, schoolYearId });
  const result = await request.query(buildTruancyListQuery(effectiveFilters));
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
