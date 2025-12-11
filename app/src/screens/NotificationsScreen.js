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
import { Ionicons, Feather } from '@expo/vector-icons';
import useNotificationStore from '../stores/notificationStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { getTimeAgo } from '../utils/timeUtils';

// ✅ COLORES PREMIUM (Azul y Dorado)
const COLORS = {
  primary: '#D4AF37',      // Dorado Premium
  secondary: '#0A1A2F',    // Azul Oscuro Profundo
  background: '#0A1A2F',   // Fondo Principal
  card: '#112240',         // Fondo de Tarjetas
  text: '#E6F1FF',         // Texto Principal (Blanco Azulado)
  subtext: '#8892B0',      // Texto Secundario (Gris Azulado)
  accent: '#64FFDA',       // Acento (Cyan Brillante para detalles)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: 'rgba(212, 175, 55, 0.2)', // Borde dorado sutil
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
        return 'school-outline';
      case 'new_tour':
        return 'cube-outline';
      case 'new_testimonio':
        return 'chatbubbles-outline';
      case 'career_updated':
        return 'refresh-circle-outline';
      case 'tour_updated':
        return 'refresh-circle-outline';
      case 'testimonio_updated':
        return 'refresh-circle-outline';
      case 'new_version':
        return 'rocket-outline';
      case 'featured_career':
        return 'star-outline';
      case 'system':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_career':
        return [COLORS.primary, '#F59E0B']; // Dorado a Naranja
      case 'new_tour':
        return ['#64FFDA', '#10B981']; // Cyan a Verde
      case 'new_testimonio':
        return ['#A78BFA', '#7C3AED']; // Violeta
      case 'career_updated':
      case 'tour_updated':
      case 'testimonio_updated':
        return ['#3B82F6', '#2563EB']; // Azul
      case 'new_version':
        return ['#EF4444', '#F87171']; // Rojo
      case 'featured_career':
        return ['#EC4899', '#F472B6']; // Rosa
      case 'system':
        return ['#6B7280', '#9CA3AF']; // Gris
      default:
        return [COLORS.primary, COLORS.secondary];
    }
  };

  const filteredNotifications =
    filter === 'unread' ? getUnreadNotifications() : notifications;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* ✅ HEADER PREMIUM */}
      <LinearGradient
        colors={[COLORS.secondary, '#0F2A4A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

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
            tintColor={COLORS.primary}
            progressBackgroundColor={COLORS.card}
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color={COLORS.subtext} style={{ marginBottom: 20 }} />
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
                <Ionicons name={getNotificationIcon(notification.type)} size={24} color={COLORS.white} />
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={12} color={COLORS.subtext} style={{ marginRight: 4 }} />
                    <Text style={styles.notificationTime}>
                      {getTimeAgo(notification.timestamp)}
                    </Text>
                  </View>

                  {notification.read && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-done-outline" size={14} color={COLORS.success} style={{ marginRight: 2 }} />
                      <Text style={styles.readIndicator}>Leído</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteNotification(notification.id)}
              >
                <Ionicons name="close-outline" size={20} color={COLORS.error} />
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
    backgroundColor: COLORS.background,
  },
  
  // ✅ HEADER PREMIUM
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  clearButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '700',
  },
  
  // ✅ FILTERS
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  filterTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // ✅ NOTIFICATION CARDS
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  unreadCard: {
    backgroundColor: '#1A2744', // Un poco más claro que card
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '700',
    color: COLORS.white,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 8,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '500',
  },
  readIndicator: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  deleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginLeft: 8,
  },
  bottomInfo: {
    padding: 24,
    alignItems: 'center',
  },
  bottomInfoText: {
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default NotificationsScreen;