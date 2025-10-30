// src/utils/constants.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detectar la IP de la LAN automáticamente
const getLanIpAddress = () => {
  try {
    const debuggerHost = Constants.expoConfig?.hostUri || 
                        Constants.manifest?.debuggerHost || 
                        Constants.manifest2?.extra?.expoClient?.hostUri;
    
    if (debuggerHost) {
      const match = debuggerHost.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (error) {
    console.warn('No se pudo detectar IP LAN:', error);
  }
  return null;
};

// Configuración de API según plataforma
const getApiBaseUrl = () => {
  // ✅ CAMBIO: Usar IP real de LAN en lugar de 10.0.2.2
  if (Platform.OS === 'android') {
    // Usar tu IP local real (funciona tanto en emulador como dispositivo físico)
    return 'http://100.100.1.157:5000';
  }
  
  // iOS/Web: intentar LAN primero, sino usar la IP fija
  const lanIp = getLanIpAddress();
  if (lanIp) {
    return `http://${lanIp}:5000`;
  }
  
  // Fallback a tu IP local
  return 'http://100.100.1.157:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints
export const ENDPOINTS = {
  CARRERAS: '/api/carreras',
  TOURS: '/api/tours',
  TESTIMONIOS: '/api/testimonios',
  ANALYTICS: '/api/analytics',
  HEALTH: '/health',
};

// Configuración de Analytics
export const ANALYTICS_CONFIG = {
  BATCH_SIZE: 10, // Enviar cada 10 eventos
  BATCH_INTERVAL: 5 * 60 * 1000, // O cada 5 minutos
};

// Tipos de eventos de Analytics
export const ANALYTICS_EVENTS = {
  APP_OPEN: 'app_open',
  CAREER_VIEW: 'career_view',
  TOUR_START: 'tour_start',
  TOUR_COMPLETE: 'tour_complete',
  HOTSPOT_CLICK: 'hotspot_click',
  SCREEN_VIEW: 'screen_view',
};

// Configuración AR
export const AR_CONFIG = {
  DEFAULT_SCALE: 1.0,
  MIN_SCALE: 0.1,
  MAX_SCALE: 10.0,
  DEFAULT_POSITION: { x: 0, y: 0, z: -5 },
};

console.log('🌐 API Base URL:', API_BASE_URL);

export default {
  API_BASE_URL,
  ENDPOINTS,
  ANALYTICS_CONFIG,
  ANALYTICS_EVENTS,
  AR_CONFIG,
};