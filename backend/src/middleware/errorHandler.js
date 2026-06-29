const { logger } = require('../utils/logger');

/**
 * Central Express error handler.
 * All errors thrown/passed via next(err) land here.
 */
module.exports = function errorHandler(err, req, res, _next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    status,
    message,
    path:   req.path,
    method: req.method,
    stack:  process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
