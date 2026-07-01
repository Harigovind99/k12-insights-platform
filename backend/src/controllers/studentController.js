// ─────────────────────────────────────────────────────────────────────────────
//  studentController.js  –  Express request/response handlers
//  All service calls are read-only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const studentService      = require('../services/studentService');
const interventionService = require('../services/interventionService');

// GET /api/students?schoolYear=...&school=...&grade=...&search=...&riskLevel=...&limit=100&offset=0
async function getStudents(req, res, next) {
  try {
    const {
      schoolYear,
      school,
      grade,
      search,
      riskLevel,
      limit  = 100,
      offset = 0,
    } = req.query;

    const data = await studentService.getStudents({
      schoolYear,
      school,
      grade,
      search,
      riskLevel,
      limit:  parseInt(limit,  10),
      offset: parseInt(offset, 10),
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/search?q=...&schoolYear=...&limit=20
async function searchStudents(req, res, next) {
  try {
    const { q, schoolYear, limit = 20 } = req.query;
    const data = await studentService.searchStudents(q, schoolYear, parseInt(limit, 10));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/grades
async function getGradeLevels(req, res, next) {
  try {
    const data = await studentService.getGradeLevels();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id?schoolYear=2024-2025
async function getStudent(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const student = await studentService.getStudentById(req.params.id, schoolYear);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id/attendance?schoolYear=2024-2025
async function getStudentAttendance(req, res, next) {
  try {
    const { schoolYear } = req.query;
    const data = await studentService.getStudentAbsenceCalendar(req.params.id, schoolYear);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id/assessments
async function getStudentAssessments(req, res, next) {
  try {
    const data = await studentService.getStudentAssessments(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id/interventions
async function getStudentInterventions(req, res, next) {
  try {
    const data = await interventionService.getInterventionsByStudent(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudents,
  searchStudents,
  getGradeLevels,
  getStudent,
  getStudentAttendance,
  getStudentAssessments,
  getStudentInterventions,
};
