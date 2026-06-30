'use strict';
const { getPool } = require('../config/database');
const logger      = require('./logger');
const sql         = require('mssql');

// Resolved GUID cache — permanent for process lifetime (year GUIDs never change).
const cache   = new Map();
// In-flight promise map — prevents duplicate DB calls for the same year key
// when many requests arrive simultaneously before the first lookup completes.
const pending = new Map();

async function resolveSchoolYearId(schoolYear) {
  const key = schoolYear || '__default__';
  if (cache.has(key))   return cache.get(key);
  if (pending.has(key)) return pending.get(key);

  const promise = (async () => {
    try {
      const pool = await getPool();
      const req  = pool.request();
      req.input('sy', sql.NVarChar, schoolYear || null);
      const res = await req.query(`
        SELECT TOP 1 SchoolYearId
        FROM [CoreReports].[AttendanceLetter]
        WHERE (@sy IS NULL OR SchoolYear = @sy)
        ORDER BY SchoolYear DESC
      `);
      const id = res.recordset[0]?.SchoolYearId ?? null;
      logger.debug(`[yearResolver] '${schoolYear}' → SchoolYearId: ${id ?? 'NULL'}`);
      if (id) cache.set(key, id);
      return id;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, promise);
  return promise;
}

// Diagnostic — exposes raw table data to identify the correct lookup path.
async function runDiagnostic(schoolYear) {
  const pool = await getPool();
  const out  = { requestedYear: schoolYear };

  // 1. tblSchoolYear — the authoritative year reference table (base table, fast)
  try {
    const r = await pool.request().query(`
      SELECT TOP 10 SchoolYear, SchoolYearId
      FROM [dbo].[tblSchoolYear]
      ORDER BY SchoolYear DESC
    `);
    out.tblSchoolYear_rows = r.recordset;
  } catch (e) { out.tblSchoolYear_rows = `ERROR: ${e.message}`; }

  // 2. CoreReports.AttendanceLetter is a VIEW — may be slow
  try {
    const r = await pool.request().query(`
      SELECT DISTINCT TOP 10 SchoolYear
      FROM [CoreReports].[AttendanceLetter]
      WHERE SchoolYear IS NOT NULL
      ORDER BY SchoolYear DESC
    `);
    out.coreReportsAttendanceLetter_years = r.recordset.map(x => x.SchoolYear);
  } catch (e) { out.coreReportsAttendanceLetter_years = `ERROR: ${e.message}`; }

  // 3. Resolve SchoolYearId via the view
  let id = null;
  try {
    id = await resolveSchoolYearId(schoolYear);
  } catch (e) { out.resolveError = e.message; }
  out.resolvedSchoolYearId = id;

  // 4. If resolved, check row counts in candidate yearly summary tables
  if (id) {
    const checks = {
      'Staging.AttendanceTrackingYearlySummaryBySchool':    '[Staging].[AttendanceTrackingYearlySummaryBySchool]',
      'dbo.tblAttendanceTrackingYearlySummaryBySchool':     '[dbo].[tblAttendanceTrackingYearlySummaryBySchool]',
      'dbo.tblAttendanceTrackingYearlySummary':             '[dbo].[tblAttendanceTrackingYearlySummary]',
    };
    out.rowCounts = {};
    for (const [label, table] of Object.entries(checks)) {
      try {
        const req = pool.request();
        req.input('id', sql.UniqueIdentifier, id);
        const r = await req.query(`SELECT COUNT(*) AS cnt FROM ${table} WHERE SchoolYearId = @id`);
        out.rowCounts[label] = r.recordset[0]?.cnt;
      } catch (e) { out.rowCounts[label] = `ERROR: ${e.message}`; }
    }
  }

  // 5. Total rows regardless of year (to confirm which tables have any data)
  try {
    const r = await pool.request().query(`SELECT COUNT(*) AS total FROM [Staging].[AttendanceTrackingYearlySummaryBySchool]`);
    out.staging_total_rows_any_year = r.recordset[0]?.total;
  } catch (e) { out.staging_total_rows_any_year = `ERROR: ${e.message}`; }

  try {
    const r = await pool.request().query(`SELECT COUNT(*) AS total FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool]`);
    out.dbo_tbl_total_rows_any_year = r.recordset[0]?.total;
  } catch (e) { out.dbo_tbl_total_rows_any_year = `ERROR: ${e.message}`; }

  return out;
}

module.exports = { resolveSchoolYearId, runDiagnostic };
