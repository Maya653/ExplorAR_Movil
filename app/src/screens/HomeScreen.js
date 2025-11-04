// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  SearchIcon,
  HeartIcon,
  PlayIcon,
  ClockIcon,
  HomeIcon,
  ExploreIcon,
  BookmarkIcon,
  StarIcon,
} from '../../components/Icons';

// Importar stores
import useCareerStore from '../stores/careerStore';
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import useHiddenStore from '../stores/hiddenStore';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../utils/constants';

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');

  // Zustand stores
  const { careers, loading: careersLoading, fetchCareers, searchCareers } = useCareerStore();
  const { tours, loading: toursLoading, fetchTours } = useTourStore();
  const { trackScreenView, trackCareerView } = useAnalyticsStore();

  const [filteredCareers, setFilteredCareers] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);

  // Cargar datos al montar
  useEffect(() => {
    console.log('🏠 HomeScreen montada');
    trackScreenView('Home');
    fetchCareers();
    fetchTours();
  }, []);

  // Actualizar filtros cuando cambian los datos o la búsqueda
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredCareers(careers);
      setFilteredTours(tours);
    } else {
      const results = searchCareers(searchText);
      setFilteredCareers(results);

      // Filtrar tours
      const lowerQuery = searchText.toLowerCase();
      const tourResults = tours.filter(t => {
        const title = (t.title || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        return title.includes(lowerQuery) || description.includes(lowerQuery);
      });
      setFilteredTours(tourResults);
    }
  }, [searchText, careers, tours, searchCareers]);

  // Handler para seleccionar una carrera
  const handleCareerPress = (career) => {
    console.log('📌 Carrera seleccionada:', career.title);
    
    // Registrar evento de analytics
    trackCareerView(career.id, career.title);
    
    // Navegar a detalle
    navigation.navigate('Carrera', { career });
  };

  const isLoading = careersLoading || toursLoading;
  const [testimonios, setTestimonios] = useState([]);
  const [testimoniosLoading, setTestimoniosLoading] = useState(false);

  // Cargar testimonios
  useEffect(() => {
    let mounted = true;
    const fetchTestimonios = async () => {
      setTestimoniosLoading(true);
      try {
  const response = await apiClient.get(ENDPOINTS.TESTIMONIOS, { timeout: 30000 });
        const data = Array.isArray(response.data) ? response.data : [];
        if (mounted) setTestimonios(data);
      } catch (err) {
        console.error('Error cargando testimonios en HomeScreen:', err);
        if (mounted) setTestimonios([]);
      } finally {
        if (mounted) setTestimoniosLoading(false);
      }
    };
    fetchTestimonios();
    return () => { mounted = false; };
  }, []);

  // Store de ocultos (sesión)
  const hiddenTours = useHiddenStore((s) => s.hiddenTours);
  const hiddenTestimonials = useHiddenStore((s) => s.hiddenTestimonials);
  const hideTour = useHiddenStore((s) => s.hideTour);
  const hideTestimonial = useHiddenStore((s) => s.hideTestimonial);

  // Acciones visuales para swipe
  const renderLeftActions = () => (
    <View style={[styles.swipeAction, styles.swipeLeft]}>
      <Text style={styles.swipeText}>Ocultar</Text>
    </View>
  );
  const renderRightActions = () => (
    <View style={[styles.swipeAction, styles.swipeRight]}>
      <Text style={styles.swipeText}>Ocultar</Text>
    </View>
  );

  // Filtrar según ocultos
  const toursToRender = filteredTours.filter((t) => !hiddenTours.some((h) => h.id === t.id));
  const testimoniosToRender = testimonios.filter((t) => !hiddenTestimonials.some((h) => h.id === t.id));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo1.png')}
            style={styles.logo}
          />
          <Text style={styles.appName}>ExplorAR</Text>
        </View>
        <View style={styles.headerRight}>
          
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={require('../../assets/notificaciones.png')}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchIcon size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar carreras, tours..."
          placeholderTextColor="#6B7280"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Cargando contenido...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Featured Careers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Carreras Destacadas</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
              {filteredCareers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? 'No se encontraron carreras' : 'No hay carreras disponibles'}
                  </Text>
                </View>
              ) : (
                filteredCareers.map((career) => (
                  <TouchableOpacity
                    key={career.id}
                    style={styles.featuredCard}
                    onPress={() => handleCareerPress(career)}
                  >
                    <LinearGradient
                      colors={['#4263EB', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    >
                      <View style={styles.cardContent}>
                        {career.isHighlighted && (
                          <View style={styles.highlightBadge}>
                            <Text style={styles.highlightText}>Destacado</Text>
                          </View>
                        )}
                        <View style={styles.cardMetadata}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{career.category || 'General'}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardTitle}>{career.title || 'Sin título'}</Text>
                        <Text style={styles.cardTours}>{career.tours || '0 tours disponibles'}</Text>
                        <Text style={styles.cardDescription} numberOfLines={3}>
                          {career.description || 'Sin descripción disponible'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* Recent Tours Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tours Recientes</Text>
            </View>

            {toursToRender.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText ? 'No se encontraron tours' : 'No hay tours disponibles'}
                </Text>
              </View>
            ) : (
              toursToRender.map((tour) => (
                <Swipeable
                  key={tour.id}
                  renderLeftActions={renderLeftActions}
                  renderRightActions={renderRightActions}
                  onSwipeableOpen={() => hideTour(tour)}
                >
                  <TouchableOpacity style={styles.tourCard}>
                    <View style={styles.tourImageContainer}>
                      <Image
                        source={
                          tour.image
                            ? (typeof tour.image === 'string' ? { uri: tour.image } : tour.image)
                            : { uri: 'https://img.icons8.com/color/96/courthouse.png' }
                        }
                        style={styles.tourImage}
                      />
                      <TouchableOpacity style={styles.playButton}>
                        <PlayIcon size={12} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.tourInfo}>
                      <Text style={styles.tourTitle}>{tour.title}</Text>
                      <View style={styles.tourDetails}>
                        <View style={styles.tourDuration}>
                          <ClockIcon size={16} />
                          <Text style={styles.durationText}>{tour.duration || '0 min'}</Text>
                        </View>
                        <View style={styles.progressContainer}>
                          <View style={[styles.progressBar, { width: `${tour.progress || 0}%` }]} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              ))
            )}
          </View>

          {/* Testimonios Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Testimonios</Text>
            </View>

            {testimoniosLoading ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : testimoniosToRender.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay testimonios disponibles</Text>
              </View>
            ) : (
              testimoniosToRender.slice(0, 5).map((t) => (
                <Swipeable
                  key={t.id}
                  renderLeftActions={renderLeftActions}
                  renderRightActions={renderRightActions}
                  onSwipeableOpen={() => hideTestimonial(t)}
                >
                  <View style={styles.testimonialCard}>
                    <Image
                      source={t.authorImage ? (typeof t.authorImage === 'string' ? { uri: t.authorImage } : t.authorImage) : require('../../assets/homescreen.png')}
                      style={styles.testimonialThumb}
                    />
                    <View style={styles.testimonialInfo}>
                      <Text style={styles.testimonialName}>{t.author || t.autor || 'Anónimo'}</Text>
                      <Text style={styles.testimonialText} numberOfLines={2}>{t.text}</Text>
                    </View>
                  </View>
                </Swipeable>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <HomeIcon size={24} active={true} />
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => {
            trackScreenView('ExplorAR');
            navigation.navigate('ExplorAR');
          }}
        >
          <ExploreIcon size={24} />
          <Text style={styles.navText}>Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            trackScreenView('Guardados');
            navigation.navigate('Guardados');
          }}
        >
          <BookmarkIcon size={24} />
          <Text style={styles.navText}>Guardados</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    width: 280,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginRight: 16,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
  cardMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  cardsContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: 280,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 3,
    backgroundColor: '#4263EB',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardTours: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  tourCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tourImageContainer: {
    position: 'relative',
  },
  tourImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  playButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tourInfo: {
    flex: 1,
    padding: 12,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  tourDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tourDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  progressContainer: {
    width: 100,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeNavText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  /* Testimonios */
  testimonialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  testimonialThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  testimonialText: {
    fontSize: 13,
    color: '#374151',
  },
  // Acciones de swipe
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
  },
  swipeLeft: {
    backgroundColor: '#F59E0B',
  },
  swipeRight: {
    backgroundColor: '#EF4444',
  },
  swipeText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default HomeScreen;