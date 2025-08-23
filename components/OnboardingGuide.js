import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const OnboardingGuide = ({ visible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const steps = [
    {
      emoji: null, // Will use logo instead
      title: 'Welcome to StorageSwipe!',
      description: 'The fun way to clean up your photo library',
      demo: (
        <View style={styles.demoContainer}>
          <Image 
            source={require('../assets/header.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.demoText}>Let's get started!</Text>
        </View>
      ),
    },
    {
      emoji: '👈👉',
      title: 'Swipe to Decide',
      description: 'Swipe left to delete, right to keep',
      demo: (
        <View style={styles.demoContainer}>
          <Animated.View style={styles.swipeDemo}>
            <View style={styles.miniCard}>
              <Text style={styles.cardEmoji}>🖼️</Text>
            </View>
            <View style={styles.swipeArrows}>
              <Text style={styles.arrow}>← ❌</Text>
              <Text style={styles.arrow}>✅ →</Text>
            </View>
          </Animated.View>
        </View>
      ),
    },
    {
      emoji: '📁',
      title: 'Drag to Organize',
      description: 'NEW! Drag photos to folders around the screen',
      demo: (
        <View style={styles.demoContainer}>
          <View style={styles.folderDemo}>
            <View style={styles.topFolders}>
              <View style={styles.miniFolder}><Text>📷</Text></View>
              <View style={styles.miniFolder}><Text>⭐</Text></View>
              <View style={styles.miniFolder}><Text>📱</Text></View>
            </View>
            <View style={styles.dragLine} />
            <Text style={styles.dragEmoji}>🖼️</Text>
          </View>
        </View>
      ),
    },
    {
      emoji: '🎯',
      title: 'Long Press to Customize',
      description: 'Hold folders to remove them from view',
      demo: (
        <View style={styles.demoContainer}>
          <View style={styles.customizeDemo}>
            <View style={[styles.miniFolder, styles.shakingFolder]}>
              <Text>📁</Text>
            </View>
            <Text style={styles.holdText}>Hold to remove</Text>
          </View>
        </View>
      ),
    },
    {
      emoji: '🚀',
      title: 'You\'re All Set!',
      description: 'Start cleaning your photo library now',
      demo: (
        <View style={styles.demoContainer}>
          <LinearGradient
            colors={['#007AFF', '#5856D6']}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Let's Go!</Text>
          </LinearGradient>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentStep + 1),
        animated: true,
      });
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };
  
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentStep(currentIndex);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          {/* Skip button */}
          {currentStep < steps.length - 1 && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Steps */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepContent}>
                  {step.emoji && (
                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  )}
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {step.demo}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentStep === index && styles.activeDot,
                ]}
              />
            ))}
          </View>

          {/* Next button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={['#007AFF', '#5856D6']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Start' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    height: SCREEN_HEIGHT * 0.7,
    maxHeight: 600,
    backgroundColor: 'white',
    borderRadius: 30,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 25,
    right: 25,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: SCREEN_WIDTH * 0.01, // Even less padding on left
    paddingRight: SCREEN_WIDTH * 0.09, // Even more padding on right
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepEmoji: {
    fontSize: 50,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  phoneDemo: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  demoEmoji: {
    fontSize: 50,
  },
  demoText: {
    fontSize: 16,
    color: '#999',
  },
  swipeDemo: {
    alignItems: 'center',
  },
  miniCard: {
    width: 80,
    height: 110,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardEmoji: {
    fontSize: 40,
  },
  swipeArrows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 150,
  },
  arrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  folderDemo: {
    alignItems: 'center',
  },
  topFolders: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  miniFolder: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  dragLine: {
    width: 2,
    height: 40,
    backgroundColor: '#007AFF',
    marginBottom: 10,
  },
  dragEmoji: {
    fontSize: 40,
  },
  customizeDemo: {
    alignItems: 'center',
  },
  shakingFolder: {
    backgroundColor: '#ffe6e6',
  },
  holdText: {
    marginTop: 15,
    color: '#999',
    fontSize: 14,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 100,
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
    width: 20,
  },
  nextButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  nextButtonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingGuide;