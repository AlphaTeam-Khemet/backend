/**
 * voice.js
 * ========
 * Voice Tour Guide route — proxies narration requests to the
 * voice-tour-guide AI service (port 8003).
 *
 * Narration requests require authentication via the auth middleware.
 * Rate limited to 20 requests per 15 minutes per user to protect
 * ElevenLabs API quota.
 *
 * Route:
 *   POST /api/voice/artifacts/:artifactId/narrate
 */

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/voiceController');

// Rate limiter — 20 narration requests per 15 minutes per IP
// Protects ElevenLabs API quota from abuse
const voiceRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many narration requests. Please wait a few minutes.',
  },
});

router.get('/health', ctrl.health);

router.post(
  '/narrate',
  auth,
  voiceRateLimiter,
  ctrl.narrate
);

router.post(
  '/artifacts/:artifactId/narrate',
  auth,
  voiceRateLimiter,
  ctrl.narrateArtifact
);

router.get('/audio/:filename', auth, ctrl.streamNarrationAudio);

module.exports = router;
