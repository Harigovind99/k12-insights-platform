/**
 * config/index.js
 * Frontend-safe runtime configuration.
 *
 * RULES:
 *  - Only VITE_* variables may appear here — they are inlined at build time.
 *  - Never add database host, credentials, internal IPs, or any server-side
 *    secret. Those live exclusively in backend/.env and never cross to the client.
 */
const config = {
  /** Base URL of the Express API (no trailing slash). */
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',

  /** Human-readable environment label. */
  appEnv: import.meta.env.VITE_APP_ENV || 'development',

  /**
   * Mock-data flag — always false in production.
   * The DASL RO database is the only data source.
   */
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',

  /** True when running Vite dev server. */
  isDev: import.meta.env.DEV,
};

export default config;
