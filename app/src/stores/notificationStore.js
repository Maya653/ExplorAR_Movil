// src/stores/notificationStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // Estado
      notifications: [],
      unreadCount: 0,
      lastCheck: null,

      // Tipos de notificaciones
      NOTIFICATION_TYPES: {
        NEW_CAREER: 'new_career',
        NEW_TOUR: 'new_tour',
        TOUR_UPDATED: 'tour_updated',
        NEW_VERSION: 'new_version',
        SYSTEM: 'system',
        FEATURED_CAREER: 'featured_career',
      },

      // ============================================
      // CREAR NOTIFICACIÓN
      // ============================================
      addNotification: (notification) => {
        const newNotification = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        console.log('🔔 Nueva notificación:', notification.title);
      },

      // ============================================
      // NOTIFICACIONES ESPECÍFICAS
      // ============================================
      notifyNewCareer: (career) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.NEW_CAREER,
          title: '🎓 Nueva Carrera Disponible',
          message: `Se agregó la carrera de ${career.title}`,
          data: { careerId: career.id || career._id, careerTitle: career.title },
          icon: '🎓',
        });
      },

      notifyNewTour: (tour, careerTitle) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.NEW_TOUR,
          title: '🎬 Nuevo Tour Disponible',
          message: `${tour.title} en ${careerTitle}`,
          data: { tourId: tour.id || tour._id, tourTitle: tour.title },
          icon: '🎬',
        });
      },

      notifyTourUpdated: (tour) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.TOUR_UPDATED,
          title: '🔄 Tour Actualizado',
          message: `${tour.title} tiene nuevo contenido`,
          data: { tourId: tour.id || tour._id, tourTitle: tour.title },
          icon: '🔄',
        });
      },

      notifyNewVersion: (version) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.NEW_VERSION,
          title: '🚀 Nueva Versión Disponible',
          message: `ExplorAR ${version} ya está disponible`,
          data: { version },
          icon: '🚀',
        });
      },

      notifyFeaturedCareer: (career) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.FEATURED_CAREER,
          title: '⭐ Carrera Destacada',
          message: `${career.title} ahora es carrera destacada`,
          data: { careerId: career.id || career._id, careerTitle: career.title },
          icon: '⭐',
        });
      },

      notifySystem: (title, message) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.SYSTEM,
          title,
          message,
          icon: '📢',
        });
      },

      // ============================================
      // MARCAR COMO LEÍDA
      // ============================================
      markAsRead: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        console.log('✅ Todas las notificaciones marcadas como leídas');
      },

      // ============================================
      // ELIMINAR NOTIFICACIONES
      // ============================================
      deleteNotification: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
        console.log('🗑️ Todas las notificaciones eliminadas');
      },

      clearOldNotifications: (daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        set((state) => {
          const filtered = state.notifications.filter(
            (n) => new Date(n.timestamp) > cutoffDate
          );
          const removedUnread = state.notifications.filter(
            (n) => !n.read && new Date(n.timestamp) <= cutoffDate
          ).length;

          return {
            notifications: filtered,
            unreadCount: Math.max(0, state.unreadCount - removedUnread),
          };
        });

        console.log(`🗑️ Notificaciones antiguas (>${daysOld} días) eliminadas`);
      },

      // ============================================
      // GETTERS
      // ============================================
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },

      getRecentNotifications: (limit = 10) => {
        return get().notifications.slice(0, limit);
      },

      // ============================================
      // UTILIDADES
      // ============================================
      updateLastCheck: () => {
        set({ lastCheck: new Date().toISOString() });
      },

      // ============================================
      // SINCRONIZACIÓN CON BACKEND
      // ============================================
      checkForUpdates: (careers, tours, prevCareers = [], prevTours = []) => {
        const state = get();

        // ✅ NUEVO: Si no hay datos previos, NO crear notificaciones (primera carga)
        if (prevCareers.length === 0 && prevTours.length === 0) {
          console.log('📦 Primera carga detectada - No se crearán notificaciones');
          state.updateLastCheck();
          return;
        }

        console.log('🔍 Verificando actualizaciones:', {
          carreras: { actual: careers.length, previa: prevCareers.length },
          tours: { actual: tours.length, previos: prevTours.length }
        });

        // Verificar nuevas carreras
        const newCareers = careers.filter(
          (career) =>
            !prevCareers.some((prev) => (prev.id || prev._id) === (career.id || career._id))
        );

        newCareers.forEach((career) => {
          console.log('🎓 Nueva carrera detectada:', career.title);
          state.notifyNewCareer(career);
        });

        // Verificar nuevos tours
        const newTours = tours.filter(
          (tour) => !prevTours.some((prev) => (prev.id || prev._id) === (tour.id || tour._id))
        );

        newTours.forEach((tour) => {
          const career = careers.find(
            (c) => (c.id || c._id) === (tour.careerId || tour.career)
          );
          console.log('🎬 Nuevo tour detectado:', tour.title);
          state.notifyNewTour(tour, career?.title || 'Carrera');
        });

        // Verificar carreras destacadas nuevas
        const newlyFeatured = careers.filter(
          (career) =>
            career.isHighlighted &&
            !prevCareers.some(
              (prev) =>
                (prev.id || prev._id) === (career.id || career._id) && prev.isHighlighted
            )
        );

        newlyFeatured.forEach((career) => {
          console.log('⭐ Carrera destacada nueva:', career.title);
          state.notifyFeaturedCareer(career);
        });

        if (newCareers.length > 0 || newTours.length > 0 || newlyFeatured.length > 0) {
          console.log(
            `🔔 Se crearon ${newCareers.length} notificaciones de carreras, ${newTours.length} de tours, ${newlyFeatured.length} destacadas`
          );
        } else {
          console.log('✅ No hay actualizaciones nuevas');
        }

        state.updateLastCheck();
      },
    }), // ✅ Esta coma era la que faltaba
    {
      name: 'explorar-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastCheck: state.lastCheck,
      }),
    }
  )
);

export default useNotificationStore;