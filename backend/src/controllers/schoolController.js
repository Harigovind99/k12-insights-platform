// ─────────────────────────────────────────────────────────────────────────────
//  schoolController.js  –  Express request/response handlers
//  All service calls are read-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const schoolService = require('../services/schoolService');

// GET /api/schools
async function getSchools(req, res, next) {
  try {
    const data = await schoolService.getSchools();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/schools/district
async function getDistrictInfo(req, res, next) {
  try {
    const data = await schoolService.getDistrictInfo();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/schools/breakdown?schoolYear=2024-2025
async function getSchoolBreakdown(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const data = await schoolService.getSchoolBreakdown(schoolYear);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/schools/:id?schoolYear=2024-2025
async function getSchoolById(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const school = await schoolService.getSchoolById(req.params.id, schoolYear);
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (err) {
    next(err);
  }
}

// GET /api/schools/:id/grades
async function getSchoolGradeLevels(req, res, next) {
  try {
    const data = await schoolService.getSchoolGradeLevels(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/schools/:id/staff
async function getSchoolStaff(req, res, next) {
  try {
    const data = await schoolService.getSchoolStaff(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSchools,
  getDistrictInfo,
  getSchoolBreakdown,
  getSchoolById,
  getSchoolGradeLevels,
  getSchoolStaff,
};
