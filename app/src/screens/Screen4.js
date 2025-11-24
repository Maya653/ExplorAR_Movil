import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
  primary: '#8A8D00',      // PANTONE 392 C - Verde olivo
  secondary: '#041E42',    // PANTONE 296 C - Azul marino
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Screen4 = ({ navigation }) => {
  return (
    <LinearGradient
      colors={["#FAFBF9", "#F5F7F4", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* ✅ CÍRCULOS DECORATIVOS DE FONDO */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* ✅ CONFETTI DECORATION */}
        <Text style={styles.confetti1}>🎉</Text>
        <Text style={styles.confetti2}>✨</Text>
        <Text style={styles.confetti3}>🎓</Text>
        <Text style={styles.confetti4}>⭐</Text>

        <View style={styles.content}>
          {/* ✅ BADGE SUPERIOR */}
          <View style={styles.topBadge}>
            <Text style={styles.badgeText}>✨ Paso 3 de 3</Text>
          </View>

          {/* ✅ IMAGEN CON BORDE INSTITUCIONAL */}
          <View style={styles.imageWrapper}>
            <View style={styles.imageBorder}>
              <Image
                source={require('../../assets/graduacion_rosa.png')}
                style={styles.graduatesImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ✅ TÍTULO CON ACENTO */}
          <View style={styles.titleContainer}>
            <View style={styles.titleAccent} />
            <Text style={styles.title}>¡Comienza Ya!</Text>
          </View>

          <Text style={styles.description}>
            Inicia tu viaje de exploración profesional y descubre si Derecho es para ti
          </Text>
        </View>

        {/* ✅ FOOTER CON GRADIENTE SUTIL */}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.95)', '#FFFFFF']}
          style={styles.buttonContainer}
        >
          <View style={styles.indicatorsContainer}>
            <View style={styles.indicator} />
            <View style={styles.indicator} />
            <View style={[styles.indicator, styles.activeIndicator]} />
          </View>
          
          <TouchableOpacity 
            style={styles.startButton} 
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={[COLORS.primary, '#9FA600']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.startButtonText}>Empezar Exploración</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.welcomeText}>
            Bienvenido a <Text style={styles.boldText}>ExplorAR</Text> 🎓
          </Text>
        </LinearGradient>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // ✅ CÍRCULOS DECORATIVOS
  decorativeCircle1: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(138, 141, 0, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 180,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(4, 30, 66, 0.07)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.35,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(138, 141, 0, 0.08)',
  },
  
  // ✅ CONFETTI
  confetti1: {
    position: 'absolute',
    top: 100,
    left: 30,
    fontSize: 32,
    opacity: 0.4,
  },
  confetti2: {
    position: 'absolute',
    top: 150,
    right: 40,
    fontSize: 28,
    opacity: 0.4,
  },
  confetti3: {
    position: 'absolute',
    bottom: 300,
    left: 50,
    fontSize: 30,
    opacity: 0.4,
  },
  confetti4: {
    position: 'absolute',
    bottom: 350,
    right: 60,
    fontSize: 26,
    opacity: 0.4,
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 100,
    paddingBottom: 220,
  },
  
  // ✅ BADGE SUPERIOR
  topBadge: {
    backgroundColor: 'rgba(138, 141, 0, 0.12)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 141, 0, 0.25)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  
  // ✅ IMAGEN CON BORDE
  imageWrapper: {
    position: 'relative',
    marginBottom: 40,
  },
  imageBorder: {
    width: 300,
    height: 300,
    borderRadius: 30,
    padding: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  graduatesImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  floatingIcon: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  floatingIconText: {
    fontSize: 32,
  },
  
  // ✅ TÍTULO CON ACENTO
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleAccent: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
    lineHeight: 24,
    maxWidth: 340,
  },
  
  // ✅ STATS
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(138, 141, 0, 0.15)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // ✅ FOOTER
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 8,
    borderRadius: 4,
  },
  startButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  welcomeText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default Screen4;