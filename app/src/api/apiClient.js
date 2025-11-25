// src/api/apiClient.js
import Constants from 'expo-constants';

// ============================================
// CONFIGURACIÓN DE API BASE URL
// ============================================

const NGROK_URL = 'https://explorarmovil-production.up.railway.app';

const getApiBaseUrl = () => {
  if (NGROK_URL.includes('YOUR-NGROK-URL')) {
    console.warn('⚠️ NGROK_URL no está configurada. Por favor actualiza src/api/apiClient.js');
    
    const debuggerHost = __DEV__ && Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      const fallbackUrl = `http://${host}:5000`;
      console.log('📡 Usando detección automática (solo funciona en misma red):', fallbackUrl);
      return fallbackUrl;
    }
    
    return 'http://localhost:5000';
  }
  
  console.log('🌐 Usando Railway URL:', NGROK_URL);
  return NGROK_URL;
};

const API_BASE_URL = getApiBaseUrl();

console.log('═══════════════════════════════════════');
console.log('🚀 ExplorAR - Configuración de API');
console.log('═══════════════════════════════════════');
console.log('📡 API Base URL:', API_BASE_URL);
console.log('🔧 Modo desarrollo:', __DEV__);
console.log('═══════════════════════════════════════');

// ============================================
// CONFIGURACIÓN DE REINTENTOS
// ============================================

const DEFAULT_TIMEOUT = 15000; // 15 segundos (optimizado para polling rápido)
const DEFAULT_RETRIES = 2;     // 2 reintentos (optimizado para velocidad)
const RETRY_DELAY = 1000;      // 1 segundo entre reintentos (más rápido)

// ============================================
// UTILIDADES
// ============================================

// Función para esperar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch con timeout
const timeoutFetch = (resource, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const signal = controller.signal;
  return fetch(resource, { ...options, signal })
    .finally(() => clearTimeout(id));
};

// Headers por defecto
const defaultHeaders = {
  'Content-Type': 'application/json',
  // ✅ Anti-caché headers para asegurar tiempo real
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const buildUrl = (path) => {
  if (!path) return API_BASE_URL || '';
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

const createHttpError = (message, { response = null, request = null, config = null } = {}) => {
  const err = new Error(message);
  if (response) err.response = response;
  if (request) err.request = request;
  if (config) err.config = config;
  return err;
};

// ============================================
// REQUEST CON REINTENTOS
// ============================================

const request = async (
  path, 
  { 
    method = 'GET', 
    headers = {}, 
    body = null, 
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES, // ✅ NUEVO: Soporta reintentos
  } = {}
) => {
  const url = buildUrl(path);
  const finalHeaders = { ...defaultHeaders, ...headers };
  const config = { url, method, headers: finalHeaders, timeout };

  // ============================================
  // FUNCIÓN INTERNA PARA HACER UNA PETICIÓN
  // ============================================
  const makeRequest = async (attemptNumber) => {
    const isRetry = attemptNumber > 1;
    const logPrefix = isRetry ? `🔄 Intento ${attemptNumber}` : '📤';
    
    console.log(`${logPrefix} API Request: ${method.toUpperCase()} ${url} (timeout ${timeout}ms)`);

    const options = {
      method,
      headers: finalHeaders,
    };

    if (body != null && method !== 'GET' && method !== 'HEAD') {
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
      console.error(`❌ Network/Error Request (Intento ${attemptNumber}):`, err?.message || err);
      throw createHttpError('Network Error or timeout', { request: { url, options }, config });
    }

    const responseData = await parseResponse(resp);

    if (resp.ok) {
      console.log(`📥 API Response: ${url} - Status ${resp.status} ✅`);
      return { data: responseData, status: resp.status, headers: resp.headers, config };
    } else {
      const response = { status: resp.status, data: responseData, headers: resp.headers };
      console.error(`❌ API Error (Intento ${attemptNumber}):`, { url, status: resp.status, data: responseData });
      throw createHttpError(`HTTP error ${resp.status}`, { response, config });
    }
  };

  // ============================================
  // LÓGICA DE REINTENTOS
  // ============================================
  
  let lastError;
  let currentDelay = RETRY_DELAY;
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await makeRequest(attempt);
      
      if (attempt > 1) {
        console.log(`✅ Petición exitosa después de ${attempt} intentos`);
      }
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Verificar si debemos reintentar
      const shouldRetry = attempt <= retries && (
        error.message.includes('timeout') || 
        error.message.includes('Network')
      );
      
      if (shouldRetry) {
        console.log(`⏳ Esperando ${currentDelay}ms antes de reintentar... (${attempt}/${retries})`);
        await wait(currentDelay);
        
        // Backoff exponencial
        currentDelay = Math.min(currentDelay * 1.5, 10000);
      } else {
        if (attempt > 1) {
          console.error(`❌ Petición falló después de ${attempt} intentos`);
        }
        throw lastError;
      }
    }
  }
  
  throw lastError;
};

// ============================================
// API CLIENT
// ============================================

const apiClient = {
  get: (path, config = {}) => request(path, { ...config, method: 'GET' }),
  post: (path, body, config = {}) => request(path, { ...config, method: 'POST', body }),
  put: (path, body, config = {}) => request(path, { ...config, method: 'PUT', body }),
  delete: (path, config = {}) => request(path, { ...config, method: 'DELETE' }),
  request,
};

export default apiClient;
export { API_BASE_URL };