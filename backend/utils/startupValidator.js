/**
 * utils/startupValidator.js
 * =========================
 * Validates that all required environment variables are set
 * before the server starts accepting requests.
 *
 * If any required variable is missing the process exits
 * immediately with a clear error message — this prevents
 * the server from starting in a silently broken state.
 */

const logger = require('./logger');

const REQUIRED_ENV_VARS = [
  'DB_NAME',
  'DB_USER',
  'DB_PASS',
  'DB_HOST',
  'DB_PORT',
  'JWT_SECRET',
  'VOICE_SERVICE_URL',
  'AI_SERVICE_URL',
  'RAG_SERVICE_URL',
  'HIEROGLYPH_SERVICE_URL',
];

module.exports = function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    process.exit(1);
  }

  logger.info('Environment validation passed', {
    vars: REQUIRED_ENV_VARS.length,
  });
};
