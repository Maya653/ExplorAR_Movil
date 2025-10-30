// src/stores/analyticsStore.js
import { create } from 'zustand';
import { ANALYTICS_CONFIG, ANALYTICS_EVENTS } from '../utils/constants';
import analyticsService from '../services/analyticsService';

const useAnalyticsStore = create((set, get) => ({
  // Estado
  eventQueue: [], // Cola de eventos pendientes de envío
  sessionId: null,
  deviceInfo: null,
  isSending: false,

  // Inicializar sesión
  initSession: async () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deviceInfo = await analyticsService.getDeviceInfo();
    
    console.log('📊 Analytics Session iniciada:', sessionId);
    set({ sessionId, deviceInfo });
    
    // Registrar evento de apertura de app
    get().trackEvent(ANALYTICS_EVENTS.APP_OPEN);
  },

  // Registrar un evento
  trackEvent: (eventType, metadata = {}) => {
    const { sessionId, deviceInfo, eventQueue } = get();
    
    if (!sessionId) {
      console.warn('⚠️ Sesión no inicializada, llamar initSession() primero');
      return;
    }

    const event = {
      eventType,
      sessionId,
      timestamp: new Date().toISOString(),
      deviceInfo,
      ...metadata,
    };

    console.log('📍 Evento registrado:', eventType, metadata);
    
    const newQueue = [...eventQueue, event];
    set({ eventQueue: newQueue });

    // Auto-enviar si alcanzamos el límite de batch
    if (newQueue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
      get().sendPendingEvents();
    }
  },

  // Enviar eventos pendientes al servidor
  sendPendingEvents: async () => {
    const { eventQueue, isSending } = get();
    
    if (isSending) {
      console.log('⏳ Ya se están enviando eventos, esperando...');
      return;
    }

    if (eventQueue.length === 0) {
      console.log('✅ No hay eventos pendientes');
      return;
    }

    set({ isSending: true });

    try {
      console.log(`📤 Enviando ${eventQueue.length} eventos al servidor...`);
      await analyticsService.sendBatch(eventQueue);
      
      console.log('✅ Eventos enviados exitosamente');
      set({ eventQueue: [], isSending: false });
    } catch (error) {
      console.error('❌ Error al enviar eventos:', error);
      set({ isSending: false });
      // Los eventos se mantienen en la cola para reintento
    }
  },

  // Limpiar cola de eventos
  clearEventQueue: () => {
    console.log('🗑️ Cola de eventos limpiada');
    set({ eventQueue: [] });
  },

  // Helpers para eventos específicos
  trackCareerView: (careerId, careerName) => {
    get().trackEvent(ANALYTICS_EVENTS.CAREER_VIEW, {
      careerId,
      careerName,
    });
  },

  trackTourStart: (tourId, tourTitle, careerId) => {
    get().trackEvent(ANALYTICS_EVENTS.TOUR_START, {
      tourId,
      tourTitle,
      careerId,
    });
  },

  trackTourComplete: (tourId, duration, completionRate) => {
    get().trackEvent(ANALYTICS_EVENTS.TOUR_COMPLETE, {
      tourId,
      duration,
      completionRate,
    });
  },

  trackHotspotClick: (tourId, hotspotTitle, position) => {
    get().trackEvent(ANALYTICS_EVENTS.HOTSPOT_CLICK, {
      tourId,
      hotspotTitle,
      position,
    });
  },

  trackScreenView: (screenName) => {
    get().trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
      screenName,
    });
  },
}));

export default useAnalyticsStore;