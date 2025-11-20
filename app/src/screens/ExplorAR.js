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
} from 'react-native';
import { WebView } from 'react-native-webview';
import useAnalyticsStore from '../stores/analyticsStore';
import apiClient from '../api/apiClient';

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

    const fetchTestimonios = async () => {
      try {
        console.log('📥 Cargando testimonios...');
        
        // ✅ AUMENTAR TIMEOUT A 60 SEGUNDOS
        const response = await apiClient.get('/api/testimonios', {
          timeout: 60000 // ← CAMBIO AQUÍ: de 30000 a 60000
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} testimonios cargados`);
          setTestimonios(response.data);
        } else {
          console.warn('Respuesta inesperada:', response.data);
          setTestimonios([]);
        }
      } catch (err) {
        console.error('Error cargando testimonios:', err.message || err);
        setTestimonios([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestimonios();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/flecha_retorno.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonios</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 24 }} />
      ) : testimonios.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No hay testimonios disponibles</Text>
          <Text style={styles.emptySubtitle}>Intenta nuevamente más tarde</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', position: 'relative', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  cardHorizontal: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  cardThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardRole: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  cardText: { fontSize: 13, color: '#374151' },
  indicatorsRow: { 
    flexDirection: 'row', 
    marginTop: 8, 
    flexWrap: 'wrap' 
  },
  indicator: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginRight: 8, 
    marginBottom: 4 
  },
  indicatorText: { 
    fontSize: 10, 
    color: '#4F46E5', 
    fontWeight: '600' 
  },
  videoContainer: { width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', marginBottom: 8 },
  videoWebView: { flex: 1, backgroundColor: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalImage: { width: '100%', height: 220 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalRole: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  modalText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  modalFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end' },
  closeButton: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '700' },
  backButton: { position: 'absolute', left: 12, top: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backIcon: { width: 18, height: 18, tintColor: '#111827' },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  testimonioSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  transcriptText: { fontSize: 13, color: '#374151', lineHeight: 18, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
  additionalInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  infoItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
    display: 'inline-flex',
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  openButton: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  openButtonText: { color: '#fff', fontWeight: '700' },
  mediaUrl: { fontSize: 12, color: '#6B7280', marginTop: 6 },
});

export default ExplorAR;