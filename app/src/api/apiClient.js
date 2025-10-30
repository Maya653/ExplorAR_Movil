// src/api/apiClient.js
import { API_BASE_URL } from '../utils/constants';

// Pequeña utilidad para timeout usando AbortController
const timeoutFetch = (resource, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const signal = controller.signal;
  return fetch(resource, { ...options, signal })
    .finally(() => clearTimeout(id));
};

// Construye headers por defecto
const defaultHeaders = {
  'Content-Type': 'application/json',
};

const buildUrl = (path) => {
  if (!path) return API_BASE_URL || '';
  // Si path ya es URL absoluta, usarla tal cual
  try {
    const u = new URL(path);
    return u.toString();
  } catch (e) {
    // No es URL absoluta
  }
  return `${API_BASE_URL?.replace(/\/$/, '') || ''}/${path.replace(/^\//, '')}`;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch (e) {
      data = null;
    }
  }
  return data;
};

// Error helper para emular shape similar a axios
const createHttpError = (message, { response = null, request = null, config = null } = {}) => {
  const err = new Error(message);
  if (response) err.response = response;
  if (request) err.request = request;
  if (config) err.config = config;
  return err;
};

const request = async (path, { method = 'GET', headers = {}, body = null, timeout = 10000 } = {}) => {
  const url = buildUrl(path);
  const finalHeaders = { ...defaultHeaders, ...headers };

  const config = { url, method, headers: finalHeaders };

  console.log(`📤 API Request: ${method.toUpperCase()} ${url}`);

  const options = {
    method,
    headers: finalHeaders,
  };

  if (body != null && method !== 'GET' && method !== 'HEAD') {
    // Si el body ya es FormData, no serializar
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      delete options.headers['Content-Type'];
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  let resp;
  try {
    resp = await timeoutFetch(url, options, timeout);
  } catch (err) {
    // Abort o fallo de red
    console.error('❌ Network/Error Request:', err?.message || err);
    throw createHttpError('Network Error or timeout', { request: { url, options }, config });
  }

  const responseData = await parseResponse(resp);

  console.log(`📥 API Response: ${url} - Status ${resp.status}`);

  if (!resp.ok) {
    const response = { status: resp.status, data: responseData, headers: resp.headers };
    console.error('❌ API Error:', { url, status: resp.status, data: responseData });
    throw createHttpError(`HTTP error ${resp.status}`, { response, config });
  }

  return { data: responseData, status: resp.status, headers: resp.headers, config };
};

const apiClient = {
  get: (path, config = {}) => request(path, { ...config, method: 'GET' }),
  post: (path, body, config = {}) => request(path, { ...config, method: 'POST', body }),
  put: (path, body, config = {}) => request(path, { ...config, method: 'PUT', body }),
  delete: (path, config = {}) => request(path, { ...config, method: 'DELETE' }),
  request,
};

export default apiClient;