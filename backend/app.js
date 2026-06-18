/**
 * app.js
 * ======
 * Express application setup for the KHEMET backend.
 *
 * Middleware stack (in order):
 *   1. requestId     — assigns unique ID to every request
 *   2. helmet        — security headers
 *   3. morgan        — HTTP request logging
 *   4. cors          — cross-origin resource sharing
 *   5. express.json  — JSON body parsing (10kb limit)
 *   6. routes        — all API routes
 *   7. notFound      — 404 handler for unmatched routes
 *   8. errorHandler  — global error handler
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────
// helmet sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
// and other security headers automatically
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── Request ID ────────────────────────────────────────────────────────────
// Assigns a unique ID to every request for end-to-end log tracing
app.use(requestId);

// ── HTTP Request Logging ──────────────────────────────────────────────────
// Logs method, path, status, response time for every request
const morganFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat));

// ── CORS ──────────────────────────────────────────────────────────────────
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body Parsing ──────────────────────────────────────────────────────────
// 10kb limit on JSON bodies prevents payload flooding attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Static Files ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ── View Engine ───────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/monuments', require('./routes/monuments'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/gallery',   require('./routes/gallery'));
app.use('/api/reviews',   require('./routes/reviews'));
app.use('/api/scan',      require('./routes/scan'));
app.use('/api/ai-guide',  require('./routes/aiGuideRoutes'));
app.use('/api/hieroglyph', require('./routes/hieroglyph'));
app.use('/api/voice',     require('./routes/voice'));
app.use('/',              require('./routes/web'));

// ── 404 Handler ───────────────────────────────────────────────────────────
// Must come after all routes
app.use(notFound);

// ── Global Error Handler ──────────────────────────────────────────────────
// Must be last — catches all errors thrown in routes and middleware
app.use(errorHandler);

module.exports = app;
