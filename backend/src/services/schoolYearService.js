// ─────────────────────────────────────────────────────────────────────────────
//  schoolYearService.js  –  DASL read-only SQL Server
//
//  School year data is derived primarily from [CoreReports].[AttendanceLetter]:
//    • SchoolYear (varchar, e.g. "2024-2025")  — human-readable label
//    • SchoolYearId (uniqueidentifier)          — FK used in tracking tables
//    • CalendarDate (date)                      — start/end date ranges
//
//  The AttendanceTrackingYearlySummary table only stores SchoolYearId (GUID).
//  All service functions return the varchar SchoolYear label so callers can
//  pass it as @schoolYear to the SYID_SUBSELECT in sqlQueries.js.
//
//  getSchoolYearStats() has been upgraded to read totals from
//  AttendanceTrackingYearlySummary (pre-computed, more accurate) while
//  keeping CalendarDate range data from AttendanceLetter.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { sql, getPool }             = require('../config/database');
const { buildSchoolYearListQuery } = require('../utils/sqlQueries');
const logger                       = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
//  getSchoolYears – all distinct school years, most recent first
//
//  Source: AttendanceLetter (authoritative SchoolYear varchar + date range)
// ─────────────────────────────────────────────────────────────────────────────
async function getSchoolYears() {
  const pool    = await getPool();
  const request = pool.request();

  logger.debug('schoolYearService.getSchoolYears');
  const result = await request.query(buildSchoolYearListQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getCurrentSchoolYear – most recent SchoolYear string
// ─────────────────────────────────────────────────────────────────────────────
async function getCurrentSchoolYear() {
  const years = await getSchoolYears();
  if (!years.length) {
    // Fallback: derive from current date (August = new school year starts)
    const now       = new Date();
    const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYear}-${startYear + 1}`;
  }
  return years[0].SchoolYear;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getSchoolYearById – lookup one year by its GUID
//
//  Source: AttendanceLetter (contains both SchoolYear label and CalendarDate)
// ─────────────────────────────────────────────────────────────────────────────
async function getSchoolYearById(schoolYearId) {
  const pool    = await getPool();
  const request = pool.request();

  request.input('schoolYearId', sql.UniqueIdentifier, schoolYearId);

  const query = `
    SELECT DISTINCT
      al.SchoolYear,
      al.SchoolYearId,
      MIN(al.CalendarDate) AS StartDate,
      MAX(al.CalendarDate) AS EndDate
    FROM [CoreReports].[AttendanceLetter] al
    WHERE al.SchoolYearId = @schoolYearId
    GROUP BY al.SchoolYear, al.SchoolYearId
  `;

  logger.debug('schoolYearService.getSchoolYearById', { schoolYearId });
  const result = await request.query(query);
  return result.recordset[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getSchoolYearStats – enrollment and absence summary for a school year
//
//  Sources:
//    • AttendanceLetter   — TotalSchools, date range, TotalCalendarDays
//    • AttendanceTrackingYearlySummary — TotalStudents, avg/total absence
//      days (more accurate than scanning every AL row)
//
//  NOTE: We join the two sources on SchoolYearId resolved from the varchar
//  label via a sub-select — same pattern used throughout sqlQueries.js.
// ─────────────────────────────────────────────────────────────────────────────
async function getSchoolYearStats(schoolYear) {
  const pool    = await getPool();
  const request = pool.request();

  request.input('schoolYear', sql.NVarChar, schoolYear);

  const query = `
    /* Resolve the SchoolYearId GUID once */
    DECLARE @syId UNIQUEIDENTIFIER = (
      SELECT TOP 1 SchoolYearId
      FROM [CoreReports].[AttendanceLetter]
      WHERE SchoolYear = @schoolYear
    );

    /* Date-range and school-count from AttendanceLetter */
    WITH CalMeta AS (
      SELECT
        al.SchoolYear,
        al.SchoolYearId,
        COUNT(DISTINCT al.SchoolId)   AS TotalSchools,
        MIN(al.CalendarDate)          AS FirstAttendanceDate,
        MAX(al.CalendarDate)          AS LastAttendanceDate,
        COUNT(DISTINCT al.CalendarDate) AS TotalCalendarDays
      FROM [CoreReports].[AttendanceLetter] al
      WHERE al.SchoolYearId = @syId
      GROUP BY al.SchoolYear, al.SchoolYearId
    ),
    /* Pre-computed yearly totals from the tracking table */
    YearlyAgg AS (
      SELECT
        COUNT(*)                                               AS TotalStudents,
        CAST(AVG(aty.AbsenceDays)          AS DECIMAL(10,2))  AS AvgAbsenceDays,
        CAST(SUM(aty.AbsenceDays)          AS DECIMAL(10,2))  AS TotalAbsenceDays,
        CAST(AVG(aty.UnexcusedAbsenceDays) AS DECIMAL(10,2))  AS AvgUnexcusedDays,
        CAST(SUM(aty.UnexcusedAbsenceDays) AS DECIMAL(10,2))  AS TotalUnexcusedDays,
        /* Avg SchoolDays tells the consumer the enrolled day standard for this year */
        CAST(AVG(aty.SchoolDays)           AS DECIMAL(10,2))  AS AvgSchoolDays,
        /* Chronic count (Ohio 10% rule) */
        SUM(CASE WHEN aty.SchoolDays > 0
                  AND aty.AbsenceDays / aty.SchoolDays >= 0.10
                 THEN 1 ELSE 0 END)                           AS ChronicCount,
        CAST(
          100.0 * SUM(CASE WHEN aty.SchoolDays > 0
                            AND aty.AbsenceDays / aty.SchoolDays >= 0.10
                           THEN 1 ELSE 0 END)
          / NULLIF(COUNT(*), 0)
        AS DECIMAL(5,2))                                       AS ChronicAbsenceRate,
        SUM(aty.NumberOfTimesTardy)                           AS TotalTardy
      FROM [dbo].[AttendanceTrackingYearlySummary] aty
      WHERE aty.SchoolYearId = @syId
    )
    SELECT
      cm.SchoolYear,
      cm.SchoolYearId,
      cm.TotalSchools,
      cm.FirstAttendanceDate,
      cm.LastAttendanceDate,
      cm.TotalCalendarDays,
      ya.TotalStudents,
      ya.AvgSchoolDays,
      ya.AvgAbsenceDays,
      ya.TotalAbsenceDays,
      ya.AvgUnexcusedDays,
      ya.TotalUnexcusedDays,
      ya.ChronicCount,
      ya.ChronicAbsenceRate,
      ya.TotalTardy
    FROM CalMeta cm
    CROSS JOIN YearlyAgg ya
  `;

  logger.debug('schoolYearService.getSchoolYearStats', { schoolYear });
  const result = await request.query(query);
  return result.recordset[0] || {};
}

module.exports = {
  getSchoolYears,
  getCurrentSchoolYear,
  getSchoolYearById,
  getSchoolYearStats,
};
