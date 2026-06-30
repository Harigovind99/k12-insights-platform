'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/attendanceController');

// District-wide KPI summary
router.get('/summary',    ctrl.getSummary);

// Per-school breakdown
router.get('/schools',    ctrl.getSchoolBreakdown);

// Monthly trend
router.get('/trend',      ctrl.getMonthlyTrend);

// Day-of-week pattern
router.get('/dow',        ctrl.getAbsenceByDOW);

// Truancy list (sorted by unexcused days)
router.get('/truancy',    ctrl.getTruancyList);

// Quarterly risk
router.get('/quarterly',  ctrl.getQuarterlyRisk);

// Chronic absentees (>= 18 days)
router.get('/chronic',    ctrl.getChronicAbsentees);

// Risk tier distribution counts
router.get('/risk',       ctrl.getRiskDistribution);

module.exports = router;

router.get('/', (req, res) => {
  res.json({ message: "Attendance API is working" });
});
