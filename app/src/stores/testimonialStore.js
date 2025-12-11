import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../utils/constants';

const useTestimonialStore = create((set, get) => ({
  // Estado
  testimonials: [],
  loading: false,
  error: null,
  lastFetch: null,

  // Acciones
  fetchTestimonials: async (forceRefresh = false) => {
    const state = get();
    
    // Si no es forzado y tenemos datos recientes (ej: < 5 segundos), usar cache
    // Esto evita llamadas excesivas si múltiples componentes lo piden, 
    // pero permite el polling rápido si se usa forceRefresh=true
    const fiveSecondsAgo = Date.now() - 5 * 1000;
    if (!forceRefresh && state.testimonials.length > 0 && state.lastFetch > fiveSecondsAgo) {
      return;
    }

    // Solo poner loading en true si no es un refresh silencioso (polling)
    // O si no tenemos datos. Si ya tenemos datos, mejor no mostrar spinner global si es posible evitarlo.
    if (!forceRefresh || state.testimonials.length === 0) {
        set({ loading: true, error: null });
    }
    
    try {
      // ✅ Cache busting: Agregar timestamp para evitar caché del servidor/red
      const url = forceRefresh 
        ? `${ENDPOINTS.TESTIMONIOS}?_t=${Date.now()}` 
        : ENDPOINTS.TESTIMONIOS;

      const response = await apiClient.get(url, { timeout: 20000 });
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Comparación profunda simple para evitar actualizaciones de estado innecesarias
      if (JSON.stringify(state.testimonials) !== JSON.stringify(data)) {
          console.log(`✅ ${data.length} testimonios cargados`);
          set({ 
            testimonials: data, 
            loading: false,
            error: null,
            lastFetch: Date.now()
          });
      } else {
          set({ loading: false, error: null, lastFetch: Date.now() });
      }
      
    } catch (error) {
      console.error('Error al cargar testimonios:', error);
      set({ 
        error: error.message || 'Error al cargar testimonios',
        loading: false,
        // Mantener datos previos si falla
        testimonials: state.testimonials.length > 0 ? state.testimonials : []
      });
    }
  },
}));

export default useTestimonialStore;
