const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const client = axios.create({
  baseURL: process.env.HIEROGLYPH_SERVICE_URL || 'http://localhost:8002',
  timeout: Number(process.env.HIEROGLYPH_SERVICE_TIMEOUT_MS || 120000),
});

class HieroglyphServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'HieroglyphServiceError';
    this.statusCode = statusCode;
  }
}

function toServiceError(error) {
  if (error.response) {
    const detail = error.response.data?.detail
      || error.response.data?.message
      || error.response.data?.error
      || 'Hieroglyph service request failed';
    return new HieroglyphServiceError(detail, error.response.status);
  }

  if (error.request) {
    return new HieroglyphServiceError('Hieroglyph translator service is unavailable. Please try again later.', 503);
  }

  return new HieroglyphServiceError(error.message || 'Hieroglyph service request failed', 500);
}

function imageForm(imagePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  return form;
}

async function request(method, url, payload, config = {}) {
  try {
    const { data } = await client.request({ method, url, data: payload, ...config });
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
}

exports.health = () => request('get', '/health');

exports.translate = (imagePath) => {
  const form = imageForm(imagePath);
  return request('post', '/api/v1/hieroglyph/translate', form, {
    headers: form.getHeaders(),
  });
};

exports.detectOnly = (imagePath) => {
  const form = imageForm(imagePath);
  return request('post', '/api/v1/hieroglyph/detect-only', form, {
    headers: form.getHeaders(),
  });
};

exports.HieroglyphServiceError = HieroglyphServiceError;

