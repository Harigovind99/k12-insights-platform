/**
 * DASL multi-schema middleware.
 * Reads X-DASL-Schema header from the request and sets req.schema,
 * which services use to scope SQL queries to the correct district schema.
 */
module.exports = function schemaMiddleware(req, _res, next) {
  const headerSchema = req.headers['x-dasl-schema'];
  const prefix       = process.env.DASL_SCHEMA_PREFIX || '';

  if (headerSchema) {
    // Sanitise: allow only alphanumeric + underscore
    const safe = headerSchema.replace(/[^a-zA-Z0-9_]/g, '');
    req.schema = prefix ? `${prefix}_${safe}` : safe;
  } else {
    req.schema = process.env.DB_NAME || 'dasl_db';
  }

  next();
};
