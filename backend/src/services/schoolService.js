'use strict';
const sql                    = require('mssql');
const { getPool }            = require('../config/database');
const logger                 = require('../utils/logger');
const { resolveSchoolYearId } = require('../utils/yearResolver');
const {
  buildSchoolListQuery,
  buildSchoolDetailQuery,
} = require('../utils/sqlQueries');

async function getSchools(filters = {}) {
  logger.debug('getSchools', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear || '2024-2025');
  const request      = pool.request();
  request.input('schoolYearId', sql.UniqueIdentifier, schoolYearId);
  const result = await request.query(buildSchoolListQuery());
  return result.recordset;
}

async function getSchoolDetail(filters = {}) {
  logger.debug('getSchoolDetail', filters);
  const pool         = await getPool();
  const schoolYearId = await resolveSchoolYearId(filters.schoolYear || '2024-2025');
  const request      = pool.request();
  request.input('schoolYearId', sql.UniqueIdentifier, schoolYearId);
  request.input('school',       sql.NVarChar,         filters.school);
  const result = await request.query(buildSchoolDetailQuery());
  return result.recordset[0] || null;
}

module.exports = { getSchools, getSchoolDetail };
