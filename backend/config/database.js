/**
 * config/database.js
 * ==================
 * Sequelize PostgreSQL connection configuration.
 *
 * Pool settings are tuned for a small production deployment:
 *   max: 10 connections — handles concurrent requests
 *   min: 2 connections — keeps connections warm
 *   acquire: 30s — max wait time for a connection
 *   idle: 10s — close idle connections after 10s
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',

    // Use structured logger instead of console output
    logging: (msg) => logger.debug(msg),

    pool: {
      max: 10,        // Maximum connections in pool
      min: 2,         // Minimum connections kept alive
      acquire: 30000, // Max ms to wait for connection before throwing error
      idle: 10000,    // Ms a connection can be idle before being released
    },

    dialectOptions: {
      // Enables statement timeout — prevents runaway queries
      statement_timeout: 10000,
      // Enables connection timeout
      connect_timeout: 10,
    },
  }
);

module.exports = sequelize;
