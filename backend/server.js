/**
 * server.js
 * =========
 * KHEMET backend server entry point.
 *
 * Responsibilities:
 *   1. Validate environment variables before anything else
 *   2. Connect to PostgreSQL with retry logic
 *   3. Sync Sequelize models
 *   4. Start the HTTP server
 *   5. Handle graceful shutdown on SIGTERM and SIGINT
 */

require('dotenv').config();

const validateEnv = require('./utils/startupValidator');
const logger = require('./utils/logger');
const app = require('./app');
const sequelize = require('./config/database');

// ── Step 1: Validate environment before anything else ─────────────────────
validateEnv();

const PORT = process.env.PORT || 3000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// ── Step 2: DB connect with retry ─────────────────────────────────────────
async function connectWithRetry(attempt = 1) {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully');
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      logger.error('PostgreSQL connection failed after max retries', {
        attempts: MAX_RETRIES,
        error: err.message,
      });
      process.exit(1);
    }
    logger.warn(`PostgreSQL connection failed — retrying in ${RETRY_DELAY_MS}ms`, {
      attempt,
      maxRetries: MAX_RETRIES,
      error: err.message,
    });
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return connectWithRetry(attempt + 1);
  }
}

// ── Step 3: Start the server ──────────────────────────────────────────────
async function start() {
  try {
    await connectWithRetry();

    // Enable uuid-ossp extension for UUID generation
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Load all models
    require('./models');

    // Sync models without { alter: true }
    // Going forward, all schema changes must be handled via formal migrations (e.g., Sequelize CLI or Umzug)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Sequelize models synced (dev mode)');
    } else {
      logger.warn('Skipping automatic model synchronization in production. Please run migrations.');
    }

    const server = app.listen(PORT, () => {
      logger.info('KHEMET backend started', {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
      });
    });

    // Fix Keep-Alive race condition with Dart/Flutter HTTP clients
    server.keepAliveTimeout = 120000; // 120 seconds
    server.headersTimeout = 121000; // 121 seconds

    // ── Step 4: Graceful shutdown ───────────────────────────────────────
    // Allows in-flight requests to complete before closing
    async function shutdown(signal) {
      logger.info(`${signal} received — starting graceful shutdown`);

      server.close(async () => {
        logger.info('HTTP server closed — no new connections accepted');

        try {
          await sequelize.close();
          logger.info('PostgreSQL connection pool closed');
        } catch (err) {
          logger.error('Error closing DB connection', { error: err.message });
        }

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Handle uncaught exceptions — log and exit cleanly
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', {
        error: err.message,
        stack: err.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', {
        reason: reason?.message || String(reason),
      });
      process.exit(1);
    });

  } catch (err) {
    logger.error('Server startup failed', { error: err.message });
    process.exit(1);
  }
}

start();
