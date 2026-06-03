const axios = require('axios');

// chatbot-llm is the Groq + ChromaDB historical Q&A service.
// The backend is the gateway, so frontend/mobile clients should call backend routes.
const client = axios.create({
  baseURL: process.env.RAG_SERVICE_URL || 'http://localhost:8001',
  // Qwen can be slow on first CPU/Docker requests, so keep the gateway patient.
  timeout: Number(process.env.RAG_SERVICE_TIMEOUT_MS || 180000),
});

class RAGServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'RAGServiceError';
    this.statusCode = statusCode;
  }
}

function toServiceError(error) {
  if (error.response) {
    const detail = error.response.data?.detail || error.response.data?.error || 'RAG service request failed';
    return new RAGServiceError(detail, error.response.status);
  }

  if (error.request) {
    return new RAGServiceError('RAG service is unavailable. Please try again later.', 503);
  }

  return new RAGServiceError(error.message || 'RAG service request failed', 500);
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
exports.ask = ({ question, topic }) => request('post', '/ask', { question, topic });
exports.describe = ({ monument_name }, config) => request('post', '/describe', { monument_name }, config);
exports.identify = ({ monument_name, question }) => request('post', '/identify', { monument_name, question });
exports.RAGServiceError = RAGServiceError;
