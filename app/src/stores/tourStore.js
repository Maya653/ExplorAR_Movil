// src/stores/tourStore.js
import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../utils/constants';

const useTourStore = create((set, get) => ({
  // Estado
  tours: [],
  currentTour: null,
  isPlaying: false,
  loading: false,
  error: null,
  lastFetch: null, // ✅ NUEVO: Timestamp del último fetch

  // Acciones
  fetchTours: async (forceRefresh = false) => {
    const state = get();
    
    // Cache check (5 segundos - optimizado para notificaciones rápidas)
    const fiveSecondsAgo = Date.now() - 5 * 1000;
    if (!forceRefresh && state.tours.length > 0 && state.lastFetch > fiveSecondsAgo) {
      return;
    }

    // Solo mostrar loading si NO es un refresh silencioso (polling) o si no hay datos
    if (!forceRefresh || state.tours.length === 0) {
      set({ loading: true, error: null });
    }

    try {
      // ✅ Cache busting: Agregar timestamp para evitar caché del servidor/red
      const url = forceRefresh 
        ? `${ENDPOINTS.TOURS}?_t=${Date.now()}` 
        : ENDPOINTS.TOURS;

      const response = await apiClient.get(url, { timeout: 30000 });
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Optimización: Solo actualizar si hay cambios reales
      if (JSON.stringify(state.tours) !== JSON.stringify(data)) {
        console.log(`✅ ${data.length} tours cargados`);
        set({ tours: data, loading: false, lastFetch: Date.now() });
      } else {
        set({ loading: false, lastFetch: Date.now() });
      }
    } catch (error) {
      console.error('Error al cargar tours:', error);
      set((state) => ({ 
        error: error.message || 'Error al cargar tours',
        loading: false,
        // Mantener tours previos si falla la recarga
        tours: state.tours.length > 0 ? state.tours : [] 
      }));
    }
  },

  loadTour: async (tourId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`${ENDPOINTS.TOURS}/${tourId}`, { timeout: 30000 });
      console.log('✅ Tour cargado:', response.data.title);
      set({ currentTour: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error('Error al cargar tour:', error);
      set({ 
        error: error.message || 'Error al cargar el tour',
        loading: false 
      });
      throw error;
    }
  },

  pauseTour: () => {
    console.log('⏸️ Tour pausado');
    set({ isPlaying: false });
  },

  resumeTour: () => {
    console.log('▶️ Tour reanudado');
    set({ isPlaying: true });
  },

  completeTour: () => {
    console.log('✅ Tour completado');
    set({ isPlaying: false, currentTour: null });
  },

  getToursByCareer: (careerId) => {
    const allTours = get().tours;
    return allTours.filter(
      (tour) => tour.careerId === careerId || tour.career === careerId
    );
  },
}));

export default useTourStore;