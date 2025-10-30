import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Screen4 = ({ navigation }) => {
  return (
    <LinearGradient
      colors={["#FFF1F9", "#FFE6F5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <Image
              source={require('../../assets/graduacion_rosa.png')}
              style={styles.graduatesImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>¡Comienza Ya!</Text>
          <Text style={styles.description}>
            Inicia tu viaje de exploración profesional y descubre si Derecho es para ti
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.indicatorsContainer}>
            <View style={styles.indicator} />
            <View style={styles.indicator} />
            <View style={[styles.indicator, styles.activeIndicator]} />
          </View>
          <TouchableOpacity 
            style={styles.startButton} 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.startButtonText}>Empezar Exploración</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
    width: '100%',
  },
  cardContainer: {
    width: 360,
    height: 300,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'visible',
  },
  graduatesImage: {
    width: 360,
    height: 300,
    marginTop: -20, // Para ajustar la posición vertical
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#10B981',
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  startButton: {
    backgroundColor: '#10B981',
    width: '88%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Screen4;
