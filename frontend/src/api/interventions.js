import client from './client';

/**
 * GET /api/interventions
 * @param {object} params - { school, grade, status, interventionType, schoolYear }
 */
export const getInterventions = (params = {}) =>
  client.get('/interventions', { params });

/**
 * GET /api/interventions/:id
 */
export const getIntervention = (id) =>
  client.get(`/interventions/${id}`);

/**
 * POST /api/interventions
 * @param {object} body - { studentId, type, staffId, startDate, notes }
 */
export const createIntervention = (body) =>
  client.post('/interventions', body);

/**
 * PATCH /api/interventions/:id
 * @param {object} body - fields to update
 */
export const updateIntervention = (id, body) =>
  client.patch(`/interventions/${id}`, body);
