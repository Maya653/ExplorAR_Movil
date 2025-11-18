// src/api/apiClient.js
import Constants from 'expo-constants';

// ============================================
// CONFIGURACIÓN DE API BASE URL CON NGROK
// ============================================

/**
 * INSTRUCCIONES PARA EL EQUIPO:
 * 
 * 1. Cuando inicies el servidor backend, también inicia ngrok:
 *    Terminal 1: cd server && node index.js
 *    Terminal 2: ngrok http 5000
 * 
 * 2. Copia la URL de ngrok (ej: https://abc123.ngrok.io)
 * 
 * 3. Actualiza NGROK_URL abajo con la nueva URL
 * 
 * 4. Haz commit y push para que el equipo tenga la URL actualizada
 * 
 * 5. Todos hacen pull y reinician: npx expo start -c
 */

// ⬇️ ACTUALIZA ESTA URL CUANDO REINICIES NGROK ⬇️
const NGROK_URL = 'explorarmovil-production.up.railway.app';
// ============================================
// OBTENER API BASE URL
// ============================================

const getApiBaseUrl = () => {
  // Verificar si la URL de ngrok está configurada
  if (NGROK_URL.includes('YOUR-NGROK-URL')) {
    console.warn('⚠️ NGROK_URL no está configurada. Por favor actualiza src/api/apiClient.js');
    
    // Fallback a detección automática (solo funciona en misma red)
    const debuggerHost = __DEV__ && Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      const fallbackUrl = `http://${host}:5000`;
      console.log('📡 Usando detección automática (solo funciona en misma red):', fallbackUrl);
      return fallbackUrl;
    }
    
    return 'http://localhost:5000';
  }
  
  console.log('🌐 Usando ngrok URL:', NGROK_URL);
  return NGROK_URL;
};

const API_BASE_URL = getApiBaseUrl();

// Log para debugging
console.log('═══════════════════════════════════════');
console.log('🚀 ExplorAR - Configuración de API');
console.log('═══════════════════════════════════════');
console.log('📡 API Base URL:', API_BASE_URL);
console.log('🔧 Modo desarrollo:', __DEV__);
console.log('═══════════════════════════════════════');

// ============================================
// API CLIENT
// ============================================

// Timeout por defecto (30s) — se puede sobrescribir por petición pasando { timeout }
const DEFAULT_TIMEOUT = 60000;

// Pequeña utilidad para timeout usando AbortController
const timeoutFetch = (resource, options = {}, timeout = DEFAULT_TIMEOUT) => {
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

const request = async (path, { method = 'GET', headers = {}, body = null, timeout = DEFAULT_TIMEOUT } = {}) => {
  const url = buildUrl(path);
  const finalHeaders = { ...defaultHeaders, ...headers };

  const config = { url, method, headers: finalHeaders, timeout };

  console.log(`📤 API Request: ${method.toUpperCase()} ${url} (timeout ${timeout}ms)`);

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
export { API_BASE_URL };