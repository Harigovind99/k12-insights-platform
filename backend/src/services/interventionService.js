// ─────────────────────────────────────────────────────────────────────────────
//  interventionService.js  –  DASL read-only SQL Server
//
//  Tables used:
//    [dbo].[AbsenceInterventionChecklist]  – student-intervention tracking
//    [dbo].[AbsenceInterventionInvolvement]– staff involvement per intervention
//    [dbo].[Interventions]                 – intervention type lookup (reference)
//
//  All queries are SELECT-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { sql, getPool } = require('../config/database');
const {
  buildInterventionListQuery,
  buildInterventionSummaryQuery,
  buildInterventionTypesQuery,
} = require('../utils/sqlQueries');
const logger = require('../utils/logger');

// ── Helper: bind named params ─────────────────────────────────────────────────
function bindParams(request, params = {}) {
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      request.input(key, sql.NVarChar, null);
    } else if (typeof value === 'number' && Number.isInteger(value)) {
      request.input(key, sql.Int, value);
    } else {
      request.input(key, sql.NVarChar, String(value));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  getInterventions – paged list of absence intervention checklist records
// ─────────────────────────────────────────────────────────────────────────────
async function getInterventions(filters = {}) {
  const pool = await getPool();
  const { query, params } = buildInterventionListQuery(filters);

  const request = pool.request();
  bindParams(request, params);

  logger.debug('interventionService.getInterventions', { filters });
  const result = await request.query(query);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getInterventionById – single intervention record by AbsenceInterventionId
// ─────────────────────────────────────────────────────────────────────────────
async function getInterventionById(interventionId) {
  const pool    = await getPool();
  const request = pool.request();
  request.input('interventionId', sql.Int, parseInt(interventionId, 10));

  const query = `
    SELECT
      aic.AbsenceInterventionId,
      aic.StudentId,
      aic.StudentNumber,
      aic.FirstName,
      aic.LastName,
      aic.MiddleName,
      aic.GradeLevel,
      aic.SchoolName,
      aic.SchoolYear,
      aic.Counselor,
      aic.HomeroomTeacher,
      aic.Program,
      aic.ProgramName,
      aic.StatusType,
      aic.StatusTypeId,
      aic.DateCreated,
      aic.SelectedTeamMembers,
      aic.ThreeParentContactAttemptsMade,
      aic.InformedParentOfDesigneeRight,
      aic.ParentFailedToRespond,
      aic.InvestigateReportingToChildServices,
      aic.InstructTeamToDevelopPlanWithoutParent,
      aic.AssignedTeamToStudent,
      aic.DevelopedPlan,
      aic.NotifiedParentInWriting,
      aic.FiledJuvenileCourtComplaint,
      aic.DistrictName,
      aic.DistrictCode,
      aic.SchoolCode,
      aic.SchoolIRN,
      aic.HomeSchoolName,
      aic.StateStudentId,
      aic.FiscalYear,
      aic.SchoolYearType
    FROM [dbo].[AbsenceInterventionChecklist] aic
    WHERE aic.AbsenceInterventionId = @interventionId
  `;

  logger.debug('interventionService.getInterventionById', { interventionId });
  const result = await request.query(query);
  return result.recordset[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getInterventionsByStudent – all interventions for one student
// ─────────────────────────────────────────────────────────────────────────────
async function getInterventionsByStudent(studentId) {
  const pool    = await getPool();
  const request = pool.request();
  request.input('studentId', sql.UniqueIdentifier, studentId);

  const query = `
    SELECT
      aic.AbsenceInterventionId,
      aic.StudentId,
      aic.StudentNumber,
      aic.FirstName,
      aic.LastName,
      aic.GradeLevel,
      aic.SchoolName,
      aic.SchoolYear,
      aic.Counselor,
      aic.StatusType,
      aic.StatusTypeId,
      aic.DateCreated,
      aic.DevelopedPlan,
      aic.NotifiedParentInWriting,
      aic.FiledJuvenileCourtComplaint,
      aic.ThreeParentContactAttemptsMade
    FROM [dbo].[AbsenceInterventionChecklist] aic
    WHERE aic.StudentId = @studentId
    ORDER BY aic.DateCreated DESC
  `;

  logger.debug('interventionService.getInterventionsByStudent', { studentId });
  const result = await request.query(query);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getInterventionSummary – counts by status type for a school year
// ─────────────────────────────────────────────────────────────────────────────
async function getInterventionSummary(schoolYear) {
  const pool    = await getPool();
  const request = pool.request();
  request.input('schoolYear', sql.NVarChar, schoolYear);

  logger.debug('interventionService.getInterventionSummary', { schoolYear });
  const result = await request.query(buildInterventionSummaryQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getInterventionTypes – lookup list from [dbo].[Interventions]
// ─────────────────────────────────────────────────────────────────────────────
async function getInterventionTypes() {
  const pool    = await getPool();
  const request = pool.request();

  logger.debug('interventionService.getInterventionTypes');
  const result = await request.query(buildInterventionTypesQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getInterventionTimeline – monthly counts of new interventions created
// ─────────────────────────────────────────────────────────────────────────────
async function getInterventionTimeline(schoolYear) {
  const pool    = await getPool();
  const request = pool.request();
  request.input('schoolYear', sql.NVarChar, schoolYear);

  const query = `
    SELECT
      YEAR(aic.DateCreated)                     AS CreatedYear,
      MONTH(aic.DateCreated)                    AS CreatedMonth,
      FORMAT(aic.DateCreated, 'MMM yyyy')       AS MonthLabel,
      COUNT(*)                                  AS NewInterventions,
      COUNT(DISTINCT aic.StudentId)             AS UniqueStudents
    FROM [dbo].[AbsenceInterventionChecklist] aic
    WHERE aic.SchoolYear = @schoolYear
      AND aic.DateCreated IS NOT NULL
    GROUP BY
      YEAR(aic.DateCreated),
      MONTH(aic.DateCreated),
      FORMAT(aic.DateCreated, 'MMM yyyy')
    ORDER BY CreatedYear, CreatedMonth
  `;

  logger.debug('interventionService.getInterventionTimeline', { schoolYear });
  const result = await request.query(query);
  return result.recordset;
}

module.exports = {
  getInterventions,
  getInterventionById,
  getInterventionsByStudent,
  getInterventionSummary,
  getInterventionTypes,
  getInterventionTimeline,
};
