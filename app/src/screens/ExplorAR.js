// src/screens/ExplorAR.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAnalyticsStore from '../stores/analyticsStore';
import apiClient from '../api/apiClient';

// ✅ COLORES PREMIUM (Azul y Dorado)
const COLORS = {
  primary: '#D4AF37',      // Dorado Premium
  secondary: '#0A1A2F',    // Azul Oscuro Profundo
  background: '#0A1A2F',   // Fondo Principal
  card: '#112240',         // Fondo de Tarjetas
  text: '#E6F1FF',         // Texto Principal (Blanco Azulado)
  subtext: '#8892B0',      // Texto Secundario (Gris Azulado)
  accent: '#64FFDA',       // Acento (Cyan Brillante para detalles)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: 'rgba(212, 175, 55, 0.2)', // Borde dorado sutil
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ CACHE EN MEMORIA (persiste durante la sesión)
let testimoniosCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helpers
const getYouTubeIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /[?&]v=([\w-]+)/,       // youtube.com/watch?v=ID
    /youtu\.be\/([\w-]+)/,  // youtu.be/ID
    /embed\/([\w-]+)/,      // youtube.com/embed/ID
    /v\/([\w-]+)/,          // youtube.com/v/ID
    /shorts\/([\w-]+)/,     // youtube.com/shorts/ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
};

const isDirectVideo = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return lower.includes('cloudinary') || lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
};

const openExternalUrl = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn('No se puede abrir URL:', url);
    }
  } catch (e) {
    console.warn('Error abriendo URL:', e.message || e);
  }
};

const ExplorAR = ({ navigation, route }) => {
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { trackScreenView } = useAnalyticsStore();

  useEffect(() => {   
    trackScreenView('Testimonials');
    fetchTestimonios();
  }, []);

  // ✅ Detectar parámetro de navegación para abrir testimonio específico
  useEffect(() => {
    if (route.params?.testimonial) {
      console.log('📌 Abriendo testimonio desde navegación:', route.params.testimonial.author);
      setSelected(route.params.testimonial);
      // Limpiar params para evitar que se reabra al volver
      navigation.setParams({ testimonial: null });
    }
  }, [route.params?.testimonial]);

  const fetchTestimonios = async () => {
    // ✅ VERIFICAR CACHE PRIMERO
    const now = Date.now();
    if (testimoniosCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Usando testimonios en cache');
      setTestimonios(testimoniosCache);
      setLoading(false);
      return;
    }

    try {
      console.log('📥 Cargando testimonios desde servidor...');
      
      // ✅ CONFIGURACIÓN OPTIMIZADA
      const response = await apiClient.get('/api/testimonios', {
        timeout: 60000,  // 60 segundos
        retries: 2,      // Solo 2 reintentos (en vez de 3)
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ ${response.data.length} testimonios cargados`);
        
        // ✅ GUARDAR EN CACHE
        testimoniosCache = response.data;
        cacheTimestamp = Date.now();
        
        setTestimonios(response.data);
      } else {
        console.warn('Respuesta inesperada:', response.data);
        setTestimonios([]);
      }
    } catch (err) {
      console.error('Error cargando testimonios:', err.message || err);
      
      // ✅ SI HAY CACHE, USARLO AUNQUE SEA ANTIGUO
      if (testimoniosCache) {
        console.log('⚠️ Usando cache antiguo debido al error');
        setTestimonios(testimoniosCache);
      } else {
        setTestimonios([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA REFRESCAR MANUALMENTE
  const handleRefresh = () => {
    testimoniosCache = null;
    cacheTimestamp = null;
    setLoading(true);
    fetchTestimonios();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      
      {/* ✅ HEADER PREMIUM */}
      <LinearGradient
        colors={[COLORS.secondary, '#0F2A4A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonios</Text>
        {/* ✅ BOTÓN DE REFRESH */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando testimonios...</Text>
        </View>
      ) : testimonios.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.subtext} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>No hay testimonios disponibles</Text>
          <Text style={styles.emptySubtitle}>Intenta nuevamente más tarde</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {testimonios.map((t) => (
            <TouchableOpacity key={t.id} style={styles.cardHorizontal} onPress={() => setSelected(t)}>
              <Image
                source={t.authorImage
                  ? (typeof t.authorImage === 'string' ? { uri: t.authorImage } : t.authorImage)
                  : (t.autorimagen
                      ? (typeof t.autorimagen === 'string' ? { uri: t.autorimagen } : t.autorimagen)
                      : require('../../assets/homescreen.png'))}
                style={styles.cardThumb}
                resizeMode="cover"
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{t.author || t.autor}</Text>
                <Text style={styles.cardRole}>{t.role} • {t.year}</Text>
                <Text style={styles.cardText} numberOfLines={3}>{t.text}</Text>
                <View style={styles.indicatorsRow}>
                  {((t._raw && (t._raw.transcript || t._raw.transcripcion)) || t.transcript) && (
                    <View style={styles.indicator}>
                      <Ionicons name="document-text-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.indicatorText}>Transcripción</Text>
                    </View>
                  )}
                  {((t._raw && (t._raw.mediaUrl || t._raw.videoUrl)) || t.mediaUrl) && (
                    <View style={styles.indicator}>
                      <Ionicons name="videocam-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.indicatorText}>Video</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal sin cambios en lógica */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Image
                source={selected?.authorImage
                  ? (typeof selected.authorImage === 'string' ? { uri: selected.authorImage } : selected.authorImage)
                  : (selected?.autorimagen
                      ? (typeof selected.autorimagen === 'string' ? { uri: selected.autorimagen } : selected.autorimagen)
                      : require('../../assets/homescreen.png'))}
                style={styles.modalImage}
                resizeMode="cover"
              />
              <View style={{ padding: 16 }}>
                <Text style={styles.modalName}>{selected?.author || selected?.autor}</Text>
                <Text style={styles.modalRole}>{selected?.role || selected?.authorRole} • {selected?.year || selected?.graduationYear}</Text>
                
                <View style={styles.testimonioSection}>
                  <Text style={styles.sectionTitle}>Testimonio</Text>
                  <Text style={styles.modalText}>{selected?.text}</Text>
                </View>

                {((selected?._raw && (selected._raw.transcript || selected._raw.transcripcion)) || selected?.transcript) ? (
                  <View style={styles.testimonioSection}>
                    <Text style={styles.sectionTitle}>Transcripción Completa</Text>
                    <Text style={styles.transcriptText}>{(selected._raw && (selected._raw.transcript || selected._raw.transcripcion)) || selected.transcript}</Text>
                  </View>
                ) : null}

                {((selected?._raw && (selected._raw.mediaUrl || selected._raw.videoUrl)) || selected?.mediaUrl) ? (
                  (() => {
                    const mediaUrl = (selected._raw && (selected._raw.mediaUrl || selected._raw.videoUrl)) || selected.mediaUrl;
                    const youtubeId = getYouTubeIdFromUrl(mediaUrl);
                    const isVideo = isDirectVideo(mediaUrl);
                    
                    return (
                      <View style={styles.testimonioSection}>
                        <Text style={styles.sectionTitle}>Video del Testimonio</Text>
                        {youtubeId ? (
                          Platform.OS === 'web' ? (
                            <div style={{ width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', marginBottom: 8 }}>
                              <iframe
                                title={`youtube-${youtubeId}`}
                                src={`https://www.youtube.com/embed/${youtubeId}?controls=1&modestbranding=1&rel=0`}
                                style={{ width: '100%', height: '100%', border: 0 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <View style={styles.videoContainer}>
                              <YoutubePlayer
                                height={220}
                                play={false}
                                videoId={youtubeId}
                                webViewStyle={{ opacity: 0.99 }}
                              />
                            </View>
                          )
                        ) : isVideo ? (
                          <View style={styles.videoContainer}>
                            <WebView
                              source={{ 
                                html: `
                                  <html>
                                    <head>
                                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                      <style>
                                        body { margin: 0; padding: 0; background-color: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                        video { width: 100%; height: 100%; object-fit: contain; }
                                      </style>
                                    </head>
                                    <body>
                                      <video controls playsinline poster="${selected.authorImage || ''}">
                                        <source src="${mediaUrl}" type="video/mp4">
                                        Tu dispositivo no soporta la reproducción de este video.
                                      </video>
                                    </body>
                                  </html>
                                `
                              }}
                              style={styles.videoWebView}
                              allowsInlineMediaPlayback={true}
                              mediaPlaybackRequiresUserAction={false}
                              javaScriptEnabled={true}
                              domStorageEnabled={true}
                              startInLoadingState={true}
                              renderLoading={() => <ActivityIndicator color={COLORS.primary} size="small" style={{position:'absolute', top: '45%', left: '45%'}} />}
                            />
                          </View>
                        ) : (
                          <View>
                            <TouchableOpacity style={styles.openButton} onPress={() => openExternalUrl(mediaUrl)}>
                              <Text style={styles.openButtonText}>Ver video externo</Text>
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                              <Ionicons name="link-outline" size={14} color={COLORS.subtext} style={{ marginRight: 4 }} />
                              <Text style={styles.mediaUrl}>{mediaUrl}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })()
                ) : null}

                {selected?._raw && (
                  <View style={styles.testimonioSection}>
                    <Text style={styles.sectionTitle}>Información Adicional</Text>
                    <View style={styles.additionalInfo}>
                      {selected._raw.email && (
                        <View style={styles.infoRow}>
                          <Ionicons name="mail-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                          <Text style={styles.infoItem}>{selected._raw.email}</Text>
                        </View>
                      )}
                      {selected._raw.phone && (
                        <View style={styles.infoRow}>
                          <Ionicons name="call-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                          <Text style={styles.infoItem}>{selected._raw.phone}</Text>
                        </View>
                      )}
                      {selected._raw.company && (
                        <View style={styles.infoRow}>
                          <Ionicons name="business-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                          <Text style={styles.infoItem}>{selected._raw.company}</Text>
                        </View>
                      )}
                      {selected._raw.location && (
                        <View style={styles.infoRow}>
                          <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                          <Text style={styles.infoItem}>{selected._raw.location}</Text>
                        </View>
                      )}
                      {selected._raw.tags && Array.isArray(selected._raw.tags) && (
                        <View style={styles.tagsContainer}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ionicons name="pricetag-outline" size={16} color={COLORS.subtext} style={{ marginRight: 6 }} />
                            <Text style={styles.tagsLabel}>Tags:</Text>
                          </View>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {selected._raw.tags.map((tag, index) => (
                              <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  
  // ✅ HEADER PREMIUM
  header: { 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // ✅ LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.subtext,
    fontWeight: '500',
  },
  
  // ✅ CONTENT
  scroll: { 
    padding: 16, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  
  // ✅ CARDS
  cardHorizontal: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardThumb: {
    width: 85,
    height: 85,
    borderRadius: 14,
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginBottom: 4,
  },
  cardRole: { 
    fontSize: 12, 
    color: COLORS.primary, 
    marginBottom: 8,
    fontWeight: '600',
  },
  cardText: { 
    fontSize: 13, 
    color: COLORS.subtext,
    lineHeight: 18,
  },
  indicatorsRow: { 
    flexDirection: 'row', 
    marginTop: 12, 
    flexWrap: 'wrap',
  },
  indicator: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginRight: 8, 
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  indicatorText: { 
    fontSize: 10, 
    color: COLORS.primary, 
    fontWeight: '600',
  },
  
  // ✅ EMPTY STATE
  emptyBox: { 
    flex: 1, 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: COLORS.subtext, 
    textAlign: 'center', 
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 15,
  },
  
  // ✅ MODAL
  videoContainer: { 
    width: '100%', 
    height: 220, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#000', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoWebView: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(10, 26, 47, 0.9)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 16,
  },
  modalCard: { 
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%', 
    backgroundColor: COLORS.card, 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalImage: { 
    width: '100%', 
    height: 240,
  },
  modalName: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalRole: { 
    fontSize: 14, 
    color: COLORS.subtext, 
    marginBottom: 16,
    fontWeight: '600',
  },
  modalText: { 
    fontSize: 15, 
    color: COLORS.text, 
    lineHeight: 24,
  },
  modalFooter: { 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 255, 255, 0.05)', 
    alignItems: 'flex-end',
    backgroundColor: COLORS.card,
  },
  closeButton: { 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeText: { 
    color: COLORS.text, 
    fontWeight: '600',
    fontSize: 15,
  },
  
  // ✅ TESTIMONIAL SECTIONS
  testimonioSection: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 6,
    alignSelf: 'flex-start',
  },
  transcriptText: { 
    fontSize: 14, 
    color: COLORS.subtext, 
    lineHeight: 22, 
    backgroundColor: 'rgba(10, 26, 47, 0.5)', 
    padding: 16, 
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  additionalInfo: {
    backgroundColor: 'rgba(10, 26, 47, 0.5)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
  },
  tagsContainer: {
    marginTop: 12,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  tag: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  openButton: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  openButtonText: { 
    color: COLORS.background, 
    fontWeight: '700',
    fontSize: 14,
  },
  mediaUrl: { 
    fontSize: 12, 
    color: COLORS.accent, 
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
});

export default ExplorAR;
