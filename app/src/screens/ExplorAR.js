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
import useAnalyticsStore from '../stores/analyticsStore';
import apiClient from '../api/apiClient';

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

// ✅ CACHE EN MEMORIA (persiste durante la sesión)
let testimoniosCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helpers
const getYouTubeIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /v=([\w-]+)/,
    /youtu\.be\/([\w-]+)/,
    /embed\/([\w-]+)/,
    /youtube\.com\/v\/([\w-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
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

const ExplorAR = ({ navigation }) => {
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { trackScreenView } = useAnalyticsStore();

  useEffect(() => {   
    trackScreenView('Testimonials');
    fetchTestimonios();
  }, []);

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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* ✅ HEADER CON COLOR INSTITUCIONAL */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/flecha_retorno.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonios</Text>
        {/* ✅ BOTÓN DE REFRESH */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Cargando testimonios...</Text>
        </View>
      ) : testimonios.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📝</Text>
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
                      <Text style={styles.indicatorText}>📝 Transcripción</Text>
                    </View>
                  )}
                  {((t._raw && (t._raw.mediaUrl || t._raw.videoUrl)) || t.mediaUrl) && (
                    <View style={styles.indicator}>
                      <Text style={styles.indicatorText}>🎥 Video</Text>
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
                    return (
                      <View style={styles.testimonioSection}>
                        <Text style={styles.sectionTitle}>Video del Testimonio</Text>
                        {youtubeId ? (
                          Platform.OS === 'web' ? (
                            <div style={{ width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', marginBottom: 8 }}>
                              <iframe
                                title={`youtube-${youtubeId}`}
                                src={`https://www.youtube.com/embed/${youtubeId}?controls=1&modestbranding=1`}
                                style={{ width: '100%', height: '100%', border: 0 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <View style={styles.videoContainer}>
                              <WebView
                                source={{ uri: `https://www.youtube.com/embed/${youtubeId}?controls=1&modestbranding=1` }}
                                style={styles.videoWebView}
                                allowsInlineMediaPlayback={true}
                                mediaPlaybackRequiresUserAction={false}
                              />
                            </View>
                          )
                        ) : (
                          <TouchableOpacity style={styles.openButton} onPress={() => openExternalUrl(mediaUrl)}>
                            <Text style={styles.openButtonText}>Ver video</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.mediaUrl}>🔗 {mediaUrl}</Text>
                      </View>
                    );
                  })()
                ) : null}

                {selected?._raw && (
                  <View style={styles.testimonioSection}>
                    <Text style={styles.sectionTitle}>Información Adicional</Text>
                    <View style={styles.additionalInfo}>
                      {selected._raw.email && (
                        <Text style={styles.infoItem}>📧 {selected._raw.email}</Text>
                      )}
                      {selected._raw.phone && (
                        <Text style={styles.infoItem}>📞 {selected._raw.phone}</Text>
                      )}
                      {selected._raw.company && (
                        <Text style={styles.infoItem}>🏢 {selected._raw.company}</Text>
                      )}
                      {selected._raw.location && (
                        <Text style={styles.infoItem}>📍 {selected._raw.location}</Text>
                      )}
                      {selected._raw.tags && Array.isArray(selected._raw.tags) && (
                        <View style={styles.tagsContainer}>
                          <Text style={styles.tagsLabel}>🏷️ Tags:</Text>
                          {selected._raw.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
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
    backgroundColor: COLORS.secondary,
  },
  
  // ✅ HEADER CON COLOR INSTITUCIONAL
  header: { 
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  refreshIcon: {
    fontSize: 22,
  },
  
  // ✅ LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.lightText,
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardThumb: {
    width: 85,
    height: 85,
    borderRadius: 14,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.secondary, 
    marginBottom: 4,
  },
  cardRole: { 
    fontSize: 12, 
    color: COLORS.mutedText, 
    marginBottom: 8,
  },
  cardText: { 
    fontSize: 13, 
    color: '#374151',
    lineHeight: 18,
  },
  indicatorsRow: { 
    flexDirection: 'row', 
    marginTop: 10, 
    flexWrap: 'wrap',
  },
  indicator: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12, 
    marginRight: 8, 
    marginBottom: 4,
  },
  indicatorText: { 
    fontSize: 10, 
    color: COLORS.accent, 
    fontWeight: '600',
  },
  
  // ✅ EMPTY STATE
  emptyBox: { 
    flex: 1, 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  emptyIcon: { 
    fontSize: 64, 
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.white, 
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: COLORS.lightText, 
    textAlign: 'center', 
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: COLORS.white,
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
  },
  videoWebView: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 16,
  },
  modalCard: { 
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%', 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalImage: { 
    width: '100%', 
    height: 240,
  },
  modalName: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.secondary,
    marginBottom: 4,
  },
  modalRole: { 
    fontSize: 14, 
    color: COLORS.mutedText, 
    marginBottom: 12,
  },
  modalText: { 
    fontSize: 15, 
    color: '#374151', 
    lineHeight: 22,
  },
  modalFooter: { 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
  },
  closeButton: { 
    backgroundColor: COLORS.accent, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  closeText: { 
    color: COLORS.white, 
    fontWeight: '700',
    fontSize: 15,
  },
  
  // ✅ TESTIMONIAL SECTIONS
  testimonioSection: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 6,
  },
  transcriptText: { 
    fontSize: 14, 
    color: '#374151', 
    lineHeight: 20, 
    backgroundColor: '#F9FAFB', 
    padding: 12, 
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  additionalInfo: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  infoItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    marginTop: 10,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
    display: 'inline-flex',
  },
  tagText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  openButton: { 
    backgroundColor: COLORS.accent, 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  openButtonText: { 
    color: COLORS.white, 
    fontWeight: '700',
    fontSize: 14,
  },
  mediaUrl: { 
    fontSize: 12, 
    color: COLORS.mutedText, 
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ExplorAR;