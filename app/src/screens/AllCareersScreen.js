// src/screens/AllCareersScreen.js
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useCareerStore from '../stores/careerStore';
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import { SearchIcon } from '../../components/Icons';

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
        <Text style={styles.headerTitle}>Todas las Carreras</Text>
        <View style={styles.headerRight}>
          <Text style={styles.careerCount}>{filteredCareers.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchIcon size={20} />
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

      {/* Sort Options */}
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

      {/* Careers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Cargando carreras...</Text>
        </View>
      ) : (
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
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  careerCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
  },
  clearSearch: {
    fontSize: 28,
    color: '#D1D5DB',
    fontWeight: '300',
    paddingHorizontal: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#4F46E5',
  },
  sortText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  careerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  careerAccent: {
    width: 4,
  },
  careerContent: {
    flex: 1,
    padding: 12,
  },
  careerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  careerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  highlightBadge: {
    padding: 4,
  },
  highlightText: {
    fontSize: 16,
  },
  careerDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  careerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  tourCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tourCountIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tourCountText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  noToursText: {
    color: '#EF4444',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    alignSelf: 'center',
    marginRight: 12,
  },
});

export default AllCareersScreen;