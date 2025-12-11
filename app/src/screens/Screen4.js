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
import { Ionicons } from '@expo/vector-icons';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Screen4 = ({ navigation }) => {
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.secondary, '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* ✅ CÍRCULOS DECORATIVOS DE FONDO */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* ✅ ICONOS DECORATIVOS (Reemplazo de Emojis) */}
        <Ionicons name="ribbon-outline" size={32} color={COLORS.primary} style={[styles.floatingIcon, styles.icon1]} />
        <Ionicons name="sparkles-outline" size={28} color={COLORS.accent} style={[styles.floatingIcon, styles.icon2]} />
        <Ionicons name="school-outline" size={30} color={COLORS.primary} style={[styles.floatingIcon, styles.icon3]} />
        <Ionicons name="star-outline" size={26} color={COLORS.warning} style={[styles.floatingIcon, styles.icon4]} />

        <View style={styles.content}>
          {/* ✅ BADGE SUPERIOR */}
          <View style={styles.topBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Paso 3 de 3</Text>
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
          colors={['transparent', COLORS.secondary, COLORS.secondary]}
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
              colors={[COLORS.primary, '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.startButtonText}>Empezar Exploración</Text>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.welcomeText}>
            Bienvenido a <Text style={styles.boldText}>ExplorAR</Text>
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
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 180,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(100, 255, 218, 0.03)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.35,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  
  // ✅ ICONOS FLOTANTES
  floatingIcon: {
    position: 'absolute',
    opacity: 0.6,
  },
  icon1: { top: 100, left: 30 },
  icon2: { top: 150, right: 40 },
  icon3: { bottom: 300, left: 50 },
  icon4: { bottom: 350, right: 60 },
  
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  graduatesImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
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
    color: COLORS.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
    lineHeight: 24,
    maxWidth: 340,
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
    backgroundColor: '#334155',
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
    shadowOpacity: 0.4,
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
    color: COLORS.subtext,
    fontSize: 14,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default Screen4;