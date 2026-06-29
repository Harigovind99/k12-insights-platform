// ─────────────────────────────────────────────────────────────────────────────
//  schoolYearController.js  –  Express request/response handlers
//  All service calls are read-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const schoolYearService = require('../services/schoolYearService');

// GET /api/school-years
async function getSchoolYears(req, res, next) {
  try {
    const data = await schoolYearService.getSchoolYears();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/school-years/current
async function getCurrentSchoolYear(req, res, next) {
  try {
    const current = await schoolYearService.getCurrentSchoolYear();
    res.json({ schoolYear: current });
  } catch (err) {
    next(err);
  }
}

// GET /api/school-years/:id
async function getSchoolYearById(req, res, next) {
  try {
    const data = await schoolYearService.getSchoolYearById(req.params.id);
    if (!data) return res.status(404).json({ message: 'School year not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/school-years/:year/stats  (year as string, e.g. "2024-2025")
async function getSchoolYearStats(req, res, next) {
  try {
    const schoolYear = decodeURIComponent(req.params.year);
    const data = await schoolYearService.getSchoolYearStats(schoolYear);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSchoolYears,
  getCurrentSchoolYear,
  getSchoolYearById,
  getSchoolYearStats,
};
