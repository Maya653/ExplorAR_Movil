// src/stores/careerStore.js
import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../utils/constants';

const useCareerStore = create((set, get) => ({
  // Estado
  careers: [],
  selectedCareer: null,
  loading: false,
  error: null,
  lastFetch: null, // ✅ NUEVO: Timestamp del último fetch exitoso

  // Acciones
  fetchCareers: async (forceRefresh = false) => {
    const state = get();
    
    // ✅ NUEVO: Cache inteligente - Si hay datos recientes, no recargar
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (!forceRefresh && state.careers.length > 0 && state.lastFetch > fiveMinutesAgo) {
      console.log('📦 Usando carreras en cache (recientes)');
      return;
    }

    set({ loading: true, error: null });
    
    try {
      console.log('📥 Cargando carreras desde el servidor...');
      
      // ✅ NUEVO: Reintentos automáticos configurados en apiClient
      const response = await apiClient.get(ENDPOINTS.CARRERAS, {
        timeout: 90000, // 90 segundos (mejor para Railway)
        retries: 3,     // 3 reintentos automáticos
      });
      
      const data = Array.isArray(response.data) ? response.data : [];
      
      console.log(`✅ ${data.length} carreras cargadas`);
      set({ 
        careers: data, 
        loading: false,
        error: null,
        lastFetch: Date.now() // ✅ NUEVO: Guardar timestamp
      });
      
    } catch (error) {
      console.error('Error al cargar carreras:', error);
      
      // ✅ NUEVO: Mensajes de error más amigables
      const errorMessage = error.message.includes('timeout') 
        ? 'El servidor está tardando. Intenta de nuevo.'
        : error.message.includes('Network')
        ? 'Sin conexión. Verifica tu internet.'
        : error.message || 'Error al cargar carreras';
      
      set({ 
        error: errorMessage,
        loading: false,
        // ✅ NUEVO: Mantener datos en cache si falló
        careers: state.careers.length > 0 ? state.careers : []
      });
      
      // ✅ NUEVO: Log si estamos usando cache
      if (state.careers.length > 0) {
        console.log('⚠️ Usando datos en cache debido al error');
      }
    }
  },

  selectCareer: (career) => {
    console.log('📌 Carrera seleccionada:', career?.title);
    set({ selectedCareer: career });
  },

  clearSelectedCareer: () => {
    set({ selectedCareer: null });
  },

  searchCareers: (query) => {
    const allCareers = get().careers;
    if (!query || query.trim() === '') {
      return allCareers;
    }

    const lowerQuery = query.toLowerCase();
    return allCareers.filter((career) => {
      const title = (career.title || '').toLowerCase();
      const description = (career.description || '').toLowerCase();
      const category = (career.category || '').toLowerCase();
      
      return (
        title.includes(lowerQuery) ||
        description.includes(lowerQuery) ||
        category.includes(lowerQuery)
      );
    });
  },

  // ✅ NUEVO: Método para forzar recarga
  forceRefresh: async () => {
    console.log('🔄 Forzando recarga de carreras...');
    await get().fetchCareers(true);
  },

  // ✅ NUEVO: Limpiar error
  clearError: () => {
    set({ error: null });
  },
}));

export default useCareerStore;