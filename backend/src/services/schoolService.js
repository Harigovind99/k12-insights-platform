'use strict';
const { getPool }  = require('../config/database');
const logger       = require('../utils/logger');
const {
  buildSchoolListQuery,
  buildSchoolDetailQuery,
} = require('../utils/sqlQueries');

async function getSchools(filters = {}) {
  logger.debug('getSchools', filters);
  const sql     = require('mssql');
  const pool    = await getPool();
  const request = pool.request();
  request.input('schoolYear', sql.NVarChar, filters.schoolYear || '2024-2025');
  const result  = await request.query(buildSchoolListQuery());
  return result.recordset;
}

async function getSchoolDetail(filters = {}) {
  logger.debug('getSchoolDetail', filters);
  const sql     = require('mssql');
  const pool    = await getPool();
  const request = pool.request();
  request.input('schoolYear', sql.NVarChar, filters.schoolYear || '2024-2025');
  request.input('school',     sql.NVarChar, filters.school);
  const result  = await request.query(buildSchoolDetailQuery());
  return result.recordset[0] || null;
}

module.exports = { getSchools, getSchoolDetail };
