const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

/**
 * Verifies Bearer JWT on every protected route.
 * Attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);
    res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
}

/**
 * Role-guard middleware factory.
 * Usage: router.get('/admin-only', authenticate, requireRole(['district_admin']))
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Build a data scope object from the authenticated user's JWT payload.
 * Used in services to restrict query results to role-appropriate data.
 */
function getDataScope(user = {}) {
  switch (user.role) {
    case 'school_admin':
      return { school: user.schoolId ?? null };
    case 'teacher':
      return { school: user.schoolId ?? null, grade: user.grade ?? null };
    case 'community_partner':
      return { aggregateOnly: true };
    default:
      return {}; // district_admin and truancy_officer see all
  }
}

module.exports = { authenticate, requireRole, getDataScope };
