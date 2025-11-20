// src/screens/TourHistoryScreen.js
// Pantalla para ver y gestionar el historial de tours vistos

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import useTourHistoryStore from '../stores/tourHistoryStore';
import { getTimeAgo } from '../utils/timeUtils';

const TourHistoryScreen = ({ navigation }) => {
  const { 
    watchedTours, 
    getStats, 
    clearHistory, 
    removeTourFromHistory,
    resetTourWatchCount,
  } = useTourHistoryStore();

  const [stats, setStats] = useState({ totalTours: 0, totalWatches: 0, averageWatches: 0 });

  useEffect(() => {
    setStats(getStats());
  }, [watchedTours]);

  const handleClearHistory = () => {
    Alert.alert(
      '🗑️ Limpiar Historial',
      '¿Estás seguro de que quieres eliminar todo tu historial de tours vistos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('✅ Historial limpiado', 'Tu historial ha sido eliminado completamente');
          },
        },
      ]
    );
  };

  const handleRemoveTour = (tourId, tourTitle) => {
    Alert.alert(
      '🗑️ Eliminar Tour',
      `¿Quieres eliminar "${tourTitle}" de tu historial?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removeTourFromHistory(tourId);
            Alert.alert('✅ Tour eliminado', `"${tourTitle}" ha sido eliminado de tu historial`);
          },
        },
      ]
    );
  };

  const handleResetCount = (tourId, tourTitle) => {
    Alert.alert(
      '🔄 Resetear Contador',
      `¿Quieres resetear el contador de "${tourTitle}" a 1 vista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          onPress: () => {
            resetTourWatchCount(tourId);
            setStats(getStats()); // Actualizar estadísticas
            Alert.alert('✅ Contador reseteado', 'El contador se ha reseteado a 1 vista');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Tours</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTours}</Text>
          <Text style={styles.statLabel}>Tours Únicos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalWatches}</Text>
          <Text style={styles.statLabel}>Total Vistas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.averageWatches}</Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
      </View>

      {/* Lista de Tours */}
      <ScrollView style={styles.content}>
        {watchedTours.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>👀 No has visto ningún tour aún</Text>
            <Text style={styles.emptySubtext}>
              Comienza a explorar para que aparezcan aquí
            </Text>
          </View>
        ) : (
          watchedTours.map((tour, index) => (
            <View key={`${tour.tourId}-${index}`} style={styles.tourCard}>
              <View style={styles.tourHeader}>
                <View style={styles.tourIndex}>
                  <Text style={styles.tourIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.tourInfo}>
                  <Text style={styles.tourTitle}>{tour.tourTitle}</Text>
                  <Text style={styles.tourType}>
                    {tour.tourType === '360' ? '🥽 Tour VR 360°' : '📱 Tour AR'}
                  </Text>
                </View>
              </View>

              <View style={styles.tourStats}>
                <Text style={styles.tourStat}>
                  👁️ Visto: <Text style={styles.tourStatBold}>{tour.watchCount}</Text> {tour.watchCount === 1 ? 'vez' : 'veces'}
                </Text>
                <Text style={styles.tourStat}>
                  🕒 Última vez: <Text style={styles.tourStatBold}>{getTimeAgo(tour.watchedAt)}</Text>
                </Text>
              </View>

              <View style={styles.tourActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleResetCount(tour.tourId, tour.tourTitle)}
                >
                  <Text style={styles.actionButtonText}>🔄 Resetear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleRemoveTour(tour.tourId, tour.tourTitle)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botón Limpiar Todo */}
      {watchedTours.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearAllButtonText}>🗑️ Limpiar Todo el Historial</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tourIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tourIndexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  tourInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tourType: {
    fontSize: 12,
    color: '#6B7280',
  },
  tourStats: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tourStat: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  tourStatBold: {
    fontWeight: '600',
    color: '#111827',
  },
  tourActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearAllButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  clearAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TourHistoryScreen;