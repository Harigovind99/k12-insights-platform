'use strict';

// ─── Absence type → DB column mapping ────────────────────────────────────────
const ABSENCE_TYPE_COL = {
  excused:    'ExcusedAbsenceDays',
  unexcused:  'UnexcusedAbsenceDays',
  tardy:      'NumberOfTimesTardy',
  suspension: 'OutOfSchoolSuspAbsenceDays',
};

function absenceTypeCol(absenceType) {
  return ABSENCE_TYPE_COL[absenceType] || 'AbsenceDays';
}

// ─── Grade filter normalization ──────────────────────────────────────────────
// s.GradeLevelName stores single-digit grades zero-padded ("01"-"09") and
// kindergarten as "KG", but the frontend filter sends "K"/"1"-"9". 10/11/12
// pass through unchanged since they're already two digits.
function normalizeGradeFilter(grade) {
  if (!grade || grade === 'all') return grade;
  if (grade === 'K') return 'KG';
  if (/^[1-9]$/.test(grade)) return `0${grade}`;
  return grade;
}

// ─── School filter subquery (monthly/daily tables) ────────────────────────────
function schoolFilterSubquery() {
  return `
    atm.StudentId IN (
      SELECT DISTINCT acs.StudentId
      FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] acs
      INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = acs.SchoolId
      WHERE sch.SchoolName = @school
        AND acs.SchoolYearId = @schoolYearId
    )`;
}

// ─── Group filter subquery ────────────────────────────────────────────────────
// Returns a SQL condition restricting to students in the given demographic group.
// tableAlias is the alias of the attendance table in the calling query (aty/atm/ac).
//
// tblStudentEMISSpecialEd confirmed columns: StudentId, IsActive, SchoolId,
//   SessionId, IEPTestType, OutcomeBeginDate, OutcomeEndDate, Date, etc.
// tblStudentFreeLunchStatus is a CODE LOOKUP TABLE only (no StudentId) — do not
//   use it for per-student FRL filtering.
// CoreReports.StudentDemographic column guesses: EconDisadvantaged, ELL,
//   Homeless, FosterCare — verify and adjust if a group returns 0 rows.
function buildGroupSubquery(group, tableAlias) {
  if (!group || group === 'all') return null;
  const sid = `${tableAlias}.StudentId`;

  switch (group) {
    case 'sped':
      // tblStudentEMISSpecialEd: per-student IEP/special-ed records (IsActive confirmed)
      return `${sid} IN (
        SELECT DISTINCT StudentId
        FROM [dbo].[tblStudentEMISSpecialEd]
        WHERE IsActive = 1
      )`;

    case 'frl':
      // tblStudentAnnual.StudentFreeLunchStatusId FK → tblStudentFreeLunchStatus
      // ID 2 = Reduced, ID 4 = Free  (1 = None, 8 = Applied-Denied — not eligible)
      return `${sid} IN (
        SELECT DISTINCT StudentId
        FROM [dbo].[tblStudentAnnual]
        WHERE SchoolYearId = @schoolYearId
          AND StudentFreeLunchStatusId IN (2, 4)
      )`;

    case 'el':
      // ELL-enrolled students use ProgramName values containing 'ELL', 'ESL', or 'Dual Language'.
      // Covers: "ELL Assignment", "ELL Assignement" (data typo), "ELL Assign + McKinney Vento",
      //         "Content Classes with Integrated ESL Support", "Dual Language Program" variants.
      return `${sid} IN (
        SELECT DISTINCT StudentId
        FROM [CoreReports].[StudentDemographic]
        WHERE SchoolYear = @schoolYear
          AND (
            ProgramName LIKE '%ELL%'
            OR ProgramName LIKE '%ESL%'
            OR ProgramName LIKE '%Dual Language%'
          )
      )`;

    case 'homeless':
      // McKinney-Vento covers all homeless designations in this system.
      // ProgramName contains 'McKinney' for all variants (including combinations with ELL,
      // counselor assignments, voluntary transfer, etc.) plus the standalone 'Homeless' program.
      return `${sid} IN (
        SELECT DISTINCT StudentId
        FROM [CoreReports].[StudentDemographic]
        WHERE SchoolYear = @schoolYear
          AND (
            ProgramName LIKE '%McKinney%'
            OR ProgramName = 'Homeless'
          )
      )`;

    case 'foster':
      // 'Court Placed' is the closest indicator of foster/court-ordered placement in ProgramName.
      // If more foster youth are tracked elsewhere, expand this condition.
      return `${sid} IN (
        SELECT DISTINCT StudentId
        FROM [CoreReports].[StudentDemographic]
        WHERE SchoolYear = @schoolYear
          AND ProgramName = 'Court Placed'
      )`;

    default:
      return null;
  }
}

// ─── Attendance Summary (KPI cards) ──────────────────────────────────────────
function buildAttendanceSummaryQuery({ school, grade, absenceType, group, month } = {}) {
  const absCol = absenceTypeCol(absenceType);

  // When a specific month is selected, route through the monthly table —
  // the yearly summary has no Month column so cannot filter to a single month.
  if (month && month !== 'all') {
    const conditions = [
      `(@startYear IS NULL OR ((atm.Year = @startYear AND atm.Month >= 8) OR (atm.Year = @endYear AND atm.Month <= 7)))`,
      `atm.Month = @month`,
    ];
    const joins = [];

    if (school && school !== 'all') {
      conditions.push(`atm.StudentId IN (
        SELECT DISTINCT sa.StudentId
        FROM [dbo].[tblStudentAnnual] sa
        INNER JOIN [dbo].[tblSchool] sch2 ON sch2.SchoolId = sa.SchoolId
        WHERE sa.SchoolYearId = @schoolYearId AND sch2.SchoolName = @school
      )`);
    }
    if (grade && grade !== 'all') {
      conditions.push(`s.GradeLevelName = @grade`);
      joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = atm.StudentId`);
    }
    const groupCond = buildGroupSubquery(group, 'atm');
    if (groupCond) conditions.push(groupCond);

    // Monthly table has AbsenceDays/Excused/Unexcused/Tardy but NOT Suspension/Medical/SchoolDays
    const mCol = (absCol === 'OutOfSchoolSuspAbsenceDays' || absCol === 'MedicalExcusedAbsenceDays')
      ? 'AbsenceDays' : absCol;

    return `
      SELECT
        COUNT(DISTINCT atm.StudentId)    AS TotalStudents,
        SUM(atm.${mCol})                 AS TotalAbsenceDays,
        SUM(atm.ExcusedAbsenceDays)      AS TotalExcused,
        SUM(atm.UnexcusedAbsenceDays)    AS TotalUnexcused,
        NULL                              AS TotalSuspension,
        NULL                              AS TotalMedical,
        SUM(atm.NumberOfTimesTardy)      AS TotalTardy,
        NULL                              AS TotalSchoolDays,
        NULL                              AS TotalActualDays,
        NULL                              AS AvgAbsenceRate,
        NULL                              AS ChronicAbsentCount
      FROM [dbo].[tblAttendanceTrackingMonthlySummary] atm
      ${joins.join('\n    ')}
      WHERE ${conditions.join('\n      AND ')}
    `;
  }

  // ── Full-year path (no month filter) ──────────────────────────────────────
  const conditions = [`aty.SchoolYearId = @schoolYearId`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId`);
  }
  const groupCond = buildGroupSubquery(group, 'aty');
  if (groupCond) conditions.push(groupCond);

  return `
    SELECT
      COUNT(DISTINCT aty.StudentId)                                  AS TotalStudents,
      SUM(aty.${absCol})                                             AS TotalAbsenceDays,
      SUM(aty.ExcusedAbsenceDays)                                    AS TotalExcused,
      SUM(aty.UnexcusedAbsenceDays)                                  AS TotalUnexcused,
      SUM(aty.OutOfSchoolSuspAbsenceDays)                            AS TotalSuspension,
      SUM(aty.MedicalExcusedAbsenceDays)                             AS TotalMedical,
      SUM(aty.NumberOfTimesTardy)                                    AS TotalTardy,
      SUM(aty.SchoolDays)                                            AS TotalSchoolDays,
      SUM(aty.ActualDays)                                            AS TotalActualDays,
      CASE WHEN SUM(aty.SchoolDays) > 0
           THEN CAST(SUM(aty.${absCol}) * 100.0 / SUM(aty.SchoolDays) AS DECIMAL(5,2))
           ELSE 0 END                                                AS AvgAbsenceRate,
      COUNT(DISTINCT CASE
            WHEN aty.SchoolDays > 0
             AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= 10
            THEN aty.StudentId END)                                  AS ChronicAbsentCount
    FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
  `;
}

// ─── School Breakdown ────────────────────────────────────────────────────────
function buildSchoolBreakdownQuery({ school, grade, absenceType, group, month } = {}) {
  const absCol = absenceTypeCol(absenceType);

  if (month && month !== 'all') {
    // Monthly table has no SchoolId; join through tblStudentAnnual (has SchoolId + IsPrimary)
    // to assign each student to their primary school for the selected month.
    const conditions = [
      `(@startYear IS NULL OR ((atm.Year = @startYear AND atm.Month >= 8) OR (atm.Year = @endYear AND atm.Month <= 7)))`,
      `atm.Month = @month`,
      `sch.SchoolName IS NOT NULL`,
    ];
    const joins = [
      `INNER JOIN [dbo].[tblStudentAnnual] sa ON sa.StudentId = atm.StudentId AND sa.SchoolYearId = @schoolYearId AND sa.IsPrimary = 1`,
      `INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = sa.SchoolId`,
    ];

    if (school && school !== 'all') conditions.push(`sch.SchoolName = @school`);
    if (grade && grade !== 'all') {
      conditions.push(`s.GradeLevelName = @grade`);
      joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = atm.StudentId`);
    }
    const groupCond = buildGroupSubquery(group, 'atm');
    if (groupCond) conditions.push(groupCond);

    const mCol = (absCol === 'OutOfSchoolSuspAbsenceDays' || absCol === 'MedicalExcusedAbsenceDays')
      ? 'AbsenceDays' : absCol;

    return `
      SELECT
        sch.SchoolName,
        COUNT(DISTINCT atm.StudentId)                                               AS StudentCount,
        SUM(atm.${mCol})                                                            AS TotalAbsenceDays,
        SUM(atm.ExcusedAbsenceDays)                                                 AS ExcusedDays,
        SUM(atm.UnexcusedAbsenceDays)                                               AS UnexcusedDays,
        SUM(atm.NumberOfTimesTardy)                                                 AS TotalTardy,
        NULL                                                                         AS TotalSchoolDays,
        NULL                                                                         AS AbsenceRate,
        NULL                                                                         AS ChronicCount
      FROM [dbo].[tblAttendanceTrackingMonthlySummary] atm
      ${joins.join('\n    ')}
      WHERE ${conditions.join('\n      AND ')}
      GROUP BY sch.SchoolName
      ORDER BY TotalAbsenceDays DESC
    `;
  }

  // ── Full-year path (no month filter) ──────────────────────────────────────
  const conditions = [`aty.SchoolYearId = @schoolYearId`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId`);
  }
  const groupCond = buildGroupSubquery(group, 'aty');
  if (groupCond) conditions.push(groupCond);

  return `
    SELECT
      sch.SchoolName,
      COUNT(DISTINCT aty.StudentId)                                               AS StudentCount,
      SUM(aty.${absCol})                                                          AS TotalAbsenceDays,
      SUM(aty.ExcusedAbsenceDays)                                                 AS ExcusedDays,
      SUM(aty.UnexcusedAbsenceDays)                                               AS UnexcusedDays,
      SUM(aty.NumberOfTimesTardy)                                                 AS TotalTardy,
      SUM(aty.SchoolDays)                                                         AS TotalSchoolDays,
      CASE WHEN SUM(aty.SchoolDays) > 0
           THEN CAST(SUM(aty.${absCol}) * 100.0 / SUM(aty.SchoolDays) AS DECIMAL(5,2))
           ELSE 0 END                                                             AS AbsenceRate,
      COUNT(DISTINCT CASE
            WHEN aty.SchoolDays > 0
             AND (aty.AbsenceDays * 100.0 / aty.SchoolDays) >= 10
            THEN aty.StudentId END)                                               AS ChronicCount
    FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
      AND sch.SchoolName IS NOT NULL
    GROUP BY sch.SchoolName
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Monthly Trend ───────────────────────────────────────────────────────────
function buildMonthlyTrendQuery({ school, grade, month, group } = {}) {
  const conditions = [
    `(@startYear IS NULL OR ((atm.Year = @startYear AND atm.Month >= 8) OR (atm.Year = @endYear AND atm.Month <= 7)))`,
  ];

  if (month && month !== 'all') {
    conditions.push(`atm.Month = @month`);
  }
  if (school && school !== 'all') {
    conditions.push(schoolFilterSubquery());
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }
  const groupCond = buildGroupSubquery(group, 'atm');
  if (groupCond) conditions.push(groupCond);

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
    FROM [dbo].[tblAttendanceTrackingMonthlySummary] atm
    ${studentJoin}
    WHERE ${conditions.join('\n      AND ')}
    GROUP BY atm.MonthName, atm.Month, atm.Year
    ORDER BY atm.Year, atm.Month
  `;
}

// ─── Day-of-Week Breakdown ───────────────────────────────────────────────────
function buildAbsenceByDOWQuery({ school, grade, month, group } = {}) {
  const conditions = [`ac.SchoolYearId = @schoolYearId`, `ac.AbsenceDays > 0`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = ac.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = ac.StudentId AND s.SchoolYearId = ac.SchoolYearId`);
  }
  if (month && month !== 'all') {
    conditions.push(`MONTH(ac.CalendarDate) = @month`);
  }
  const groupCond = buildGroupSubquery(group, 'ac');
  if (groupCond) conditions.push(groupCond);

  return `
    SELECT
      DATENAME(WEEKDAY, ac.CalendarDate) AS DayOfWeek,
      DATEPART(WEEKDAY, ac.CalendarDate) AS DayNumber,
      COUNT(*)                           AS AbsenceCount,
      SUM(ac.AbsenceDays)                AS TotalAbsenceDays
    FROM [dbo].[tblAttendanceTrackingDailySummaryBySchool] ac
    ${joins.join('\n    ')}
    WHERE ${conditions.join('\n      AND ')}
      AND ac.CalendarDate IS NOT NULL
    GROUP BY DATENAME(WEEKDAY, ac.CalendarDate), DATEPART(WEEKDAY, ac.CalendarDate)
    ORDER BY DayNumber
  `;
}

// ─── Chronic Absentees List ──────────────────────────────────────────────────
function buildChronicAbsenteesQuery({ school, grade, threshold = 10, absenceType, group } = {}) {
  const absCol = absenceTypeCol(absenceType);
  const conditions = [`aty.SchoolYearId = @schoolYearId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }
  const groupCond = buildGroupSubquery(group, 'aty');
  if (groupCond) conditions.push(groupCond);

  return `
    SELECT
      s.StudentId,
      s.StudentNumber,
      s.FirstName,
      s.LastName,
      s.GradeLevelName                                                              AS GradeLevel,
      sch.SchoolName,
      aty.${absCol}                                                                 AS AbsenceDays,
      aty.ExcusedAbsenceDays,
      aty.UnexcusedAbsenceDays,
      aty.SchoolDays,
      CASE WHEN aty.SchoolDays > 0
           THEN CAST(aty.${absCol} * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
           ELSE 0 END                                                               AS AbsenceRate
    FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
    INNER JOIN [Mobile].[Students]  s   ON s.StudentId  = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId
    INNER JOIN [dbo].[tblSchool]    sch ON sch.SchoolId = aty.SchoolId
    WHERE ${conditions.join('\n      AND ')}
      AND aty.SchoolDays > 0
      AND (aty.${absCol} * 100.0 / aty.SchoolDays) >= @threshold
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Risk Distribution ───────────────────────────────────────────────────────
function buildRiskDistributionQuery({ school, grade, absenceType, group } = {}) {
  const absCol = absenceTypeCol(absenceType);
  const conditions = [`aty.SchoolYearId = @schoolYearId`];
  const joins = [`INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
    joins.push(`INNER JOIN [Mobile].[Students] s ON s.StudentId = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId`);
  }
  const groupCond = buildGroupSubquery(group, 'aty');
  if (groupCond) conditions.push(groupCond);

  return `
    WITH StudentRates AS (
      SELECT
        aty.StudentId,
        CASE WHEN aty.SchoolDays > 0
             THEN aty.${absCol} * 100.0 / aty.SchoolDays
             ELSE 0 END AS AbsenceRate
      FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
      ${joins.join('\n      ')}
      WHERE ${conditions.join('\n        AND ')}
    )
    SELECT
      COUNT(CASE WHEN AbsenceRate <  2                        THEN 1 END) AS OnTrack,
      COUNT(CASE WHEN AbsenceRate >= 2  AND AbsenceRate <  5  THEN 1 END) AS Moderate,
      COUNT(CASE WHEN AbsenceRate >= 5  AND AbsenceRate < 10  THEN 1 END) AS AtRisk,
      COUNT(CASE WHEN AbsenceRate >= 10                       THEN 1 END) AS Chronic,
      COUNT(*)                                                              AS Total
    FROM StudentRates
  `;
}

// ─── Quarterly Risk ──────────────────────────────────────────────────────────
function buildQuarterlyRiskQuery({ school, grade, quarter, group } = {}) {
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
  const groupCond = buildGroupSubquery(group, 'atm');
  if (groupCond) conditions.push(groupCond);

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
      FROM [dbo].[tblAttendanceTrackingMonthlySummary] atm
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
function buildTruancyListQuery({ school, grade, threshold = 10, absenceType, group } = {}) {
  const absCol = absenceTypeCol(absenceType);
  const conditions = [`aty.SchoolYearId = @schoolYearId`];

  if (school && school !== 'all') {
    conditions.push(`sch.SchoolName = @school`);
  }
  if (grade && grade !== 'all') {
    conditions.push(`s.GradeLevelName = @grade`);
  }
  const groupCond = buildGroupSubquery(group, 'aty');
  if (groupCond) conditions.push(groupCond);

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
        aty.${absCol}                                                       AS AbsenceDays,
        aty.UnexcusedAbsenceDays,
        aty.SchoolDays,
        CASE WHEN aty.SchoolDays > 0
             THEN CAST(aty.${absCol} * 100.0 / aty.SchoolDays AS DECIMAL(5,2))
             ELSE 0 END                                                     AS AbsenceRate
      FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
      INNER JOIN [Mobile].[Students]  s   ON s.StudentId  = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId
      INNER JOIN [dbo].[tblSchool]    sch ON sch.SchoolId = aty.SchoolId
      WHERE ${conditions.join('\n        AND ')}
        AND aty.SchoolDays > 0
        AND (aty.${absCol} * 100.0 / aty.SchoolDays) >= @threshold
    )
    SELECT TOP 500 *
    FROM TruancyBase
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Student List ────────────────────────────────────────────────────────────
function buildStudentListQuery({ school, grade, search, riskLevel } = {}) {
  const conditions = [`aty.SchoolYearId = @schoolYearId`];

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
      FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
      INNER JOIN [Mobile].[Students]  s   ON s.StudentId  = aty.StudentId AND s.SchoolYearId = aty.SchoolYearId
      INNER JOIN [dbo].[tblSchool]    sch ON sch.SchoolId = aty.SchoolId
      WHERE ${conditions.join('\n        AND ')}
    )
    SELECT TOP 500 *
    FROM StudentBase
    ${riskFilter}
    ORDER BY AbsenceRate DESC
  `;
}

// ─── Student Detail ──────────────────────────────────────────────────────────
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
    LEFT JOIN [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
          ON aty.StudentId    = s.StudentId
         AND aty.SchoolYearId = @schoolYearId
    WHERE s.StudentId    = @studentId
      AND s.SchoolYearId = @schoolYearId
  `;
}

// ─── Student Absence Calendar ────────────────────────────────────────────────
function buildStudentAbsenceCalendarQuery() {
  return `
    SELECT
      ac.CalendarDate,
      ac.AbsenceDays,
      ac.ExcusedAbsenceDays,
      ac.UnexcusedAbsenceDays
    FROM [dbo].[tblAttendanceTrackingDailySummaryBySchool] ac
    WHERE ac.StudentId    = @studentId
      AND ac.SchoolYearId = @schoolYearId
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
    FROM [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
    INNER JOIN [dbo].[tblSchool] sch ON sch.SchoolId = aty.SchoolId
    WHERE sch.SchoolName IS NOT NULL
      AND aty.SchoolYearId = @schoolYearId
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
    INNER JOIN [dbo].[tblAttendanceTrackingYearlySummaryBySchool] aty
          ON aty.SchoolId    = sch.SchoolId
         AND aty.SchoolYearId = @schoolYearId
    WHERE sch.SchoolName = @school
  `;
}

// ─── School Year List ─────────────────────────────────────────────────────────
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
function buildAssessmentListQuery({ school, grade, subject } = {}) {
  const conditions = [`s.SchoolYearId = @schoolYearId`];

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
    INNER JOIN [Mobile].[Students]              s    ON s.StudentId          = ast.StudentId
    INNER JOIN [dm].[AssessmentTypes]           at2  ON at2.AssessmentType_Id = ast.AssessmentTypeId
    LEFT  JOIN [Staging].[AssessmentStudentCat] asc2 ON asc2.AssessmentStudentId = ast.AssessmentStudentId
    WHERE ${conditions.join('\n      AND ')}
    ORDER BY ast.TestDate DESC
  `;
}

// ─── Grade Level List ─────────────────────────────────────────────────────────
function buildGradeLevelListQuery() {
  return `
    SELECT DISTINCT GradeLevelName AS grade
    FROM [Mobile].[Students]
    WHERE GradeLevelName IS NOT NULL
    ORDER BY GradeLevelName
  `;
}

// ─── Assessment Results (per student) ────────────────────────────────────────
function buildAssessmentResultsQuery() {
  return `
    SELECT
      ast.AssessmentStudentId,
      ast.TestDate,
      at2.LongName                          AS AssessmentName,
      at2.ShortName,
      at2.Abbreviation,
      asc2.Score
    FROM [Staging].[AssessmentStudent] ast
    INNER JOIN [dm].[AssessmentTypes]           at2  ON at2.AssessmentType_Id = ast.AssessmentTypeId
    LEFT  JOIN [Staging].[AssessmentStudentCat] asc2 ON asc2.AssessmentStudentId = ast.AssessmentStudentId
    WHERE ast.StudentId = @studentId
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
  buildGradeLevelListQuery,
  buildAssessmentResultsQuery,
  normalizeGradeFilter,
};
