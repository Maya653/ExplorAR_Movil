// src/screens/VR360ViewerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';

// Stores
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';

// Icons
const CloseIcon = () => <Text style={styles.iconText}>✕</Text>;
const VRIcon = () => <Text style={styles.iconText}>🥽</Text>;

const VR360ViewerScreen = ({ route, navigation }) => {
  // Props de navegación
  const { tourId } = route.params;
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [vrMode, setVrMode] = useState(false);
  
  // Stores
  const { currentTour, loadTour, error, completeTour } = useTourStore();
  const { trackEvent } = useAnalyticsStore();
  
  // Ref del WebView
  const webViewRef = useRef(null);

  // ============================================
  // EFECTOS
  // ============================================
  
  // Cargar tour al montar
  useEffect(() => {
    console.log('🎬 Iniciando VR360ViewerScreen con tourId:', tourId);
    loadTour(tourId);
    
    // Track: Tour iniciado
    trackEvent('tour_start', { tourId, type: '360' });
    
    // Cleanup al desmontar
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⏱️ Tour 360° duró ${duration} segundos`);
      
      trackEvent('tour_complete', {
        tourId,
        duration,
        type: '360',
      });
    };
  }, [tourId]);
// Forzar orientación horizontal en este screen
useEffect(() => {
  const setOrientation = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      console.log('🔄 Orientación bloqueada a horizontal');
    } catch (err) {
      console.warn('⚠️ No se pudo bloquear orientación:', err);
    }
  };

  setOrientation();

  // Restaurar orientación al salir
  return () => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT
    ).catch(err => console.warn('Error al restaurar orientación:', err));
  };
}, []);
  // Manejar botón "atrás" de Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleClose);
    return () => backHandler.remove();
  }, []);

  // ============================================
  // GENERAR HTML CON A-FRAME
  // ============================================
  
  const generateHTML = () => {
    // Extraer el video 360° del tour
    const video360 = currentTour?.multimedia?.find(m => 
      m.type === '360-video' || m.type === '360-photo' || m.type === '360'
    );
    
    // URL del video (usar de prueba si no hay)
    const videoUrl = video360?.url || 
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
    
    const isVideo = !videoUrl.match(/\.(jpg|jpeg|png|webp)$/i);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${currentTour?.title || 'Tour VR 360°'}</title>
  
  <!-- A-Frame -->
  <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      overflow: hidden;
      background: #000;
      width: 100vw;
      height: 100vh;
    }
    
    #loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
      z-index: 9999;
      text-align: center;
      background: rgba(0,0,0,0.8);
      padding: 20px 40px;
      border-radius: 12px;
    }
    
    #error-message {
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      background: rgba(239, 68, 68, 0.9);
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 9999;
      display: none;
      font-family: Arial, sans-serif;
    }
    
    #vr-button {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(99, 102, 241, 0.95);
      color: white;
      border: none;
      padding: 20px 40px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
      min-width: 200px;
      text-align: center;
    }
    
    #vr-button:active {
      background: rgba(79, 70, 229, 1);
      transform: translate(-50%, -50%) scale(0.95);
    }
    
    .a-enter-vr-button {
      display: none !important;
    }
    
    a-scene {
      width: 100vw !important;
      height: 100vh !important;
      display: block;
    }
    
    .instructions-overlay {
      position: fixed;
      bottom: 80px;
      left: 0;
      right: 0;
      z-index: 9998;
      pointer-events: none;
    }
    
    .instructions-text {
      text-align: center;
      color: #D1D5DB;
      font-size: 14px;
      margin-bottom: 8px;
      padding: 0 20px;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div>⏳ Cargando experiencia VR...</div>
    <div style="margin-top: 10px; font-size: 14px; color: #D1D5DB;">Por favor espera</div>
  </div>
  
  <div id="error-message"></div>
  
  <button id="vr-button" onclick="enterVR()">🥽 Entrar a VR</button>
  
  <div class="instructions-overlay">
    <div class="instructions-text">📱 Mueve tu dispositivo para mirar alrededor</div>
    <div class="instructions-text">🥽 Presiona el botón VR para usar con gafas</div>
  </div>

  <a-scene
    id="scene"
    embedded
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: true"
    loading-screen="enabled: false"
  >
    <!-- Assets -->
    <a-assets>
      ${isVideo ? `
        <video
          id="video360"
          src="${videoUrl}"
          preload="auto"
          loop
          crossorigin="anonymous"
          playsinline
          webkit-playsinline
        ></video>
      ` : `
        <img
          id="image360"
          src="${videoUrl}"
          crossorigin="anonymous"
        >
      `}
    </a-assets>

    <!-- Video/Imagen 360° -->
    ${isVideo ? `
      <a-videosphere
        src="#video360"
        rotation="0 0 0"
        radius="100"
      ></a-videosphere>
    ` : `
      <a-sky
        src="#image360"
        rotation="0 0 0"
        radius="5000"
      ></a-sky>
    `}

    <!-- Hotspots (OCULTOS por defecto, se activan después) -->
    ${currentTour?.hotspots?.map((hotspot, index) => `
      <a-entity
        class="hotspot"
        visible="false"
        position="${hotspot.position?.x || 0} ${hotspot.position?.y || 0} ${hotspot.position?.z || -5}"
        geometry="primitive: sphere; radius: 0.2"
        material="color: #6366F1; opacity: 0.8; transparent: true; shader: flat"
        data-title="${hotspot.title || ''}"
        data-content="${hotspot.content || ''}"
      ></a-entity>
    `).join('') || ''}

    <!-- Cámara con controles mejorados -->
    <a-entity
      id="camera"
      camera="active: true; fov: 80"
      look-controls="
        enabled: true;
        magicWindowTrackingEnabled: true;
        touchEnabled: true;
        mouseEnabled: true;
        pointerLockEnabled: false;
        reverseMouseDrag: false;
        reverseTouchDrag: false
      "
      wasd-controls="enabled: false"
      position="0 0 0"
    >
      <!-- Cursor para interacción (solo visible en VR) -->
      <a-entity
        cursor="fuse: true; fuseTimeout: 1500"
        position="0 0 -1"
        geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
        material="color: #6366F1; shader: flat"
        raycaster="objects: .hotspot"
      >
        <a-animation
          begin="fusing"
          easing="ease-in"
          attribute="scale"
          fill="backwards"
          from="1 1 1"
          to="0.2 0.2 0.2"
          dur="1500"
        ></a-animation>
      </a-entity>
    </a-entity>
  </a-scene>

  <script>
    const scene = document.querySelector('a-scene');
    const video = document.querySelector('#video360');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const vrButton = document.getElementById('vr-button');
    
    let isVRMode = false;
    let sceneLoaded = false;
    let instructionsTimeout = null;
    
    function showError(msg) {
      errorMessage.textContent = '❌ ' + msg;
      errorMessage.style.display = 'block';
      setTimeout(() => {
        errorMessage.style.display = 'none';
      }, 5000);
    }
    
    // Función para ocultar instrucciones y mostrar hotspots
    function hideInstructions() {
      const instructions = document.querySelectorAll('.instructions-text');
      instructions.forEach(el => {
        el.style.display = 'none';
      });
      
      // Mostrar hotspots después de ocultar instrucciones
      const hotspots = document.querySelectorAll('.hotspot');
      hotspots.forEach(hotspot => {
        hotspot.setAttribute('visible', 'true');
        hotspot.setAttribute('animation', 'property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate');
      });
      
      console.log('✅ Instrucciones ocultas, hotspots visibles');
    }
    
    // Ocultar loading cuando A-Frame esté listo
    scene.addEventListener('loaded', () => {
      console.log('✅ A-Frame cargado');
      sceneLoaded = true;
      
      // Timer de 10 segundos para ocultar instrucciones
      instructionsTimeout = setTimeout(() => {
        hideInstructions();
      }, 10000);
      
      // Intentar reproducir video
      if (video) {
        console.log('🎥 Intentando reproducir video...');
        
        video.addEventListener('loadeddata', () => {
          console.log('✅ Video cargado');
          loading.style.display = 'none';
        });
        
        video.addEventListener('error', (e) => {
          console.error('❌ Error cargando video:', e);
          loading.style.display = 'none';
          showError('No se pudo cargar el video. Verifica la conexión.');
        });
        
        // Intentar reproducir
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Video reproduciéndose');
              loading.style.display = 'none';
            })
            .catch((err) => {
              console.warn('⚠️ Auto-play bloqueado:', err.message);
              loading.style.display = 'none';
              showError('Toca la pantalla para iniciar el video');
              
              // Permitir reproducir al tocar
              document.addEventListener('click', () => {
                video.play().catch(e => console.error('Error play:', e));
              }, { once: true });
            });
        }
      } else {
        // Es una imagen, no un video
        console.log('📸 Imagen 360° cargada');
        setTimeout(() => {
          loading.style.display = 'none';
        }, 1000);
      }
    });
    
    // Detectar movimiento del dispositivo (giroscopio)
    let deviceMoved = false;
    window.addEventListener('deviceorientation', (event) => {
      if (!deviceMoved && (Math.abs(event.alpha) > 5 || Math.abs(event.beta) > 5 || Math.abs(event.gamma) > 5)) {
        deviceMoved = true;
        console.log('📱 Movimiento detectado, ocultando instrucciones');
        hideInstructions();
        if (instructionsTimeout) {
          clearTimeout(instructionsTimeout);
        }
      }
    }, { once: true });
    
    // Timeout de seguridad
    setTimeout(() => {
      if (!sceneLoaded) {
        loading.style.display = 'none';
        showError('Error al cargar la escena 3D');
      }
    }, 15000);
    
    // Función para entrar a VR
    function enterVR() {
      if (!sceneLoaded) {
        showError('La escena aún está cargando...');
        return;
      }
      
      // Ocultar instrucciones al entrar a VR
      hideInstructions();
      if (instructionsTimeout) {
        clearTimeout(instructionsTimeout);
      }
      
      if (!scene.is('vr-mode')) {
        console.log('🥽 Entrando a modo VR');
        scene.enterVR();
        isVRMode = true;
        vrButton.style.display = 'none';
        
        // Reproducir video si estaba pausado
        if (video && video.paused) {
          video.play().catch(e => console.error('Error play:', e));
        }
      } else {
        console.log('📱 Saliendo de modo VR');
        scene.exitVR();
        isVRMode = false;
        vrButton.style.display = 'block';
        vrButton.textContent = '🥽 Entrar a VR';
      }
    }
    
    // Detectar cuando se sale de VR (con botón físico de gafas)
    scene.addEventListener('exit-vr', () => {
      console.log('👋 Salió de VR');
      isVRMode = false;
      vrButton.style.display = 'block';
      vrButton.textContent = '🥽 Entrar a VR';
    });
    
    scene.addEventListener('enter-vr', () => {
      console.log('🥽 Entró a VR');
      isVRMode = true;
      vrButton.style.display = 'none';
    });
    
    // Click en hotspots
    const hotspots = document.querySelectorAll('.hotspot');
    hotspots.forEach(hotspot => {
      hotspot.addEventListener('click', () => {
        const title = hotspot.getAttribute('data-title');
        const content = hotspot.getAttribute('data-content');
        showError(title + ': ' + content);
      });
    });
    
    // Log de errores de A-Frame
    scene.addEventListener('renderstart', () => {
      console.log('🎨 Render iniciado');
    });
    
    // Comunicación con React Native
    window.addEventListener('message', (event) => {
      const data = event.data;
      
      if (data.action === 'enterVR') {
        enterVR();
      } else if (data.action === 'exitVR') {
        if (scene.is('vr-mode')) {
          scene.exitVR();
        }
      } else if (data.action === 'playVideo') {
        if (video) video.play();
      } else if (data.action === 'pauseVideo') {
        if (video) video.pause();
      }
    });
    
    // Enviar eventos a React Native
    function sendToRN(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }
    
    // Notificar cuando el video termine
    if (video) {
      video.addEventListener('ended', () => {
        sendToRN({ type: 'video_ended' });
      });
    }
  </script>
</body>
</html>
    `;
  };

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleClose = () => {
    Alert.alert(
      'Salir del Tour VR',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            completeTour();
            navigation.goBack();
          },
        },
      ]
    );
    return true; // Prevenir comportamiento por defecto
  };

  const handleEnterVR = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        enterVR();
        true;
      `);
      setVrMode(true);
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'video_ended') {
        console.log('📹 Video terminó');
        Alert.alert('Tour completado', '¿Deseas verlo de nuevo?', [
          { text: 'Salir', onPress: () => navigation.goBack() },
          { text: 'Ver de nuevo', onPress: () => {
            webViewRef.current?.injectJavaScript(`
              video.currentTime = 0;
              video.play();
              true;
            `);
          }},
        ]);
      }
    } catch (err) {
      console.warn('Error procesando mensaje:', err);
    }
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  
  if (loading && !currentTour) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Cargando experiencia VR 360°...</Text>
      </View>
    );
  }

  if (error || !currentTour) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Error al cargar el tour</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* WebView con A-Frame */}
      <WebView
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        mixedContentMode="always"
        originWhitelist={['*']}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
      />

      {/* Overlay superior: Info del tour */}
      {!vrMode && (
        <View style={styles.topOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.topGradient}
          >
            <View style={styles.topBar}>
              <TouchableOpacity onPress={handleClose} style={styles.topButton}>
                <CloseIcon />
              </TouchableOpacity>
              
              <View style={styles.tourInfo}>
                <Text style={styles.tourTitle} numberOfLines={1}>
                  {currentTour.title}
                </Text>
                <Text style={styles.tourType}>Tour VR 360°</Text>
              </View>
              
              <View style={styles.topButton} />
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Indicador de carga */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingOverlayText}>Cargando...</Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F3F4F6',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F3F4F6',
  },
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 24,
  },
  errorText: {
    fontSize: 20,
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Overlays
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourInfo: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  tourTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  tourType: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
  },
  
  // Instructions
  instructionsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  instructionsGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  instructionsText: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
  },
  
  // Icons
  iconText: {
    fontSize: 24,
    color: '#fff',
  },
});

export default VR360ViewerScreen;   