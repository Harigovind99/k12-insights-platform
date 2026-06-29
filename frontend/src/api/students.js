import client from './client';

/**
 * GET /api/students
 * @param {object} params - { school, grade, group, riskLevel, interventionStatus, search, page, limit, sortCol, sortDir, schoolYear }
 */
export const getStudents = (params = {}) =>
  client.get('/students', { params });

/**
 * GET /api/students/:id
 */
export const getStudent = (id) =>
  client.get(`/students/${id}`);

/**
 * GET /api/students/:id/attendance
 * @param {object} params - { schoolYear, month }
 */
export const getStudentAttendance = (id, params = {}) =>
  client.get(`/students/${id}/attendance`, { params });

/**
 * GET /api/students/:id/assessments
 * @param {object} params - { subject, term }
 */
export const getStudentAssessments = (id, params = {}) =>
  client.get(`/students/${id}/assessments`, { params });

/**
 * GET /api/students/:id/interventions
 */
export const getStudentInterventions = (id) =>
  client.get(`/students/${id}/interventions`);

/**
 * GET /api/students/:id/contacts
 */
export const getStudentContacts = (id) =>
  client.get(`/students/${id}/contacts`);
