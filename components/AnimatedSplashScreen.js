import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedSplashScreen = ({ onAnimationComplete }) => {
  const cubeScale = useRef(new Animated.Value(0)).current;
  const cubeRotate = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const arrowTranslate = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const particlesOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animation sequence
    Animated.sequence([
      // Phase 1: Cube appears and grows
      Animated.parallel([
        Animated.spring(cubeScale, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Arrow swooshes in
      Animated.parallel([
        Animated.spring(arrowTranslate, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(cubeRotate, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Phase 3: Text fades in and particles appear
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(particlesOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Phase 4: Hold for a moment
      Animated.delay(500),
    ]).start(() => {
      // Animation complete
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);

  const cubeRotation = cubeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a1f', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated particles/stars in background */}
      <Animated.View style={[styles.particlesContainer, { opacity: particlesOpacity }]}>
        {[...Array(15)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Glowing cube with arrow */}
        <View style={styles.logoContainer}>
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowOpacity,
                transform: [{ scale: cubeScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', '#4a00ff20', '#00ffff20', 'transparent']}
              style={styles.glow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Cube */}
          <Animated.View
            style={[
              styles.cube,
              {
                transform: [
                  { scale: cubeScale },
                  { rotate: cubeRotation },
                  { perspective: 1000 },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#4a00ff', '#00ffff']}
              style={styles.cubeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cubeInner}>
                <Image
                  source={require('../assets/header.png')}
                  style={styles.cubeLogoImage}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Arrow */}
          <Animated.View
            style={[
              styles.arrow,
              {
                transform: [
                  { translateX: arrowTranslate },
                  { translateY: -10 },
                ],
                opacity: arrowTranslate.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <View style={styles.arrowShape}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowHead} />
            </View>
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Animated.Text style={styles.storageText}>STORAGE</Animated.Text>
          <Animated.Text style={styles.swipeText}>SWIPE</Animated.Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View style={[styles.loadingContainer, { opacity: textOpacity }]}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  transform: [{
                    scaleX: textOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  }],
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  cube: {
    width: 100,
    height: 100,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  cubeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 3,
  },
  cubeInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cubeLogoImage: {
    width: '95%',
    height: '95%',
    opacity: 0.95,
  },
  arrow: {
    position: 'absolute',
    right: -30,
    top: 20,
  },
  arrowShape: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowLine: {
    width: 40,
    height: 3,
    backgroundColor: '#00ffff',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    borderLeftColor: '#00ffff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  storageText: {
    fontSize: 36,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 5,
    marginBottom: -5,
  },
  swipeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#00ffff',
    letterSpacing: 5,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    width: '60%',
  },
  loadingBar: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '100%',
    height: '100%',
    backgroundColor: '#00ffff',
    borderRadius: 1,
    transformOrigin: 'left',
  },
});

export default AnimatedSplashScreen;