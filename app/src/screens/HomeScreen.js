// src/screens/HomeScreen.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshControl,
  Dimensions,
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
import useTourHistoryStore from '../stores/tourHistoryStore';
import useNotificationStore from '../stores/notificationStore';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../utils/constants';
import { getTimeAgo, getWatchIndicatorColor } from '../utils/timeUtils';

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
  primary: '#8A8D00',      // PANTONE 392 C - Verde olivo (header, search)
  secondary: '#041E42',    // PANTONE 296 C - Azul marino (fondo contenido)
  white: '#FFFFFF',
  lightText: '#E5E7EB',
  mutedText: '#9CA3AF',
  accent: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// ✅ Obtener dimensiones para responsividad
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Referencias para detección de cambios
  const prevCareersRef = useRef([]);
  const prevToursRef = useRef([]);
  const prevTestimoniosRef = useRef([]);
  const isFirstLoadRef = useRef(true);

  // Zustand stores
  const { careers, loading: careersLoading, fetchCareers, searchCareers } = useCareerStore();
  const { tours, loading: toursLoading, fetchTours } = useTourStore();
  const { trackScreenView, trackCareerView } = useAnalyticsStore();
  const { getTourWatchInfo, isTourWatched, getRecentlyWatchedTours } = useTourHistoryStore();
  const { unreadCount, checkForUpdates } = useNotificationStore();

  const [filteredCareers, setFilteredCareers] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [testimoniosLoading, setTestimoniosLoading] = useState(false);

  // ✅ Sincronizar contador de tours por carrera
  const getCareersWithTourCount = useCallback(() => {
    return careers.map(career => {
      const careerTours = tours.filter(tour => 
        tour.careerId === career.id || tour.careerId === career._id
      );
      return {
        ...career,
        tours: `${careerTours.length} tour${careerTours.length !== 1 ? 's' : ''} disponible${careerTours.length !== 1 ? 's' : ''}`,
        tourCount: careerTours.length,
      };
    });
  }, [careers, tours]);

  // ✅ useEffect para detectar cambios
  useEffect(() => {
    if (careers.length > 0 || tours.length > 0 || testimonios.length > 0) {
      if (isFirstLoadRef.current) {
        console.log("📦 Primera carga: Inicializando referencias sin notificaciones");
        prevCareersRef.current = careers;
        prevToursRef.current = tours;
        prevTestimoniosRef.current = testimonios;
        isFirstLoadRef.current = false;
        return;
      }

      console.log("🔍 Verificando cambios (no es primera carga)");
      checkForUpdates(
        careers,
        tours,
        testimonios,
        prevCareersRef.current,
        prevToursRef.current,
        prevTestimoniosRef.current
      );

      prevCareersRef.current = careers;
      prevToursRef.current = tours;
      prevTestimoniosRef.current = testimonios;
    }
  }, [careers, tours, testimonios, checkForUpdates]);

  // Función centralizada para cargar todos los datos
  const loadAllData = useCallback(async () => {
    console.log('🔄 Cargando todos los datos...');
    
    try {
      await Promise.all([
        fetchCareers(),
        fetchTours(),
      ]);

      try {
        const response = await apiClient.get(ENDPOINTS.TESTIMONIOS, { timeout: 120000 });
        const data = Array.isArray(response.data) ? response.data : [];
        setTestimonios(data);
        console.log(`✅ ${data.length} testimonios cargados`);
      } catch (err) {
        console.error('Error cargando testimonios:', err);
        setTestimonios([]);
      }

      console.log('✅ Todos los datos cargados');
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  }, [fetchCareers, fetchTours]);

  // ✅ Función de refresh
  const onRefresh = useCallback(async () => {
    console.log('🔄 Iniciando refresh...');
    setRefreshing(true);
    
    try {
      const currentCareers = [...careers];
      const currentTours = [...tours];
      const currentTestimonios = [...testimonios];

      await Promise.all([
        fetchCareers(),
        fetchTours(),
      ]);

      try {
        const response = await apiClient.get(ENDPOINTS.TESTIMONIOS, { timeout: 120000 });
        const data = Array.isArray(response.data) ? response.data : [];
        setTestimonios(data);
      } catch (err) {
        console.error('Error recargando testimonios:', err);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCareers = useCareerStore.getState().careers;
      const newTours = useTourStore.getState().tours;

      checkForUpdates(
        newCareers,
        newTours,
        testimonios,
        currentCareers,
        currentTours,
        currentTestimonios
      );

      prevCareersRef.current = newCareers;
      prevToursRef.current = newTours;
      prevTestimoniosRef.current = testimonios;

      console.log('✅ Refresh completado exitosamente');
    } catch (error) {
      console.error('❌ Error en refresh:', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  }, [fetchCareers, fetchTours, careers, tours, testimonios, checkForUpdates]);

  // Cargar datos al montar
  useEffect(() => {
    console.log('🏠 HomeScreen montada');
    trackScreenView('Home');
    loadAllData();
  }, []);

  // Actualizar filtros cuando cambian los datos o la búsqueda
  useEffect(() => {
    const careersWithCount = getCareersWithTourCount();
    
    if (searchText.trim() === '') {
      setFilteredCareers(careersWithCount);
      setFilteredTours(tours);
    } else {
      const results = searchCareers(searchText);
      const resultsWithCount = results.map(career => {
        const careerTours = tours.filter(tour => 
          tour.careerId === career.id || tour.careerId === career._id
        );
        return {
          ...career,
          tours: `${careerTours.length} tour${careerTours.length !== 1 ? 's' : ''} disponible${careerTours.length !== 1 ? 's' : ''}`,
          tourCount: careerTours.length,
        };
      });
      setFilteredCareers(resultsWithCount);

      const lowerQuery = searchText.toLowerCase();
      const tourResults = tours.filter(t => {
        const title = (t.title || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        return title.includes(lowerQuery) || description.includes(lowerQuery);
      });
      setFilteredTours(tourResults);
    }
  }, [searchText, careers, tours, searchCareers, getCareersWithTourCount]);

  // Handler para seleccionar una carrera
  const handleCareerPress = (career) => {
    console.log('📌 Carrera seleccionada:', career.title);
    trackCareerView(career.id, career.title);
    navigation.navigate('Carrera', { career });
  };

  // ✅ Handler para iniciar un tour AR O VR 360°
  const handleTourPress = (tour) => {
    console.log('🎬 Tour seleccionado:', tour.title);
    
    let tourType = 'AR';
    
    if (tour.type === '360') {
      tourType = '360';
    } else if (tour.multimedia?.some(m => 
      m.type === '360-video' || m.type === '360-photo' || m.type === '360'
    )) {
      tourType = '360';
    }

    if (tourType === '360') {
      navigation.navigate('VR360Viewer', {
        tourId: tour.id || tour._id,
      });
    } else {
      navigation.navigate('ARViewer', {
        tourId: tour.id || tour._id,
        tourTitle: tour.title,
      });
    }
  };

  // ✅ Handler para abrir tours desde "Tours Recientes"
  const handleRecentTourPress = (watchedTour) => {
    const fullTour = tours.find(t => (t.id || t._id) === watchedTour.tourId);
    
    if (!fullTour) {
      Alert.alert('Error', 'No se encontró el tour');
      return;
    }

    const tourType = watchedTour.tourType || 'AR';

    if (tourType === '360') {
      navigation.navigate('VR360Viewer', {
        tourId: fullTour.id || fullTour._id,
      });
    } else {
      navigation.navigate('ARViewer', {
        tourId: fullTour.id || fullTour._id,
        tourTitle: fullTour.title,
      });
    }
  };

  const isLoading = careersLoading || toursLoading;

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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* ✅ HEADER CON COLOR INSTITUCIONAL */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../../assets/logo1.png')}
                style={styles.logo}
              />
              <Text style={styles.appName}>ExplorAR</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Image
                  source={require('../../assets/notificaciones.png')}
                  style={styles.notificationIcon}
                />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ SEARCH BAR EN EL HEADER */}
          <View style={styles.searchContainer}>
            <SearchIcon size={20} color={COLORS.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar carreras, tours..."
              placeholderTextColor="#6B7280"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* ✅ CONTENIDO CON FONDO AZUL MARINO */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.loadingText}>Cargando contenido...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary, COLORS.accent]}
                tintColor={COLORS.white}
                title="Actualizando..."
                titleColor={COLORS.lightText}
                progressBackgroundColor={COLORS.secondary}
              />
            }
          >
            {/* Featured Careers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Carreras Destacadas</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllCareers')}>
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
                          <Text style={styles.cardTours}>{career.tours}</Text>
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

            {/* Nuevos Tours Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🆕 Nuevos Tours</Text>
                <View style={styles.statusLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.legendText}>Disponible</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                    <Text style={styles.legendText}>Visto</Text>
                  </View>
                </View>
              </View>

              {(() => {
                const sortedTours = [...toursToRender].sort((a, b) => {
                  const dateA = new Date(a.createdAt || a.created_at || 0);
                  const dateB = new Date(b.createdAt || b.created_at || 0);
                  return dateB - dateA;
                });

                const newTours = sortedTours.slice(0, 10);
                const now = Date.now();
                const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

                return newTours.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {searchText ? 'No se encontraron tours' : 'No hay tours disponibles'}
                    </Text>
                  </View>
                ) : (
                  newTours.map((tour) => {
                    const watchInfo = getTourWatchInfo(tour.id || tour._id);
                    const isWatched = isTourWatched(tour.id || tour._id);
                    const isAvailable = tour.status === 'published' || tour.status === 'active' || tour.isActive !== false;
                    const tourDate = new Date(tour.createdAt || tour.created_at || 0).getTime();
                    const isReallyNew = tourDate > sevenDaysAgo;
                    
                    return (
                      <Swipeable
                        key={tour.id}
                        renderLeftActions={renderLeftActions}
                        renderRightActions={renderRightActions}
                        onSwipeableOpen={() => hideTour(tour)}
                      >
                        <TouchableOpacity 
                          style={[
                            styles.tourCard, 
                            isWatched && styles.watchedTourCard,
                            !isAvailable && styles.unavailableTourCard,
                            isReallyNew && styles.newTourCard,
                          ]}
                          onPress={() => handleTourPress(tour)}
                          disabled={!isAvailable}
                        >
                          <View style={styles.tourImageContainer}>
                            <Image
                              source={
                                tour.image
                                  ? (typeof tour.image === 'string' ? { uri: tour.image } : tour.image)
                                  : { uri: 'https://img.icons8.com/color/96/courthouse.png' }
                              }
                              style={[styles.tourImage, !isAvailable && styles.unavailableImage]}
                            />
                            
                            {isReallyNew && (
                              <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>🆕 NUEVO</Text>
                              </View>
                            )}
                            
                            <View style={[
                              styles.statusIndicator,
                              { backgroundColor: isAvailable ? COLORS.success : COLORS.error }
                            ]}>
                              <Text style={styles.statusText}>
                                {isAvailable ? '📁' : '🔒'}
                              </Text>
                            </View>
                            
                            {isAvailable && (
                              <TouchableOpacity 
                                style={styles.playButton}
                                onPress={() => handleTourPress(tour)}
                              >
                                <PlayIcon size={12} />
                              </TouchableOpacity>
                            )}
                            
                            {isWatched && (
                              <View style={[
                                styles.watchIndicator,
                                { backgroundColor: getWatchIndicatorColor(watchInfo?.watchedAt) }
                              ]}>
                                <Text style={styles.watchIndicatorText}>👁️</Text>
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.tourInfo}>
                            <View style={styles.tourHeader}>
                              <Text style={[
                                styles.tourTitle,
                                !isAvailable && styles.unavailableTextDark
                              ]}>
                                {tour.title}
                              </Text>
                              <View style={styles.badgesContainer}>
                                {!isAvailable && (
                                  <View style={styles.unavailableBadge}>
                                    <Text style={styles.unavailableBadgeText}>NO DISPONIBLE</Text>
                                  </View>
                                )}
                                {isWatched && (
                                  <View style={styles.watchBadge}>
                                    <Text style={styles.watchBadgeText}>VISTO</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            
                            <View style={styles.tourStatusContainer}>
                              <Text style={[
                                styles.tourStatusText,
                                { color: isAvailable ? COLORS.success : COLORS.error }
                              ]}>
                                {isAvailable ? '✅ Tour subido y disponible' : '❌ Tour no disponible'}
                              </Text>
                            </View>
                            
                            {isReallyNew && tour.createdAt && (
                              <Text style={styles.addedDateText}>
                                ✨ Agregado {getTimeAgo(tour.createdAt)}
                              </Text>
                            )}
                            
                            {watchInfo && isAvailable && (
                              <Text style={styles.watchInfoText}>
                                👀 Visto {getTimeAgo(watchInfo.watchedAt)}
                                {watchInfo.watchCount > 1 && ` • ${watchInfo.watchCount} veces`}
                              </Text>
                            )}
                            
                            <View style={styles.tourDetails}>
                              <View style={styles.tourDuration}>
                                <ClockIcon size={16} color={COLORS.mutedText} />
                                <Text style={[
                                  styles.durationText,
                                  !isAvailable && styles.unavailableTextDark
                                ]}>
                                  {tour.duration || '0 min'}
                                </Text>
                              </View>
                              {isAvailable && (
                                <View style={styles.progressContainer}>
                                  <View style={[styles.progressBar, { width: `${tour.progress || 0}%` }]} />
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Swipeable>
                    );
                  })
                );
              })()}
            </View>

            {/* Tours Recientes Section */}
            {(() => {
              const recentTours = getRecentlyWatchedTours();
              return recentTours.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tours Recientes</Text>
                    <View style={styles.recentToursInfo}>
                      <Text style={styles.recentToursSubtitle}>
                        👁️ {recentTours.length} tours vistos
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('TourHistory')}>
                        <Text style={styles.seeAllButton}>Ver historial</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
                    {recentTours.slice(0, 5).map((watchedTour, index) => {
                      const timeSinceWatch = Date.now() - new Date(watchedTour.watchedAt).getTime();
                      const isRecent = timeSinceWatch < 24 * 60 * 60 * 1000;
                      const isFrequent = watchedTour.watchCount >= 3;
                      
                      return (
                        <TouchableOpacity
                          key={`recent-${watchedTour.tourId}`}
                          style={[
                            styles.recentTourCard,
                            isRecent && styles.veryRecentCard,
                            index === 0 && styles.mostRecentCard
                          ]}
                          onPress={() => handleRecentTourPress(watchedTour)}
                        >
                          {index === 0 && (
                            <View style={styles.positionBadge}>
                              <Text style={styles.positionText}>🏆 RECIENTE</Text>
                            </View>
                          )}
                          
                          <View style={styles.recentTourHeader}>
                            <Text style={styles.recentTourTitle} numberOfLines={2}>
                              {watchedTour.tourTitle}
                            </Text>
                            <View style={[
                              styles.recentWatchIndicator,
                              { backgroundColor: getWatchIndicatorColor(watchedTour.watchedAt) }
                            ]}>
                              <Text style={styles.recentWatchIndicatorText}>👁️</Text>
                            </View>
                          </View>
                          
                          <View style={styles.watchStatusContainer}>
                            <Text style={[
                              styles.watchStatusText,
                              { color: isRecent ? COLORS.success : COLORS.warning }
                            ]}>
                              ✅ Has visto este tour
                            </Text>
                          </View>
                          
                          <View style={styles.recentTourMeta}>
                            <Text style={styles.recentTourTime}>
                              🕒 {getTimeAgo(watchedTour.watchedAt)}
                            </Text>
                            
                            <View style={styles.watchStats}>
                              <Text style={styles.recentTourCount}>
                                📊 {watchedTour.watchCount} {watchedTour.watchCount === 1 ? 'vez' : 'veces'}
                              </Text>
                              {isFrequent && (
                                <View style={styles.frequentBadge}>
                                  <Text style={styles.frequentText}>⭐ FAVORITO</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <View style={styles.timeIndicatorContainer}>
                            <View 
                              style={[
                                styles.timeIndicator,
                                { 
                                  backgroundColor: isRecent ? COLORS.success : 
                                                  timeSinceWatch < 7 * 24 * 60 * 60 * 1000 ? COLORS.warning : COLORS.mutedText
                                }
                              ]}
                            />
                            <Text style={styles.timeIndicatorText}>
                              {isRecent ? 'Recién visto' : 
                              timeSinceWatch < 7 * 24 * 60 * 60 * 1000 ? 'Esta semana' : 'Hace tiempo'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tours Recientes</Text>
                  </View>
                  <View style={styles.emptyRecentContainer}>
                    <Text style={styles.emptyRecentText}>👀 Aún no has visto ningún tour</Text>
                    <Text style={styles.emptyRecentSubtext}>¡Explora los tours disponibles para comenzar!</Text>
                  </View>
                </View>
              );
            })()}

            {/* Testimonios Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Testimonios</Text>
              </View>

              {testimoniosLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
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

            {/* Espaciado para el bottom nav */}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ✅ BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <HomeIcon size={24} active={true} color={COLORS.primary} />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => {
              trackScreenView('ExplorAR');
              navigation.navigate('ExplorAR');
            }}
          >
            <ExploreIcon size={24} color="#6B7280" />
            <Text style={styles.navText}>Explorar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              trackScreenView('Guardados');
              navigation.navigate('Guardados');
            }}
          >
            <BookmarkIcon size={24} color="#6B7280" />
            <Text style={styles.navText}>Guardados</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  
  // ✅ HEADER STYLES
  headerWrapper: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationIcon: {
    width: 26,
    height: 26,
    tintColor: COLORS.white,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  
  // ✅ SEARCH BAR
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.secondary,
    marginLeft: 10,
  },
  
  // ✅ CONTENT
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
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
    color: COLORS.lightText,
  },
  
  // ✅ SECTIONS
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
    color: COLORS.white,
  },
  seeAllButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // ✅ CARDS
  cardsContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: SCREEN_WIDTH * 0.75,
    maxWidth: 300,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  highlightBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  highlightText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  cardTours: {
    fontSize: 13,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.lightText,
    lineHeight: 18,
  },
  
  // ✅ EMPTY STATE
  emptyContainer: {
    width: SCREEN_WIDTH * 0.75,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: COLORS.lightText,
    fontSize: 14,
  },
  
  // ✅ TOUR CARDS
  tourCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  watchedTourCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  newTourCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  unavailableTourCard: {
    opacity: 0.6,
  },
  tourImageContainer: {
    position: 'relative',
  },
  tourImage: {
    width: 85,
    height: 85,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  unavailableImage: {
    opacity: 0.5,
  },
  statusIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
  },
  playButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchIndicatorText: {
    fontSize: 10,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 2,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  tourInfo: {
    flex: 1,
    padding: 12,
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tourTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
  },
  unavailableTextDark: {
    color: COLORS.mutedText,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unavailableBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  unavailableBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
  },
  watchBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  watchBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
  },
  tourStatusContainer: {
    marginBottom: 6,
  },
  tourStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  addedDateText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '500',
    marginBottom: 4,
  },
  watchInfoText: {
    fontSize: 10,
    color: COLORS.success,
    marginBottom: 6,
    fontWeight: '500',
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
    color: COLORS.mutedText,
    marginLeft: 4,
  },
  progressContainer: {
    width: 80,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  
  // ✅ RECENT TOURS
  recentToursInfo: {
    alignItems: 'flex-end',
  },
  recentToursSubtitle: {
    fontSize: 11,
    color: COLORS.lightText,
    marginBottom: 2,
  },
  recentTourCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginRight: 14,
    width: SCREEN_WIDTH * 0.55,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  veryRecentCard: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  mostRecentCard: {
    backgroundColor: '#F0FDF4',
  },
  positionBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  positionText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
  },
  recentTourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recentTourTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
    marginRight: 8,
  },
  recentWatchIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentWatchIndicatorText: {
    fontSize: 11,
  },
  watchStatusContainer: {
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  watchStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recentTourMeta: {
    marginBottom: 6,
  },
  recentTourTime: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  watchStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTourCount: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  frequentBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  frequentText: {
    color: '#92400E',
    fontSize: 8,
    fontWeight: '700',
  },
  timeIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  timeIndicatorText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyRecentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  emptyRecentText: {
    fontSize: 15,
    color: COLORS.lightText,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyRecentSubtext: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
  
  // ✅ TESTIMONIALS
  testimonialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  testimonialThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  testimonialText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  
  // ✅ SWIPE ACTIONS
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 14,
  },
  swipeLeft: {
    backgroundColor: COLORS.warning,
  },
  swipeRight: {
    backgroundColor: COLORS.error,
  },
  swipeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  
  // ✅ LEGEND
  statusLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.lightText,
    fontWeight: '500',
  },
  
  // ✅ BOTTOM NAVIGATION
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeNavText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;