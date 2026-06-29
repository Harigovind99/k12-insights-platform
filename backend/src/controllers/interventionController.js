// ─────────────────────────────────────────────────────────────────────────────
//  interventionController.js  –  Express request/response handlers
//  All service calls are read-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const interventionService = require('../services/interventionService');

// GET /api/interventions?schoolYear=...&schoolName=...&statusType=...&limit=50&offset=0
async function getInterventions(req, res, next) {
  try {
    const { schoolYear, schoolName, statusType, limit = 50, offset = 0 } = req.query;
    const data = await interventionService.getInterventions({
      schoolYear,
      schoolName,
      statusType,
      limit:  parseInt(limit,  10),
      offset: parseInt(offset, 10),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/interventions/summary?schoolYear=2024-2025
async function getInterventionSummary(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const data = await interventionService.getInterventionSummary(schoolYear);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/interventions/types
async function getInterventionTypes(req, res, next) {
  try {
    const data = await interventionService.getInterventionTypes();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/interventions/timeline?schoolYear=2024-2025
async function getInterventionTimeline(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const data = await interventionService.getInterventionTimeline(schoolYear);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/interventions/:id
async function getInterventionById(req, res, next) {
  try {
    const data = await interventionService.getInterventionById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Intervention not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInterventions,
  getInterventionSummary,
  getInterventionTypes,
  getInterventionTimeline,
  getInterventionById,
};
