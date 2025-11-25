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
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  SearchIcon,
  PlayIcon,
  ClockIcon,
} from '../../components/Icons';
import AnimatedBell from '../../components/AnimatedBell';

// ✅ Componente de Icono Animado (Pulso)
const PulseIcon = ({ name, size, color, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

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

// ✅ COLORES INSTITUCIONALES PREMIUM
const COLORS = {
  primary: '#D4AF37',      // Gold
  secondary: '#0A1A2F',    // Dark Blue
  background: '#0A1A2F',   // Dark Blue Background
  card: '#112240',         // Lighter Blue for cards
  text: '#E6F1FF',         // Light Text
  muted: '#8892B0',        // Muted Text
  accent: '#D4AF37',       // Gold Accent
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  border: '#233554',
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
                <AnimatedBell color={COLORS.primary} size={24} badgeCount={unreadCount} />
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
                <View style={{flexDirection:'row', alignItems:'center'}}>
                <PulseIcon name="sparkles" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                <Text style={styles.sectionTitle}>Nuevos Tours</Text>
              </View>
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
                              {isAvailable ? (
                                <Ionicons name="folder-open" size={12} color={COLORS.white} />
                              ) : (
                                <Ionicons name="lock-closed" size={12} color={COLORS.white} />
                              )}
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
                                <Ionicons name="eye" size={12} color={COLORS.white} />
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
                              <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Ionicons name={isAvailable ? "checkmark-circle" : "close-circle"} size={14} color={isAvailable ? COLORS.success : COLORS.error} style={{marginRight: 4}} />
                                <Text style={[
                                  styles.tourStatusText,
                                  { color: isAvailable ? COLORS.success : COLORS.error }
                                ]}>
                                  {isAvailable ? 'Tour disponible' : 'Tour no disponible'}
                                </Text>
                              </View>
                            </View>
                            
                            {isReallyNew && tour.createdAt && (
                              <View style={{flexDirection:'row', alignItems:'center', marginBottom: 4}}>
                                <Ionicons name="sparkles" size={12} color={COLORS.primary} style={{marginRight: 4}} />
                                <Text style={styles.addedDateText}>
                                  Agregado {getTimeAgo(tour.createdAt)}
                                </Text>
                              </View>
                            )}
                            
                            {watchInfo && isAvailable && (
                              <View style={{flexDirection:'row', alignItems:'center', marginBottom: 6}}>
                                <Ionicons name="eye" size={12} color={COLORS.success} style={{marginRight: 4}} />
                                <Text style={styles.watchInfoText}>
                                  Visto {getTimeAgo(watchInfo.watchedAt)}
                                  {watchInfo.watchCount > 1 && ` • ${watchInfo.watchCount} veces`}
                                </Text>
                              </View>
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
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <PulseIcon name="time" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                      <Text style={styles.sectionTitle}>Tours Recientes</Text>
                    </View>
                    <View style={styles.recentToursInfo}>
                      <Text style={styles.recentToursSubtitle}>
                        <Ionicons name="eye" size={12} color={COLORS.muted} /> {recentTours.length} tours vistos
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
                              <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Ionicons name="trophy" size={10} color={COLORS.secondary} style={{marginRight: 4}} />
                                <Text style={styles.positionText}>RECIENTE</Text>
                              </View>
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
                              <Ionicons name="eye" size={12} color={COLORS.white} />
                            </View>
                          </View>
                          
                          <View style={styles.watchStatusContainer}>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                              <Ionicons name="checkmark-circle" size={12} color={isRecent ? COLORS.success : COLORS.warning} style={{marginRight: 4}} />
                              <Text style={[
                                styles.watchStatusText,
                                { color: isRecent ? COLORS.success : COLORS.warning }
                              ]}>
                                Has visto este tour
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.recentTourMeta}>
                            <View style={{flexDirection:'row', alignItems:'center', marginBottom: 4}}>
                              <Ionicons name="time" size={12} color={COLORS.muted} style={{marginRight: 4}} />
                              <Text style={styles.recentTourTime}>
                                {getTimeAgo(watchedTour.watchedAt)}
                              </Text>
                            </View>
                            
                            <View style={styles.watchStats}>
                              <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Ionicons name="stats-chart" size={12} color={COLORS.primary} style={{marginRight: 4}} />
                                <Text style={styles.recentTourCount}>
                                  {watchedTour.watchCount} {watchedTour.watchCount === 1 ? 'vez' : 'veces'}
                                </Text>
                              </View>
                              {isFrequent && (
                                <View style={styles.frequentBadge}>
                                  <View style={{flexDirection:'row', alignItems:'center'}}>
                                    <Ionicons name="star" size={10} color={COLORS.primary} style={{marginRight: 4}} />
                                    <Text style={styles.frequentText}>FAVORITO</Text>
                                  </View>
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
                    <Ionicons name="eye-off-outline" size={40} color={COLORS.muted} style={{marginBottom: 10}} />
                    <Text style={styles.emptyRecentText}>Aún no has visto ningún tour</Text>
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
                    <TouchableOpacity 
                      style={styles.testimonialCard}
                      onPress={() => navigation.navigate('ExplorAR', { testimonial: t })}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={t.authorImage ? (typeof t.authorImage === 'string' ? { uri: t.authorImage } : t.authorImage) : require('../../assets/homescreen.png')}
                        style={styles.testimonialThumb}
                      />
                      <View style={styles.testimonialInfo}>
                        <Text style={styles.testimonialName}>{t.author || t.autor || 'Anónimo'}</Text>
                        <Text style={styles.testimonialText} numberOfLines={2}>{t.text}</Text>
                      </View>
                    </TouchableOpacity>
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
            <PulseIcon name="home" size={24} color={COLORS.primary} />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => {
              trackScreenView('ExplorAR');
              navigation.navigate('ExplorAR');
            }}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={COLORS.muted} />
            <Text style={styles.navText}>Testimonios</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              trackScreenView('Guardados');
              navigation.navigate('Guardados');
            }}
          >
            <Ionicons name="bookmark-outline" size={24} color={COLORS.muted} />
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
    backgroundColor: COLORS.background,
  },
  
  // ✅ HEADER STYLES
  headerWrapper: {
    backgroundColor: COLORS.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // ✅ SEARCH BAR
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.secondary,
    marginLeft: 12,
  },
  
  // ✅ CONTENT
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // ✅ SECTIONS
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  seeAllButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // ✅ CARDS
  cardsContainer: {
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: SCREEN_WIDTH * 0.8,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  highlightBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  highlightText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardTours: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    opacity: 0.9,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
  },
  
  // ✅ EMPTY STATE
  emptyContainer: {
    width: SCREEN_WIDTH - 40,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 64, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 12,
  },
  
  // ✅ TOUR CARDS
  tourCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  watchedTourCard: {
    borderColor: COLORS.success,
    borderLeftWidth: 4,
  },
  newTourCard: {
    borderColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  unavailableTourCard: {
    opacity: 0.5,
    backgroundColor: '#0f1a2a',
  },
  tourImageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  tourImage: {
    width: '100%',
    height: '100%',
  },
  unavailableImage: {
    opacity: 0.5,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  playButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  watchIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  newBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tourInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  unavailableTextDark: {
    color: COLORS.muted,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  unavailableBadgeText: {
    color: COLORS.error,
    fontSize: 9,
    fontWeight: '700',
  },
  watchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  watchBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '700',
  },
  tourStatusContainer: {
    marginBottom: 6,
  },
  tourStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addedDateText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  watchInfoText: {
    fontSize: 11,
    color: COLORS.success,
    marginBottom: 6,
    fontWeight: '500',
  },
  tourDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tourDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 6,
  },
  progressContainer: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  
  // ✅ RECENT TOURS
  recentToursInfo: {
    alignItems: 'flex-end',
  },
  recentToursSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  recentTourCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 280, // Aumentado de 240
    minHeight: 160, // Altura mínima para evitar aplastamiento
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'space-between', // Distribuir contenido
  },
  veryRecentCard: {
    borderColor: COLORS.success,
    borderWidth: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  mostRecentCard: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  positionBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  positionText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  recentTourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentTourTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  recentWatchIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchStatusContainer: {
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  watchStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentTourMeta: {
    marginBottom: 8,
  },
  recentTourTime: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 6,
    fontWeight: '500',
  },
  watchStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTourCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  frequentBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  frequentText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  timeIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  timeIndicatorText: {
    fontSize: 10,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  emptyRecentContainer: {
    backgroundColor: 'rgba(17, 34, 64, 0.5)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  emptyRecentText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRecentSubtext: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  
  // ✅ TESTIMONIALS
  testimonialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  testimonialThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  testimonialText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // ✅ SWIPE ACTIONS
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
    marginVertical: 0,
    marginBottom: 16,
  },
  swipeLeft: {
    backgroundColor: COLORS.warning,
    marginLeft: 20,
  },
  swipeRight: {
    backgroundColor: COLORS.error,
    marginRight: 20,
  },
  swipeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  
  // ✅ LEGEND
  statusLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },
  
  // ✅ BOTTOM NAVIGATION
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  activeNavText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default HomeScreen;