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

  // Acciones
  fetchCareers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(ENDPOINTS.CARRERAS);
      const data = Array.isArray(response.data) ? response.data : [];
      
      console.log(`✅ ${data.length} carreras cargadas`);
      set({ careers: data, loading: false });
    } catch (error) {
      console.error('Error al cargar carreras:', error);
      set({ 
        error: error.message || 'Error al cargar carreras',
        loading: false,
        careers: [] 
      });
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
}));

export default useCareerStore;