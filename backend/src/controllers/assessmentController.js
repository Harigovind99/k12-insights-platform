// ─────────────────────────────────────────────────────────────────────────────
//  assessmentController.js  –  Express request/response handlers
//  All service calls are read-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const assessmentService = require('../services/assessmentService');

// GET /api/assessments/types
async function getAssessmentTypes(req, res, next) {
  try {
    const data = await assessmentService.getAssessmentTypes();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/assessments/summary?schoolYear=2024-2025
async function getDistrictSummary(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const data = await assessmentService.getDistrictAssessmentSummary(schoolYear);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/assessments?assessmentTypeId=1&schoolYear=2024-2025&schoolName=...
async function getAssessmentsByType(req, res, next) {
  try {
    const { assessmentTypeId, schoolYear, schoolName } = req.query;
    const data = await assessmentService.getAssessmentsByType(
      assessmentTypeId,
      schoolYear,
      schoolName,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/assessments/distribution?assessmentTypeId=1&schoolYear=2024-2025
async function getScoreDistribution(req, res, next) {
  try {
    const { assessmentTypeId, schoolYear } = req.query;
    const data = await assessmentService.getAssessmentScoreDistribution(
      assessmentTypeId,
      schoolYear,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/assessments/student/:id
async function getStudentAssessments(req, res, next) {
  try {
    const data = await assessmentService.getStudentAssessments(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssessmentTypes,
  getDistrictSummary,
  getAssessmentsByType,
  getScoreDistribution,
  getStudentAssessments,
};
