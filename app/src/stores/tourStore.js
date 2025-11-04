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

  // Acciones
  fetchTours: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(ENDPOINTS.TOURS, { timeout: 30000 });
      const data = Array.isArray(response.data) ? response.data : [];
      
      console.log(`✅ ${data.length} tours cargados`);
      set({ tours: data, loading: false });
    } catch (error) {
      console.error('Error al cargar tours:', error);
      set({ 
        error: error.message || 'Error al cargar tours',
        loading: false,
        tours: [] 
      });
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