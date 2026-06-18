/**
 * voiceController.js
 * ==================
 * Controller for the Voice Tour Guide feature.
 *
 * Responsibilities:
 *   1. Check PostgreSQL cache for existing narration
 *   2. If cached → return immediately (fast path)
 *   3. If not cached → call voice service to generate audio
 *   4. Save result to PostgreSQL
 *   5. Return audio URL to frontend
 *
 * The voice-tour-guide AI service (port 8003) only generates audio.
 * All DB operations are handled here in the Node.js backend.
 */

const axios = require('axios');
const path = require('path');
const { ArtifactNarration } = require('../models');

const VOICE_SERVICE_URL = (
  process.env.VOICE_SERVICE_URL || 'http://voice-tour-guide:8003'
).replace(/\/$/, '');

const VOICE_SERVICE_TIMEOUT = parseInt(
  process.env.VOICE_SERVICE_TIMEOUT_MS || '60000',
  10
);

/**
 * POST /api/voice/artifacts/:artifactId/narrate
 *
 * Returns cached narration if available, otherwise generates new audio,
 * saves to DB, and returns the result.
 */
exports.narrateArtifact = async (req, res, next) => {
  const { artifactId } = req.params;
  const { language, artifact_name, artifact_description } = req.body;

  // ── Input Validation ───────────────────────────────────────────────────
  if (!language || !artifact_name || !artifact_description) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'language, artifact_name, and artifact_description are required.',
    });
  }

  if (!['en', 'ar'].includes(language)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_LANGUAGE',
      message: "language must be 'en' or 'ar'.",
    });
  }

  try {
    // ── State 1: Full cache hit ────────────────────────────────────────────
    // Row exists with audio_url → return immediately, no AI call needed
    const cached = await ArtifactNarration.findOne({
      where: { artifact_id: artifactId, language },
    });

    if (cached && cached.audio_url) {
      return res.status(200).json({
        success: true,
        data: {
          narration_text: cached.narration_text,
          audio_url: cached.audio_url,
          cached: true,
        },
      });
    }

    // ── State 2: Partial cache hit ─────────────────────────────────────────
    // Row exists but audio_url is null → retry TTS only, no new DB insert
    if (cached && !cached.audio_url) {
      let narrative = cached.narration_text;
      
      // If the cached narration is just the dry description, try to upgrade it!
      try {
        const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://chatbot-llm:8001';
        const storyResponse = await axios.post(`${RAG_SERVICE_URL}/story`, {
          artifact_name,
          base_description: artifact_description,
          language
        }, { timeout: 30000 });
        
        if (storyResponse.data && storyResponse.data.story) {
          narrative = storyResponse.data.story;
        }
      } catch (llmErr) {
        console.warn("Failed to generate story via LLM during retry:", llmErr.message);
      }

      const retryResponse = await axios.post(
        `${VOICE_SERVICE_URL}/generate`,
        {
          artifact_id: artifactId,
          language,
          text: narrative,
        },
        { timeout: VOICE_SERVICE_TIMEOUT }
      );

      const audio_url = retryResponse.data?.audio_url || null;

      if (audio_url) {
        // Update existing row with the new audio_url and upgraded narrative
        await cached.update({ audio_url, narration_text: narrative });
      }

      return res.status(200).json({
        success: true,
        data: {
          narration_text: narrative,
          audio_url,
          cached: true,
        },
      });
    }

    // ── State 3: Cache miss ────────────────────────────────────────────────
    // No row exists → call voice service to generate audio
    
    // First, rewrite the dry description into an engaging tour guide story
    let narrative = artifact_description;
    try {
      const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://chatbot-llm:8001';
      const storyResponse = await axios.post(`${RAG_SERVICE_URL}/story`, {
        artifact_name,
        base_description: artifact_description,
        language
      }, { timeout: 30000 });
      
      if (storyResponse.data && storyResponse.data.story) {
        narrative = storyResponse.data.story;
      }
    } catch (llmErr) {
      console.warn("Failed to generate story via LLM, falling back to raw description:", llmErr.message);
    }

    const voiceResponse = await axios.post(
      `${VOICE_SERVICE_URL}/generate`,
      {
        artifact_id: artifactId,
        language,
        text: narrative,
      },
      { timeout: VOICE_SERVICE_TIMEOUT }
    );

    const audio_url = voiceResponse.data?.audio_url || null;

    // Save to PostgreSQL regardless of whether audio succeeded
    // If audio_url is null, the row is saved and TTS will be retried next request
    await ArtifactNarration.create({
      artifact_id: artifactId,
      language,
      narration_text: narrative,
      audio_url,
      generated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: {
        narration_text: narrative,
        audio_url,
        cached: false,
      },
    });

  } catch (err) {
    // ── Voice service is down or timed out ─────────────────────────────────
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(503).json({
        success: false,
        error: 'VOICE_SERVICE_UNAVAILABLE',
        message: 'Voice narration service is currently unavailable.',
      });
    }

    // ── Voice service returned an error ────────────────────────────────────
    if (err.response?.config?.url?.includes('voice-tour-guide')) {
      return res.status(err.response.status).json({
        success: false,
        error: 'VOICE_SERVICE_ERROR',
        message: err.response.data?.detail || 'Voice service error.',
      });
    }

    // ── Pass all other errors to global error handler ──────────────────────
    next(err);
  }
};

/**
 * GET /api/voice/audio/:filename
 *
 * Streams generated narration audio through the backend. The voice service is
 * internal-only in docker-compose, so browsers cannot reliably fetch port 8003.
 */
exports.streamNarrationAudio = async (req, res, next) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename || '');

  if (!safeFilename || safeFilename !== filename || !safeFilename.endsWith('.mp3')) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AUDIO_FILE',
      message: 'A valid MP3 filename is required.',
    });
  }

  try {
    const audioResponse = await axios.get(
      `${VOICE_SERVICE_URL}/static/audio/${safeFilename}`,
      {
        responseType: 'arraybuffer',
        timeout: VOICE_SERVICE_TIMEOUT,
      }
    );

    const fs = require('fs');
    const os = require('os');
    const tempPath = path.join(os.tmpdir(), safeFilename);
    
    // Save to temp file to allow Express to handle byte-range requests natively
    fs.writeFileSync(tempPath, audioResponse.data);
    
    return res.sendFile(tempPath, (err) => {
      // Clean up temp file after sending
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'AUDIO_NOT_FOUND',
        message: 'Narration audio was not found.',
      });
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED' || err.request) {
      return res.status(503).json({
        success: false,
        error: 'VOICE_SERVICE_UNAVAILABLE',
        message: 'Voice narration service is currently unavailable.',
      });
    }

    return next(err);
  }
};
