// src/stores/notificationStore.js - ACTUALIZADO
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
        NEW_TESTIMONIO: 'new_testimonio', // ✅ NUEVO
        CAREER_UPDATED: 'career_updated', // ✅ NUEVO
        TOUR_UPDATED: 'tour_updated',
        TESTIMONIO_UPDATED: 'testimonio_updated', // ✅ NUEVO
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

      // ✅ NUEVO: Notificar nuevo testimonio
      notifyNewTestimonio: (testimonio) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.NEW_TESTIMONIO,
          title: '💬 Nuevo Testimonio',
          message: `${testimonio.author || testimonio.autor || 'Alguien'} compartió su experiencia`,
          data: { testimonioId: testimonio.id || testimonio._id },
          icon: '💬',
        });
      },

      // ✅ NUEVO: Notificar carrera actualizada
      notifyCareerUpdated: (career) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.CAREER_UPDATED,
          title: '🔄 Carrera Actualizada',
          message: `${career.title} tiene información nueva`,
          data: { careerId: career.id || career._id, careerTitle: career.title },
          icon: '🔄',
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

      // ✅ NUEVO: Notificar testimonio actualizado
      notifyTestimonioUpdated: (testimonio) => {
        get().addNotification({
          type: get().NOTIFICATION_TYPES.TESTIMONIO_UPDATED,
          title: '🔄 Testimonio Actualizado',
          message: `Se actualizó un testimonio de ${testimonio.author || testimonio.autor || 'un usuario'}`,
          data: { testimonioId: testimonio.id || testimonio._id },
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
      // ✅ SINCRONIZACIÓN CON BACKEND - ACTUALIZADO
      // ============================================
      checkForUpdates: (
        careers, 
        tours, 
        testimonios, // ✅ NUEVO parámetro
        prevCareers = [], 
        prevTours = [],
        prevTestimonios = [] // ✅ NUEVO parámetro
      ) => {
        const state = get();

        // ✅ Si no hay datos previos, NO crear notificaciones (primera carga)
        if (prevCareers.length === 0 && prevTours.length === 0 && prevTestimonios.length === 0) {
          console.log('📦 Primera carga detectada - No se crearán notificaciones');
          state.updateLastCheck();
          return;
        }

        console.log('🔍 Verificando actualizaciones:', {
          carreras: { actual: careers.length, previa: prevCareers.length },
          tours: { actual: tours.length, previos: prevTours.length },
          testimonios: { actual: testimonios.length, previos: prevTestimonios.length }
        });

        let notificationCount = 0;

        // ============================================
        // 1. VERIFICAR NUEVAS CARRERAS
        // ============================================
        const newCareers = careers.filter(
          (career) =>
            !prevCareers.some((prev) => (prev.id || prev._id) === (career.id || career._id))
        );

        newCareers.forEach((career) => {
          console.log('🎓 Nueva carrera detectada:', career.title);
          state.notifyNewCareer(career);
          notificationCount++;
        });

        // ============================================
        // 2. VERIFICAR NUEVOS TOURS
        // ============================================
        const newTours = tours.filter(
          (tour) => !prevTours.some((prev) => (prev.id || prev._id) === (tour.id || tour._id))
        );

        newTours.forEach((tour) => {
          const career = careers.find(
            (c) => (c.id || c._id) === (tour.careerId || tour.career)
          );
          console.log('🎬 Nuevo tour detectado:', tour.title);
          state.notifyNewTour(tour, career?.title || 'Carrera');
          notificationCount++;
        });

        // ============================================
        // 3. ✅ VERIFICAR NUEVOS TESTIMONIOS
        // ============================================
        const newTestimonios = testimonios.filter(
          (testimonio) => 
            !prevTestimonios.some((prev) => (prev.id || prev._id) === (testimonio.id || testimonio._id))
        );

        newTestimonios.forEach((testimonio) => {
          console.log('💬 Nuevo testimonio detectado:', testimonio.author || testimonio.autor);
          state.notifyNewTestimonio(testimonio);
          notificationCount++;
        });

        // ============================================
        // 4. VERIFICAR CARRERAS DESTACADAS NUEVAS
        // ============================================
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
          notificationCount++;
        });

        // ============================================
        // 5. ✅ VERIFICAR ACTUALIZACIONES EN CARRERAS
        // ============================================
        const updatedCareers = careers.filter((career) => {
          const prev = prevCareers.find((p) => (p.id || p._id) === (career.id || career._id));
          if (!prev) return false;

          // Verificar si cambió updatedAt o algún campo relevante
          const hasUpdatedAt = career.updatedAt !== prev.updatedAt || 
                              career.updated_at !== prev.updated_at;
          const hasChanges = 
            career.title !== prev.title ||
            career.description !== prev.description ||
            career.category !== prev.category;

          return hasUpdatedAt || hasChanges;
        });

        updatedCareers.forEach((career) => {
          console.log('🔄 Carrera actualizada:', career.title);
          state.notifyCareerUpdated(career);
          notificationCount++;
        });

        // ============================================
        // 6. ✅ VERIFICAR ACTUALIZACIONES EN TOURS
        // ============================================
        const updatedTours = tours.filter((tour) => {
          const prev = prevTours.find((p) => (p.id || p._id) === (tour.id || tour._id));
          if (!prev) return false;

          // Verificar cambios significativos
          const hasUpdatedAt = tour.updatedAt !== prev.updatedAt || 
                              tour.updated_at !== prev.updated_at;
          const hasChanges = 
            tour.title !== prev.title ||
            tour.description !== prev.description ||
            tour.duration !== prev.duration ||
            JSON.stringify(tour.multimedia) !== JSON.stringify(prev.multimedia);

          return hasUpdatedAt || hasChanges;
        });

        updatedTours.forEach((tour) => {
          console.log('🔄 Tour actualizado:', tour.title);
          state.notifyTourUpdated(tour);
          notificationCount++;
        });

        // ============================================
        // 7. ✅ VERIFICAR ACTUALIZACIONES EN TESTIMONIOS
        // ============================================
        const updatedTestimonios = testimonios.filter((testimonio) => {
          const prev = prevTestimonios.find((p) => (p.id || p._id) === (testimonio.id || testimonio._id));
          if (!prev) return false;

          // Verificar cambios
          const hasUpdatedAt = testimonio.updatedAt !== prev.updatedAt || 
                              testimonio.updated_at !== prev.updated_at;
          const hasChanges = 
            testimonio.text !== prev.text ||
            testimonio.author !== prev.author ||
            testimonio.autor !== prev.autor;

          return hasUpdatedAt || hasChanges;
        });

        updatedTestimonios.forEach((testimonio) => {
          console.log('🔄 Testimonio actualizado:', testimonio.author || testimonio.autor);
          state.notifyTestimonioUpdated(testimonio);
          notificationCount++;
        });

        // ============================================
        // RESUMEN
        // ============================================
        if (notificationCount > 0) {
          console.log(`🔔 Total de ${notificationCount} notificaciones creadas:`, {
            nuevasCarreras: newCareers.length,
            nuevosTours: newTours.length,
            nuevosTestimonios: newTestimonios.length,
            carrerasActualizadas: updatedCareers.length,
            toursActualizados: updatedTours.length,
            testimoniosActualizados: updatedTestimonios.length,
            destacadas: newlyFeatured.length,
          });
        } else {
          console.log('✅ No hay actualizaciones nuevas');
        }

        state.updateLastCheck();
      },
    }),
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