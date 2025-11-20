// src/screens/TourHistoryScreen.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import useTourHistoryStore from '../stores/tourHistoryStore';
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { getTimeAgo, getWatchIndicatorColor } from '../utils/timeUtils';

const TourHistoryScreen = ({ navigation }) => {
  const { getRecentlyWatchedTours, clearHistory } = useTourHistoryStore();
  const { tours } = useTourStore();
  const { trackScreenView } = useAnalyticsStore();

  const watchedTours = getRecentlyWatchedTours();

  useEffect(() => {
    trackScreenView('TourHistory');
  }, []);

  const handleTourPress = (watchedTour) => {
    const fullTour = tours.find((t) => (t.id || t._id) === watchedTour.tourId);
    if (fullTour) {
      navigation.navigate('ARViewer', {
        tourId: fullTour.id || fullTour._id,
        tourTitle: fullTour.title,
      });
    }
  };

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
        <Text style={styles.headerTitle}>Historial de Tours</Text>
        {watchedTours.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearButton}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {watchedTours.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            👁️ {watchedTours.length} tour{watchedTours.length !== 1 ? 's' : ''} visto
            {watchedTours.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* History List */}
      <ScrollView style={styles.content}>
        {watchedTours.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👀</Text>
            <Text style={styles.emptyTitle}>No has visto ningún tour</Text>
            <Text style={styles.emptySubtitle}>
              ¡Explora los tours disponibles para comenzar!
            </Text>
          </View>
        ) : (
          watchedTours.map((watchedTour, index) => {
            const timeSinceWatch = Date.now() - new Date(watchedTour.watchedAt).getTime();
            const isRecent = timeSinceWatch < 24 * 60 * 60 * 1000;
            const isFrequent = watchedTour.watchCount >= 3;

            return (
              <TouchableOpacity
                key={`history-${watchedTour.tourId}-${index}`}
                style={[styles.historyCard, isRecent && styles.recentCard]}
                onPress={() => handleTourPress(watchedTour)}
              >
                <View
                  style={[
                    styles.watchIndicator,
                    { backgroundColor: getWatchIndicatorColor(watchedTour.watchedAt) },
                  ]}
                >
                  <Text style={styles.watchIndicatorText}>👁️</Text>
                </View>

                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>{watchedTour.tourTitle}</Text>

                  <View style={styles.historyMeta}>
                    <Text style={styles.historyTime}>
                      🕒 {getTimeAgo(watchedTour.watchedAt)}
                    </Text>
                    <Text style={styles.historyCount}>
                      📊 {watchedTour.watchCount} {watchedTour.watchCount === 1 ? 'vez' : 'veces'}
                    </Text>
                  </View>

                  <View style={styles.badges}>
                    {isRecent && (
                      <View style={styles.recentBadge}>
                        <Text style={styles.recentBadgeText}>🔥 RECIENTE</Text>
                      </View>
                    )}
                    {isFrequent && (
                      <View style={styles.frequentBadge}>
                        <Text style={styles.frequentBadgeText}>⭐ FAVORITO</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.chevron}>›</Text>
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
  statsContainer: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statsText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  watchIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  watchIndicatorText: {
    fontSize: 18,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTime: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 12,
  },
  historyCount: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  recentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  frequentBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  frequentBadgeText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 8,
  },
});

export default TourHistoryScreen;