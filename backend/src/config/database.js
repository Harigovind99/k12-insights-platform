'use strict';
const sql = require('mssql');

const config = {
  server:   process.env.DB_SERVER   || 'localhost',
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || process.env.DB_DATABASE || '',  // DB_NAME is canonical
  domain:   process.env.DB_DOMAIN || '',
  authentication: {
    type: 'ntlm',
    options: {
      domain:   process.env.DB_DOMAIN   || '',
      userName: process.env.DB_USER     || '',
      password: process.env.DB_PASSWORD || '',
    },
  },
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
    // Only pass instanceName when the env var is actually set
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
  requestTimeout: 30000,
  pool: {
    max:               30,
    min:               2,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (pool) return pool;
  pool = await new sql.ConnectionPool(config).connect();
  pool.on('error', (err) => {
    console.error('MSSQL pool error:', err);
    pool = null;  // allow reconnect on next request
  });
  return pool;
}

async function healthCheck() {
  try {
    const p   = await getPool();
    const res = await p.request().query('SELECT 1 AS ok');
    return res.recordset[0].ok === 1;
  } catch {
    return false;
  }
}

module.exports = { getPool, healthCheck, sql };
