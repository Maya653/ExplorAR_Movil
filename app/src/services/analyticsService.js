// src/services/analyticsService.js
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../utils/constants';

class AnalyticsService {
  /**
   * Obtiene información del dispositivo
   */
  async getDeviceInfo() {
    try {
      const info = {
        platform: Platform.OS,
        osVersion: Platform.Version,
        deviceModel: Device.modelName || 'Unknown',
        appVersion: Constants.expoConfig?.version || '1.0.0',
        deviceBrand: Device.brand || 'Unknown',
        deviceYear: Device.deviceYearClass || null,
        isDevice: Device.isDevice,
      };

      console.log('📱 Device Info:', info);
      return info;
    } catch (error) {
      console.error('Error obteniendo device info:', error);
      return {
        platform: Platform.OS,
        osVersion: 'Unknown',
        deviceModel: 'Unknown',
        appVersion: '1.0.0',
      };
    }
  }

  /**
   * Envía un batch de eventos al servidor
   */
  async sendBatch(events) {
    if (!Array.isArray(events) || events.length === 0) {
      console.warn('⚠️ No hay eventos para enviar');
      return;
    }

    try {
      console.log(`📤 Enviando batch de ${events.length} eventos...`);
      
      const response = await apiClient.post(ENDPOINTS.ANALYTICS, {
        events,
        batchTimestamp: new Date().toISOString(),
      });

      console.log('✅ Batch enviado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando batch de analytics:', error);
      throw error;
    }
  }

  /**
   * Registra un evento individual (para casos especiales)
   */
  async trackEvent(eventType, metadata = {}) {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const event = {
        eventType,
        timestamp: new Date().toISOString(),
        deviceInfo,
        ...metadata,
      };

      console.log('📍 Tracking event:', eventType);
      
      const response = await apiClient.post(ENDPOINTS.ANALYTICS, {
        events: [event],
      });

      return response.data;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  /**
   * Obtiene métricas del usuario (para dashboard)
   */
  async getUserMetrics(userId) {
    try {
      const response = await apiClient.get(`${ENDPOINTS.ANALYTICS}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      throw error;
    }
  }
}

// Exportar instancia única (singleton)
const analyticsService = new AnalyticsService();
export default analyticsService;