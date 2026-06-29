import client from './client';

export const getSchoolYears      = ()     => client.get('/school-years');
export const getActiveSchoolYear = ()     => client.get('/school-years/active');
