'use strict';

// ─── Helper: resolve SchoolYearId GUID from AttendanceLetter by year label ─────
// AttendanceLetter.SchoolYear is the human-readable varchar label (e.g. '2024-2025').
// AttendanceLetter.SchoolYearId is the uniqueidentifier FK shared by all
// attendance tracking tables, so this subselect returns the correct GUID type.
const schoolYearIdSubselect =
  `(SELECT TOP 1 SchoolYearId FROM [CoreReports].[AttendanceLetter]
    WHERE (@schoolYear IS NULL OR SchoolYear = @schoolYear)
    ORDER BY SchoolYear DESC)`;

// ─── Subquery: students enrolled in a specific school for the school year ──────
// AttendanceTrackingYearlySummaryBySchool has SchoolId → tblSchool.SchoolId.
// Used by monthly/quarterly queries that lack a direct SchoolId column.
function schoolFilterSubquery() {
  return `
    atm.StudentId IN (
      SELECT DISTINCT acs.StudentId
      FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] acs
      INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = acs.SchoolId
      WHERE sch.SchoolName = @school
        AND acs.SchoolYearId = ${schoolYearIdSubselect}
    )`;
}

// ─── Attendance Summary (KPI cards) ──────────────────────────────────────────
function buildAttendanceSummaryQuery({ school, grade } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId`);
  }

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
    FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
  `;
}

// ─── School Breakdown ────────────────────────────────────────────────────────
function buildSchoolBreakdownQuery({ school, grade } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId`);
  }

  return `
    SELECT
      sch.SchoolName,
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
    FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
      AND sch.SchoolName IS NOT NULL
    GROUP BY sch.SchoolName
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Monthly Trend ───────────────────────────────────────────────────────────
// AttendanceTrackingMonthlySummary has no SchoolId column, so school filter
// uses a subquery through AttendanceTrackingYearlySummaryBySchool.
// Year/month integers are used for filtering instead of the GUID SchoolYearId.
function buildMonthlyTrendQuery({ school, grade } = {}) {
  const conditions = [
    `(@startYear IS NULL OR ((atm.Year = @startYear AND atm.Month >= 8) OR (atm.Year = @endYear AND atm.Month <= 7)))`,
  ];

  if (school && school !== 'all') {
    conditions.push(schoolFilterSubquery());
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  const studentJoin = grade && grade !== 'all'
    ? `INNER JOIN [Mobile].[Students] s ON s.StudentId = atm.StudentId AND s.SchoolYearId = atm.SchoolYearId`
    : '';

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
    FROM [Staging].[AttendanceTrackingMonthlySummary] atm
    ${studentJoin}
    WHERE ${conditions.join('\n      AND ')}
    GROUP BY atm.MonthName, atm.Month, atm.Year
    ORDER BY atm.Year, atm.Month
  `;
}

// ─── Day-of-Week Breakdown ───────────────────────────────────────────────────
// AttendanceTrackingDailySummaryBySchool has CalendarDate, SchoolId, SchoolYearId
// and per-day absence totals — used instead of the raw absence cache table.
function buildAbsenceByDOWQuery({ school, grade } = {}) {
  const conditions = [`ac.SchoolYearId = ${schoolYearIdSubselect}`, `ac.AbsenceDays > 0`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = ac.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = ac.StudentId AND s.SchoolYearId = ac.SchoolYearId`);
  }

  return `
    SELECT
      DATENAME(WEEKDAY, ac.CalendarDate) AS DayOfWeek,
      DATEPART(WEEKDAY, ac.CalendarDate) AS DayNumber,
      COUNT(*)                           AS AbsenceCount,
      SUM(ac.AbsenceDays)                AS TotalAbsenceDays
    FROM [Staging].[AttendanceTrackingDailySummaryBySchool] ac
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
      AND ac.CalendarDate IS NOT NULL
    GROUP BY DATENAME(WEEKDAY, ac.CalendarDate), DATEPART(WEEKDAY, ac.CalendarDate)
    ORDER BY DayNumber
  `;
}

// ─── Chronic Absentees List ──────────────────────────────────────────────────
function buildChronicAbsenteesQuery({ school, grade, threshold = 10 } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
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
      sch.SchoolName,
      aty.AbsenceDays,
      aty.ExcusedAbsenceDays,
      aty.UnexcusedAbsenceDays,
      aty.SchoolDays,
      CASE WHEN aty.SchoolDays > 0
           THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
           ELSE 0 END                                                               AS AbsenceRate
    FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
    INNER JOIN [Mobile].[Students]  s   ON s.StudentId  = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId
    INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId
    WHERE ${conditions.join('\n      AND ')}
      AND aty.SchoolDays > 0
      AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= @threshold
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Risk Distribution ───────────────────────────────────────────────────────
function buildRiskDistributionQuery({ school, grade } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId`);
  }

  return `
    WITH StudentRates AS (
      SELECT
        aty.StudentId,
        CASE WHEN aty.SchoolDays > 0
             THEN aty.AbsenceDays * 100.0 / aty.SchoolDays
             ELSE 0 END AS AbsenceRate
      FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
      ${joins.join('\n      ')}
      WHERE ${conditions.join('\n        AND ')}
    )
    SELECT
      COUNT(CASE WHEN AbsenceRate <  2                             THEN 1 END) AS OnTrack,
      COUNT(CASE WHEN AbsenceRate >= 2  AND AbsenceRate <  5      THEN 1 END) AS Moderate,
      COUNT(CASE WHEN AbsenceRate >= 5  AND AbsenceRate < 10      THEN 1 END) AS AtRisk,
      COUNT(CASE WHEN AbsenceRate >= 10                           THEN 1 END) AS Chronic,
      COUNT(*)                                                                  AS Total
    FROM StudentRates
  `;
}

// ─── Quarterly Risk ──────────────────────────────────────────────────────────
// Uses Year/Month filtering; school filter uses the YearlySummaryBySchool subquery.
function buildQuarterlyRiskQuery({ school, grade, quarter } = {}) {
  const conditions = [
    `(@startYear IS NULL OR ((atm.Year = @startYear AND atm.Month >= 8) OR (atm.Year = @endYear AND atm.Month <= 7)))`,
  ];

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
    conditions.push(schoolFilterSubquery());
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }

  const studentJoin = grade && grade !== 'all'
    ? `INNER JOIN [Mobile].[Students] s ON s.StudentId = atm.StudentId AND s.SchoolYearId = atm.SchoolYearId`
    : '';

  return `
    WITH QuarterlyData AS (
      SELECT
        atm.StudentId,
        SUM(atm.AbsenceDays)          AS AbsenceDays,
        SUM(atm.ExcusedAbsenceDays)   AS ExcusedDays,
        SUM(atm.UnexcusedAbsenceDays) AS UnexcusedDays,
        COUNT(DISTINCT atm.Month)     AS MonthCount
      FROM [Staging].[AttendanceTrackingMonthlySummary] atm
      ${studentJoin}
      WHERE ${conditions.join('\n        AND ')}
      GROUP BY atm.StudentId
    )
    SELECT
      SUM(AbsenceDays)    AS TotalAbsenceDays,
      SUM(ExcusedDays)    AS TotalExcused,
      SUM(UnexcusedDays)  AS TotalUnexcused,
      COUNT(StudentId)    AS StudentCount
    FROM QuarterlyData
  `;
}

// ─── Truancy List ────────────────────────────────────────────────────────────
function buildTruancyListQuery({ school, grade, threshold = 10 } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
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
        sch.SchoolName,
        s.EMail,
        aty.AbsenceDays,
        aty.UnexcusedAbsenceDays,
        aty.SchoolDays,
        CASE WHEN aty.SchoolDays > 0
             THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
             ELSE 0 END                                                     AS AbsenceRate
      FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
      INNER JOIN [Mobile].[Students]  s   ON s.StudentId  = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId
      INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId
      WHERE ${conditions.join('\n        AND ')}
        AND aty.SchoolDays > 0
        AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= @threshold
    )
    SELECT TOP 500 *
    FROM TruancyBase
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Student List ────────────────────────────────────────────────────────────
function buildStudentListQuery({ school, grade, search, riskLevel } = {}) {
  const conditions = [`aty.SchoolYearId = ${schoolYearIdSubselect}`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }
  if (search) {
    conditions.push(`(s.FirstName LIKE @search OR s.LastName LIKE @search OR CAST(s.StudentNumber AS VARCHAR) LIKE @search)`);
  }

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
        sch.SchoolName,
        s.StatusName,
        aty.AbsenceDays,
        aty.ExcusedAbsenceDays,
        aty.UnexcusedAbsenceDays,
        aty.SchoolDays,
        aty.NumberOfTimesTardy,
        CASE WHEN aty.SchoolDays > 0
             THEN CAST(aty.AbsenceDays * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
             ELSE 0 END                                                     AS AbsenceRate
      FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
      INNER JOIN [Mobile].[Students]  s   ON s.StudentId  = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId
      INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId
      WHERE ${conditions.join('\n        AND ')}
    )
    SELECT TOP 500 *
    FROM StudentBase
    ${riskFilter}
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Student Detail ──────────────────────────────────────────────────────────
// Students view already contains SchoolName, so no tblSchool join is needed.
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
    FROM [Mobile].[Students] s
    LEFT JOIN [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
          ON aty.StudentId    = s.StudentId
         AND aty.SchoolYearId = s.SchoolYearId
    WHERE s.StudentId    = @studentId
      AND s.SchoolYearId = ${schoolYearIdSubselect}
  `;
}

// ─── Student Absence Calendar ────────────────────────────────────────────────
// AttendanceTrackingDailySummaryBySchool has CalendarDate, SchoolYearId,
// and per-day absence breakdown per student per school.
function buildStudentAbsenceCalendarQuery() {
  return `
    SELECT
      ac.CalendarDate,
      ac.AbsenceDays,
      ac.ExcusedAbsenceDays,
      ac.UnexcusedAbsenceDays
    FROM [Staging].[AttendanceTrackingDailySummaryBySchool] ac
    WHERE ac.StudentId    = @studentId
      AND ac.SchoolYearId = ${schoolYearIdSubselect}
      AND ac.AbsenceDays  > 0
    ORDER BY ac.CalendarDate
  `;
}

// ─── School List ─────────────────────────────────────────────────────────────
function buildSchoolListQuery() {
  return `
    SELECT DISTINCT
      sch.SchoolId,
      sch.SchoolName
    FROM [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
    INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId
    WHERE sch.SchoolName IS NOT NULL
      AND aty.SchoolYearId = ${schoolYearIdSubselect}
    ORDER BY SchoolName
  `;
}

// ─── School Detail ───────────────────────────────────────────────────────────
function buildSchoolDetailQuery() {
  return `
    SELECT TOP 1
      sch.SchoolId,
      sch.SchoolName
    FROM [dbo].[tblSchool] sch
    INNER JOIN [Staging].[AttendanceTrackingYearlySummaryBySchool] aty
          ON aty.SchoolId    = sch.SchoolId
         AND aty.SchoolYearId = ${schoolYearIdSubselect}
    WHERE sch.SchoolName = @school
  `;
}

// ─── School Year List ─────────────────────────────────────────────────────────
// AttendanceLetter.SchoolYear holds the human-readable label (e.g. '2024-2025').
function buildSchoolYearListQuery() {
  return `
    SELECT DISTINCT SchoolYear
    FROM [CoreReports].[AttendanceLetter]
    WHERE SchoolYear IS NOT NULL
    ORDER BY SchoolYear DESC
  `;
}

// ─── Intervention List ───────────────────────────────────────────────────────
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
    FROM [CoreReports].[AbsenceInterventionChecklist] aic
    WHERE ${conditions.join('\n      AND ')}
    ORDER BY aic.DateCreated DESC
  `;
}

// ─── Assessment List ─────────────────────────────────────────────────────────
// Students view provides SchoolYearId, SchoolName, GradeLevelName.
// AssessmentTypes PK is AssessmentType_Id; AssessmentStudent FK is AssessmentTypeId.
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
      s.StudentId,
      s.StudentNumber,
      s.FirstName,
      s.LastName,
      s.GradeLevelName                      AS GradeLevel,
      s.SchoolName,
      at2.LongName                          AS AssessmentName,
      at2.ShortName,
      at2.Abbreviation,
      asc2.Score
    FROM [Staging].[AssessmentStudent] ast
    INNER JOIN [Mobile].[Students]             s    ON s.StudentId          = ast.StudentId
    INNER JOIN [dm].[AssessmentTypes]      at2  ON at2.AssessmentType_Id = ast.AssessmentTypeId
    LEFT  JOIN [Staging].[AssessmentStudentCat] asc2 ON asc2.AssessmentStudentId = ast.AssessmentStudentId
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
