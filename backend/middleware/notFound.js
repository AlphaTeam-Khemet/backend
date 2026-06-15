/**
 * middleware/notFound.js
 * ======================
 * Catches all requests that did not match any route
 * and returns a consistent 404 JSON response.
 */

module.exports = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} does not exist.`,
    requestId: req.id,
  });
};
