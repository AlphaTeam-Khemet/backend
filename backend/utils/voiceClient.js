const axios = require('axios');

const client = axios.create({
  baseURL: process.env.VOICE_SERVICE_URL || 'http://localhost:8003',
  timeout: Number(process.env.VOICE_SERVICE_TIMEOUT_MS || 60000),
});

class VoiceServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'VoiceServiceError';
    this.statusCode = statusCode;
  }
}

function toServiceError(error) {
  if (error.response) {
    const detail = error.response.data?.detail
      || error.response.data?.message
      || error.response.data?.error
      || 'Voice service request failed';
    return new VoiceServiceError(detail, error.response.status);
  }

  if (error.request) {
    return new VoiceServiceError('Voice tour guide service is unavailable. Please try again later.', 503);
  }

  return new VoiceServiceError(error.message || 'Voice service request failed', 500);
}

async function request(method, url, data, config = {}) {
  try {
    const response = await client.request({ method, url, data, ...config });
    return response.data;
  } catch (error) {
    throw toServiceError(error);
  }
}

exports.health = () => request('get', '/health');
exports.narrate = (payload) => request('post', '/api/v1/voice/narrate', payload);
exports.audio = (filename) => request('get', `/audio/${filename}`, undefined, {
  responseType: 'stream',
});
exports.VoiceServiceError = VoiceServiceError;
