// src/screens/AllCareersScreen.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useCareerStore from '../stores/careerStore';
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { SearchIcon } from '../../components/Icons';

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

const AllCareersScreen = ({ navigation }) => {
  const { careers, loading, fetchCareers, searchCareers } = useCareerStore();
  const { tours } = useTourStore();
  const { trackScreenView, trackCareerView } = useAnalyticsStore();

  const [searchText, setSearchText] = useState('');
  const [filteredCareers, setFilteredCareers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'tours', 'category'

  useEffect(() => {
    trackScreenView('AllCareers');
  }, []);

  // ✅ Sincronizar contador de tours por carrera
  const getCareersWithTourCount = useCallback(() => {
    return careers.map((career) => {
      const careerTours = tours.filter(
        (tour) => tour.careerId === career.id || tour.careerId === career._id
      );
      return {
        ...career,
        tourCount: careerTours.length,
        toursText: `${careerTours.length} tour${careerTours.length !== 1 ? 's' : ''}`,
      };
    });
  }, [careers, tours]);

  // Actualizar filtros cuando cambian los datos o la búsqueda
  useEffect(() => {
    let results = getCareersWithTourCount();

    // Aplicar búsqueda
    if (searchText.trim() !== '') {
      const searchResults = searchCareers(searchText);
      results = searchResults.map((career) => {
        const careerTours = tours.filter(
          (tour) => tour.careerId === career.id || tour.careerId === career._id
        );
        return {
          ...career,
          tourCount: careerTours.length,
          toursText: `${careerTours.length} tour${careerTours.length !== 1 ? 's' : ''}`,
        };
      });
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case 'name':
        results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'tours':
        results.sort((a, b) => b.tourCount - a.tourCount);
        break;
      case 'category':
        results.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      default:
        break;
    }

    setFilteredCareers(results);
  }, [searchText, careers, tours, sortBy, searchCareers, getCareersWithTourCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCareers();
    } catch (error) {
      console.error('Error al actualizar carreras:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCareers]);

  const handleCareerPress = (career) => {
    trackCareerView(career.id, career.title);
    navigation.navigate('Carrera', { career });
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'ciencias sociales':
        return ['#4263EB', '#3B82F6'];
      case 'ingeniería':
        return ['#7C3AED', '#A78BFA'];
      case 'salud':
        return ['#10B981', '#34D399'];
      case 'artes':
        return ['#F59E0B', '#FBBF24'];
      case 'negocios':
        return ['#EF4444', '#F87171'];
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  // Agrupar carreras por categoría
  const careersByCategory = filteredCareers.reduce((acc, career) => {
    const category = career.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(career);
    return acc;
  }, {});

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
        <Text style={styles.headerTitle}>Todas las Carreras</Text>
        <View style={styles.headerRight}>
          <Text style={styles.careerCount}>{filteredCareers.length}</Text>
        </View>
      </View>

      {/* ✅ SEARCH BAR */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={COLORS.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar carreras..."
            placeholderTextColor="#6B7280"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearch}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ✅ SORT OPTIONS */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>
              Nombre
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'tours' && styles.sortButtonActive]}
            onPress={() => setSortBy('tours')}
          >
            <Text style={[styles.sortText, sortBy === 'tours' && styles.sortTextActive]}>
              Tours
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'category' && styles.sortButtonActive]}
            onPress={() => setSortBy('category')}
          >
            <Text style={[styles.sortText, sortBy === 'category' && styles.sortTextActive]}>
              Categoría
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ✅ CAREERS LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Cargando carreras...</Text>
        </View>
      ) : (
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
          {filteredCareers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>
                {searchText ? 'No se encontraron carreras' : 'No hay carreras disponibles'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchText
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Pronto agregaremos más carreras'}
              </Text>
            </View>
          ) : sortBy === 'category' ? (
            // Vista agrupada por categoría
            Object.entries(careersByCategory).map(([category, careersInCategory]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.categoryCount}>
                    {careersInCategory.length} carrera{careersInCategory.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {careersInCategory.map((career) => (
                  <TouchableOpacity
                    key={career.id || career._id}
                    style={styles.careerCard}
                    onPress={() => handleCareerPress(career)}
                  >
                    <LinearGradient
                      colors={getCategoryColor(career.category)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.careerAccent}
                    />

                    <View style={styles.careerContent}>
                      <View style={styles.careerHeader}>
                        <Text style={styles.careerTitle} numberOfLines={2}>
                          {career.title || 'Sin título'}
                        </Text>
                        {career.isHighlighted && (
                          <View style={styles.highlightBadge}>
                            <Text style={styles.highlightText}>⭐</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.careerDescription} numberOfLines={2}>
                        {career.description || 'Sin descripción disponible'}
                      </Text>

                      <View style={styles.careerFooter}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{career.category || 'General'}</Text>
                        </View>

                        <View style={styles.tourCountContainer}>
                          <Text style={styles.tourCountIcon}>🎬</Text>
                          <Text
                            style={[
                              styles.tourCountText,
                              career.tourCount === 0 && styles.noToursText,
                            ]}
                          >
                            {career.toursText}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            // Vista de lista normal
            filteredCareers.map((career) => (
              <TouchableOpacity
                key={career.id || career._id}
                style={styles.careerCard}
                onPress={() => handleCareerPress(career)}
              >
                <LinearGradient
                  colors={getCategoryColor(career.category)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.careerAccent}
                />

                <View style={styles.careerContent}>
                  <View style={styles.careerHeader}>
                    <Text style={styles.careerTitle} numberOfLines={2}>
                      {career.title || 'Sin título'}
                    </Text>
                    {career.isHighlighted && (
                      <View style={styles.highlightBadge}>
                        <Text style={styles.highlightText}>⭐</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.careerDescription} numberOfLines={2}>
                    {career.description || 'Sin descripción disponible'}
                  </Text>

                  <View style={styles.careerFooter}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{career.category || 'General'}</Text>
                    </View>

                    <View style={styles.tourCountContainer}>
                      <Text style={styles.tourCountIcon}>🎬</Text>
                      <Text
                        style={[
                          styles.tourCountText,
                          career.tourCount === 0 && styles.noToursText,
                        ]}
                      >
                        {career.toursText}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  careerCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  
  // ✅ SEARCH BAR
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.secondary,
    marginLeft: 10,
  },
  clearSearch: {
    fontSize: 30,
    color: COLORS.mutedText,
    fontWeight: '300',
    paddingHorizontal: 6,
  },
  
  // ✅ SORT OPTIONS
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.secondary,
  },
  sortLabel: {
    fontSize: 13,
    color: COLORS.lightText,
    fontWeight: '600',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortText: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  sortTextActive: {
    color: COLORS.white,
  },
  
  // ✅ CONTENT
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.lightText,
  },
  
  // ✅ EMPTY STATE
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
  },
  
  // ✅ CATEGORY SECTION
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(138, 141, 0, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.lightText,
    fontWeight: '600',
  },
  
  // ✅ CAREER CARDS
  careerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  careerAccent: {
    width: 5,
  },
  careerContent: {
    flex: 1,
    padding: 14,
  },
  careerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  careerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  highlightBadge: {
    padding: 4,
  },
  highlightText: {
    fontSize: 18,
  },
  careerDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 10,
  },
  careerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  tourCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tourCountIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  tourCountText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  noToursText: {
    color: COLORS.error,
  },
  chevron: {
    fontSize: 28,
    color: COLORS.mutedText,
    alignSelf: 'center',
    marginRight: 14,
  },
});

export default AllCareersScreen;