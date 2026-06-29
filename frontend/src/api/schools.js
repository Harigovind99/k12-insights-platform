import client from './client';

export const getSchools   = (params = {}) => client.get('/schools', { params });
export const getSchool    = (id)           => client.get(`/schools/${id}`);
export const getSchoolKPIs = (id, params = {}) => client.get(`/schools/${id}/kpis`, { params });
