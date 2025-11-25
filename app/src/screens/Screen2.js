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
import { useNavigation } from '@react-navigation/native';
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

const Screen2 = () => {
  const navigation = useNavigation();

  const handleNext = () => {
    navigation.navigate('Screen3');
  };

  return (
    <LinearGradient
      colors={[COLORS.secondary, '#0F2A4A', '#112240']}
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

        <View style={styles.content}>
          {/* ✅ BADGE SUPERIOR */}
          <View style={styles.topBadge}>
            <Ionicons name="school-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Paso 1 de 3</Text>
          </View>

          {/* ✅ IMAGEN CON BORDE INSTITUCIONAL */}
          <View style={styles.imageWrapper}>
            <View style={styles.imageBorder}>
              <Image
                source={require('../../assets/law.png')}
                style={styles.lawImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ✅ TÍTULO CON ACENTO */}
          <View style={styles.titleContainer}>
            <View style={styles.titleAccent} />
            <Text style={styles.title}>Explora Derecho</Text>
          </View>

          <Text style={styles.description}>
            Descubre todo sobre la carrera de Derecho a través de experiencias inmersivas y contenido especializado
          </Text>
        </View>

        {/* ✅ FOOTER CON GRADIENTE SUTIL */}
        <LinearGradient
          colors={['transparent', COLORS.secondary, COLORS.secondary]}
          style={styles.buttonContainer}
        >
          <View style={styles.indicatorsContainer}>
            <View style={styles.indicator} />
            <View style={[styles.indicator, styles.activeIndicator]} />
            <View style={styles.indicator} />
          </View>
          
          <TouchableOpacity 
            style={styles.nextButton} 
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <LinearGradient
              colors={[COLORS.primary, '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.nextButtonText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
            </LinearGradient>
          </TouchableOpacity>
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
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 40 : 80,
    paddingBottom: 160,
  },
  
  // ✅ BADGE SUPERIOR
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    width: 280,
    height: 280,
    borderRadius: 30,
    padding: 4,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  lawImage: {
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
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.5,
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
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  nextButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Screen2;