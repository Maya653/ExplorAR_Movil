// src/screens/NotificationsScreen.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
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
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useNotificationStore from '../stores/notificationStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { getTimeAgo } from '../utils/timeUtils';

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
  primary: '#8A8D00',      // PANTONE 392 C - Verde olivo
  secondary: '#041E42',    // PANTONE 296 C - Azul marino
  white: '#FFFFFF',
  lightText: '#E5E7EB',
  mutedText: '#9CA3AF',
  accent: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // ✅ handleNotificationPress con mejor navegación
  const handleNotificationPress = (notification) => {
    // Marcar como leída
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navegar según el tipo
    switch (notification.type) {
      case 'new_career':
      case 'featured_career':
      case 'career_updated':
        if (notification.data?.careerId) {
          navigation.navigate('Carrera', {
            career: { 
              id: notification.data.careerId, 
              title: notification.data.careerTitle 
            },
          });
        } else {
          navigation.navigate('Home');
        }
        break;

      case 'new_tour':
      case 'tour_updated':
        if (notification.data?.tourId) {
          navigation.navigate('ARViewer', {
            tourId: notification.data.tourId,
            tourTitle: notification.data.tourTitle,
          });
        } else {
          navigation.navigate('Home');
        }
        break;

      case 'new_testimonio':
      case 'testimonio_updated':
        navigation.navigate('Home');
        setTimeout(() => {
          Alert.alert(
            notification.type === 'new_testimonio' ? 'Nuevo Testimonio' : 'Testimonio Actualizado',
            'Revisa la sección de testimonios en la página principal',
            [{ text: 'Entendido', style: 'default' }]
          );
        }, 500);
        break;

      case 'new_version':
        const version = notification.data?.version || 'la nueva versión';
        Alert.alert(
          'Nueva Versión Disponible',
          `ExplorAR ${version} está disponible. Actualiza la app para obtener las últimas mejoras.`,
          [{ text: 'Entendido', style: 'default' }]
        );
        break;

      case 'system':
        Alert.alert(
          notification.title || 'Notificación',
          notification.message,
          [{ text: 'Entendido', style: 'default' }]
        );
        break;

      default:
        navigation.navigate('Home');
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
      case 'new_testimonio':
        return '💬';
      case 'career_updated':
        return '🔄';
      case 'tour_updated':
        return '🔄';
      case 'testimonio_updated':
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
      case 'new_testimonio':
        return ['#10B981', '#34D399'];
      case 'career_updated':
      case 'tour_updated':
      case 'testimonio_updated':
        return ['#F59E0B', '#FBBF24'];
      case 'new_version':
        return ['#EF4444', '#F87171'];
      case 'featured_career':
        return ['#EC4899', '#F472B6'];
      case 'system':
        return ['#6B7280', '#9CA3AF'];
      default:
        return ['#4F46E5', '#7C3AED'];
    }
  };

  const filteredNotifications =
    filter === 'unread' ? getUnreadNotifications() : notifications;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ✅ HEADER CON COLOR INSTITUCIONAL */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/flecha_retorno.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ FILTERS */}
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

      {/* ✅ NOTIFICATIONS LIST */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.white}
            progressBackgroundColor={COLORS.secondary}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  
  // ✅ HEADER CON COLOR INSTITUCIONAL
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  clearButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#FEE2E2',
    fontWeight: '700',
  },
  
  // ✅ FILTERS
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.secondary,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(138, 141, 0, 0.2)',
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(138, 141, 0, 0.4)',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // ✅ CONTENT
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  
  // ✅ EMPTY STATE
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
  },
  
  // ✅ NOTIFICATION CARDS
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIcon: {
    fontSize: 26,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  readIndicator: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteIcon: {
    fontSize: 26,
    color: COLORS.error,
    fontWeight: '300',
  },
  bottomInfo: {
    padding: 24,
    alignItems: 'center',
  },
  bottomInfoText: {
    fontSize: 12,
    color: COLORS.mutedText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NotificationsScreen;