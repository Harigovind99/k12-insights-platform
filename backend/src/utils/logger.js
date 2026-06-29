'use strict';
/**
 * Simple logger — wraps console with level prefixes.
 * Drop-in replacement that matches the winston API surface used in services.
 */
const logger = {
  debug: (...args) => { if (process.env.NODE_ENV !== 'production') console.debug('[DEBUG]', ...args); },
  info:  (...args) => console.info ('[INFO] ',  ...args),
  warn:  (...args) => console.warn ('[WARN] ',  ...args),
  error: (...args) => console.error('[ERROR]',  ...args),
};

module.exports = logger;
