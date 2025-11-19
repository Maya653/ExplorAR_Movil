// src/stores/notificationStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      lastChecked: null,

      // Agregar notificación
      addNotification: (notification) => {
        const newNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      // Marcar como leída
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      // Marcar todas como leídas
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
          unreadCount: 0,
          lastChecked: new Date().toISOString(),
        }));
      },

      // Limpiar notificaciones antiguas (más de 30 días)
      clearOldNotifications: () => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        set((state) => ({
          notifications: state.notifications.filter(
            (notif) => new Date(notif.timestamp).getTime() > thirtyDaysAgo
          ),
        }));
      },

      // Eliminar notificación
      deleteNotification: (notificationId) => {
        set((state) => {
          const notif = state.notifications.find((n) => n.id === notificationId);
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: notif && !notif.read ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      // Limpiar todas
      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      // Obtener notificaciones no leídas
      getUnreadNotifications: () => {
        return get().notifications.filter((notif) => !notif.read);
      },
    }),
    {
      name: 'explorar-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotificationStore;