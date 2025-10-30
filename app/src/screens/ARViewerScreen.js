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
      camera.position.z = 3;
      cameraRef.current = camera;

      // Crear renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      rendererRef.current = renderer;

      // Iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

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
        if (modelRef.current && !isPaused) {
          modelRef.current.rotation.y += 0.005;
        }

        // Aplicar rotaciones manuales
        if (modelRef.current) {
          modelRef.current.rotation.x = rotationRef.current.x;
          modelRef.current.rotation.y += rotationRef.current.y;
        }

        renderer.render(scene, camera);
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
  
  const loadModel = async (scene, modelUrl) => {
    return new Promise((resolve, reject) => {
      console.log('📦 Cargando modelo desde:', modelUrl);
      
      const loader = new GLTFLoader();
      
      loader.load(
        modelUrl,
        (gltf) => {
          console.log('✅ Modelo cargado correctamente');
          
          const model = gltf.scene;
          
          // Escalar modelo
          const scale = currentTour?.arConfig?.scale || 0.5;
          model.scale.set(scale, scale, scale);
          
          // Posicionar modelo
          const pos = currentTour?.arConfig?.initialPosition || { x: 0, y: 0, z: 0 };
          model.position.set(pos.x, pos.y, pos.z);
          
          // Centrar modelo
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          
          scene.add(model);
          modelRef.current = model;
          
          setModelLoaded(true);
          resolve(model);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`📥 Cargando: ${percent.toFixed(0)}%`);
        },
        (error) => {
          console.error('❌ Error al cargar modelo:', error);
          Alert.alert('Error', 'No se pudo cargar el modelo 3D');
          reject(error);
        }
      );
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
      onPanResponderMove: (evt, gestureState) => {
        // Rotar modelo con gestos
        rotationRef.current = {
          x: gestureState.dy * 0.01,
          y: gestureState.dx * 0.01,
        };
      },
      onPanResponderRelease: () => {
        rotationRef.current = { x: 0, y: 0 };
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
            
            <View style={styles.controlButton} />
          </View>
          
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