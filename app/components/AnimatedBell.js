import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnimatedBell = ({ color = '#D4AF37', size = 24, badgeCount = 0 }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de "campanada"
    const ringAnimation = Animated.sequence([
      Animated.timing(rotation, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: -1,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0.5,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: -0.5,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.delay(3000), // Pausa de 3 segundos entre campanadas
    ]);

    // Animación de pulso si hay notificaciones
    const pulseAnimation = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
    ]);

    // Iniciar animaciones
    const loop = Animated.loop(ringAnimation);
    loop.start();

    return () => loop.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-25deg', '25deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="notifications" size={size} color={color} />
    </Animated.View>
  );
};

export default AnimatedBell;
