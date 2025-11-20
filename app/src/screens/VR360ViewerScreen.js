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
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { DeviceMotion } from 'expo-sensors';

// Stores
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';
import useTourHistoryStore from '../stores/tourHistoryStore';


// Icons
const CloseIcon = () => <Text style={styles.iconText}>✕</Text>;

const VR360ViewerScreen = ({ route, navigation }) => {
  // Permite pasar configuraciones opcionales desde la navegación
  const { tourId, lensRadius = 0.44, lensYOffset = 0.5, lensXOffset = 0 } = route.params;
  const { recordTourWatch } = useTourHistoryStore();
  const hasRegisteredViewRef = useRef(false);


  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [vrMode, setVrMode] = useState(false);
  const [gyroAvailable, setGyroAvailable] = useState(false);
  // Estados locales para controles dinámicos
  const [lensRadiusState, setLensRadiusState] = useState(lensRadius);
  const [lensYOffsetState, setLensYOffsetState] = useState(lensYOffset);
  const [lensXOffsetState, setLensXOffsetState] = useState(lensXOffset);
  const [showLensControls, setShowLensControls] = useState(false);
  
  const { currentTour, loadTour, error, completeTour } = useTourStore();
  const { trackEvent } = useAnalyticsStore();
  
  const webViewRef = useRef(null);
  const rotationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const lastUpdateRef = useRef(0);

  // ============================================
  // GIROSCOPIO
  // ============================================
  
  useEffect(() => {
    let subscription;
    
    const setupGyroscope = async () => {
      const available = await DeviceMotion.isAvailableAsync();
      setGyroAvailable(available);
      
      if (!available) {
        console.warn('⚠ Giroscopio no disponible');
        return;
      }
      
      console.log('✅ Giroscopio disponible');
      DeviceMotion.setUpdateInterval(16);
      
      subscription = DeviceMotion.addListener((data) => {
        if (!data.rotation || !webViewRef.current) return;
        
        const { alpha, beta, gamma } = data.rotation;
        rotationRef.current = { alpha, beta, gamma };
        
        const now = Date.now();
        if (now - lastUpdateRef.current < 16) return;
        lastUpdateRef.current = now;
        
        const jsCode = `
          (function() {
            try {
              if (typeof updateCameraFromGyro === 'function') {
                updateCameraFromGyro(${alpha}, ${beta}, ${gamma});
              }
            } catch(e) {
              console.error('Error:', e);
            }
          })();
          true;
        `;
        
        webViewRef.current.injectJavaScript(jsCode);
      });
      
      console.log('✅ Giroscopio activo');
    };
    
    setupGyroscope();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // ✅ CORREGIDO: Cargar tour al montar
  useEffect(() => {
    console.log('🎬 Iniciando VR360ViewerScreen con tourId:', tourId);
    loadTour(tourId);
    trackEvent('tour_start', { tourId, type: '360' });
    
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      trackEvent('tour_complete', { tourId, duration, type: '360' });
    };
  }, [tourId]); // ✅ Solo depender de tourId, NO de currentTour

  // ✅ NUEVO: Efecto separado para registrar visualización SOLO UNA VEZ
  useEffect(() => {
    // Solo registrar cuando:
    // 1. currentTour está cargado
    // 2. NO se ha registrado antes
    if (currentTour && currentTour.title && !hasRegisteredViewRef.current) {
      recordTourWatch(tourId, currentTour.title, '360');
      hasRegisteredViewRef.current = true; // ✅ Marcar como registrado
      console.log('✅ Tour VR 360° registrado UNA VEZ:', currentTour.title);
    }
  }, [currentTour]); // Solo cuando currentTour cambia

  // ✅ MANTENER todos los demás useEffect sin cambios
  useEffect(() => {
    const setOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (err) {
        console.warn('⚠ No se pudo bloquear orientación:', err);
      }
    };

    setOrientation();

    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      ).catch(err => console.warn('Error al restaurar orientación:', err));
    };
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleClose);
    return () => backHandler.remove();
  }, []);

  // ============================================
  // GENERAR HTML CON A-FRAME - VISTA MONOSCÓPICA
  // ============================================
  
  const generateHTML = () => {
    const video360 = currentTour?.multimedia?.find(m => 
      m.type === '360-video' || m.type === '360-photo' || m.type === '360'
    );
    
    const videoUrl = video360?.url || 
      'https://res.cloudinary.com/dmezvip8c/video/upload/v1762921740/Lions_360_National_Geographic_-_National_Geographic_1080p_h264_t5ucgw.mp4';
    
    const isVideo = !videoUrl.match(/\.(jpg|jpeg|png|webp)$/i);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <title>${currentTour?.title || 'Tour VR 360°'}</title>
  
  <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
      width: 100vw;
      height: 100vh;
      position: fixed;
    }
    
    #loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
      z-index: 10000;
      text-align: center;
      background: rgba(0,0,0,0.8);
      padding: 20px 40px;
      border-radius: 12px;
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
      z-index: 10000;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
      min-width: 200px;
      text-align: center;
      display: block;
    }
    
    #vr-button:active {
      background: rgba(79, 70, 229, 1);
      transform: translate(-50%, -50%) scale(0.95);
    }
    
    #vr-button.hidden {
      display: none !important;
    }
    
    .a-enter-vr-button { display: none !important; }
    
    #scene-container {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
    
    /* Modo normal: pantalla completa */
    #scene-container.normal a-scene {
      width: 100vw !important;
      height: 100vh !important;
    }
    
    /* Modo VR: MISMA VISTA DUPLICADA PARA AMBOS OJOS */
    #scene-container.vr-monoscopic a-scene {
      width: 200vw !important;
      height: 100vh !important;
      transform: translateX(-50vw);
    }
    
    a-scene {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
    }
    
    /* MÁSCARA VR - DOS CÍRCULOS PARA VISOR VR */
    #vr-lens-mask {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
      display: none;
      background: transparent;
    }
    
    #vr-lens-mask.active {
      display: block;
    }
    
    /* Variables dinámicas para lentes */
    :root {
      --lens-radius: ${lensRadius * 100}%;
      --lens-y-offset: ${lensYOffset * 100}%;
      --lens-x-offset: ${lensXOffset * 100}%;
    }
    
    /* DOS CÍRCULOS PARA VISOR VR - MISMA VISTA EN AMBOS */
    #vr-lens-mask::before, #vr-lens-mask::after {
      content: '';
      position: absolute;
      top: 0;
      width: 50%;
      height: 100%;
      background: none;
    }
    /* Ojo izquierdo */
    #vr-lens-mask::before {
      left: 0;
      background: radial-gradient(
        circle at calc(50% + var(--lens-x-offset)) var(--lens-y-offset),
        transparent 0%,
        transparent var(--lens-radius),
        black calc(var(--lens-radius) + 1%),
        black 100%
      );
    }
    /* Ojo derecho - EXACTAMENTE LA MISMA VISTA */
    #vr-lens-mask::after {
      right: 0;
      background: radial-gradient(
        circle at calc(50% - var(--lens-x-offset)) var(--lens-y-offset),
        transparent 0%,
        transparent var(--lens-radius),
        black calc(var(--lens-radius) + 1%),
        black 100%
      );
    }
    
    #vr-divider {
      position: fixed;
      left: 50%;
      top: 0;
      width: 3px;
      height: 100vh;
      background: #000;
      z-index: 9997;
      display: none;
      transform: translateX(-50%);
    }
    
    #vr-divider.active {
      display: block;
    }
    
    #gyro-debug {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.9);
      color: #10B981;
      padding: 10px;
      font-size: 10px;
      z-index: 9999;
      font-family: monospace;
      border-radius: 6px;
      border: 2px solid #10B981;
      display: none;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div>⏳ Cargando experiencia VR...</div>
  </div>
  
  <div id="gyro-debug">🎯 GYRO<br>Esperando...</div>
  
  <button id="vr-button" onclick="enterVR()">🥽 Entrar a VR</button>
  <div id="vr-lens-mask"></div>
  <div id="vr-divider"></div>

  <div id="scene-container" class="normal">
    <a-scene
      id="scene"
      embedded
      vr-mode-ui="enabled: false"
      renderer="antialias: true; colorManagement: true"
      loading-screen="enabled: false"
    >
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
            muted
          ></video>
        ` : `
          <img id="image360" src="${videoUrl}" crossorigin="anonymous">
        `}
      </a-assets>

      <!-- ESCENA 360° PRINCIPAL - MISMA PARA AMBOS OJOS -->
      ${isVideo ? `
        <a-videosphere src="#video360" rotation="0 0 0" radius="500"></a-videosphere>
      ` : `
        <a-sky src="#image360" rotation="0 0 0"></a-sky>
      `}

      <!-- SOLO UNA CÁMARA - MISMA VISTA PARA AMBOS OJOS -->
      <a-entity id="rig" movement-controls>
        <a-entity
          id="camera"
          camera="active: true; fov: 80; near: 0.1; far: 2000"
          position="0 1.6 0"
          look-controls="pointerLockEnabled: false"
        ></a-entity>
      </a-entity>
    </a-scene>
  </div>

  <script>
    const scene = document.querySelector('a-scene');
    const sceneContainer = document.getElementById('scene-container');
    const video = document.querySelector('#video360');
    const loading = document.getElementById('loading');
    const vrButton = document.getElementById('vr-button');
    const gyroDebug = document.getElementById('gyro-debug');
    const lensMask = document.getElementById('vr-lens-mask');
    const vrDivider = document.getElementById('vr-divider');
    
    let isVRMode = false;
    let sceneLoaded = false;
    let cameraEl = null;
    let camera3D = null;
    let rigEl = null;
    
    let targetRotation = { x: 0, y: 0, z: 0 };
    let currentRotation = { x: 0, y: 0, z: 0 };
    const smoothing = 0.12;
    let manualControl = false;
    let dragStart = null;
    let startRotationSnapshot = null;
    
    console.log('🌐 [WebView] Inicializando - VISTA VR MONOSCÓPICA 360°');

    // FUNCIÓN PRINCIPAL: GIROSCOPIO CONTROLANDO LA MISMA VISTA PARA AMBOS OJOS
    window.updateCameraFromGyro = function(alpha, beta, gamma) {
      if (!camera3D || !rigEl) return;

      // Usar valores directos del giroscopio
      let yaw = alpha;   // rotación Z (izquierda/derecha)
      let pitch = beta;  // rotación X (arriba/abajo)  
      let roll = gamma;  // rotación Y (inclinación)

      // Compensar orientación landscape del dispositivo
      const orientation = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      if (orientation === 90) {
        // Dispositivo en landscape derecho
        yaw = yaw + Math.PI / 2;
      } else if (orientation === -90 || orientation === 270) {
        // Dispositivo en landscape izquierdo
        yaw = yaw - Math.PI / 2;
      }

      // Limitar pitch para evitar que se voltee completamente
      const pitchLimit = Math.PI / 2 - 0.01;
      if (pitch > pitchLimit) pitch = pitchLimit;
      if (pitch < -pitchLimit) pitch = -pitchLimit;

      if (!manualControl) {
        // MISMA rotación para AMBOS ojos - VISTA IDÉNTICA
        targetRotation = {
          x: -pitch,  // Invertir pitch para movimiento natural
          y: yaw,     // Yaw directo
          z: ${Platform.OS === 'ios' ? '-roll' : 'roll'}  // Ajuste para iOS/Android
        };
      }

      // Mostrar debug solo en modo normal
      if (!isVRMode && gyroDebug) {
        gyroDebug.style.display = 'block';
        gyroDebug.innerHTML = '🎯 GIROSCOPIO ACTIVO<br>' +
          'Pitch: ' + (pitch * 180/Math.PI).toFixed(0) + '°<br>' +
          'Yaw: ' + (yaw * 180/Math.PI).toFixed(0) + '°<br>' +
          'Roll: ' + (roll * 180/Math.PI).toFixed(0) + '°';
      }
    };
    
    // ANIMACIÓN SUAVIZADA - MISMA para ambos ojos
    function animate() {
      requestAnimationFrame(animate);
      
      if (rigEl && camera3D) {
        // Suavizado de movimiento - MISMO para ambos ojos
        currentRotation.x += (targetRotation.x - currentRotation.x) * smoothing;
        currentRotation.y += (targetRotation.y - currentRotation.y) * smoothing;
        currentRotation.z += (targetRotation.z - currentRotation.z) * smoothing;
        
        // APLICAR LA MISMA ROTACIÓN AL RIG - AMBOS OJOS VEN EXACTAMENTE LO MISMO
        rigEl.object3D.rotation.set(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z
        );
      }
    }
    
    // CUANDO LA ESCENA CARGA
    scene.addEventListener('loaded', () => {
      console.log('✅ [WebView] A-Frame cargado - VISTA MONOSCÓPICA LISTA');
      sceneLoaded = true;
      
      // Obtener el rig y la cámara principal
      rigEl = document.querySelector('#rig');
      cameraEl = document.querySelector('#camera');
      
      if (cameraEl && rigEl) {
        camera3D = cameraEl.getObject3D('camera');
        if (camera3D) {
          console.log('✅ [WebView] Cámara obtenida - VISTA MONOSCÓPICA CONFIGURADA');
          // Iniciar animación
          animate();
        }
      }
      
      // Manejar video o imagen 360
      if (video) {
        console.log('🎥 Video 360° detectado');
        video.muted = true;
        video.play()
          .then(() => {
            console.log('✅ Video 360° reproduciéndose');
            loading.style.display = 'none';
            vrButton.classList.remove('hidden');
            // Quitar mute después de un momento
            setTimeout(() => { 
              video.muted = false;
              console.log('🔊 Audio activado');
            }, 500);
          })
          .catch((error) => {
            console.error('❌ Error reproduciendo video:', error);
            loading.style.display = 'none';
            vrButton.classList.remove('hidden');
          });
      } else {
        // Es una imagen 360
        setTimeout(() => {
          loading.style.display = 'none';
          vrButton.classList.remove('hidden');
          console.log('🖼 Imagen 360° cargada');
        }, 1000);
      }
    });
    
    // ENTRAR AL MODO VR - VISTA MONOSCÓPICA (MISMA EN AMBOS OJOS)
    function enterVR() {
      if (!sceneLoaded) {
        alert('La escena aún está cargando...');
        return;
      }
      
      console.log('🥽 [WebView] Entrando a modo VR - VISTA MONOSCÓPICA ACTIVADA');
      
      // Ocultar elementos de UI
      vrButton.classList.add('hidden');
      if (gyroDebug) gyroDebug.style.display = 'none';
      isVRMode = true;
      
      // Activar modo VR - MISMA VISTA DUPLICADA
      sceneContainer.classList.remove('normal');
      sceneContainer.classList.add('vr-monoscopic');
      
      // Activar máscaras de lentes - DOS CÍRCULOS CON LA MISMA VISTA
      lensMask.classList.add('active');
      vrDivider.classList.add('active');
      
      console.log('✅ Modo VR activado - AMBOS OJOS VEN EXACTAMENTE LO MISMO');
      
      // Asegurar que el video se reproduzca
      if (video && video.paused) {
        video.play().catch(e => console.error('Error reproduciendo video en VR:', e));
      }
      
      // Notificar a React Native
      sendToRN({ type: 'vr_mode_changed', vrMode: true });
    }
    
    // SALIR DEL MODO VR
    function exitVR() {
      console.log('👋 [WebView] Saliendo de VR');
      isVRMode = false;
      
      // Mostrar botón nuevamente
      vrButton.classList.remove('hidden');
      
      // Volver a modo normal
      sceneContainer.classList.remove('vr-monoscopic');
      sceneContainer.classList.add('normal');
      
      // Desactivar máscaras
      lensMask.classList.remove('active');
      vrDivider.classList.remove('active');
      
      sendToRN({ type: 'vr_mode_changed', vrMode: false });
    }
    
    // COMUNICACIÓN CON REACT NATIVE
    function sendToRN(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }

    // ACTUALIZAR CONFIGURACIÓN DE LENTES
    window.updateLensConfig = function(cfg = {}) {
      const r = (typeof cfg.radius === 'number') ? (cfg.radius * 100) + '%' : null;
      const y = (typeof cfg.yOffset === 'number') ? (cfg.yOffset * 100) + '%' : null;
      const x = (typeof cfg.xOffset === 'number') ? (cfg.xOffset * 100) + '%' : null;
      const rootStyle = document.documentElement.style;
      if (r) rootStyle.setProperty('--lens-radius', r);
      if (y) rootStyle.setProperty('--lens-y-offset', y);
      if (x) rootStyle.setProperty('--lens-x-offset', x);
      sendToRN({ type: 'lens_config_updated', config: { radius: cfg.radius, yOffset: cfg.yOffset, xOffset: cfg.xOffset } });
    };
    
    // MANEJAR FIN DEL VIDEO
    if (video) {
      video.addEventListener('ended', () => {
        console.log('🏁 Video 360° terminado');
        sendToRN({ type: 'video_ended' });
      });
    }
    
    // DOBLE TAP PARA SALIR DE VR
    let lastTap = 0;
    document.addEventListener('click', (e) => {
      if (isVRMode) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
          // Doble tap detectado - salir de VR
          exitVR();
        }
        
        lastTap = currentTime;
      }
    });

    // CONTROL TÁCTIL MANUAL - MISMA rotación para ambos ojos
    function onTouchStart(e) {
      if (!isVRMode) return;
      manualControl = true;
      const touch = e.touches[0];
      dragStart = { x: touch.clientX, y: touch.clientY };
      startRotationSnapshot = { ...targetRotation };
    }
    
    function onTouchMove(e) {
      if (!manualControl || !dragStart) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      
      // Sensibilidad del movimiento táctil
      const sensitivityX = 0.003;
      const sensitivityY = 0.003;
      
      let newYaw = startRotationSnapshot.y - dx * sensitivityX;
      let newPitch = startRotationSnapshot.x + dy * sensitivityY;
      
      // Limitar movimiento vertical
      const limit = Math.PI / 2 - 0.01;
      if (newPitch < -limit) newPitch = -limit;
      if (newPitch > limit) newPitch = limit;
      
      // MISMA rotación aplicada a AMBOS ojos
      targetRotation.y = newYaw;
      targetRotation.x = newPitch;
    }
    
    function onTouchEnd() {
      dragStart = null;
      // Volver al control del giroscopio después de un tiempo
      setTimeout(() => { manualControl = false; }, 1500);
    }
    
    // EVENTOS TÁCTILES
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
  </script>
</body>
</html>
    `;
  };

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
    return true;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'video_ended') {
        Alert.alert('Tour completado', '¿Deseas verlo de nuevo?', [
          { text: 'Salir', onPress: () => navigation.goBack() },
          { 
            text: 'Ver de nuevo', 
            onPress: () => {
              webViewRef.current?.injectJavaScript(`
                if (video) {
                  video.currentTime = 0;
                  video.play();
                }
                true;
              `);
            }
          },
        ]);
      } else if (data.type === 'vr_mode_changed') {
        setVrMode(data.vrMode);
        if (data.vrMode) {
          // Enviar configuración inicial de lentes al entrar a VR
          sendLensConfig(lensRadiusState, lensYOffsetState, lensXOffsetState);
        }
      } else if (data.type === 'lens_config_updated') {
        console.log('Configuración de lentes actualizada en WebView');
      }
    } catch (err) {
      console.warn('Error procesando mensaje:', err);
    }
  };

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const sendLensConfig = (r, y, x) => {
    if (!webViewRef.current) return;
const js = `updateLensConfig({ radius: ${r.toFixed(3)}, yOffset: ${y.toFixed(3)}, xOffset: ${x.toFixed(3)} }); true;`;
    webViewRef.current.injectJavaScript(js);
  };

  const handleAdjust = (field, delta) => {
    if (field === 'radius') {
      const newVal = clamp(lensRadiusState + delta, 0.30, 0.60);
      setLensRadiusState(newVal);
      sendLensConfig(newVal, lensYOffsetState, lensXOffsetState);
    } else if (field === 'yOffset') {
      const newVal = clamp(lensYOffsetState + delta, 0.40, 0.60);
      setLensYOffsetState(newVal);
      sendLensConfig(lensRadiusState, newVal, lensXOffsetState);
    } else if (field === 'xOffset') {
      const newVal = clamp(lensXOffsetState + delta, -0.05, 0.05);
      setLensXOffsetState(newVal);
      sendLensConfig(lensRadiusState, lensYOffsetState, newVal);
    }
  };

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
      />

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

      {vrMode && (
        <>
          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => setShowLensControls(!showLensControls)}
          >
            <Text style={styles.gearText}>{showLensControls ? '✕' : '⚙'}</Text>
          </TouchableOpacity>
          {showLensControls && (
            <View style={styles.lensPanel}>
              <Text style={styles.panelTitle}>Ajustes Lentes</Text>
              <View style={styles.row}> 
                <Text style={styles.label}>Radio: {lensRadiusState.toFixed(2)}</Text>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust('radius', -0.01)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust('radius', +0.01)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.row}> 
                <Text style={styles.label}>Vertical: {lensYOffsetState.toFixed(2)}</Text>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust('yOffset', -0.01)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust('yOffset', +0.01)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.row}> 
                <Text style={styles.label}>Horizontal: {lensXOffsetState.toFixed(3)}</Text>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust('xOffset', -0.005)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust('xOffset', +0.005)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingOverlayText}>Cargando video 360°...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#F3F4F6' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  loadingOverlayText: { marginTop: 16, fontSize: 16, color: '#F3F4F6' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937', padding: 24 },
  errorText: { fontSize: 20, color: '#EF4444', marginBottom: 8, textAlign: 'center' },
  errorSubtext: { fontSize: 14, color: '#9CA3AF', marginBottom: 24, textAlign: 'center' },
  errorButton: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  tourInfo: { flex: 1, marginHorizontal: 12, alignItems: 'center' },
  tourTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  tourType: { fontSize: 12, color: '#D1D5DB', marginTop: 2 },
  iconText: { fontSize: 24, color: '#fff' },
  gearButton: { position: 'absolute', top: 20, right: 20, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24 },
  gearText: { color: '#fff', fontSize: 18 },
  lensPanel: { position: 'absolute', top: 70, right: 20, zIndex: 20, width: 200, backgroundColor: 'rgba(0,0,0,0.75)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#6366F1' },
  panelTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#D1D5DB', fontSize: 12, flex: 1, marginRight: 4 },
  buttonsRow: { flexDirection: 'row' },
  adjustBtn: { backgroundColor: '#6366F1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 6 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});

export default VR360ViewerScreen;