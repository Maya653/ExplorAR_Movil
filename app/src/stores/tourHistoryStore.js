// src/screens/TourHistoryScreen.js - CÓDIGO COMPLETO Y CORREGIDO
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useTourHistoryStore from '../stores/tourHistoryStore';
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { getTimeAgo, getWatchIndicatorColor } from '../utils/timeUtils';
import { ClockIcon, PlayIcon, BackIcon } from '../../components/Icons';

const TourHistoryScreen = ({ navigation }) => {
  const { watchedTours, clearHistory, removeTourFromHistory } = useTourHistoryStore();
  const { tours } = useTourStore();
  const { trackScreenView } = useAnalyticsStore();

  useEffect(() => {
    console.log('📜 TourHistoryScreen montada');
    trackScreenView('TourHistory');
  }, []);

  // Ordenar por fecha más reciente
  const sortedHistory = [...watchedTours].sort(
    (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
  );

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Estás seguro de que deseas eliminar todo el historial de tours vistos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('✅ Historial limpiado', 'Se ha eliminado todo el historial');
          },
        },
      ]
    );
  };

  const handleRemoveTour = (tourId, tourTitle) => {
    Alert.alert(
      'Eliminar del Historial',
      `¿Deseas eliminar "${tourTitle}" del historial?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removeTourFromHistory(tourId);
          },
        },
      ]
    );
  };

  const handleTourPress = (tourId) => {
    console.log('🎬 Abriendo tour desde historial:', tourId);
    const fullTour = tours.find(t => (t.id || t._id) === tourId);
    if (fullTour) {
      navigation.navigate('ARViewer', {
        tourId: fullTour.id || fullTour._id,
        tourTitle: fullTour.title,
      });
    } else {
      Alert.alert('❌ Error', 'Este tour ya no está disponible');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Tours</Text>
        {watchedTours.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButtonContainer}>
            <Text style={styles.clearButton}>Limpiar</Text>
          </TouchableOpacity>
        )}
        {watchedTours.length === 0 && <View style={{ width: 60 }} />}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          👁️ {watchedTours.length} tour{watchedTours.length !== 1 ? 's' : ''} visto{watchedTours.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {sortedHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No hay historial</Text>
            <Text style={styles.emptySubtitle}>
              Los tours que veas aparecerán aquí
            </Text>
          </View>
        ) : (
          sortedHistory.map((watchedTour, index) => {
            const timeSinceWatch = Date.now() - new Date(watchedTour.watchedAt).getTime();
            const isRecent = timeSinceWatch < 24 * 60 * 60 * 1000;
            const isFrequent = watchedTour.watchCount >= 3;

            return (
              <TouchableOpacity
                key={`history-${watchedTour.tourId}-${index}`}
                style={[
                  styles.historyCard,
                  isRecent && styles.recentCard,
                ]}
                onPress={() => handleTourPress(watchedTour.tourId)}
                onLongPress={() => handleRemoveTour(watchedTour.tourId, watchedTour.tourTitle)}
              >
                <LinearGradient
                  colors={isRecent ? ['#10B981', '#059669'] : ['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {/* Badge de posición */}
                  {index < 3 && (
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>
                        {index === 0 ? '🏆 #1' : index === 1 ? '🥈 #2' : '🥉 #3'}
                      </Text>
                    </View>
                  )}

                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.tourTitle} numberOfLines={2}>
                      {watchedTour.tourTitle}
                    </Text>
                    <View style={[
                      styles.watchIndicator,
                      { backgroundColor: getWatchIndicatorColor(watchedTour.watchedAt) }
                    ]}>
                      <Text style={styles.watchIndicatorText}>👁️</Text>
                    </View>
                  </View>

                  {/* Watch Status */}
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                      ✅ Has visto este tour
                    </Text>
                  </View>

                  {/* Meta Info */}
                  <View style={styles.metaContainer}>
                    <View style={styles.timeInfo}>
                      <ClockIcon size={14} color="#FFFFFF" />
                      <Text style={styles.timeText}>
                        {getTimeAgo(watchedTour.watchedAt)}
                      </Text>
                    </View>

                    <View style={styles.countInfo}>
                      <Text style={styles.countText}>
                        📊 {watchedTour.watchCount} {watchedTour.watchCount === 1 ? 'vez' : 'veces'}
                      </Text>
                      {isFrequent && (
                        <View style={styles.frequentBadge}>
                          <Text style={styles.frequentText}>⭐ FAVORITO</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={[
                      styles.timeIndicator,
                      {
                        backgroundColor: isRecent ? '#FFFFFF' :
                          timeSinceWatch < 7 * 24 * 60 * 60 * 1000 ? 'rgba(255, 255, 255, 0.5)' :
                          'rgba(255, 255, 255, 0.3)'
                      }
                    ]} />
                    <Text style={styles.timeIndicatorText}>
                      {isRecent ? 'Recién visto' :
                        timeSinceWatch < 7 * 24 * 60 * 60 * 1000 ? 'Esta semana' : 'Hace tiempo'}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={() => handleTourPress(watchedTour.tourId)}
                    >
                      <PlayIcon size={10} color="#FFFFFF" />
                      <Text style={styles.playText}>Ver de nuevo</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  clearButtonContainer: {
    padding: 8,
  },
  clearButton: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  statsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
  },
  recentCard: {
    transform: [{ scale: 1.02 }],
  },
  cardGradient: {
    padding: 16,
  },
  positionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  positionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tourTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  watchIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  metaContainer: {
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  countInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  frequentBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  frequentText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  timeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.9,
    flex: 1,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default TourHistoryScreen;