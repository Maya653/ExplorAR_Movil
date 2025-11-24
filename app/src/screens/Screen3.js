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

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
  primary: '#8A8D00',      // PANTONE 392 C - Verde olivo
  secondary: '#041E42',    // PANTONE 296 C - Azul marino
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Screen3 = () => {
  const navigation = useNavigation();

  const handleNext = () => {
    navigation.navigate('Screen4');
  };

  return (
    <LinearGradient
      colors={["#F8FAFB", "#F3F5F7", "#FFFFFF"]}
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

        <View style={styles.content}>
          {/* ✅ BADGE SUPERIOR */}
          <View style={styles.topBadge}>
            <Text style={styles.badgeText}>🎯 Paso 2 de 3</Text>
          </View>

          {/* ✅ IMAGEN CON BORDE INSTITUCIONAL */}
          <View style={styles.imageWrapper}>
            <View style={styles.imageBorder}>
              <Image
                source={require('../../assets/balanza.png')}
                style={styles.lawImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ✅ TÍTULO CON ACENTO */}
          <View style={styles.titleContainer}>
            <View style={styles.titleAccent} />
            <Text style={styles.title}>Experiencias Únicas</Text>
          </View>

          <Text style={styles.description}>
            Vive micro-experiencias académicas con realidad aumentada y tours virtuales 360°
          </Text>
        </View>

        {/* ✅ FOOTER CON GRADIENTE SUTIL */}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.95)', '#FFFFFF']}
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
              colors={[COLORS.primary, '#9FA600']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.nextButtonText}>Siguiente</Text>
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
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(138, 141, 0, 0.09)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 250,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(4, 30, 66, 0.06)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.25,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(138, 141, 0, 0.07)',
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 100,
    paddingBottom: 200,
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
    width: 290,
    height: 290,
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
  lawImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  floatingIcon: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 28,
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
  
  // ✅ FEATURES
  featuresContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  featureItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(138, 141, 0, 0.15)',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
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
  nextButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Screen3;