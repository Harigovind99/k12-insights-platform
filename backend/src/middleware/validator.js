const { validationResult } = require('express-validator');

/**
 * Express-validator middleware — returns 400 if any validation errors exist.
 * Place after your express-validator chain in a route definition.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { validate };
