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
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import useAnalyticsStore from '../stores/analyticsStore';

// Helpers
const getYouTubeIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  // varios formatos posibles
  const patterns = [
    /v=([\w-]+)/, // watch?v=ID
    /youtu\.be\/([\w-]+)/, // youtu.be/ID
    /embed\/([\w-]+)/, // embed/ID
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


  // Construir una lista de bases probables y una función que intente cada una hasta obtener datos
  const LOCALHOST = 'http://localhost:5000';
  const ANDROID_LOCALHOST = 'http://10.0.2.2:5000';
  

  const getLanApiBase = () => {
    try {
      const candidates = [
        Constants?.manifest?.debuggerHost,
        Constants?.manifest2?.extra?.expoClient?.hostUri,
        Constants?.expoConfig?.hostUri,
        Constants?.manifest?.hostUri,
        Constants?.manifest2?.hostUri,
      ];
      for (const c of candidates) {
        if (!c) continue;
        const m = c.toString().match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m && m[1]) return `http://${m[1]}:5000`;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const candidateBases = [];
  const lanBase = getLanApiBase();
  if (lanBase) candidateBases.push(lanBase);
  // prefer localhost on iOS/web, and 10.0.2.2 on Android emulator
  if (Platform.OS === 'android') candidateBases.push(ANDROID_LOCALHOST);
  candidateBases.push(LOCALHOST);
  // remove duplicates
  const uniqueBases = Array.from(new Set(candidateBases));
  // Elegir una única base para la API: lanBase si existe, sino 10.0.2.2 en Android o localhost en iOS/web
  const API_BASE = React.useMemo(() => {
    if (Platform.OS === 'android') return ANDROID_LOCALHOST;
    if (lanBase) return lanBase;
    return LOCALHOST;
  }, [lanBase]);

  useEffect(() => {   
    trackScreenView('Testimonials');

    const fetchTestimonios = async () => {
      const url = `${API_BASE}/api/testimonios`;
      try {
        console.log('Fetch testimonios desde', url);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          console.log(`Recibidos ${data.length} testimonios`);
          setTestimonios(data);
        } else {
          console.warn('Respuesta inesperada (no array):', data);
          setTestimonios([]);
        }
      } catch (err) {
        console.error('Error fetching testimonios:', err && err.message ? err.message : err);
        setTestimonios([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonios();
  }, [API_BASE]);

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
          <Text style={styles.emptyTitle}>No hay testimonios</Text>
          <Text style={styles.emptySubtitle}>Asegúrate de que el servidor esté corriendo y que la colección tenga documentos.</Text>
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
                <Text style={styles.modalText}>{selected?.text}</Text>

                {/* Transcript (si existe) */}
                {((selected?._raw && (selected._raw.transcript || selected._raw.transcripcion)) || selected?.transcript) ? (
                  <>
                    <Text style={styles.sectionTitleSmall}>Transcripción</Text>
                    <Text style={styles.transcriptText}>{(selected._raw && (selected._raw.transcript || selected._raw.transcripcion)) || selected.transcript}</Text>
                  </>
                ) : null}

                {/* Media (video) */}
                {((selected?._raw && (selected._raw.mediaUrl || selected._raw.videoUrl)) || selected?.mediaUrl) ? (
                  (() => {
                    const mediaUrl = (selected._raw && (selected._raw.mediaUrl || selected._raw.videoUrl)) || selected.mediaUrl;
                    const youtubeId = getYouTubeIdFromUrl(mediaUrl);
                    return (
                      <View style={styles.mediaBlock}>
                        <Text style={styles.sectionTitleSmall}>Media</Text>
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
                        <Text style={styles.mediaUrl}>{mediaUrl}</Text>
                      </View>
                    );
                  })()
                ) : null}
                {/* Documento completo removido del modal según petición */}
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
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 12 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardRole: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  cardText: { fontSize: 13, color: '#374151' },
  sectionTitleSmall: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 12, marginBottom: 6 },
  transcriptText: { fontSize: 13, color: '#374151', lineHeight: 18, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
  mediaBlock: { marginTop: 12 },
  videoThumbWrap: { position: 'relative', width: '100%', height: 200, borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  videoThumb: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
  openButton: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  openButtonText: { color: '#fff', fontWeight: '700' },
  mediaUrl: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  videoContainer: { width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', marginBottom: 8 },
  videoWebView: { flex: 1, backgroundColor: '#000' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalImage: { width: '100%', height: 220 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalRole: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  modalText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  jsonTitle: { fontSize: 12, color: '#6B7280', marginTop: 12, marginBottom: 4 },
  jsonBlock: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 12, color: '#111827', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
  modalFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end' },
  closeButton: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '700' },
  backButton: { position: 'absolute', left: 12, top: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backIcon: { width: 18, height: 18, tintColor: '#111827' },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  /* Estilos tipo HomeScreen para tarjetas horizontales */
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
});

export default ExplorAR;
