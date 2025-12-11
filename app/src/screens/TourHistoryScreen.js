// src/screens/TourHistoryScreen.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
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
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import useTourHistoryStore from '../stores/tourHistoryStore';
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* ✅ HEADER CON COLOR INSTITUCIONAL */}
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

      {/* ✅ ESTADÍSTICAS */}
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

      {/* ✅ LISTA DE TOURS */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {watchedTours.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👀</Text>
            <Text style={styles.emptyText}>No has visto ningún tour aún</Text>
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
                  <Text style={styles.tourTitle} numberOfLines={2}>
                    {tour.tourTitle}
                  </Text>
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

      {/* ✅ BOTÓN LIMPIAR TODO */}
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 70,
  },
  
  // ✅ ESTADÍSTICAS
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: COLORS.secondary,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // ✅ CONTENT
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  
  // ✅ EMPTY STATE
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.lightText,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
  
  // ✅ TOUR CARDS
  tourCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tourIndex: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(138, 141, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(138, 141, 0, 0.3)',
  },
  tourIndexText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tourInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 5,
    lineHeight: 22,
  },
  tourType: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  tourStats: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  tourStat: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  tourStatBold: {
    fontWeight: '700',
    color: COLORS.secondary,
  },
  tourActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(138, 141, 0, 0.15)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(138, 141, 0, 0.3)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  
  // ✅ FOOTER
  footer: {
    padding: 16,
    backgroundColor: COLORS.secondary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  clearAllButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  clearAllButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default TourHistoryScreen;