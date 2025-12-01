// src/screens/VR360ViewerScreen.js - VISOR VR 360° CON YOUTUBE Y KUULA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

// Importar stores
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import useTourHistoryStore from '../stores/tourHistoryStore';

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
  primary: '#D4AF37',      // Dorado Premium
  secondary: '#0A1A2F',    // Azul Oscuro Profundo
  background: '#0A1A2F',   // Fondo Principal
  card: '#112240',         // Fondo de Tarjetas
  text: '#E6F1FF',         // Texto Principal
  subtext: '#8892B0',      // Texto Secundario
  accent: '#64FFDA',       // Acento Cyan
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: 'rgba(212, 175, 55, 0.2)',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VR360ViewerScreen = ({ route, navigation }) => {
  const { tourId, tourTitle, careerId, careerTitle } = route.params || {};
  
  // Zustand stores
  const { currentTour, loadTour, loading: tourLoading } = useTourStore();
  const { trackScreenView, trackTourStart, trackEvent } = useAnalyticsStore();
  const { recordTourWatch } = useTourHistoryStore();
  
  // Estados locales
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('info'); // 'info' | 'youtube' | 'kuula' | 'instructions'
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [kuulaUrl, setKuulaUrl] = useState(null);
  const [startTime] = useState(Date.now());
  const [thumbnailAspectRatio, setThumbnailAspectRatio] = useState(16 / 9); // ✅ Relación de aspecto dinámica para la imagen
  
  // ✅ REF para evitar múltiples registros
  const hasRegisteredViewRef = useRef(false);

  useEffect(() => {
    console.log('🥽 VR360ViewerScreen montada');
    console.log('📋 Tour ID:', tourId);
    console.log('📋 Tour Title:', tourTitle);
    
    trackScreenView('VR360_Viewer');
    initializeTour();
    
    // ✅ REGISTRAR TIEMPO DE VISUALIZACIÓN AL SALIR
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      trackEvent('vr360_viewer_close', {
        tourId,
        tourTitle,
        duration,
        viewMode,
      });
      console.log(`⏱️ Tiempo en VR360 Viewer: ${duration} segundos`);
    };
  }, [tourId]);

  // ✅ INICIALIZAR TOUR
  const initializeTour = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del tour
      const tour = await loadTour(tourId);
      console.log('✅ Tour VR 360° cargado:', tour);
      
      // ✅ VERIFICAR THUMBNAIL URL
      console.log('🖼️ thumbnailUrl del tour:', tour?.thumbnailUrl);
      console.log('🖼️ Todos los campos del tour:', Object.keys(tour || {}));
      
      // Extraer YouTube Video ID
      const videoId = extractYoutubeVideoId(tour);
      if (videoId) {
        setYoutubeVideoId(videoId);
        console.log('✅ YouTube Video ID extraído:', videoId);
      }
      
      // ✅ EXTRAER KUULA URL
      const extractedKuulaUrl = extractKuulaUrl(tour);
      if (extractedKuulaUrl) {
        setKuulaUrl(extractedKuulaUrl);
        console.log('✅ Kuula URL extraída:', extractedKuulaUrl);
      }
      
      // Registrar analytics
      trackTourStart(tourId, tourTitle, careerId);
      
    } catch (error) {
      console.error('❌ Error cargando tour VR:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el tour VR 360°',
        [{ text: 'Volver', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Registrar visualización SOLO UNA VEZ cuando el tour se carga
  useEffect(() => {
    if (currentTour && currentTour.title && !hasRegisteredViewRef.current) {
      recordTourWatch(tourId, currentTour.title, 'vr360');
      hasRegisteredViewRef.current = true;
      console.log(`✅ Tour VR 360° registrado UNA VEZ: ${currentTour.title}`);
    }
  }, [currentTour]);

  // ✅ EXTRAER VIDEO ID DE YOUTUBE
  const extractYoutubeVideoId = (tour) => {
    if (!tour) return null;

    const possibleFields = [
      tour.youtubeUrl,
      tour.videoUrl,
      tour.vrUrl,
      tour.video360Url,
      tour.url,
      tour.youtubeVideoId,
      tour.videoId,
    ];

    for (const field of possibleFields) {
      if (!field) continue;

      if (typeof field === 'string' && field.length === 11 && /^[a-zA-Z0-9_-]+$/.test(field)) {
        return field;
      }

      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
      ];

      for (const pattern of patterns) {
        const match = String(field).match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    return null;
  };

  // ✅ NUEVO: EXTRAER KUULA URL
  const extractKuulaUrl = (tour) => {
    if (!tour) return null;

    // Buscar en diferentes campos posibles
    const possibleFields = [
      tour.kuulaUrl,
      tour.kuulaLink,
      tour.vrNativeUrl,
      tour.vr360Url,
      tour.kuula,
    ];

    for (const field of possibleFields) {
      if (!field) continue;

      // Si es una URL completa de Kuula
      if (typeof field === 'string' && field.includes('kuula.co')) {
        // Limpiar URL y agregar parámetros optimizados
        const cleanUrl = field.split('?')[0]; // Remover parámetros existentes
        return `${cleanUrl}?logo=0&info=0&fs=1&vr=1&sd=1&thumbs=-1&keys=0&inst=0`;
      }
    }

    return null;
  };

  // ✅ ABRIR EN YOUTUBE APP
  const openInYouTubeApp = useCallback(async () => {
    if (!youtubeVideoId) {
      Alert.alert('Error', 'No hay video de YouTube disponible para este tour');
      return;
    }

    try {
      const openTime = Date.now();
      trackEvent('vr360_youtube_app_open', {
        tourId,
        tourTitle,
        videoId: youtubeVideoId,
        timestamp: openTime,
      });

      console.log('📹 Abriendo YouTube para tour VR 360°:', tourTitle);

      const youtubeAppUrl = `youtube://${youtubeVideoId}`;
      const youtubeBrowserUrl = `https://youtu.be/${youtubeVideoId}`;

      const canOpen = await Linking.canOpenURL(youtubeAppUrl);

      if (canOpen) {
        console.log('📱 Abriendo en YouTube app...');
        await Linking.openURL(youtubeAppUrl);
      } else {
        console.log('🌐 Abriendo en navegador...');
        await Linking.openURL(youtubeBrowserUrl);
      }
    } catch (error) {
      console.error('❌ Error abriendo YouTube:', error);
      Alert.alert('Error', 'No se pudo abrir YouTube');
    }
  }, [youtubeVideoId, tourId, tourTitle]);

  // ✅ VER EN MODO EMBEBIDO YOUTUBE
  const viewEmbedded = useCallback(() => {
    if (!youtubeVideoId) {
      Alert.alert('Error', 'No hay video disponible');
      return;
    }

    trackEvent('vr360_embedded_view', {
      tourId,
      tourTitle,
      videoId: youtubeVideoId,
    });

    setViewMode('youtube');
  }, [youtubeVideoId, tourId, tourTitle]);

  // ✅ NUEVO: VER EN KUULA (MODO VR NATIVO)
  const viewKuulaNative = useCallback(() => {
    if (!kuulaUrl) {
      Alert.alert(
        'Video VR no disponible',
        'Este tour aún no tiene un video 360° en modo VR nativo. Por favor, usa la opción de YouTube.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    trackEvent('vr360_kuula_native_view', {
      tourId,
      tourTitle,
      kuulaUrl,
    });

    console.log('🥽 Abriendo visor VR nativo con Kuula:', kuulaUrl);
    setViewMode('kuula');
  }, [kuulaUrl, tourId, tourTitle]);

  // ✅ VER INSTRUCCIONES VR
  const showInstructions = useCallback(() => {
    setViewMode('instructions');
  }, []);

  // ✅ RENDERIZAR CONTENIDO SEGÚN MODO
  const renderContent = () => {
    // Loading
    if (loading || tourLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tour VR 360°...</Text>
        </View>
      );
    }

    // Sin video disponible
    if (!youtubeVideoId && !kuulaUrl) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="videocam-off-outline" size={64} color={COLORS.subtext} />
          <Text style={styles.errorTitle}>Video no disponible</Text>
          <Text style={styles.errorSubtitle}>
            Este tour aún no tiene un video 360° asignado
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ✅ MODO KUULA (VR NATIVO)
    if (viewMode === 'kuula') {
      // ✅ JavaScript simple para bajar solo un poco los controles superiores
      const injectedJS = `
        (function() {
          function adjustControls() {
            // Buscar solo elementos en la parte superior (top < 50px)
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
              try {
                const style = window.getComputedStyle(el);
                if ((style.position === 'absolute' || style.position === 'fixed') && style.top !== 'auto') {
                  const top = parseInt(style.top);
                  // Solo ajustar elementos que están muy arriba (top < 50px)
                  if (top >= 0 && top < 50) {
                    // Bajar solo 30px manteniendo posición relativa
                    el.style.top = (top + 30) + 'px';
                    console.log('✅ Control ajustado ligeramente');
                  }
                }
              } catch(e) {}
            });
          }
          
          // Ejecutar después de que cargue
          setTimeout(adjustControls, 1000);
          setTimeout(adjustControls, 2500);
        })();
        true;
      `;
      
      return (
        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: kuulaUrl }}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            injectedJavaScript={injectedJS}
            onMessage={(event) => {
              console.log('📩 Mensaje de Kuula:', event.nativeEvent.data);
            }}
            style={styles.webview}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ WebView error (Kuula):', nativeEvent);
            }}
            onLoadStart={() => console.log('🔄 Kuula cargando...')}
            onLoadEnd={() => {
              console.log('✅ Kuula cargado');
            }}
          />
          <TouchableOpacity
            style={styles.floatingBackButton}
            onPress={() => setViewMode('info')}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      );
    }

    // Modo YouTube embebido
    if (viewMode === 'youtube') {
      return (
        <View style={styles.webviewContainer}>
          <WebView
            source={{
              uri: `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1&modestbranding=1&rel=0`,
            }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            style={styles.webview}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ WebView error (YouTube):', nativeEvent);
            }}
          />
          <TouchableOpacity
            style={styles.floatingBackButton}
            onPress={() => setViewMode('info')}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      );
    }

    // Modo instrucciones
    if (viewMode === 'instructions') {
      return (
        <ScrollView style={styles.instructionsContainer} contentContainerStyle={styles.instructionsContent}>
          <TouchableOpacity
            style={styles.closeInstructions}
            onPress={() => setViewMode('info')}
          >
            <Ionicons name="close" size={28} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.instructionsTitle}>🥽 Cómo usar el modo VR</Text>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionStepTitle}>Usa el visor VR nativo</Text>
              <Text style={styles.instructionStepText}>
                Presiona el botón "Ver en Modo VR (en app)" para abrir el visor integrado sin salir de la aplicación
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionStepTitle}>Explora con tu teléfono</Text>
              <Text style={styles.instructionStepText}>
                Mueve tu teléfono en cualquier dirección - el giroscopio te permitirá mirar alrededor
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionStepTitle}>Activa el modo VR</Text>
              <Text style={styles.instructionStepText}>
                Dentro del visor, toca el ícono de gafas VR para activar el modo estereoscópico
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>4</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionStepTitle}>Usa tus gafas VR</Text>
              <Text style={styles.instructionStepText}>
                Coloca tu teléfono en gafas Cardboard o similar y explora {careerTitle || 'la carrera'} en 360°
              </Text>
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Consejos</Text>
            <Text style={styles.tipText}>• El modo VR nativo funciona completamente dentro de la app</Text>
            <Text style={styles.tipText}>• Usa audífonos para una experiencia inmersiva completa</Text>
            <Text style={styles.tipText}>• Asegúrate de estar en un lugar seguro antes de ponerte las gafas</Text>
            <Text style={styles.tipText}>• Si te mareas, toma un descanso y quítate las gafas</Text>
            <Text style={styles.tipText}>• La calidad del video se mejora con mejor conexión a internet o subiendo la calidad desde el apartado configuraciones</Text>
          </View>

          <TouchableOpacity
            style={styles.gotItButton}
            onPress={() => setViewMode('info')}
          >
            <Text style={styles.gotItButtonText}>¡Entendido!</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // Modo info (pantalla principal)
    return (
      <ScrollView style={styles.infoContainer} contentContainerStyle={styles.infoContent}>
        {/* Header con título del tour */}
        <View style={styles.tourHeader}>
          <View style={styles.vrBadge}>
            <Ionicons name="glasses-outline" size={20} color={COLORS.primary} />
            <Text style={styles.vrBadgeText}>VR 360°</Text>
          </View>
          <Text style={styles.tourTitleText}>{tourTitle || 'Tour Virtual'}</Text>
          {careerTitle && (
            <Text style={styles.careerSubtitle}>{careerTitle}</Text>
          )}
        </View>

        {/* Thumbnail */}
        <View style={[styles.thumbnailContainer, { aspectRatio: thumbnailAspectRatio }]}>
          {(() => {
            // ✅ Cargar automáticamente imagen de Cloudinary si existe thumbnailUrl
            const thumbnailUrl = currentTour?.thumbnailUrl;
            
            if (thumbnailUrl) {
              // Calcular relación de aspecto real para adaptar el tamaño del contenedor
              Image.getSize(
                thumbnailUrl,
                (width, height) => {
                  if (width && height) {
                    const ratio = width / height;
                    if (ratio > 0 && ratio !== thumbnailAspectRatio) {
                      setThumbnailAspectRatio(ratio);
                    }
                  }
                },
                (error) => {
                  console.error('❌ Error obteniendo tamaño de la imagen de Cloudinary:', error);
                }
              );
              
              return (
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('❌ Error cargando imagen de Cloudinary:', error);
                  }}
                />
              );
            } else {
              // Si no hay thumbnailUrl, mostrar placeholder
              return (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="globe-outline" size={80} color={COLORS.primary} />
                </View>
              );
            }
          })()}
        </View>

        {/* Descripción */}
        {currentTour?.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Acerca de este tour</Text>
            <Text style={styles.descriptionText}>{currentTour.description}</Text>
          </View>
        )}

        {/* Detalles del tour */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>
              {currentTour?.duration || 'Duración variable'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>Experiencia 360° inmersiva</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>Compatible con gafas VR</Text>
          </View>
        </View>

        {/* ✅ BOTONES DE ACCIÓN - 3 BOTONES INDEPENDIENTES */}
        <View style={styles.actionsContainer}>
          {/* ✅ BOTÓN 1: YouTube (Dorado - Primario) */}
          {youtubeVideoId && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openInYouTubeApp}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8941F']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="logo-youtube" size={24} color={COLORS.secondary} />
                <Text style={styles.primaryButtonText}>Abrir en YouTube</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ✅ BOTÓN 2: Ver aquí en el teléfono - Kuula (Secundario) */}
          {kuulaUrl && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={viewKuulaNative}
              activeOpacity={0.8}
            >
              <Ionicons name="phone-portrait-outline" size={22} color={COLORS.accent} />
              <Text style={styles.vrNativeButtonText}>Ver aquí en el teléfono</Text>
            </TouchableOpacity>
          )}

          {/* ✅ BOTÓN 3: Instrucciones (Terciario) */}
          <TouchableOpacity
            style={styles.helpButton}
            onPress={showInstructions}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={22} color={COLORS.accent} />
            <Text style={styles.helpButtonText}>¿Cómo usar el modo VR?</Text>
          </TouchableOpacity>
        </View>

        {/* Nota informativa */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
          <Text style={styles.infoNoteText}>
            {kuulaUrl 
              ? 'El visor VR nativo funciona como imagen 360°, para utilizar gafas VR ir a Youtube'
              : 'Para la mejor experiencia VR, abre el video en YouTube y activa el modo Cardboard'
            }
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* Header con gradiente */}
      {viewMode === 'info' && (
        <LinearGradient
          colors={[COLORS.secondary, '#0F2A4A']}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Tour VR 360°</Text>
              <View style={styles.headerButton} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      )}

      {/* Contenido principal */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ✅ HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  // ✅ CONTENIDO
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.subtext,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ✅ INFO MODE
  infoContainer: {
    flex: 1,
  },
  infoContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tourHeader: {
    marginBottom: 24,
  },
  vrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  vrBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tourTitleText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 36,
  },
  careerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.subtext,
  },

  // ✅ THUMBNAIL
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    // La altura se controla con aspectRatio dinámico
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 26, 47, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ DESCRIPCIÓN
  descriptionCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 22,
  },

  // ✅ DETALLES
  detailsCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
    fontWeight: '600',
  },

  // ✅ ACCIONES
  actionsContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  vrNativeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(100, 255, 218, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 8,
  },

  // ✅ NOTA INFORMATIVA
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(100, 255, 218, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.accent,
    marginLeft: 10,
    lineHeight: 20,
  },

  // ✅ WEBVIEW MODE
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 60,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(10, 26, 47, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },

  // ✅ INSTRUCCIONES
  instructionsContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  instructionsContent: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
  },
  closeInstructions: {
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  instructionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  instructionNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  instructionStepText: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: 'rgba(100, 255, 218, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.accent,
    lineHeight: 22,
    marginBottom: 6,
  },
  gotItButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gotItButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
});

export default VR360ViewerScreen;