// src/screens/ARViewerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  PanResponder,
} from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { LinearGradient } from 'expo-linear-gradient';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as ScreenOrientation from 'expo-screen-orientation';
import { API_BASE_URL, AR_CONFIG } from '../utils/constants';

// Stores
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';

// Icons
const CloseIcon = () => <Text style={styles.iconText}>✕</Text>;
const PauseIcon = () => <Text style={styles.iconText}>⏸</Text>;
const PlayIcon = () => <Text style={styles.iconText}>▶</Text>;
const CameraIcon = () => <Text style={styles.iconText}>📷</Text>;
const InfoIcon = () => <Text style={styles.iconText}>ℹ️</Text>;

const { width, height } = Dimensions.get('window');

// ============================================
// COMPONENTE PRINCIPAL: ARViewerScreen
// ============================================
const ARViewerScreen = ({ route, navigation }) => {
  // Props de navegación
  const { tourId } = route.params;
  
  // Estados
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [startTime] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [sensorControl, setSensorControl] = useState(true);
  
  // Stores
  const { currentTour, loadTour, loading, error, pauseTour, resumeTour, completeTour } = useTourStore();
  const { trackEvent } = useAnalyticsStore();
  
  // Refs para Three.js
  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const frameIdRef = useRef(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const initialScaleRef = useRef(null);
  const initialDistanceRef = useRef(null);
  const initialModelPosRef = useRef(null);
  const lastTouchRef = useRef(null); // {x, y}
  const initialCenterRef = useRef(null); // {x, y}

  // DeviceMotion subscription ref
  const deviceMotionSubRef = useRef(null);
  const baselineRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const smoothedRotRef = useRef({ x: 0, y: 0, z: 0 });
  const lastRotationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // ============================================
  // EFECTOS
  // ============================================
  
  // Cargar tour al montar
  useEffect(() => {
    console.log('🎬 Iniciando ARViewerScreen con tourId:', tourId);
    loadTour(tourId);
    
    // Track: Tour iniciado
    trackEvent('tour_start', { tourId });
    
    // Cleanup al desmontar
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⏱️ Tour duró ${duration} segundos`);
      
      // Limpiar animación
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      // Track: Tour completado
      trackEvent('tour_complete', {
        tourId,
        duration,
        interactions,
      });
    };
  }, [tourId]);

  // Subscribirse a DeviceMotion para mover cámara/modelo al mover el celular
  useEffect(() => {
    let DeviceMotionModule = null;
    try {
      // Importar expo-sensors de forma segura
      DeviceMotionModule = require('expo-sensors');
      console.log('✅ expo-sensors cargado correctamente');
    } catch (e) {
      console.warn('⚠️ expo-sensors no está instalado; movimiento por dispositivo deshabilitado');
      DeviceMotionModule = null;
    }

    if (!DeviceMotionModule || !DeviceMotionModule.DeviceMotion) {
      return () => {};
    }

    const DeviceMotion = DeviceMotionModule.DeviceMotion;
    try {
      DeviceMotion.setUpdateInterval && DeviceMotion.setUpdateInterval(50); // ~20 Hz para mayor fluidez
    } catch (e) {
      // ignore
    }

    const sub = DeviceMotion.addListener((data) => {
      if (!sensorControl || !modelRef.current) return;
      const rot = data.rotation || {}; // { alpha, beta, gamma } en radianes
  const { alpha = 0, beta = 0, gamma = 0 } = rot;
  lastRotationRef.current = { alpha, beta, gamma };

      // Baseline para "centrar" la posición actual del usuario
      const base = baselineRef.current;
      const dAlpha = alpha - base.alpha; // roll
      const dBeta = beta - base.beta;   // pitch (x)
      const dGamma = gamma - base.gamma; // yaw (y)

      const yawFactor = currentTour?.arConfig?.sensorYawFactor ?? 1.0;
      const pitchFactor = currentTour?.arConfig?.sensorPitchFactor ?? 1.0;
      const rollFactor = currentTour?.arConfig?.sensorRollFactor ?? 0.0; // por defecto ignoramos roll

      // Mapeo: gamma -> rotación Y, beta -> rotación X, alpha -> Z (opcional)
      let targetX = -dBeta * pitchFactor; // invertir para que se sienta natural
      let targetY = dGamma * yawFactor;
      let targetZ = dAlpha * rollFactor;

      // Suavizado simple (low-pass)
      const smooth = currentTour?.arConfig?.sensorSmoothing ?? 0.15;
      smoothedRotRef.current.x = smoothedRotRef.current.x + (targetX - smoothedRotRef.current.x) * smooth;
      smoothedRotRef.current.y = smoothedRotRef.current.y + (targetY - smoothedRotRef.current.y) * smooth;
      smoothedRotRef.current.z = smoothedRotRef.current.z + (targetZ - smoothedRotRef.current.z) * smooth;

      modelRef.current.rotation.x = smoothedRotRef.current.x;
      modelRef.current.rotation.y = smoothedRotRef.current.y;
      modelRef.current.rotation.z = smoothedRotRef.current.z;
    });

    deviceMotionSubRef.current = sub;

    return () => {
      try {
        deviceMotionSubRef.current && deviceMotionSubRef.current.remove && deviceMotionSubRef.current.remove();
      } catch (e) {
        // ignore
      }
    };
  }, [modelLoaded, currentTour]);

  // Bloquear la orientación en horizontal mientras esta pantalla esté activa
  useEffect(() => {
    const lock = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        // ignore
      }
    };
    lock();
    return () => {
      // Regresar a orientación vertical por defecto de la app
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // ============================================
  // CONFIGURACIÓN DE THREE.JS
  // ============================================
  
  const onContextCreate = async (gl) => {
    try {
      console.log('🎨 Inicializando contexto GL...');
      
      // Crear escena
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      sceneRef.current = scene;

      // Crear cámara
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      // Posición inicial; se reajustará automáticamente tras cargar el modelo
      camera.position.z = currentTour?.arConfig?.cameraZ || 5;
      camera.position.y = currentTour?.arConfig?.cameraY || 0.5;
      cameraRef.current = camera;

      // Crear renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      // Asegurar espacio de color correcto para materiales PBR
      if (renderer.outputEncoding !== undefined) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      rendererRef.current = renderer;

      // Iluminación mejorada para mejor visibilidad
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

      // Luz adicional desde abajo para eliminar sombras duras
      const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
      bottomLight.position.set(0, -5, 0);
      scene.add(bottomLight);

      // Cargar modelo 3D
      if (currentTour?.multimedia?.[0]?.url) {
        await loadModel(scene, currentTour.multimedia[0].url);
      }

      // Crear marcadores de hotspots
      if (currentTour?.hotspots) {
        createHotspots(scene, currentTour.hotspots);
      }

      // Loop de animación
      const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        
        // Rotar modelo si no está pausado
        if (modelRef.current && !isPaused && !sensorControl) {
          // Solo auto-rotar si no estamos en modo sensor
          modelRef.current.rotation.y += 0.005;
        }

        // Aplicar rotaciones manuales
        if (modelRef.current) {
          modelRef.current.rotation.x = rotationRef.current.x;
          modelRef.current.rotation.y += rotationRef.current.y;
        }

        // Renderizar siempre con la cámara activa (embebida del glTF o la por defecto)
        const activeCamera = cameraRef.current || camera;
        renderer.render(scene, activeCamera);
        gl.endFrameEXP();
      };

      animate();
      console.log('✅ Contexto GL inicializado');

    } catch (error) {
      console.error('❌ Error al inicializar GL:', error);
      Alert.alert('Error', 'No se pudo inicializar el visor 3D');
    }
  };

  // ============================================
  // CARGAR MODELO 3D
  // ============================================
  
  const toAbsoluteUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return u.toString();
    } catch (e) {
      // relativo
    }
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  const FALLBACK_GLB = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

  const loadModel = async (scene, modelUrl) => {
    return new Promise((resolve, reject) => {
      const resolvedUrl = toAbsoluteUrl(modelUrl) || FALLBACK_GLB;
      console.log('📦 Cargando modelo desde:', resolvedUrl);

      const loader = new GLTFLoader();
      try { 
        loader.setCrossOrigin && loader.setCrossOrigin('anonymous'); 
        
        // Configurar el manager para manejar errores de texturas
        const manager = new THREE.LoadingManager();
        manager.onError = function(url) {
          console.warn('⚠️ Error cargando recurso:', url);
        };
        loader.manager = manager;
      } catch (e) {}

      let triedFallback = false;

      const doLoad = (url) => {
        loader.load(
          url,
          (gltf) => {
          console.log('✅ Modelo cargado correctamente');

          const model = gltf.scene;
          
          // Manejar materiales con texturas problemáticas
          model.traverse((child) => {
            if (child.isMesh) {
              // Si hay errores de texturas, usar material básico
              if (child.material) {
                try {
                  // Verificar si el material tiene texturas problemáticas
                  const material = child.material;
                  if (material.map && !material.map.image) {
                    // Si la textura no se cargó correctamente, usar color sólido
                    const basicMaterial = new THREE.MeshLambertMaterial({
                      color: material.color || 0xcccccc,
                      transparent: material.transparent,
                      opacity: material.opacity || 1.0
                    });
                    child.material = basicMaterial;
                    console.log('🎨 Aplicando material básico por error de textura');
                  }
                } catch (e) {
                  // Si hay error, usar material básico gris
                  child.material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
                }
              }
            }
          });

          // No modificar transformaciones del modelo: respetar escala/orientación/posición original
          scene.add(model);
          modelRef.current = model;
          
          // Debug: información del modelo cargado
          console.log('📊 Modelo añadido a la escena. Información:');
          console.log('- Children:', model.children.length);
          console.log('- Posición:', model.position);
          console.log('- Escala:', model.scale);
          console.log('- Rotación:', model.rotation);

          // Si el glTF trae una cámara, úsala
          if (gltf.cameras && gltf.cameras.length > 0) {
            const gltfCam = gltf.cameras[0];
            try {
              gltfCam.aspect = width / height;
              gltfCam.updateProjectionMatrix && gltfCam.updateProjectionMatrix();
            } catch (e) {}
            cameraRef.current = gltfCam;
          } else {
            // Enfocar la cámara a los límites del modelo, sin mover el modelo
            try {
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              const maxSize = Math.max(size.x, size.y, size.z) || 1;
              const cam = cameraRef.current;
              if (cam && cam.isPerspectiveCamera) {
                const fov = (cam.fov * Math.PI) / 180;
                let dist = Math.abs(maxSize / (2 * Math.tan(fov / 2)));
                dist *= 1.25; // margen
                cam.near = Math.max(0.01, dist / 100);
                cam.far = dist * 100;
                cam.updateProjectionMatrix();
                cam.position.copy(center.clone().add(new THREE.Vector3(0, 0, dist)));
                cam.lookAt(center);
              }
            } catch (e) {
              // ignore encuadre si falla
            }
          }

          setModelLoaded(true);
          resolve(model);
        },
          (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`📥 Cargando: ${percent.toFixed(0)}%`);
        },
          (error) => {
            console.error('❌ Error al cargar modelo:', error);
            if (!triedFallback) {
              triedFallback = true;
              console.log('🔁 Reintentando con modelo de respaldo:', FALLBACK_GLB);
              return doLoad(FALLBACK_GLB);
            }
            Alert.alert('Error', 'No se pudo cargar el modelo 3D');
            reject(error);
          }
        );
      };

      doLoad(resolvedUrl);
    });
  };

  // ============================================
  // CREAR HOTSPOTS
  // ============================================
  
  const createHotspots = (scene, hotspots) => {
    hotspots.forEach((hotspot, index) => {
      // Crear geometría de esfera para el marcador
      const geometry = new THREE.SphereGeometry(0.05, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x6366f1,
        transparent: true,
        opacity: 0.8
      });
      
      const marker = new THREE.Mesh(geometry, material);
      
      // Posicionar hotspot
      marker.position.set(
        hotspot.position?.x || 0,
        hotspot.position?.y || 0,
        hotspot.position?.z || 0
      );
      
      // Guardar datos del hotspot
      marker.userData = {
        isHotspot: true,
        title: hotspot.title,
        content: hotspot.content,
        index: index
      };
      
      scene.add(marker);
      console.log(`📍 Hotspot creado: ${hotspot.title}`);
    });
  };

  // ============================================
  // GESTOS TÁCTILES
  // ============================================
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches || [];
        if (touches.length === 1) {
          const t = touches[0];
          lastTouchRef.current = { x: t.pageX, y: t.pageY };
        } else if (touches.length >= 2) {
          const [t1, t2] = touches;
          const dx = t2.pageX - t1.pageX;
          const dy = t2.pageY - t1.pageY;
          initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
          initialScaleRef.current = zoomRef.current;
          initialModelPosRef.current = modelRef.current
            ? modelRef.current.position.clone()
            : new THREE.Vector3(0, 0, 0);
          initialCenterRef.current = {
            x: (t1.pageX + t2.pageX) / 2,
            y: (t1.pageY + t2.pageY) / 2,
          };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches || [];
        const ROTATE_SENS = 0.005;
        const PAN_SENS = 0.005;

        if (!modelRef.current) return;

        if (touches.length === 1) {
          if (sensorControl) {
            // En modo sensor, ignoramos rotación por un dedo para no interferir
            return;
          }
          // Rotación con un dedo
          const t = touches[0];
          if (lastTouchRef.current) {
            const dx = t.pageX - lastTouchRef.current.x;
            const dy = t.pageY - lastTouchRef.current.y;
            modelRef.current.rotation.y += dx * ROTATE_SENS;
            modelRef.current.rotation.x += dy * ROTATE_SENS;
          }
          lastTouchRef.current = { x: t.pageX, y: t.pageY };
        } else if (touches.length >= 2) {
          // Pan + Zoom con dos dedos
          const [t1, t2] = touches;
          const dx = t2.pageX - t1.pageX;
          const dy = t2.pageY - t1.pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (initialDistanceRef.current && initialScaleRef.current != null) {
            const scaleFactor = distance / initialDistanceRef.current;
            const nextZoom = Math.max(
              AR_CONFIG.MIN_SCALE,
              Math.min(AR_CONFIG.MAX_SCALE, initialScaleRef.current * scaleFactor)
            );
            zoomRef.current = nextZoom;
            modelRef.current.scale.set(nextZoom, nextZoom, nextZoom);
          }

          if (initialCenterRef.current && initialModelPosRef.current) {
            const centerX = (t1.pageX + t2.pageX) / 2;
            const centerY = (t1.pageY + t2.pageY) / 2;
            const deltaX = (centerX - initialCenterRef.current.x) * PAN_SENS;
            const deltaY = (centerY - initialCenterRef.current.y) * PAN_SENS;
            modelRef.current.position.x = initialModelPosRef.current.x + deltaX;
            modelRef.current.position.y = initialModelPosRef.current.y - deltaY;
          }
        }
      },
      onPanResponderRelease: () => {
        rotationRef.current = { x: 0, y: 0 };
        lastTouchRef.current = null;
        initialDistanceRef.current = null;
        initialScaleRef.current = null;
        initialModelPosRef.current = null;
        initialCenterRef.current = null;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        rotationRef.current = { x: 0, y: 0 };
        lastTouchRef.current = null;
        initialDistanceRef.current = null;
        initialScaleRef.current = null;
        initialModelPosRef.current = null;
        initialCenterRef.current = null;
      },
    })
  ).current;

  // ============================================
  // HANDLERS
  // ============================================
  
  const handlePause = () => {
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    
    if (newPauseState) {
      pauseTour();
      console.log('⏸️ Tour pausado');
    } else {
      resumeTour();
      console.log('▶️ Tour reanudado');
    }
  };

  const handleToggleSensor = () => {
    setSensorControl((prev) => !prev);
  };

  const handleCalibrate = () => {
    // Fija el estado actual como "centro" para deltas cero
    try {
      const DeviceMotionModule = require('expo-sensors');
      const DeviceMotion = DeviceMotionModule?.DeviceMotion;
      if (!DeviceMotion) return;
      // Usamos el último valor de rotación conocido como baseline
      baselineRef.current = { ...lastRotationRef.current };
      // Resetea suavizado a cero (sentir recalibre inmediato)
      smoothedRotRef.current = { x: 0, y: 0, z: 0 };
      // Y tomamos la pose actual del modelo como nueva base (inversa)
      if (modelRef.current) {
        // Si el usuario recalibra, mantenemos la pose actual como punto cero visual
        // Ajuste: movemos baseline a la rotación actual para que deltas sean ~0
        // Como no tenemos el último alpha/beta/gamma de forma directa, aproximamos poniendo rot a 0
        modelRef.current.rotation.set(0, 0, 0);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Salir del Tour',
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
  };

  const handleCapture = () => {
    Alert.alert('Captura de pantalla', 'Esta función estará disponible pronto');
  };

  const handleHotspotClick = (hotspot) => {
    console.log('📍 Hotspot clickeado:', hotspot.title);
    setSelectedHotspot(hotspot);
    setInteractions(prev => prev + 1);
    
    trackEvent('hotspot_click', {
      tourId,
      hotspotTitle: hotspot.title,
    });
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Cargando experiencia 3D...</Text>
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
      {/* Visor 3D con Three.js */}
      <View style={styles.glContainer} {...panResponder.panHandlers}>
        <GLView
          style={styles.glView}
          onContextCreate={onContextCreate}
        />
        
        {/* Indicador de carga del modelo */}
        {!modelLoaded && (
          <View style={styles.modelLoadingOverlay}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.modelLoadingText}>Cargando modelo 3D...</Text>
          </View>
        )}
      </View>

      {/* Overlay superior: Información del tour */}
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
              <Text style={styles.tourType}>{currentTour.type} Tour</Text>
            </View>
            
            <TouchableOpacity onPress={() => setShowInfo(true)} style={styles.topButton}>
              <InfoIcon />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Overlay inferior: Controles */}
      <View style={styles.bottomOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.bottomGradient}
        >
          <View style={styles.controlsBar}>
            <TouchableOpacity onPress={handleCapture} style={styles.controlButton}>
              <CameraIcon />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handlePause} style={styles.controlButtonLarge}>
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleToggleSensor}
              style={[
                styles.controlButton,
                sensorControl ? { backgroundColor: '#10B981' } : null,
              ]}
            >
              <Text style={styles.iconText}>🧭</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleCalibrate} style={styles.calibrateButton}>
            <Text style={styles.calibrateText}>Recalibrar orientación</Text>
          </TouchableOpacity>
          
          {currentTour.hotspots && currentTour.hotspots.length > 0 && (
            <Text style={styles.hotspotHint}>
              📍 {currentTour.hotspots.length} puntos de interés • Toca para explorar
            </Text>
          )}
          
          <Text style={styles.gestureHint}>
            👆 Desliza para rotar el modelo
          </Text>
        </LinearGradient>
      </View>

      {/* Modal: Información del tour */}
      <Modal
        visible={showInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Información del Tour</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <CloseIcon />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Descripción</Text>
              <Text style={styles.modalText}>{currentTour.description}</Text>
              
              <Text style={styles.modalSectionTitle}>Tipo</Text>
              <Text style={styles.modalText}>{currentTour.type}</Text>
              
              <Text style={styles.modalSectionTitle}>Duración estimada</Text>
              <Text style={styles.modalText}>{currentTour.duration} minutos</Text>
              
              {currentTour.hotspots && currentTour.hotspots.length > 0 && (
                <>
                  <Text style={styles.modalSectionTitle}>Puntos de interés</Text>
                  {currentTour.hotspots.map((hotspot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.hotspotListItem}
                      onPress={() => {
                        setShowInfo(false);
                        handleHotspotClick(hotspot);
                      }}
                    >
                      <Text style={styles.modalListItem}>
                        📍 {hotspot.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Hotspot seleccionado */}
      <Modal
        visible={!!selectedHotspot}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedHotspot(null)}
      >
        <View style={styles.hotspotOverlay}>
          <View style={styles.hotspotCard}>
            <Text style={styles.hotspotCardTitle}>{selectedHotspot?.title}</Text>
            <Text style={styles.hotspotCardContent}>{selectedHotspot?.content}</Text>
            
            <TouchableOpacity
              style={styles.hotspotCloseButton}
              onPress={() => setSelectedHotspot(null)}
            >
              <Text style={styles.hotspotCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  glContainer: {
    flex: 1,
  },
  glView: {
    flex: 1,
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
  modelLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modelLoadingText: {
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
  
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  calibrateButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  calibrateText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  hotspotHint: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
  },
  gestureHint: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
  
  // Icons
  iconText: {
    fontSize: 24,
    color: '#fff',
  },
  
  // Modal Info
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  hotspotListItem: {
    marginBottom: 8,
  },
  modalListItem: {
    fontSize: 15,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  
  // Hotspot Modal
  hotspotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  hotspotCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  hotspotCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 12,
  },
  hotspotCardContent: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 20,
  },
  hotspotCloseButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  hotspotCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ARViewerScreen;