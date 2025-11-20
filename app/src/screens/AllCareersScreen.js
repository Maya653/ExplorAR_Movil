// src/screens/AllCareersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useCareerStore from '../stores/careerStore';
import useTourStore from '../stores/tourStore'; // ✅ AGREGAR ESTA LÍNEA
import useAnalyticsStore from '../stores/analyticsStore';
import { SearchIcon } from '../../components/Icons';

const AllCareersScreen = ({ navigation }) => {
  const { 
    careers, 
    searchCareers,
    updateCareerTourCounts  // ✅ AGREGAR
  } = useCareerStore();
  
  const { tours } = useTourStore(); // ✅ AGREGAR ESTA LÍNEA
  const { trackScreenView, trackCareerView } = useAnalyticsStore();
  
  const [searchText, setSearchText] = useState('');
  const [filteredCareers, setFilteredCareers] = useState(careers);

  useEffect(() => {
    trackScreenView('AllCareers');
  }, []);

  // ✅ AGREGAR: Actualizar contadores cuando cambien los tours
  useEffect(() => {
    if (tours.length > 0 && careers.length > 0) {
      console.log('🔄 Actualizando contadores en AllCareers...');
      updateCareerTourCounts(tours);
    }
  }, [tours, careers.length, updateCareerTourCounts]);

  // ✅ Actualizar filtros
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredCareers(careers);
    } else {
      const results = searchCareers(searchText);
      setFilteredCareers(results);
    }
  }, [searchText, careers, searchCareers]);

  const handleCareerPress = (career) => {
    trackCareerView(career.id, career.title);
    navigation.navigate('Carrera', { career });
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
        <Text style={styles.headerTitle}>Todas las Carreras</Text>
        <View style={{ width: 40 }} />
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
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredCareers.length} carrera{filteredCareers.length !== 1 ? 's' : ''}{' '}
          {searchText ? 'encontrada' + (filteredCareers.length !== 1 ? 's' : '') : 'disponible' + (filteredCareers.length !== 1 ? 's' : '')}
        </Text>
      </View>

      {/* Careers List */}
      <ScrollView style={styles.content}>
        {filteredCareers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No se encontraron carreras</Text>
            <Text style={styles.emptySubtitle}>
              Intenta con otro término de búsqueda
            </Text>
          </View>
        ) : (
          filteredCareers.map((career) => (
            <TouchableOpacity
              key={career.id}
              style={styles.careerCard}
              onPress={() => handleCareerPress(career)}
            >
              <LinearGradient
                colors={['#4263EB', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {career.isHighlighted && (
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightText}>⭐ Destacado</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {career.category || 'General'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.careerTitle}>{career.title}</Text>
                {/* ✅ MOSTRAR CONTADOR SINCRONIZADO */}
                <Text style={styles.careerTours}>
                  {career.tours || '0 tours disponibles'}
                </Text>
                <Text style={styles.careerDescription} numberOfLines={2}>
                  {career.description || 'Sin descripción disponible'}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {career.rating || '0.0'}</Text>
                  </View>
                  <Text style={styles.viewButton}>Ver detalles →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  careerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
  },
  highlightBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  highlightText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  cardHeader: {
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  careerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  careerTours: {
    fontSize: 13,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  careerDescription: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  viewButton: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AllCareersScreen;