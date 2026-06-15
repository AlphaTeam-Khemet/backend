/**
 * middleware/errorHandler.js
 * ==========================
 * Global error handler — catches all unhandled errors thrown
 * anywhere in the application and returns a consistent JSON response.
 *
 * Rules:
 * - Never leak stack traces or internal error messages to clients
 * - Always return a consistent { success, error, message } shape
 * - Log the full error internally with request ID for tracing
 * - Handle known error types with appropriate status codes
 */

module.exports = (err, req, res, next) => {
  const requestId = req.id || 'unknown';

  // Always log the full error internally
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  }));

  // Handle known error types with specific status codes
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
      requestId,
    });
  }

  if (err.name === 'UnauthorizedError' || err.message === 'No token provided') {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
      requestId,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_ENTRY',
      message: 'A record with this data already exists.',
      requestId,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.errors?.map(e => e.message).join(', ') || 'Validation failed.',
      requestId,
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      error: 'DATABASE_UNAVAILABLE',
      message: 'Database is temporarily unavailable. Please try again.',
      requestId,
    });
  }

  // Default: unknown error — never leak details to client
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred. Please try again.',
    requestId,
  });
};
