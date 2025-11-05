// src/stores/tourHistoryStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store para gestionar el historial de tours AR vistos
const useTourHistoryStore = create(
  persist(
    (set, get) => ({
      // Estado del historial
      watchedTours: [], // Array de tours vistos con timestamps
      
      // Acciones
      markTourAsWatched: (tourId, tourTitle) => {
        set((state) => {
          const existingIndex = state.watchedTours.findIndex(t => t.tourId === tourId);
          const watchData = {
            tourId,
            tourTitle,
            watchedAt: new Date().toISOString(),
            watchCount: 1
          };
          
          if (existingIndex >= 0) {
            // Si ya existe, actualizar timestamp y contador
            const existing = state.watchedTours[existingIndex];
            const updatedTours = [...state.watchedTours];
            updatedTours[existingIndex] = {
              ...existing,
              watchedAt: new Date().toISOString(),
              watchCount: (existing.watchCount || 1) + 1
            };
            return { watchedTours: updatedTours };
          } else {
            // Si es nuevo, agregarlo
            return {
              watchedTours: [watchData, ...state.watchedTours]
            };
          }
        });
      },
      
      // Obtener información de un tour específico
      getTourWatchInfo: (tourId) => {
        const { watchedTours } = get();
        return watchedTours.find(t => t.tourId === tourId) || null;
      },
      
      // Obtener tours vistos recientemente (últimos 10)
      getRecentlyWatchedTours: () => {
        const { watchedTours } = get();
        return watchedTours
          .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
          .slice(0, 10);
      },
      
      // Verificar si un tour fue visto
      isTourWatched: (tourId) => {
        const { watchedTours } = get();
        return watchedTours.some(t => t.tourId === tourId);
      },
      
      // Limpiar historial
      clearHistory: () => {
        set({ watchedTours: [] });
      },
      
      // Remover un tour del historial
      removeTourFromHistory: (tourId) => {
        set((state) => ({
          watchedTours: state.watchedTours.filter(t => t.tourId !== tourId)
        }));
      }
    }),
    {
      name: 'tour-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ watchedTours: state.watchedTours }),
    }
  )
);

export default useTourHistoryStore;