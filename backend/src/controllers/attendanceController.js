// ─────────────────────────────────────────────────────────────────────────────
//  attendanceController.js  –  Express request/response handlers
//  All service calls are read-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const attendanceService = require('../services/attendanceService');

// GET /api/attendance/summary?schoolYear=2024-2025
async function getSummary(req, res, next) {
  try {
    const { schoolYear, school, grade } = req.query;
    const data = await attendanceService.getAttendanceSummary({ schoolYear, school, grade });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/schools?schoolYear=2024-2025
async function getSchoolBreakdown(req, res, next) {
  try {
    const { schoolYear, school, grade } = req.query;
    const data = await attendanceService.getSchoolBreakdown({ schoolYear, school, grade });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/trend?schoolYear=2024-2025&school=...
async function getMonthlyTrend(req, res, next) {
  try {
    const { schoolYear, school, grade } = req.query;
    const data = await attendanceService.getMonthlyTrend({ schoolYear, school, grade });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/dow?schoolYear=2024-2025&school=...
async function getAbsenceByDOW(req, res, next) {
  try {
    const { schoolYear, school, grade } = req.query;
    const data = await attendanceService.getAbsenceByDOW({ schoolYear, school, grade });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/truancy?schoolYear=...&school=...&grade=...&limit=50&offset=0
async function getTruancyList(req, res, next) {
  try {
    const { schoolYear, school, grade, limit, offset } = req.query;
    const data = await attendanceService.getTruancyList({
      schoolYear,
      school,
      grade,
      limit:  parseInt(limit  || 50,  10),
      offset: parseInt(offset || 0,   10),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/quarterly?schoolYear=2024-2025
async function getQuarterlyRisk(req, res, next) {
  try {
    const { schoolYear, school, grade, quarter } = req.query;
    const data = await attendanceService.getQuarterlyRisk({ schoolYear, school, grade, quarter });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/chronic?schoolYear=...&school=...&limit=100&offset=0
async function getChronicAbsentees(req, res, next) {
  try {
    const { schoolYear, school, grade, limit, offset } = req.query;
    const data = await attendanceService.getChronicAbsentees({
      schoolYear,
      school,
      grade,
      limit:  parseInt(limit  || 100, 10),
      offset: parseInt(offset || 0,   10),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/risk?schoolYear=2024-2025&school=...
async function getRiskDistribution(req, res, next) {
  try {
    const { schoolYear, school, grade } = req.query;
    const data = await attendanceService.getRiskDistribution({ schoolYear, school, grade });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getSchoolBreakdown,
  getMonthlyTrend,
  getAbsenceByDOW,
  getTruancyList,
  getQuarterlyRisk,
  getChronicAbsentees,
  getRiskDistribution,
};
