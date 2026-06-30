'use strict';
/**
 * T-SQL query builders for K12 Insights Platform
 * Database: DASL (read-only SQL Server, NTLM auth)
 *
 * Key schema facts:
 *   • AttendanceTrackingYearlySummary  — no SchoolId; JOIN Students for school info
 *   • AttendanceTrackingMonthlySummary — has MonthName, Month, Year
 *   • AttendanceLetter                 — has SchoolYear (VARCHAR '2024-2025')
 *   • Students                         — PascalCase; SchoolName, GradeLevelName
 *   • SchoolYearId resolved via sub-select from AttendanceLetter
 *   • Risk tiers: Ohio HB 410 percentage-based (<2 / 2-5 / 5-10 / ≥10)
 */

// ─── Helper: resolve SchoolYearId GUID from varchar label ────────────────────
// When @schoolYear is NULL, ORDER BY DESC + TOP 1 returns the most recent year.
const schoolYearIdSubselect =
  `(SELECT TOP 1 SchoolYearId FROM [dbo].[AttendanceLetter] WHERE (@schoolYear IS NULL OR SchoolYear = @schoolYear) ORDER BY SchoolYear DESC)`;

// ─── Attendance Summary (KPI cards) ──────────────────────────────────────────
function buildAttendanceSummaryQuery({ school, grade, absenceType } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];
  const joins      = [
    `INNER JOIN [dbo].[Students] s ON s.StudentId = aty.StudentId`,
  ];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  // Absence type filter maps to column selection — handled in service layer

  return `
    SELECT
      COUNT(DISTINCT aty.StudentId)                                  AS TotalStudents,
      SUM(aty.AbsenceDays)                                           AS TotalAbsenceDays,
      SUM(aty.ExcusedAbsenceDays)                                    AS TotalExcused,
      SUM(aty.UnexcusedAbsenceDays)                                  AS TotalUnexcused,
      SUM(aty.OutOfSchoolSuspAbsenceDays)                            AS TotalSuspension,
      SUM(aty.MedicalExcusedAbsenceDays)                             AS TotalMedical,
      SUM(aty.NumberOfTimesTardy)                                    AS TotalTardy,
      SUM(aty.SchoolDays)                                            AS TotalSchoolDays,
      SUM(aty.ActualDays)                                            AS TotalActualDays,
      CASE WHEN SUM(aty.SchoolDays) > 0
           THEN CAST(SUM(aty.AbsenceDays) * 100.0 / SUM(aty.SchoolDays) AS DECIMAL(5,2))
           ELSE 0 END                                                AS AvgAbsenceRate,
      COUNT(DISTINCT CASE
            WHEN aty.SchoolDays > 0
             AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= 10
            THEN aty.StudentId END)                                  AS ChronicAbsentCount
    FROM [dbo].[AttendanceTrackingYearlySummary] aty
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
  `;
}

// ─── School Breakdown ─────────────────────────────────────────────────────────
// AttendanceTrackingYearlySummary has NO SchoolId — must JOIN Students
function buildSchoolBreakdownQuery({ school, grade } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  return `
    SELECT
      s.SchoolName,
      COUNT(DISTINCT aty.StudentId)                                               AS StudentCount,
      SUM(aty.AbsenceDays)                                                        AS TotalAbsenceDays,
      SUM(aty.ExcusedAbsenceDays)                                                 AS ExcusedDays,
      SUM(aty.UnexcusedAbsenceDays)                                               AS UnexcusedDays,
      SUM(aty.SchoolDays)                                                         AS TotalSchoolDays,
      CASE WHEN SUM(aty.SchoolDays) > 0
           THEN CAST(SUM(aty.AbsenceDays) * 100.0 / SUM(aty.SchoolDays) AS DECIMAL(5,2))
           ELSE 0 END                                                             AS AbsenceRate,
      COUNT(DISTINCT CASE
            WHEN aty.SchoolDays > 0
             AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= 10
            THEN aty.StudentId END)                                               AS ChronicCount
    FROM [dbo].[AttendanceTrackingYearlySummary] aty
    INNER JOIN [dbo].[Students] s ON s.StudentId = aty.StudentId
    WHERE ${conditions.join('\n      AND ')}
      AND s.SchoolName IS NOT NULL
    GROUP BY s.SchoolName
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Monthly Trend ────────────────────────────────────────────────────────────
function buildMonthlyTrendQuery({ school, grade } = {}) {
  const conditions = [`atm.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  return `
    SELECT
      atm.MonthName,
      atm.Month,
      atm.Year,
      COUNT(DISTINCT atm.StudentId)                                              AS StudentCount,
      SUM(atm.AbsenceDays)                                                       AS TotalAbsenceDays,
      SUM(atm.ExcusedAbsenceDays)                                                AS ExcusedDays,
      SUM(atm.UnexcusedAbsenceDays)                                              AS UnexcusedDays,
      SUM(atm.NumberOfTimesTardy)                                                AS TotalTardy
    FROM [dbo].[AttendanceTrackingMonthlySummary] atm
    INNER JOIN [dbo].[Students] s ON s.StudentId = atm.StudentId
    WHERE ${conditions.join('\n      AND ')}
    GROUP BY atm.MonthName, atm.Month, atm.Year
    ORDER BY atm.Year, atm.Month
  `;
}

// ─── Day-of-Week Breakdown ────────────────────────────────────────────────────
// Uses AttendanceLetter because we need CalendarDate granularity
function buildAbsenceByDOWQuery({ school, grade } = {}) {
  const conditions = [`al.SchoolYear = ISNULL(@schoolYear, (SELECT TOP 1 SchoolYear FROM [dbo].[AttendanceLetter] ORDER BY SchoolYear DESC))`];

  if (school && school !== 'all') {
    conditions.push(`al.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`al.GradeLevel = @grade`);
  }

  return `
    SELECT
      DATENAME(WEEKDAY, al.CalendarDate) AS DayOfWeek,
      DATEPART(WEEKDAY, al.CalendarDate) AS DayNumber,
      COUNT(*)                           AS AbsenceCount,
      SUM(al.AbsenceDays)                AS TotalAbsenceDays
    FROM [dbo].[AttendanceLetter] al
    WHERE ${conditions.join('\n      AND ')}
      AND al.CalendarDate IS NOT NULL
    GROUP BY DATENAME(WEEKDAY, al.CalendarDate), DATEPART(WEEKDAY, al.CalendarDate)
    ORDER BY DayNumber
  `;
}

// ─── Chronic Absentees List ───────────────────────────────────────────────────
// FIX: was HAVING without GROUP BY — now uses WHERE on a subquery
function buildChronicAbsenteesQuery({ school, grade, threshold = 10 } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  return `
    SELECT
      s.StudentId,
      s.StudentNumber,
      s.FirstName,
      s.LastName,
      s.GradeLevelName                                                              AS GradeLevel,
      s.SchoolName,
      aty.AbsenceDays,
      aty.ExcusedAbsenceDays,
      aty.UnexcusedAbsenceDays,
      aty.SchoolDays,
      CASE WHEN aty.SchoolDays > 0
           THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
           ELSE 0 END                                                               AS AbsenceRate
    FROM [dbo].[AttendanceTrackingYearlySummary] aty
    INNER JOIN [dbo].[Students] s ON s.StudentId = aty.StudentId
    WHERE ${conditions.join('\n      AND ')}
      AND aty.SchoolDays > 0
      AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= @threshold
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Risk Distribution ────────────────────────────────────────────────────────
// Ohio HB 410 % thresholds — uses WHERE not HAVING
function buildRiskDistributionQuery({ school, grade } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  return `
    WITH StudentRates AS (
      SELECT
        aty.StudentId,
        CASE WHEN aty.SchoolDays > 0
             THEN aty.AbsenceDays * 100.0 / aty.SchoolDays
             ELSE 0 END AS AbsenceRate
      FROM [dbo].[AttendanceTrackingYearlySummary] aty
      INNER JOIN [dbo].[Students] s ON s.StudentId = aty.StudentId
      WHERE ${conditions.join('\n        AND ')}
    )
    SELECT
      COUNT(CASE WHEN AbsenceRate <  2               THEN 1 END) AS OnTrack,
      COUNT(CASE WHEN AbsenceRate >= 2  AND AbsenceRate <  5 THEN 1 END) AS Moderate,
      COUNT(CASE WHEN AbsenceRate >= 5  AND AbsenceRate < 10 THEN 1 END) AS AtRisk,
      COUNT(CASE WHEN AbsenceRate >= 10                      THEN 1 END) AS Chronic,
      COUNT(*)                                                             AS Total
    FROM StudentRates
  `;
}

// ─── Quarterly Risk ───────────────────────────────────────────────────────────
function buildQuarterlyRiskQuery({ school, grade, quarter } = {}) {
  const conditions = [`atm.SchoolYearId = ${schoolYearIdSubselect}`];

  // Quarter → month numbers (Aug-start school year)
  const quarterMonths = {
    Q1: [8, 9, 10],
    Q2: [11, 12, 1],
    Q3: [2, 3, 4],
    Q4: [5, 6],
  };

  if (quarter && quarter !== 'all' && quarterMonths[quarter]) {
    const months = quarterMonths[quarter].join(',');
    conditions.push(`atm.Month IN (${months})`);
  }
  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  return `
    WITH QuarterlyData AS (
      SELECT
        atm.StudentId,
        SUM(atm.AbsenceDays)                                           AS AbsenceDays,
        SUM(atm.ExcusedAbsenceDays)                                    AS ExcusedDays,
        SUM(atm.UnexcusedAbsenceDays)                                  AS UnexcusedDays,
        COUNT(DISTINCT atm.Month)                                      AS MonthCount
      FROM [dbo].[AttendanceTrackingMonthlySummary] atm
      INNER JOIN [dbo].[Students] s ON s.StudentId = atm.StudentId
      WHERE ${conditions.join('\n        AND ')}
      GROUP BY atm.StudentId
    )
    SELECT
      SUM(AbsenceDays)                                                 AS TotalAbsenceDays,
      SUM(ExcusedDays)                                                 AS TotalExcused,
      SUM(UnexcusedDays)                                               AS TotalUnexcused,
      COUNT(StudentId)                                                 AS StudentCount
    FROM QuarterlyData
  `;
}

// ─── Truancy List ─────────────────────────────────────────────────────────────
function buildTruancyListQuery({ school, grade, threshold = 10 } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  return `
    WITH TruancyBase AS (
      SELECT
        s.StudentId,
        s.StudentNumber,
        s.FirstName,
        s.LastName,
        s.GradeLevelName                                                    AS GradeLevel,
        s.SchoolName,
        s.EMail,
        aty.AbsenceDays,
        aty.UnexcusedAbsenceDays,
        aty.SchoolDays,
        CASE WHEN aty.SchoolDays > 0
             THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
             ELSE 0 END                                                     AS AbsenceRate
      FROM [dbo].[AttendanceTrackingYearlySummary] aty
      INNER JOIN [dbo].[Students] s ON s.StudentId = aty.StudentId
      WHERE ${conditions.join('\n        AND ')}
        AND aty.SchoolDays > 0
        AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= @threshold
    )
    SELECT TOP 500 *
    FROM TruancyBase
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Student List ─────────────────────────────────────────────────────────────
function buildStudentListQuery({ school, grade, search, riskLevel } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }
  if (search) {
    conditions.push(`(s.FirstName LIKE @search OR s.LastName LIKE @search OR CAST(s.StudentNumber AS VARCHAR) LIKE @search)`);
  }

  // Risk level filter applied as a HAVING-style post-filter via CTE
  let riskFilter = '';
  if (riskLevel && riskLevel !== 'all') {
    const riskMap = {
      low:      `AbsenceRate <  2`,
      moderate: `AbsenceRate >= 2  AND AbsenceRate <  5`,
      at_risk:  `AbsenceRate >= 5  AND AbsenceRate < 10`,
      chronic:  `AbsenceRate >= 10`,
    };
    if (riskMap[riskLevel]) {
      riskFilter = `WHERE ${riskMap[riskLevel]}`;
    }
  }

  return `
    WITH StudentBase AS (
      SELECT
        s.StudentId,
        s.StudentNumber,
        s.FirstName,
        s.LastName,
        s.GradeLevelName                                                    AS GradeLevel,
        s.SchoolName,
        s.StatusName,
        aty.AbsenceDays,
        aty.ExcusedAbsenceDays,
        aty.UnexcusedAbsenceDays,
        aty.SchoolDays,
        aty.NumberOfTimesTardy,
        CASE WHEN aty.SchoolDays > 0
             THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
             ELSE 0 END                                                     AS AbsenceRate
      FROM [dbo].[AttendanceTrackingYearlySummary] aty
      INNER JOIN [dbo].[Students] s ON s.StudentId = aty.StudentId
      WHERE ${conditions.join('\n        AND ')}
    )
    SELECT TOP 500 *
    FROM StudentBase
    ${riskFilter}
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Student Detail ───────────────────────────────────────────────────────────
function buildStudentDetailQuery() {
  return `
    SELECT
      s.StudentId,
      s.StudentNumber,
      s.FirstName,
      s.LastName,
      s.MiddleName,
      s.Gender,
      s.Birthdate,
      s.GradeLevelName                                                      AS GradeLevel,
      s.SchoolName,
      s.StatusName,
      s.EMail,
      s.Number                                                              AS Phone,
      s.Address,
      s.City,
      s.State,
      s.Zip,
      s.CounselorFirstName,
      s.CounselorLastName,
      s.HomeroomTeacherFirstName,
      s.HomeroomTeacherLastName,
      aty.AbsenceDays,
      aty.ExcusedAbsenceDays,
      aty.UnexcusedAbsenceDays,
      aty.OutOfSchoolSuspAbsenceDays,
      aty.MedicalExcusedAbsenceDays,
      aty.SchoolDays,
      aty.ActualDays,
      aty.NumberOfTimesTardy,
      CASE WHEN aty.SchoolDays > 0
           THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
           ELSE 0 END                                                       AS AbsenceRate
    FROM [dbo].[Students] s
    LEFT JOIN [dbo].[AttendanceTrackingYearlySummary] aty
          ON aty.StudentId = s.StudentId
         AND aty.SchoolYearId = ${schoolYearIdSubselect}
    WHERE s.StudentId = @studentId
  `;
}

// ─── Student Absence Calendar ─────────────────────────────────────────────────
function buildStudentAbsenceCalendarQuery() {
  return `
    SELECT
      al.CalendarDate,
      al.AbsenceDays,
      al.ExcusedAbsenceDays,
      al.UnexcusedAbsenceDays
    FROM [dbo].[AttendanceLetter] al
    WHERE al.StudentId = @studentId
      AND al.SchoolYear = @schoolYear
    ORDER BY al.CalendarDate
  `;
}

// ─── School List ──────────────────────────────────────────────────────────────
function buildSchoolListQuery() {
  return `
    SELECT DISTINCT
      s.SchoolId,
      s.SchoolName
    FROM [dbo].[Students] s
    WHERE s.SchoolName IS NOT NULL
      AND s.SchoolYearId = ${schoolYearIdSubselect}
    ORDER BY s.SchoolName
  `;
}

// ─── School Detail ────────────────────────────────────────────────────────────
function buildSchoolDetailQuery() {
  return `
    SELECT TOP 1
      al.SchoolName,
      al.Principal,
      al.SchoolAddress,
      al.SchoolPhoneFormatted
    FROM [dbo].[AttendanceLetter] al
    WHERE al.SchoolName = @school
      AND al.SchoolYear  = @schoolYear
  `;
}

// ─── School Year List ─────────────────────────────────────────────────────────
function buildSchoolYearListQuery() {
  return `
    SELECT DISTINCT SchoolYear
    FROM [dbo].[AttendanceLetter]
    WHERE SchoolYear IS NOT NULL
    ORDER BY SchoolYear DESC
  `;
}

// ─── Intervention List ────────────────────────────────────────────────────────
function buildInterventionListQuery({ school, grade, status } = {}) {
  const conditions = [`aic.SchoolYear = @schoolYear`];

  if (school && school !== 'all') {
    conditions.push(`aic.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`aic.GradeLevel = @grade`);
  }
  if (status && status !== 'all') {
    conditions.push(`aic.StatusType = @status`);
  }

  return `
    SELECT TOP 500
      aic.AbsenceInterventionId,
      aic.StudentId,
      aic.StudentNumber,
      aic.FirstName,
      aic.LastName,
      aic.GradeLevel,
      aic.SchoolName,
      aic.StatusType,
      aic.Counselor,
      aic.HomeroomTeacher,
      aic.DateCreated,
      aic.AssignedTeamToStudent,
      aic.DevelopedPlan
    FROM [dbo].[AbsenceInterventionChecklist] aic
    WHERE ${conditions.join('\n      AND ')}
    ORDER BY aic.DateCreated DESC
  `;
}

// ─── Assessment List ──────────────────────────────────────────────────────────
function buildAssessmentListQuery({ school, grade, subject } = {}) {
  const conditions = [`s.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`s.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }
  if (subject) {
    conditions.push(`at2.LongName LIKE @subject`);
  }

  return `
    SELECT TOP 500
      ast.AssessmentStudentId,
      ast.TestDate,
      st.StudentId,
      st.StudentNumber,
      st.FirstName,
      st.LastName,
      st.GradeLevelName                     AS GradeLevel,
      st.SchoolName,
      at2.LongName                          AS AssessmentName,
      at2.ShortName,
      at2.Abbreviation,
      asc2.Score
    FROM [dbo].[AssessmentStudent] ast
    INNER JOIN [dbo].[Students]            st   ON st.StudentId       = ast.StudentId
    INNER JOIN [dbo].[AssessmentTypes]     at2  ON at2.AssessmentType_Id = ast.AssessmentTypeId
    LEFT  JOIN [dbo].[AssessmentStudentCat] asc2 ON asc2.AssessmentStudentId = ast.AssessmentStudentId
    WHERE ${conditions.join('\n      AND ')}
    ORDER BY ast.TestDate DESC
  `;
}

module.exports = {
  buildAttendanceSummaryQuery,
  buildSchoolBreakdownQuery,
  buildMonthlyTrendQuery,
  buildAbsenceByDOWQuery,
  buildChronicAbsenteesQuery,
  buildRiskDistributionQuery,
  buildQuarterlyRiskQuery,
  buildTruancyListQuery,
  buildStudentListQuery,
  buildStudentDetailQuery,
  buildStudentAbsenceCalendarQuery,
  buildSchoolListQuery,
  buildSchoolDetailQuery,
  buildSchoolYearListQuery,
  buildInterventionListQuery,
  buildAssessmentListQuery,
};
