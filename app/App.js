// App.js - ACTUALIZADO con ARViewerScreen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Image, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

// Importar screens desde src/screens/
import Screen2 from './src/screens/Screen2';
import Screen3 from './src/screens/Screen3';
import Screen4 from './src/screens/Screen4';
import HomeScreen from './src/screens/HomeScreen';
import ExplorAR from './src/screens/ExplorAR';
import CarreraScreen from './src/screens/CarreraScreen';
import ARViewerScreen from './src/screens/ARViewerScreen'; // ✅ NUEVO

// ✅ Importar TODOS los stores
import useAnalyticsStore from './src/stores/analyticsStore';
import useCareerStore from './src/stores/careerStore';
import useTourStore from './src/stores/tourStore';

// ✅ Importar constants
import { ANALYTICS_CONFIG } from './src/utils/constants';

const Stack = createStackNavigator();

const SplashScreen = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <LinearGradient
        colors={["#6366F1", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.splashContent}>
          <View style={styles.iconBox}>
            <Image source={require('./assets/logo1.png')} style={styles.icon} resizeMode="contain" />
          </View>
          <Text style={styles.splashTitle}>ExplorAR</Text>
          <Text style={styles.splashSubtitle}>Descubre tu futuro profesional</Text>
          <View style={styles.line} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const MainStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Screen2"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Screen2" component={Screen2} />
      <Stack.Screen name="Screen3" component={Screen3} />
      <Stack.Screen name="Screen4" component={Screen4} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Carrera" component={CarreraScreen} />
      <Stack.Screen name="ExplorAR" component={ExplorAR} />
      
      {/* ✅ NUEVA PANTALLA: ARViewerScreen */}
      <Stack.Screen 
        name="ARViewer" 
        component={ARViewerScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Evitar swipe para cerrar accidentalmente
        }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  // ✅ Extraer funciones de los stores
  const initSession = useAnalyticsStore(state => state.initSession);
  const sendPendingEvents = useAnalyticsStore(state => state.sendPendingEvents);
  const fetchCareers = useCareerStore(state => state.fetchCareers);
  const fetchTours = useTourStore(state => state.fetchTours);

  // ✅ Inicializar TODO al montar la app
  useEffect(() => {
    console.log('🚀 Iniciando ExplorAR...');
    
    // Inicializar analytics
    initSession();
    
    // Pre-cargar datos
    console.log('📥 Pre-cargando carreras y tours...');
    fetchCareers();
    fetchTours();
  }, []);

  // Enviar eventos pendientes periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      sendPendingEvents();
    }, ANALYTICS_CONFIG.BATCH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Enviar eventos cuando la app pase a background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App en background, enviando eventos pendientes...');
        sendPendingEvents();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      {showSplash ? <SplashScreen /> : <MainStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    width: 70,
    height: 70,
    tintColor: undefined,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  splashSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: 18,
  },
  line: {
    width: 50,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginTop: 8,
  },
});

export default App;