/**
 * middleware/requestId.js
 * =======================
 * Assigns a unique ID to every incoming request.
 *
 * The ID is attached to req.id and sent back in the
 * X-Request-ID response header so clients and logs
 * can trace a request end to end.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};
