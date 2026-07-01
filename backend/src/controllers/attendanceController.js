'use strict';

const attendanceService = require('../services/attendanceService');

// GET /api/attendance/summary
async function getSummary(req, res, next) {
  try {
    const { schoolYear, school, grade, group, absenceType, month } = req.query;
    const data = await attendanceService.getAttendanceSummary({ schoolYear, school, grade, group, absenceType, month });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/schools
async function getSchoolBreakdown(req, res, next) {
  try {
    const { schoolYear, school, grade, group, absenceType, month } = req.query;
    const data = await attendanceService.getSchoolBreakdown({ schoolYear, school, grade, group, absenceType, month });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/trend
async function getMonthlyTrend(req, res, next) {
  try {
    const { schoolYear, school, grade, group, month } = req.query;
    const data = await attendanceService.getMonthlyTrend({ schoolYear, school, grade, group, month });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/dow
async function getAbsenceByDOW(req, res, next) {
  try {
    const { schoolYear, school, grade, group, month } = req.query;
    const data = await attendanceService.getAbsenceByDOW({ schoolYear, school, grade, group, month });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/truancy
async function getTruancyList(req, res, next) {
  try {
    const { schoolYear, school, grade, group, absenceType, limit, offset } = req.query;
    const data = await attendanceService.getTruancyList({
      schoolYear, school, grade, group, absenceType,
      limit:  parseInt(limit  || 50,  10),
      offset: parseInt(offset || 0,   10),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/quarterly
async function getQuarterlyRisk(req, res, next) {
  try {
    const { schoolYear, school, grade, group, quarter } = req.query;
    const data = await attendanceService.getQuarterlyRisk({ schoolYear, school, grade, group, quarter });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/chronic
async function getChronicAbsentees(req, res, next) {
  try {
    const { schoolYear, school, grade, group, absenceType, limit, offset } = req.query;
    const data = await attendanceService.getChronicAbsentees({
      schoolYear, school, grade, group, absenceType,
      limit:  parseInt(limit  || 100, 10),
      offset: parseInt(offset || 0,   10),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/risk
async function getRiskDistribution(req, res, next) {
  try {
    const { schoolYear, school, grade, group, absenceType } = req.query;
    const data = await attendanceService.getRiskDistribution({ schoolYear, school, grade, group, absenceType });
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
