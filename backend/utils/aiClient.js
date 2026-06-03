const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const client = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 30000,
});

class AIServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
  }
}

function createImageForm(imagePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  return form;
}

function toServiceError(error) {
  if (error.response) {
    const detail = error.response.data?.detail || error.response.data?.error || 'AI service request failed';
    return new AIServiceError(detail, error.response.status);
  }

  if (error.request) {
    return new AIServiceError('AI service is unavailable. Please try again later.', 503);
  }

  return new AIServiceError(error.message || 'AI service request failed', 500);
}

exports.recognizeArtifact = async (imagePath) => {
  try {
    const form = createImageForm(imagePath);
    const { data } = await client.post('/predict', form, {
      headers: form.getHeaders(),
    });
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
};

exports.translateHieroglyph = async (imagePath) => {
  try {
    const form = createImageForm(imagePath);
    const { data } = await client.post('/translate', form, {
      headers: form.getHeaders(),
    });
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
};

exports.AIServiceError = AIServiceError;
