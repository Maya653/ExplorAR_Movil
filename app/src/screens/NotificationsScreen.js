// src/screens/NotificationsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useNotificationStore from '../stores/notificationStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { getTimeAgo } from '../utils/timeUtils';

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadNotifications,
  } = useNotificationStore();

  const { trackScreenView } = useAnalyticsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    trackScreenView('Notifications');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular actualización
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (notification) => {
    // Marcar como leída
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navegar según el tipo
    switch (notification.type) {
      case 'new_career':
      case 'featured_career':
        if (notification.data?.careerId) {
          navigation.navigate('Carrera', {
            career: { id: notification.data.careerId, title: notification.data.careerTitle },
          });
        }
        break;

      case 'new_tour':
      case 'tour_updated':
        if (notification.data?.tourId) {
          navigation.navigate('ARViewer', {
            tourId: notification.data.tourId,
            tourTitle: notification.data.tourTitle,
          });
        }
        break;

      case 'new_version':
        // Aquí podrías abrir una pantalla de información de versión
        Alert.alert(
          'Nueva Versión',
          `ExplorAR ${notification.data?.version} está disponible. Actualiza para obtener las últimas mejoras.`,
          [{ text: 'Entendido', style: 'default' }]
        );
        break;

      default:
        break;
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Eliminar Notificación',
      '¿Estás seguro de que quieres eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar Todas',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_career':
        return '🎓';
      case 'new_tour':
        return '🎬';
      case 'tour_updated':
        return '🔄';
      case 'new_version':
        return '🚀';
      case 'featured_career':
        return '⭐';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_career':
        return ['#4263EB', '#3B82F6'];
      case 'new_tour':
        return ['#7C3AED', '#A78BFA'];
      case 'tour_updated':
        return ['#10B981', '#34D399'];
      case 'new_version':
        return ['#F59E0B', '#FBBF24'];
      case 'featured_career':
        return ['#EF4444', '#F87171'];
      case 'system':
        return ['#6B7280', '#9CA3AF'];
      default:
        return ['#4F46E5', '#7C3AED'];
    }
  };

  const filteredNotifications =
    filter === 'unread' ? getUnreadNotifications() : notifications;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/flecha_retorno.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearButton}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {notifications.length > 0 && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todas ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              No leídas ({unreadCount})
            </Text>
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No hay notificaciones'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'Todas tus notificaciones están al día'
                : 'Te notificaremos sobre nuevas carreras y tours'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationCard, !notification.read && styles.unreadCard]}
              onPress={() => handleNotificationPress(notification)}
              onLongPress={() => handleDeleteNotification(notification.id)}
            >
              <LinearGradient
                colors={getNotificationColor(notification.type)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Text style={styles.notificationIcon}>{getNotificationIcon(notification.type)}</Text>
              </LinearGradient>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle,
                    ]}
                  >
                    {notification.title}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>

                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationTime}>
                    🕒 {getTimeAgo(notification.timestamp)}
                  </Text>

                  {notification.read && (
                    <Text style={styles.readIndicator}>✓ Leído</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteNotification(notification.id)}
              >
                <Text style={styles.deleteIcon}>×</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {filteredNotifications.length > 0 && (
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomInfoText}>
              Mantén presionada una notificación para eliminarla
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  markAllButton: {
    marginLeft: 'auto',
  },
  markAllText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#4F46E5',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  readIndicator: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 28,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  bottomInfo: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  bottomInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NotificationsScreen;