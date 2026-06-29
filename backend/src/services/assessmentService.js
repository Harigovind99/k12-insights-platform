// ─────────────────────────────────────────────────────────────────────────────
//  assessmentService.js  –  DASL read-only SQL Server
//
//  Tables used:
//    [dbo].[AssessmentStudent]     – one row per test event per student
//    [dbo].[AssessmentStudentCat]  – one row per score category per event
//    [dbo].[AssessmentTypes]       – lookup: AssessmentType_Id, LongName, ShortName
//    [dbo].[Students]              – joined for name / school / grade
//
//  NOTE: Score is stored as varchar in AssessmentStudentCat.Score.
//        TRY_CAST to DECIMAL is used for numeric aggregations.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { sql, getPool } = require('../config/database');
const {
  buildAssessmentResultsQuery,
  buildAssessmentDistrictSummaryQuery,
  buildAssessmentTypesQuery,
  schoolYearToDates,
} = require('../utils/sqlQueries');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
//  getStudentAssessments – all test results for one student
// ─────────────────────────────────────────────────────────────────────────────
async function getStudentAssessments(studentId) {
  const pool    = await getPool();
  const request = pool.request();
  request.input('studentId', sql.UniqueIdentifier, studentId);

  logger.debug('assessmentService.getStudentAssessments', { studentId });
  const result = await request.query(buildAssessmentResultsQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getDistrictAssessmentSummary – avg scores by assessment type, grade, school
// ─────────────────────────────────────────────────────────────────────────────
async function getDistrictAssessmentSummary(schoolYear) {
  const pool    = await getPool();
  const request = pool.request();

  const { start, end } = schoolYearToDates(schoolYear);
  request.input('startDate', sql.Date, start);
  request.input('endDate',   sql.Date, end);

  logger.debug('assessmentService.getDistrictAssessmentSummary', { schoolYear, start, end });
  const result = await request.query(buildAssessmentDistrictSummaryQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getAssessmentTypes – lookup list
// ─────────────────────────────────────────────────────────────────────────────
async function getAssessmentTypes() {
  const pool    = await getPool();
  const request = pool.request();

  logger.debug('assessmentService.getAssessmentTypes');
  const result = await request.query(buildAssessmentTypesQuery());
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getAssessmentsByType – results for a specific assessment type and school year
// ─────────────────────────────────────────────────────────────────────────────
async function getAssessmentsByType(assessmentTypeId, schoolYear, schoolName) {
  const pool    = await getPool();
  const request = pool.request();

  const { start, end } = schoolYearToDates(schoolYear);

  request.input('assessmentTypeId', sql.TinyInt, parseInt(assessmentTypeId, 10));
  request.input('startDate',        sql.Date,    start);
  request.input('endDate',          sql.Date,    end);

  const schoolFilter = schoolName
    ? 'AND s.SchoolName = @schoolName'
    : '';

  if (schoolName) request.input('schoolName', sql.NVarChar, schoolName);

  const query = `
    SELECT
      ast.AssessmentStudentId,
      ast.StudentId,
      s.StudentNumber,
      s.FirstName,
      s.LastName,
      s.GradeLevelName,
      s.SchoolName,
      at2.LongName        AS AssessmentName,
      at2.ShortName,
      at2.Abbreviation,
      ast.TestDate,
      asc2.AssessmentCategoryId,
      asc2.Score
    FROM [dbo].[AssessmentStudent]         ast
    JOIN [dbo].[Students]                  s    ON s.StudentId             = ast.StudentId
    JOIN [dbo].[AssessmentTypes]           at2  ON at2.AssessmentType_Id   = ast.AssessmentTypeId
    LEFT JOIN [dbo].[AssessmentStudentCat] asc2 ON asc2.AssessmentStudentId = ast.AssessmentStudentId
    WHERE ast.AssessmentTypeId = @assessmentTypeId
      AND ast.TestDate BETWEEN @startDate AND @endDate
      ${schoolFilter}
    ORDER BY s.LastName, s.FirstName, ast.TestDate DESC
  `;

  logger.debug('assessmentService.getAssessmentsByType', {
    assessmentTypeId, schoolYear, schoolName,
  });
  const result = await request.query(query);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getAssessmentScoreDistribution – score band counts for one assessment type
// ─────────────────────────────────────────────────────────────────────────────
async function getAssessmentScoreDistribution(assessmentTypeId, schoolYear) {
  const pool    = await getPool();
  const request = pool.request();

  const { start, end } = schoolYearToDates(schoolYear);

  request.input('assessmentTypeId', sql.TinyInt, parseInt(assessmentTypeId, 10));
  request.input('startDate',        sql.Date,    start);
  request.input('endDate',          sql.Date,    end);

  // Score is varchar – bucket numerically where possible
  const query = `
    WITH Scores AS (
      SELECT
        TRY_CAST(asc2.Score AS DECIMAL(10,2)) AS NumericScore,
        asc2.Score                             AS RawScore
      FROM [dbo].[AssessmentStudent]         ast
      JOIN [dbo].[AssessmentStudentCat]      asc2
        ON asc2.AssessmentStudentId = ast.AssessmentStudentId
      WHERE ast.AssessmentTypeId = @assessmentTypeId
        AND ast.TestDate BETWEEN @startDate AND @endDate
        AND asc2.Score IS NOT NULL
    )
    SELECT
      CASE
        WHEN sc.NumericScore IS NULL     THEN 'Non-numeric'
        WHEN sc.NumericScore < 25        THEN '0–24'
        WHEN sc.NumericScore < 50        THEN '25–49'
        WHEN sc.NumericScore < 75        THEN '50–74'
        WHEN sc.NumericScore < 100       THEN '75–99'
        ELSE '100+'
      END                                                   AS ScoreBand,
      COUNT(*)                                              AS StudentCount,
      CAST(AVG(sc.NumericScore) AS DECIMAL(10,2))           AS AvgScore,
      CAST(MIN(sc.NumericScore) AS DECIMAL(10,2))           AS MinScore,
      CAST(MAX(sc.NumericScore) AS DECIMAL(10,2))           AS MaxScore
    FROM Scores sc
    GROUP BY
      CASE
        WHEN sc.NumericScore IS NULL     THEN 'Non-numeric'
        WHEN sc.NumericScore < 25        THEN '0–24'
        WHEN sc.NumericScore < 50        THEN '25–49'
        WHEN sc.NumericScore < 75        THEN '50–74'
        WHEN sc.NumericScore < 100       THEN '75–99'
        ELSE '100+'
      END
    ORDER BY MIN(sc.NumericScore)
  `;

  logger.debug('assessmentService.getAssessmentScoreDistribution', {
    assessmentTypeId, schoolYear,
  });
  const result = await request.query(query);
  return result.recordset;
}

module.exports = {
  getStudentAssessments,
  getDistrictAssessmentSummary,
  getAssessmentTypes,
  getAssessmentsByType,
  getAssessmentScoreDistribution,
};
