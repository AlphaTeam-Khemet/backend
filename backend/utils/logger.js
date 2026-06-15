/**
 * utils/logger.js
 * ===============
 * Structured JSON logger for the KHEMET backend.
 *
 * Replaces all console.log / console.error calls with
 * structured logs that include timestamp, level, and context.
 * In production these logs can be ingested by any log aggregator.
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('DB connected');
 *   logger.error('Startup failed', { error: err.message });
 *   logger.warn('Email service failed', { email: user.email });
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? LEVELS.info;

function log(level, message, context = {}) {
  if (LEVELS[level] > currentLevel) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'khemet-backend',
    message,
    ...context,
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

module.exports = {
  info:  (msg, ctx) => log('info',  msg, ctx),
  warn:  (msg, ctx) => log('warn',  msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
  debug: (msg, ctx) => log('debug', msg, ctx),
};
