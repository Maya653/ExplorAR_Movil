  // src/screens/HomeScreen.js - PARTE 1
  import React, { useState, useEffect, useCallback } from 'react';
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

  const HomeScreen = ({ navigation }) => {
    const [searchText, setSearchText] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Zustand stores
    const { careers, loading: careersLoading, fetchCareers, searchCareers } = useCareerStore();
    const { tours, loading: toursLoading, fetchTours } = useTourStore();
    const { trackScreenView, trackCareerView } = useAnalyticsStore();
    const { getTourWatchInfo, isTourWatched, getRecentlyWatchedTours } = useTourHistoryStore();
    const { unreadCount } = useNotificationStore();

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

    // Función centralizada para cargar todos los datos
    const loadAllData = useCallback(async () => {
      console.log('🔄 Cargando todos los datos...');
      
      try {
        // Cargar carreras y tours en paralelo
        await Promise.all([
          fetchCareers(),
          fetchTours(),
        ]);

        // Cargar testimonios
        try {
          const response = await apiClient.get(ENDPOINTS.TESTIMONIOS, { timeout: 30000 });
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

    // Función de refresh para Pull-to-Refresh
    const onRefresh = useCallback(async () => {
      console.log('🔄 Iniciando refresh...');
      setRefreshing(true);
      
      try {
        await loadAllData();
        console.log('✅ Refresh completado');
      } catch (error) {
        console.error('❌ Error en refresh:', error);
        Alert.alert('Error', 'No se pudieron actualizar los datos');
      } finally {
        setRefreshing(false);
      }
    }, [loadAllData]);

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

        // Filtrar tours
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

    // Handler para iniciar un tour AR
    const handleTourPress = (tour) => {
      console.log('🎬 Tour AR seleccionado:', tour.title);
      navigation.navigate('ARViewer', {
        tourId: tour.id || tour._id,
        tourTitle: tour.title,
      });
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
    // ... (continuación del código anterior)

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
            {/* ✅ BOTÓN DE NOTIFICACIONES CON BADGE */}
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
          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5', '#7C3AED']}
                tintColor="#4F46E5"
                title="Actualizando..."
                titleColor="#6B7280"
                progressBackgroundColor="#FFFFFF"
              />
            }
          >
            {/* Featured Careers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Carreras Destacadas</Text>
                {/* ✅ VER TODAS LAS CARRERAS */}
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
                          {/* ✅ CONTADOR DE TOURS SINCRONIZADO */}
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

            {/* Available Tours Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tours Disponibles</Text>
                <View style={styles.statusLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>Disponible</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendText}>Visto</Text>
                  </View>
                </View>
              </View>

              {toursToRender.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? 'No se encontraron tours' : 'No hay tours disponibles'}
                  </Text>
                </View>
              ) : (
                toursToRender.map((tour) => {
                  const watchInfo = getTourWatchInfo(tour.id || tour._id);
                  const isWatched = isTourWatched(tour.id || tour._id);
                  const isAvailable = tour.status === 'active' || tour.isActive !== false;
                  
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
                          !isAvailable && styles.unavailableTourCard
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
                          
                          <View style={[
                            styles.statusIndicator,
                            { backgroundColor: isAvailable ? '#10B981' : '#EF4444' }
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
                              !isAvailable && styles.unavailableText
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
                              { color: isAvailable ? '#10B981' : '#EF4444' }
                            ]}>
                              {isAvailable ? '✅ Tour subido y disponible' : '❌ Tour no disponible'}
                            </Text>
                          </View>
                          
                          {watchInfo && isAvailable && (
                            <Text style={styles.watchInfoText}>
                              👀 Visto {getTimeAgo(watchInfo.watchedAt)}
                              {watchInfo.watchCount > 1 && ` • ${watchInfo.watchCount} veces`}
                            </Text>
                          )}
                          
                          <View style={styles.tourDetails}>
                            <View style={styles.tourDuration}>
                              <ClockIcon size={16} />
                              <Text style={[
                                styles.durationText,
                                !isAvailable && styles.unavailableText
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
              )}
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
                      {/* ✅ VER HISTORIAL DE TOURS */}
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
                          onPress={() => {
                            const fullTour = tours.find(t => (t.id || t._id) === watchedTour.tourId);
                            if (fullTour) {
                              handleTourPress(fullTour);
                            }
                          }}
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
                              { color: isRecent ? '#10B981' : '#F59E0B' }
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
                                  backgroundColor: isRecent ? '#10B981' : 
                                                  timeSinceWatch < 7 * 24 * 60 * 60 * 1000 ? '#F59E0B' : '#6B7280'
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
    watchedTourCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#10B981',
      backgroundColor: '#F0FDF4',
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
    watchIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    watchIndicatorText: {
      color: '#FFFFFF',
      fontSize: 10,
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
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      flex: 1,
    },
    watchBadge: {
      backgroundColor: '#10B981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    watchBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },
    watchInfoText: {
      fontSize: 11,
      color: '#059669',
      marginBottom: 8,
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
    // Estilos para tours disponibles
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
      color: '#6B7280',
      fontWeight: '500',
    },
    unavailableTourCard: {
      opacity: 0.6,
      backgroundColor: '#F9FAFB',
    },
    unavailableImage: {
      opacity: 0.5,
    },
    unavailableText: {
      color: '#9CA3AF',
    },
    statusIndicator: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
    },
    badgesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    unavailableBadge: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    unavailableBadgeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '700',
    },
    tourStatusContainer: {
      marginBottom: 8,
    },
    tourStatusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    
    // Estilos para tours recientes mejorados
    recentToursInfo: {
      alignItems: 'flex-end',
    },
    recentToursSubtitle: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 2,
    },
    recentTourCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginRight: 16,
      width: 200,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      position: 'relative',
    },
    veryRecentCard: {
      borderColor: '#10B981',
      borderWidth: 2,
      shadowColor: '#10B981',
      shadowOpacity: 0.2,
    },
    mostRecentCard: {
      backgroundColor: '#F0FDF4',
      transform: [{ scale: 1.02 }],
    },
    positionBadge: {
      position: 'absolute',
      top: -8,
      right: 8,
      backgroundColor: '#10B981',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    positionText: {
      color: '#FFFFFF',
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
      color: '#111827',
      flex: 1,
      marginRight: 8,
    },
    recentWatchIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    recentWatchIndicatorText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    watchStatusContainer: {
      marginBottom: 8,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: '#F0FDF4',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#10B981',
    },
    watchStatusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    recentTourMeta: {
      marginBottom: 8,
    },
    recentTourTime: {
      fontSize: 12,
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
      color: '#4F46E5',
      fontWeight: '600',
    },
    frequentBadge: {
      backgroundColor: '#FCD34D',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    frequentText: {
      color: '#92400E',
      fontSize: 8,
      fontWeight: '700',
    },
    timeIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
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
      backgroundColor: '#F9FAFB',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderStyle: 'dashed',
    },
    emptyRecentText: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyRecentSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
      textAlign: 'center',
    },
      // ✅ NUEVOS ESTILOS PARA NOTIFICACIONES
    notificationButton: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    notificationIcon: {
      width: 24,
      height: 24,
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
  });

  export default HomeScreen;