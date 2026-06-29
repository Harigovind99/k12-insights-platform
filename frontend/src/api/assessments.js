import client from './client';

/**
 * GET /api/assessments/summary
 * District/school level score summaries.
 * @param {object} params - { schoolYear, school, grade, group, subject, term }
 */
export const getAssessmentSummary = (params = {}) =>
  client.get('/assessments/summary', { params });

/**
 * GET /api/assessments/growth
 * RIT growth data for NWEA MAP.
 * @param {object} params - { schoolYear, school, grade, subject }
 */
export const getAssessmentGrowth = (params = {}) =>
  client.get('/assessments/growth', { params });

/**
 * GET /api/assessments/proficiency
 * Proficiency band distribution.
 * @param {object} params - { schoolYear, school, grade, group, subject, term }
 */
export const getAssessmentProficiency = (params = {}) =>
  client.get('/assessments/proficiency', { params });

/**
 * GET /api/assessments/by-group
 * Disaggregated scores by student demographic group.
 * @param {object} params - { schoolYear, school, grade, subject, term }
 */
export const getAssessmentByGroup = (params = {}) =>
  client.get('/assessments/by-group', { params });
