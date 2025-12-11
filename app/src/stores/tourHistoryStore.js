// src/stores/tourHistoryStore.js - VERSIÓN CORREGIDA
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useTourHistoryStore = create(
  persist(
    (set, get) => ({
      // Estado: array de tours vistos
      watchedTours: [],
      // { tourId, tourTitle, tourType, watchedAt, watchCount }

      // ✅ NUEVO: Registro de sesiones activas para prevenir duplicados
      activeSessions: new Set(),

      // ============================================
      // REGISTRAR VISUALIZACIÓN DE TOUR (MEJORADO)
      // ============================================
      recordTourWatch: (tourId, tourTitle, tourType = 'ar') => {
        // ✅ PREVENIR LLAMADAS MÚLTIPLES EN LA MISMA SESIÓN
        const sessionKey = `${tourId}_${Date.now()}`;
        const { activeSessions } = get();
        
        // Si ya hay una sesión activa en los últimos 5 segundos, no registrar
        const recentSession = Array.from(activeSessions).find(
          session => session.startsWith(`${tourId}_`) && 
          (Date.now() - parseInt(session.split('_')[1])) < 5000
        );

        if (recentSession) {
          console.log(`⏭️ Registro duplicado prevenido para: ${tourTitle}`);
          return;
        }

        set((state) => {
          const existingIndex = state.watchedTours.findIndex(
            (t) => t.tourId === tourId
          );

          let updatedWatchedTours;

          if (existingIndex !== -1) {
            // Tour ya existe, actualizar
            updatedWatchedTours = [...state.watchedTours];
            updatedWatchedTours[existingIndex] = {
              ...updatedWatchedTours[existingIndex],
              watchedAt: new Date().toISOString(),
              watchCount: updatedWatchedTours[existingIndex].watchCount + 1,
              tourType, // Actualizar tipo
            };
          } else {
            // Nuevo tour
            updatedWatchedTours = [
              {
                tourId,
                tourTitle,
                tourType, // 'ar' o '360'
                watchedAt: new Date().toISOString(),
                watchCount: 1,
              },
              ...state.watchedTours,
            ];
          }

          // Agregar sesión activa
          const newActiveSessions = new Set(state.activeSessions);
          newActiveSessions.add(sessionKey);

          // Limpiar sesiones antiguas (más de 10 segundos)
          const now = Date.now();
          newActiveSessions.forEach(session => {
            const timestamp = parseInt(session.split('_')[1]);
            if (now - timestamp > 10000) {
              newActiveSessions.delete(session);
            }
          });

          console.log(`👁️ Tour registrado: ${tourTitle} (${tourId}) - Tipo: ${tourType}`);
          console.log(`📊 Contador actual: ${existingIndex !== -1 ? updatedWatchedTours[existingIndex].watchCount : 1} veces`);
          
          return { 
            watchedTours: updatedWatchedTours,
            activeSessions: newActiveSessions
          };
        });
      },

      // ============================================
      // OBTENER INFORMACIÓN DE UN TOUR
      // ============================================
      getTourWatchInfo: (tourId) => {
        const state = get();
        return state.watchedTours.find((t) => t.tourId === tourId) || null;
      },

      // ============================================
      // VERIFICAR SI UN TOUR FUE VISTO
      // ============================================
      isTourWatched: (tourId) => {
        const state = get();
        return state.watchedTours.some((t) => t.tourId === tourId);
      },

      // ============================================
      // OBTENER TOURS VISTOS RECIENTEMENTE
      // ============================================
      getRecentlyWatchedTours: (limit = 10) => {
        const state = get();
        return [...state.watchedTours]
          .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
          .slice(0, limit);
      },

      // ============================================
      // OBTENER TOURS MÁS VISTOS
      // ============================================
      getMostWatchedTours: (limit = 10) => {
        const state = get();
        return [...state.watchedTours]
          .sort((a, b) => b.watchCount - a.watchCount)
          .slice(0, limit);
      },

      // ============================================
      // OBTENER ESTADÍSTICAS
      // ============================================
      getStats: () => {
        const state = get();
        const totalTours = state.watchedTours.length;
        const totalWatches = state.watchedTours.reduce(
          (sum, tour) => sum + tour.watchCount,
          0
        );
        const averageWatches = totalTours > 0 ? totalWatches / totalTours : 0;

        return {
          totalTours,
          totalWatches,
          averageWatches: averageWatches.toFixed(1),
        };
      },

      // ============================================
      // ✅ NUEVO: RESETEAR CONTADOR DE UN TOUR ESPECÍFICO
      // ============================================
      resetTourWatchCount: (tourId) => {
        set((state) => {
          const updatedWatchedTours = state.watchedTours.map(tour => 
            tour.tourId === tourId 
              ? { ...tour, watchCount: 1, watchedAt: new Date().toISOString() }
              : tour
          );
          console.log(`🔄 Contador reseteado para tour: ${tourId}`);
          return { watchedTours: updatedWatchedTours };
        });
      },

      // ============================================
      // LIMPIAR HISTORIAL
      // ============================================
      clearHistory: () => {
        set({ watchedTours: [], activeSessions: new Set() });
        console.log('🗑️ Historial de tours limpiado');
      },

      // ============================================
      // ELIMINAR UN TOUR ESPECÍFICO
      // ============================================
      removeTourFromHistory: (tourId) => {
        set((state) => ({
          watchedTours: state.watchedTours.filter((t) => t.tourId !== tourId),
        }));
        console.log(`🗑️ Tour ${tourId} eliminado del historial`);
      },

      // ============================================
      // LIMPIAR TOURS ANTIGUOS
      // ============================================
      clearOldHistory: (daysOld = 90) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        set((state) => ({
          watchedTours: state.watchedTours.filter(
            (t) => new Date(t.watchedAt) > cutoffDate
          ),
        }));

        console.log(`🗑️ Tours vistos hace más de ${daysOld} días eliminados`);
      },
    }),
    {
      name: 'explorar-tour-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        watchedTours: state.watchedTours,
        // NO persistir activeSessions (solo en memoria)
      }),
    }
  )
);

export default useTourHistoryStore;