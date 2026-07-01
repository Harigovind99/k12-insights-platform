// ─────────────────────────────────────────────────────────────────────────────
//  studentService.js  –  DASL read-only SQL Server
//
//  All queries are SELECT-only.  Tables use PascalCase column names exactly
//  as they appear in the DASL database.  No synthetic data.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { sql, getPool }    = require('../config/database');
const {
  buildStudentListQuery,
  buildStudentDetailQuery,
  buildGradeLevelListQuery,
  buildAssessmentResultsQuery,
  buildStudentAbsenceCalendarQuery,
} = require('../utils/sqlQueries');
const { resolveSchoolYearId } = require('../utils/yearResolver');
const logger = require('../utils/logger');

// ── Helper: bind named params to a mssql request ─────────────────────────────
function bindParams(request, params = {}) {
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      request.input(key, sql.NVarChar, null);
    } else if (typeof value === 'number' && Number.isInteger(value)) {
      request.input(key, sql.Int, value);
    } else if (typeof value === 'number') {
      request.input(key, sql.Decimal(18, 4), value);
    } else {
      request.input(key, sql.NVarChar, String(value));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  getStudents – paged student roster with absence totals
// ─────────────────────────────────────────────────────────────────────────────
async function getStudents(filters = {}) {
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear);
  const query        = buildStudentListQuery(filters);

  const request = pool.request();
  request.input('schoolYearId', sql.UniqueIdentifier, schoolYearId);
  if (filters.school && filters.school !== 'all') {
    request.input('school', sql.NVarChar, filters.school);
  }
  if (filters.grade && filters.grade !== 'all') {
    request.input('grade', sql.NVarChar, filters.grade);
  }
  if (filters.search) {
    request.input('search', sql.NVarChar, `%${filters.search}%`);
  }

  logger.debug('studentService.getStudents', { filters });
  const result = await request.query(query);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getStudentById – full profile for one student
// ─────────────────────────────────────────────────────────────────────────────
async function getStudentById(studentId, schoolYear) {
  const pool    = await getPool();
  const request = pool.request();

  request.input('studentId',  sql.UniqueIdentifier, studentId);

  const baseQuery = buildStudentDetailQuery();

  // Optionally filter to a specific school year in the LEFT JOIN
  const finalQuery = schoolYear
    ? baseQuery.replace(
        'WHERE s.StudentId = @studentId',
        'WHERE s.StudentId = @studentId AND (al.SchoolYear = @schoolYear OR al.SchoolYear IS NULL)',
      )
    : baseQuery;

  if (schoolYear) request.input('schoolYear', sql.NVarChar, schoolYear);

  logger.debug('studentService.getStudentById', { studentId, schoolYear });
  const result = await request.query(finalQuery);

  if (!result.recordset.length) return null;

  // Multiple rows possible when the student has multiple year records –
  // return the first (most recent year from ORDER BY in query)
  return result.recordset[0];
}

// ─────────────────────────────────────────────────────────────────────────────
//  getStudentAbsenceCalendar – daily absence events for a student
// ─────────────────────────────────────────────────────────────────────────────
async function getStudentAbsenceCalendar(studentId, schoolYear) {
  const pool    = await getPool();
  const request = pool.request();

  request.input('studentId',  sql.UniqueIdentifier, studentId);
  request.input('schoolYear', sql.NVarChar,         schoolYear || '');

  logger.debug('studentService.getStudentAbsenceCalendar', { studentId, schoolYear });
  const result = await request.query(buildStudentAbsenceCalendarQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getStudentAssessments – all test results for a student
// ─────────────────────────────────────────────────────────────────────────────
async function getStudentAssessments(studentId) {
  const pool    = await getPool();
  const request = pool.request();

  request.input('studentId', sql.UniqueIdentifier, studentId);

  logger.debug('studentService.getStudentAssessments', { studentId });
  const result = await request.query(buildAssessmentResultsQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getGradeLevels – distinct grade levels from Students table
// ─────────────────────────────────────────────────────────────────────────────
async function getGradeLevels() {
  const pool    = await getPool();
  const request = pool.request();

  logger.debug('studentService.getGradeLevels');
  const result = await request.query(buildGradeLevelListQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  searchStudents – quick name / number search (wraps getStudents with search)
// ─────────────────────────────────────────────────────────────────────────────
async function searchStudents(searchTerm, schoolYear, limit = 20) {
  return getStudents({ search: searchTerm, schoolYear, limit, offset: 0 });
}

module.exports = {
  getStudents,
  getStudentById,
  getStudentAbsenceCalendar,
  getStudentAssessments,
  getGradeLevels,
  searchStudents,
};
