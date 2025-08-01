import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, Alert, Dimensions, ActivityIndicator, Modal, FlatList, Animated, Linking } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';
import { categorizePhotos, formatFileSize } from './utils/duplicateDetection';
import { Image as ExpoImage } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
// Mock in-app purchases for development - replace with real implementation for production
const InAppPurchases = {
  connectAsync: () => Promise.resolve(),
  purchaseItemAsync: (productId) => Promise.resolve({ 
    responseCode: 0 // Mock success
  }),
  IAPResponseCode: { OK: 0 }
};
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Language translations
const translations = {
  en: {
    title: 'StorageSwipe',
    subtitle: 'Clean up your photo library', 
    swipe: 'Swipe',
    categories: 'Categories',
    delete: 'Delete',
    keep: 'Keep',
    photosRemaining: 'photos remaining',
    swipeInstructions: '💡 Swipe left to delete • Swipe right to keep',
    confirmDelete: 'Confirm Delete',
    screenshots: 'Screenshots',
    whatsapp: 'WhatsApp',
    camera: 'Camera',
    socialMedia: 'Social Media',
    videos: 'Videos',
    other: 'Other',
    tapToView: 'Tap to view',
    deleteAll: 'Delete All',
    back: '← Back',
    items: 'items',
    // Paywall
    unlockPremium: 'Unlock StorageSwipe Premium',
    cleanUpPro: 'Clean up your photos like a pro',
    organizeCategories: 'Organize by Categories',
    bulkDelete: 'Bulk Delete by Category',
    unlimitedProcessing: 'Unlimited Photo Processing',
    noAds: 'No Ads Forever',
    yearly: 'Yearly',
    monthly: 'Monthly',
    lifetime: 'Lifetime',
    bestValue: 'BEST VALUE',
    save44: 'Save 44%',
    cancelAnytime: 'Cancel anytime',
    oneTimePayment: 'One-time payment',
    freeTrialText: '• 3-day free trial • Cancel anytime • Secure payment',
    // Settings
    settings: 'Settings',
    language: 'Language',
    selectLanguage: 'Select Language',
    // Free limits
    swipesRemaining: 'swipes remaining',
    unlimitedSwipes: 'Unlimited swipes'
  },
  es: {
    title: 'StorageSwipe',
    subtitle: 'Limpia tu biblioteca de fotos',
    swipe: 'Deslizar',
    categories: 'Categorías',
    delete: 'Eliminar',
    keep: 'Mantener',
    photosRemaining: 'fotos restantes',
    swipeInstructions: '💡 Desliza izquierda para eliminar • Desliza derecha para mantener',
    confirmDelete: 'Confirmar Eliminación',
    screenshots: 'Capturas',
    whatsapp: 'WhatsApp',
    camera: 'Cámara', 
    socialMedia: 'Redes Sociales',
    videos: 'Videos',
    other: 'Otros',
    tapToView: 'Toca para ver',
    deleteAll: 'Eliminar Todo',
    back: '← Volver',
    items: 'elementos',
    // Paywall
    unlockPremium: 'Desbloquear StorageSwipe Premium',
    cleanUpPro: 'Limpia tus fotos como un profesional',
    organizeCategories: 'Organizar por Categorías',
    bulkDelete: 'Eliminación Masiva por Categoría',
    unlimitedProcessing: 'Procesamiento Ilimitado de Fotos',
    noAds: 'Sin Anuncios Para Siempre',
    yearly: 'Anual',
    monthly: 'Mensual',
    lifetime: 'De por Vida',
    bestValue: 'MEJOR VALOR',
    save44: 'Ahorra 44%',
    cancelAnytime: 'Cancela en cualquier momento',
    oneTimePayment: 'Pago único',
    freeTrialText: '• Prueba gratis de 3 días • Cancela en cualquier momento • Pago seguro',
    // Settings
    settings: 'Configuración',
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    // Free limits
    swipesRemaining: 'deslizamientos restantes',
    unlimitedSwipes: 'Deslizamientos ilimitados'
  },
  fr: {
    title: 'StorageSwipe',
    subtitle: 'Nettoyez votre photothèque',
    swipe: 'Balayer',
    categories: 'Catégories',
    delete: 'Supprimer',
    keep: 'Garder',
    photosRemaining: 'photos restantes',
    swipeInstructions: '💡 Balayez à gauche pour supprimer • Balayez à droite pour garder',
    confirmDelete: 'Confirmer la Suppression',
    screenshots: 'Captures',
    whatsapp: 'WhatsApp',
    camera: 'Appareil Photo',
    socialMedia: 'Réseaux Sociaux',
    videos: 'Vidéos',
    other: 'Autres',
    tapToView: 'Appuyez pour voir',
    deleteAll: 'Tout Supprimer',
    back: '← Retour',
    items: 'éléments',
    // Paywall
    unlockPremium: 'Débloquer StorageSwipe Premium',
    cleanUpPro: 'Nettoyez vos photos comme un pro',
    organizeCategories: 'Organiser par Catégories',
    bulkDelete: 'Suppression en Lot par Catégorie',  
    unlimitedProcessing: 'Traitement Illimité des Photos',
    noAds: 'Pas de Publicités à Vie',
    yearly: 'Annuel',
    monthly: 'Mensuel',
    lifetime: 'À Vie',
    bestValue: 'MEILLEURE VALEUR',
    save44: 'Économisez 44%',
    cancelAnytime: 'Annulez à tout moment',
    oneTimePayment: 'Paiement unique',
    freeTrialText: '• Essai gratuit de 3 jours • Annulez à tout moment • Paiement sécurisé',
    // Settings
    settings: 'Paramètres',
    language: 'Langue',
    selectLanguage: 'Sélectionner la Langue',
    // Free limits
    swipesRemaining: 'glissements restants',
    unlimitedSwipes: 'Glissements illimités'
  },
  ar: {
    title: 'StorageSwipe',
    subtitle: 'نظف مكتبة الصور الخاصة بك',
    swipe: 'اسحب',
    categories: 'التصنيفات',
    delete: 'حذف',
    keep: 'احتفظ',
    photosRemaining: 'صورة متبقية',
    swipeInstructions: '💡 اسحب يسارًا للحذف • اسحب يمينًا للاحتفاظ',
    confirmDelete: 'تأكيد الحذف',
    screenshots: 'لقطات الشاشة',
    whatsapp: 'واتساب',
    camera: 'الكاميرا',
    socialMedia: 'وسائل التواصل',
    videos: 'الفيديوهات',
    other: 'أخرى',
    tapToView: 'اضغط للعرض',
    deleteAll: 'حذف الكل',
    back: '← رجوع',
    items: 'عنصر',
    // Paywall
    unlockPremium: 'فتح StorageSwipe المميز',
    cleanUpPro: 'نظف صورك مثل المحترفين',
    organizeCategories: 'تنظيم حسب التصنيفات',
    bulkDelete: 'الحذف المجمع حسب التصنيف',
    unlimitedProcessing: 'معالجة صور غير محدودة',
    noAds: 'بلا إعلانات للأبد',
    yearly: 'سنوي',
    monthly: 'شهري',
    lifetime: 'مدى الحياة',
    bestValue: 'أفضل قيمة',
    save44: 'وفر 44%',
    cancelAnytime: 'إلغاء في أي وقت',
    oneTimePayment: 'دفعة واحدة',
    freeTrialText: '• تجربة مجانية 3 أيام • إلغاء في أي وقت • دفع آمن',
    // Settings
    settings: 'الإعدادات',
    language: 'اللغة',
    selectLanguage: 'اختر اللغة',
    // Free limits
    swipesRemaining: 'سحبة متبقية',
    unlimitedSwipes: 'سحبات غير محدودة'
  }
};

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPhotoUri, setCurrentPhotoUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSource, setVideoSource] = useState(null);
  const [viewMode, setViewMode] = useState('swipe'); // 'swipe', 'categories'
  const [categoryData, setCategoryData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState(null);
  const [categoryMediaView, setCategoryMediaView] = useState(null);
  const videoRef = useRef(null);
  
  // Paywall state
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // All users need premium - no free tier
  
  // Ad overlay system
  const [adVehicles, setAdVehicles] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const MAX_CONCURRENT_ADS = 2; // Maximum vehicles on screen at once
  
  // Animation values for swipe gestures
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPermissions();
    initializePurchases();
    loadLanguage();
    initializeAdSystem();
  }, []);

  // Helper function to get translated text
  const t = (key) => translations[currentLanguage][key] || translations.en[key];

  // Ad system configuration - using your custom images from assets/
  const AD_VEHICLES = [
    {
      id: 'spaceship_1',
      type: 'spaceship',
      image: require('./assets/spaceship.png'), // Your custom spaceship image
      lane: 1,
      speed: 8000,
      interval: 45000,
      banner: 'Nike - Just Do It',
      color: '#FF6B35',
      url: 'https://www.nike.com',
      hasThrottle: true // Enable throttle flames
    },
    {
      id: 'plane_1', 
      type: 'plane',
      image: require('./assets/plane.png'), // Your custom plane image
      lane: 2,
      speed: 9000,
      interval: 60000,
      banner: 'McDonald\'s - I\'m Lovin\' It',
      color: '#FFD700',
      url: 'https://www.mcdonalds.com',
      hasSmoke: true // Enable smoke trail
    },
    {
      id: 'drone_1',
      type: 'drone', 
      image: require('./assets/drone.png'), // Your custom drone image
      lane: 3,
      speed: 7500,
      interval: 75000,
      banner: 'Coca-Cola - Open Happiness',
      color: '#FF0000',
      url: 'https://www.coca-cola.com',
      hasRotor: true // Enable rotor blur effect
    },
    {
      id: 'helicopter_1',
      type: 'helicopter',
      image: require('./assets/helicopter.png'), // Your custom helicopter image
      lane: 4,
      speed: 10000,
      interval: 90000,
      banner: 'Apple - Think Different',
      color: '#007AFF',
      url: 'https://www.apple.com',
      hasRotor: true // Enable rotor blur effect
    }
  ];

  // Initialize ad system
  const initializeAdSystem = () => {
    // Start each vehicle's timer
    AD_VEHICLES.forEach(vehicle => {
      // Random initial delay to stagger appearances
      const initialDelay = Math.random() * 10000;
      
      setTimeout(() => {
        startVehicleLoop(vehicle);
      }, initialDelay);
    });
  };

  // Check if vehicle type already exists on screen
  const isDuplicateVehicle = (vehicleType) => {
    return activeAds.some(ad => ad.type === vehicleType);
  };

  // Check if lane is clear before spawning
  const isLaneClear = (lane, direction) => {
    return !activeAds.some(ad => 
      ad.lane === lane && 
      ad.direction === direction &&
      // Check if vehicle is still in spawn zone (within 300px of start)
      (direction === 'left-to-right' ? 
        ad.animatedValue._value < 300 : 
        ad.animatedValue._value > SCREEN_WIDTH - 300)
    );
  };

  // Start a vehicle's animation loop with traffic management
  const startVehicleLoop = (vehicle) => {
    const animate = () => {
      // Check if we've reached maximum concurrent ads
      if (activeAds.length >= MAX_CONCURRENT_ADS) {
        // Wait and try again when screen is less busy
        setTimeout(animate, 10000);
        return;
      }

      // 70% chance left-to-right, 30% chance right-to-left for variety
      const direction = Math.random() > 0.3 ? 'left-to-right' : 'right-to-left';
      
      // Only spawn if conditions are met:
      // 1. Lane is clear
      // 2. No duplicate vehicle type on screen
      // 3. Under max concurrent limit
      if (isLaneClear(vehicle.lane, direction) && !isDuplicateVehicle(vehicle.type)) {
        spawnVehicle(vehicle, direction);
      } else {
        // If conditions not met, try again in 8 seconds
        setTimeout(() => {
          if (isLaneClear(vehicle.lane, direction) && 
              !isDuplicateVehicle(vehicle.type) && 
              activeAds.length < MAX_CONCURRENT_ADS) {
            spawnVehicle(vehicle, direction);
          }
        }, 8000);
      }
      
      // Schedule next appearance
      setTimeout(animate, vehicle.interval);
    };
    animate();
  };

  // Spawn a single vehicle
  const spawnVehicle = (vehicle, direction = 'left-to-right') => {
    const vehicleId = `${vehicle.id}_${Date.now()}`;
    const laneHeight = 200 + (vehicle.lane * 120); // Much lower on screen, bigger spacing
    
    // Set start and end positions based on direction
    const isLeftToRight = direction === 'left-to-right';
    const startX = isLeftToRight ? -200 : SCREEN_WIDTH + 200;
    const endX = isLeftToRight ? SCREEN_WIDTH + 200 : -200;
    
    const animatedValue = new Animated.Value(startX);
    
    // Create animated values for effects
    const throttleFlicker = new Animated.Value(1);
    const smokeOpacity = new Animated.Value(1);
    const rotorSpin = new Animated.Value(0);
    
    const newVehicle = {
      ...vehicle,
      id: vehicleId,
      animatedValue,
      laneHeight,
      throttleFlicker,
      smokeOpacity,
      rotorSpin,
      direction,
      isFlipped: !isLeftToRight // Flip image for right-to-left flight
    };
    
    setActiveAds(prev => [...prev, newVehicle]);
    
    // Start effect animations
    if (vehicle.hasThrottle) {
      // Throttle flame flickering
      const flickerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(throttleFlicker, {
            toValue: 0.3,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(throttleFlicker, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
          })
        ])
      );
      flickerAnimation.start();
    }
    
    if (vehicle.hasSmoke) {
      // Smoke pulsing effect
      const smokeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(smokeOpacity, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(smokeOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ])
      );
      smokeAnimation.start();
    }
    
    if (vehicle.hasRotor) {
      // Rotor spinning
      const spinAnimation = Animated.loop(
        Animated.timing(rotorSpin, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      );
      spinAnimation.start();
    }
    
    // Animate across screen in the correct direction
    Animated.timing(animatedValue, {
      toValue: endX, // Exit off-screen (left or right depending on direction)
      duration: vehicle.speed,
      useNativeDriver: true
    }).start(() => {
      // Remove from active ads when animation completes
      setActiveAds(prev => prev.filter(ad => ad.id !== vehicleId));
    });
  };

  // Confetti state and effects
  const [confetti, setConfetti] = useState([]);
  const confettiId = useRef(0);

  // Generate realistic confetti burst with physics
  const createConfetti = (startX, startY) => {
    const particles = [];
    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98', '#F4A460', '#FF69B4', '#00CED1', '#FFD700', '#FF1493'];
    const shapes = ['square', 'circle', 'triangle', 'rectangle'];
    
    // Create 150 particles for an absolutely MASSIVE burst!
    for (let i = 0; i < 150; i++) {
      const id = confettiId.current++;
      
      // Random initial velocity and angle for explosion effect
      const angle = (Math.PI * 2 * i) / 150 + (Math.random() - 0.5) * 0.8;
      const velocity = Math.random() * 200 + 100; // Slower initial burst speed
      const gravity = 400; // Reduced gravity for slower fall
      const drag = 0.99; // Less air resistance
      
      const initialVelX = Math.cos(angle) * velocity;
      const initialVelY = Math.sin(angle) * velocity - 120; // Less upward bias for gentler arc
      
      const animatedValue = new Animated.ValueXY({ x: 0, y: 0 });
      const rotation = new Animated.Value(0);
      const opacity = new Animated.Value(1);
      const scale = new Animated.Value(Math.random() * 0.5 + 0.5);
      
      particles.push({
        id,
        animatedValue,
        rotation,
        opacity,
        scale,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: Math.random() * 12 + 8,
        initialVelX,
        initialVelY,
        gravity,
        drag
      });
      
      // Physics-based animation with rotation and realistic falling
      const duration = 4500 + Math.random() * 3000; // Much longer duration (4.5-7.5 seconds)
      
      // Calculate final position with physics
      const finalX = startX + initialVelX * (duration / 1000) * drag;
      const finalY = startY + initialVelY * (duration / 1000) + 0.5 * gravity * Math.pow(duration / 1000, 2);
      
      Animated.parallel([
        // Position with physics curve
        Animated.timing(animatedValue, {
          toValue: { x: finalX - startX, y: finalY - startY },
          duration: duration,
          useNativeDriver: true
        }),
        // Slower continuous rotation (gentle wobbling in air)
        Animated.loop(
          Animated.timing(rotation, {
            toValue: 1,
            duration: 1200 + Math.random() * 800, // Slower rotation
            useNativeDriver: true
          })
        ),
        // Fade out over time
        Animated.sequence([
          Animated.delay(duration * 0.6), // Stay visible for 60% of flight
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true
          })
        ]),
        // Gentler scale variation for flutter effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, {
              toValue: (Math.random() * 0.3 + 0.6) * 1.1, // Smaller scale variations
              duration: 600 + Math.random() * 400, // Slower scale changes
              useNativeDriver: true
            }),
            Animated.timing(scale, {
              toValue: Math.random() * 0.3 + 0.6,
              duration: 600 + Math.random() * 400,
              useNativeDriver: true
            })
          ])
        )
      ]).start(() => {
        // Remove particle when animation completes
        setConfetti(prev => prev.filter(p => p.id !== id));
      });
    }
    
    setConfetti(prev => [...prev, ...particles]);
  };

  // Handle ad banner click with confetti
  const handleAdClick = async (url, event) => {
    // Create confetti burst at click location
    const { pageX, pageY } = event.nativeEvent;
    createConfetti(pageX, pageY);
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  // Optimized photo loading function
  const loadPhotoUri = async (photo) => {
    if (!photo) return;
    
    try {
      if (photo.mediaType === 'video') {
        // For videos, get the full asset info to get localUri
        const assetInfo = await MediaLibrary.getAssetInfoAsync(photo);
        let videoUri = assetInfo.localUri || assetInfo.uri;
        
        // Clean the URI by removing the fragment
        if (videoUri.includes('#')) {
          videoUri = videoUri.split('#')[0];
        }
        
        setCurrentPhotoUri(videoUri);
        setVideoSource(videoUri);
      } else {
        // For photos, get the full asset info for better quality
        const assetInfo = await MediaLibrary.getAssetInfoAsync(photo);
        setCurrentPhotoUri(assetInfo.localUri || assetInfo.uri);
        setVideoSource(null);
      }
    } catch (error) {
      // Fallback to basic uri
      setCurrentPhotoUri(photo.uri);
      if (photo.mediaType === 'video') {
        setVideoSource(photo.uri);
      } else {
        setVideoSource(null);
      }
    }
  };

  // Load photo URI when index changes - ALL hooks must be before conditional returns
  useEffect(() => {
    if (photos.length > 0 && currentIndex < photos.length) {
      // Load current photo immediately
      loadPhotoUri(photos[currentIndex]);
      
      // Preload next photo for faster transitions
      if (currentIndex + 1 < photos.length) {
        setTimeout(() => {
          // Preload next photo asset info in background
          MediaLibrary.getAssetInfoAsync(photos[currentIndex + 1]).catch(() => {});
        }, 100);
      }
    }
  }, [currentIndex, photos]);

  // Initialize in-app purchases
  const initializePurchases = async () => {
    try {
      await InAppPurchases.connectAsync();
      await checkPremiumStatus();
    } catch (error) {
      console.log('Purchase initialization error:', error);
    }
  };

  // Check if user has premium
  const checkPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem('isPremium');
      if (premiumStatus === 'true') {
        setIsPremium(true);
      }
    } catch (error) {
      console.log('Error checking premium status:', error);
    }
  };

  // Load saved language
  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage && translations[savedLanguage]) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  // Change language
  const changeLanguage = async (languageCode) => {
    try {
      await AsyncStorage.setItem('appLanguage', languageCode);
      setCurrentLanguage(languageCode);
      setShowSettings(false);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };


  // Handle purchase
  const handlePurchase = async (productId) => {
    if (purchaseLoading) return;
    
    setPurchaseLoading(true);
    try {
      const result = await InAppPurchases.purchaseItemAsync(productId);
      
      if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
        await AsyncStorage.setItem('isPremium', 'true');
        setIsPremium(true);
        setShowPaywall(false);
        Alert.alert('Success!', 'Welcome to StorageSwipe Premium! 🎉\nEnjoy unlimited swipes and all premium features!');
      }
    } catch (error) {
      Alert.alert('Purchase Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Show paywall for non-premium users
  const triggerPaywall = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return true;
    }
    return false;
  };

  const checkPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      loadPhotos();
    }
  };

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // Load ALL photos and videos
      let allAssets = [];
      let hasNextPage = true;
      let endCursor = null;
      
      while (hasNextPage) {
        const { assets, endCursor: nextCursor, hasNextPage: hasMore } = await MediaLibrary.getAssetsAsync({
          first: 100, // Load 100 at a time
          after: endCursor,
          mediaType: ['photo', 'video'],
          sortBy: MediaLibrary.SortBy.creationTime,
        });
        
        allAssets = [...allAssets, ...assets];
        endCursor = nextCursor;
        hasNextPage = hasMore;
        
      }
      
      // For now, just get info for the current photo as needed
      setPhotos(allAssets);
      setCurrentIndex(0);
      
      const categories = categorizePhotos(allAssets);
      setCategoryData(categories);
      
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load photos: ' + error.message);
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (currentIndex < photos.length) {
      // Stop video if playing
      if (videoRef.current && photos[currentIndex].mediaType === 'video') {
        videoRef.current.pauseAsync();
      }
      setDeletedPhotos([...deletedPhotos, photos[currentIndex]]);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Preload next photo immediately for faster display
      if (nextIndex < photos.length) {
        loadPhotoUri(photos[nextIndex]);
      }
      
      resetAnimation();
    }
  };

  const handleKeep = () => {
    if (currentIndex < photos.length) {
      // Stop video if playing
      if (videoRef.current && photos[currentIndex].mediaType === 'video') {
        videoRef.current.pauseAsync();
      }
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Preload next photo immediately for faster display
      if (nextIndex < photos.length) {
        loadPhotoUri(photos[nextIndex]);
      }
      
      resetAnimation();
    }
  };

  const confirmDelete = async () => {
    if (deletedPhotos.length === 0) return;
    
    try {
      await MediaLibrary.deleteAssetsAsync(deletedPhotos);
      Alert.alert('Success', `Deleted ${deletedPhotos.length} photos`);
      setDeletedPhotos([]);
      loadPhotos();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete photos');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Checking permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.title}>Photo Access Required</Text>
          <Text style={styles.subtitle}>StorageSwipe needs access to your photos to help you clean up your gallery.</Text>
          <TouchableOpacity style={styles.button} onPress={checkPermissions}>
            <Text style={styles.buttonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  const renderCategoriesView = () => {
    if (!categoryData) return null;

    const categoryInfo = {
      screenshot: { emoji: '📱', label: 'Screenshots' },
      whatsapp: { emoji: '💬', label: 'WhatsApp' },
      camera: { emoji: '📷', label: 'Camera' },
      downloads: { emoji: '⬇️', label: 'Social Media' },
      video: { emoji: '🎥', label: 'Videos' },
      other: { emoji: '📁', label: 'Other' }
    };

    return (
      <>
        <Text style={styles.sectionTitle}>Photos by Category</Text>
        <View style={styles.categoryGrid}>
          {Object.entries(categoryData).map(([category, items]) => (
            items.length > 0 && (
              <TouchableOpacity
                key={category}
                style={styles.categoryCard}
                onPress={() => setCategoryMediaView({ category, items })}
              >
                <Text style={styles.categoryEmoji}>{categoryInfo[category].emoji}</Text>
                <Text style={styles.categoryLabel}>{categoryInfo[category].label}</Text>
                <Text style={styles.categoryCount}>{items.length} items</Text>
                <Text style={styles.categorySize}>
                  Tap to view
                </Text>
              </TouchableOpacity>
            )
          ))}
        </View>
      </>
    );
  };


  // Reset animation values when photo changes
  const resetAnimation = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true })
    ]).start();
  };

  // Handle swipe gestures with new Gesture API
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.setValue(event.translationX);
      rotate.setValue(event.translationX * 0.1); // Rotate based on swipe distance
    })
    .onEnd((event) => {
      const { translationX: tx, velocityX } = event;
      
      // Swipe left (delete) - threshold for swipe detection
      if (tx < -100 || velocityX < -500) {
        Animated.spring(translateX, { 
          toValue: -SCREEN_WIDTH, 
          useNativeDriver: true 
        }).start(() => handleDelete());
      }
      // Swipe right (keep) - threshold for swipe detection  
      else if (tx > 100 || velocityX > 500) {
        Animated.spring(translateX, { 
          toValue: SCREEN_WIDTH, 
          useNativeDriver: true 
        }).start(() => handleKeep());
      }
      // Snap back if not enough swipe
      else {
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotate, { toValue: 0, useNativeDriver: true })
        ]).start();
      }
    });

  // Animated style for the card
  const animatedCardStyle = {
    transform: [
      { translateX: translateX },
      { 
        rotate: rotate.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: ['-30deg', '0deg', '30deg'],
          extrapolate: 'clamp'
        })
      }
    ],
  };

  const currentPhoto = photos[currentIndex];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={styles.subtitle}>{t('subtitle')}</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Reset button for testing - remove in production */}
            {isPremium && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={async () => {
                  await AsyncStorage.removeItem('isPremium');
                  setIsPremium(false);
                  Alert.alert('Reset', 'Premium status cleared for testing');
                }}
              >
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'swipe' && styles.activeTab]} 
          onPress={() => setViewMode('swipe')}
        >
          <Text style={[styles.tabText, viewMode === 'swipe' && styles.activeTabText]}>{t('swipe')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'categories' && styles.activeTab]} 
          onPress={() => {
            if (triggerPaywall()) return; // Show paywall for non-premium users
            setViewMode('categories');
          }}
        >
          <Text style={[styles.tabText, viewMode === 'categories' && styles.activeTabText]}>
            {t('categories')} {!isPremium && '🔒'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading your media library...</Text>
            <Text style={styles.loadingSubtext}>This might take a moment for large libraries</Text>
          </View>
        ) : !isPremium ? (
          // Show paywall for all non-premium users immediately
          <View style={styles.paywallBlocked}>
            <Text style={styles.paywallBlockedTitle}>🔒 Premium Required</Text>
            <Text style={styles.paywallBlockedText}>
              StorageSwipe requires a premium subscription to clean up your photos
            </Text>
            <TouchableOpacity 
              style={styles.unlockButton}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.unlockButtonText}>Unlock Premium Features</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'swipe' && currentIndex < photos.length ? (
          <ScrollView contentContainerStyle={styles.content}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                {currentPhotoUri ? (
                  currentPhoto.mediaType === 'video' ? (
                    <View style={styles.videoContainer}>
                      <View style={[styles.photo, styles.videoPlaceholder]}>
                        <Text style={styles.videoIcon}>🎥</Text>
                      </View>
                      <View style={styles.videoOverlay}>
                        <Text style={styles.videoPlayIcon}>▶️</Text>
                        <Text style={styles.videoMessage}>Video preview</Text>
                        <Text style={styles.videoSubMessage}>{currentPhoto.duration ? `${Math.round(currentPhoto.duration)}s` : ''}</Text>
                      </View>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: currentPhotoUri }} 
                      style={styles.photo}
                    />
                  )
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <ActivityIndicator size="small" color="#999" />
                  </View>
                )}
                <Text style={styles.debugText}>
                  {currentPhoto.mediaType === 'video' ? '🎥 Video' : '📷 Photo'} {currentIndex + 1} of {photos.length}
                </Text>
              </Animated.View>
            </GestureDetector>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.buttonText}>{t('delete')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.keepButton]} onPress={handleKeep}>
                <Text style={styles.buttonText}>{t('keep')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.counter}>{photos.length - currentIndex} {t('photosRemaining')}</Text>
            
            <View style={styles.swipeInstructions}>
              <Text style={styles.swipeText}>{t('swipeInstructions')}</Text>
            </View>
          </ScrollView>
        ) : viewMode === 'categories' ? (
          <View style={styles.fullContainer}>
            {renderCategoriesView()}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No more photos to review!</Text>
            <TouchableOpacity style={styles.button} onPress={loadPhotos}>
              <Text style={styles.buttonText}>Load More Photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {deletedPhotos.length > 0 && (
          <TouchableOpacity style={styles.confirmButton} onPress={confirmDelete}>
            <Text style={styles.confirmButtonText}>
              {t('confirmDelete')} ({deletedPhotos.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Duplicate Selection Modal */}
      <Modal
        visible={selectedDuplicateGroup !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDuplicateGroup(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Photos to Keep</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedDuplicateGroup?.map((photo, index) => (
                <TouchableOpacity key={photo.id} style={styles.modalPhotoWrapper}>
                  {photo.mediaType === 'video' ? (
                    <View style={[styles.modalPhoto, styles.videoThumbnailSmall]}>
                      <Text style={styles.videoIconSmall}>🎥</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: photo.uri }} style={styles.modalPhoto} />
                  )}
                  <Text style={styles.modalPhotoLabel}>Copy {index + 1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={() => {
                  // Delete all but the first copy
                  const toDelete = selectedDuplicateGroup.slice(1);
                  setDeletedPhotos([...deletedPhotos, ...toDelete]);
                  setSelectedDuplicateGroup(null);
                }}
              >
                <Text style={styles.modalButtonText}>Keep First, Delete Rest</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setSelectedDuplicateGroup(null)}
              >
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={selectedCategory !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedCategory(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Delete all {selectedCategory?.items.length} items in {selectedCategory?.category}?
            </Text>
            <Text style={styles.modalSubtitle}>
              This will free up {selectedCategory && formatFileSize(
                selectedCategory.items.reduce((acc, item) => acc + (item.fileSize || 0), 0)
              )}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={() => {
                  setDeletedPhotos([...deletedPhotos, ...selectedCategory.items]);
                  setSelectedCategory(null);
                }}
              >
                <Text style={styles.modalButtonText}>Delete All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Media Viewer Modal */}
      <Modal
        visible={categoryMediaView !== null}
        animationType="slide"
        onRequestClose={() => setCategoryMediaView(null)}
      >
        <SafeAreaView style={styles.modalFullScreen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton} 
              onPress={() => setCategoryMediaView(null)}
            >
              <Text style={styles.modalBackText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {categoryMediaView?.category.toUpperCase()} ({categoryMediaView?.items.length} items)
            </Text>
            <TouchableOpacity 
              style={styles.modalDeleteAllButton}
              onPress={() => {
                setDeletedPhotos([...deletedPhotos, ...categoryMediaView.items]);
                setCategoryMediaView(null);
              }}
            >
              <Text style={styles.modalDeleteAllText}>Delete All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categoryMediaView?.items.filter(item => 
              !item.uri.includes('/T/TemporaryItems/') && 
              !item.uri.includes('NSIRD_screencaptureui')
            ) || []}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.mediaGridItem}
                onPress={() => {
                  // Toggle selection - add or remove from delete queue
                  if (deletedPhotos.includes(item)) {
                    // Remove from delete queue (uncheck)
                    setDeletedPhotos(deletedPhotos.filter(photo => photo.id !== item.id));
                  } else {
                    // Add to delete queue (check)
                    setDeletedPhotos([...deletedPhotos, item]);
                  }
                }}
              >
                {item.mediaType === 'video' ? (
                  <View style={[styles.mediaGridImage, styles.videoThumbnailSmall]}>
                    <Text style={styles.videoIconSmall}>🎥</Text>
                  </View>
                ) : (
                  <ExpoImage
                    source={{ uri: item.uri }}
                    style={styles.mediaGridImage}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hL+bhwAAAABJRU5ErkJggg==' }}
                  />
                )}
                {deletedPhotos.includes(item) && (
                  <View style={styles.selectedOverlay}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.mediaGrid}
          />
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity 
              style={styles.settingsClose}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.settingsCloseText}>← {t('back')}</Text>
            </TouchableOpacity>
            <Text style={styles.settingsTitle}>{t('settings')}</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <View style={styles.settingsContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>{t('language')}</Text>
              {languages.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === lang.code && styles.selectedLanguageOption
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    currentLanguage === lang.code && styles.selectedLanguageName
                  ]}>
                    {lang.name}
                  </Text>
                  {currentLanguage === lang.code && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <SafeAreaView style={styles.paywallContainer}>
          <View style={styles.paywallHeader}>
            <TouchableOpacity 
              style={styles.paywallClose}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.paywallCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.paywallContent}>
            <Text style={styles.paywallTitle}>Unlock StorageSwipe Premium</Text>
            <Text style={styles.paywallSubtitle}>Clean up your photos like a pro</Text>
            
            
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Organize by Categories</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🗂️</Text>
                <Text style={styles.featureText}>Bulk Delete by Category</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Unlimited Swipes & Processing</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🚫</Text>
                <Text style={styles.featureText}>No Ads Forever</Text>
              </View>
            </View>
            
            <View style={styles.pricingContainer}>
              <TouchableOpacity 
                style={[styles.pricingOption, styles.recommendedOption]}
                onPress={() => handlePurchase('storageswipe_yearly')}
                disabled={purchaseLoading}
              >
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>BEST VALUE</Text>
                </View>
                <Text style={[styles.pricingTitle, {color: 'white'}]}>Yearly</Text>
                <Text style={[styles.pricingPrice, {color: 'white'}]}>$19.99/year</Text>
                <Text style={[styles.pricingSubtext, {color: '#E6F3FF'}]}>Save 44%</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.pricingOption}
                onPress={() => handlePurchase('storageswipe_monthly')}
                disabled={purchaseLoading}
              >
                <Text style={styles.pricingTitle}>Monthly</Text>
                <Text style={styles.pricingPrice}>$2.99/month</Text>
                <Text style={styles.pricingSubtext}>Cancel anytime</Text>
              </TouchableOpacity>
              
            </View>
            
            {purchaseLoading && (
              <ActivityIndicator size="large" color="#007AFF" style={styles.purchaseLoader} />
            )}
            
            <Text style={styles.paywallFooter}>
              • 3-day free trial • Cancel anytime • Secure payment
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Confetti Effects */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confetti.map(particle => (
          <Animated.View
            key={particle.id}
            style={[
              styles.confettiParticle,
              {
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.animatedValue.x },
                  { translateY: particle.animatedValue.y },
                  { scale: particle.scale },
                  {
                    rotate: particle.rotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ]
              }
            ]}
          >
            {particle.shape === 'square' && (
              <View style={[
                styles.confettiSquare,
                { backgroundColor: particle.color, width: particle.size, height: particle.size }
              ]} />
            )}
            {particle.shape === 'circle' && (
              <View style={[
                styles.confettiCircle,
                { 
                  backgroundColor: particle.color, 
                  width: particle.size, 
                  height: particle.size,
                  borderRadius: particle.size / 2
                }
              ]} />
            )}
            {particle.shape === 'triangle' && (
              <View style={[
                styles.confettiTriangle,
                { 
                  borderBottomColor: particle.color,
                  borderBottomWidth: particle.size,
                  borderLeftWidth: particle.size / 2,
                  borderRightWidth: particle.size / 2
                }
              ]} />
            )}
            {particle.shape === 'rectangle' && (
              <View style={[
                styles.confettiRectangle,
                { 
                  backgroundColor: particle.color, 
                  width: particle.size * 1.5, 
                  height: particle.size * 0.6
                }
              ]} />
            )}
          </Animated.View>
        ))}
      </View>

      {/* Intelligent Ad Overlay System */}
      <View style={styles.adOverlay} pointerEvents="box-none">
        {activeAds.map(vehicle => (
          <Animated.View
            key={vehicle.id}
            style={[
              styles.adVehicle,
              {
                top: vehicle.laneHeight,
                transform: [{ translateX: vehicle.animatedValue }]
              }
            ]}
          >
            <View style={styles.vehicleContainer}>
              <View style={styles.vehicleWrapper}>
                {/* Vehicle with effects */}
                <View style={styles.vehicleWithEffects}>
                  {/* Animated Throttle flames for spaceship */}
                  {vehicle.hasThrottle && (
                    <Animated.View 
                      style={[
                        vehicle.isFlipped ? styles.throttleContainerFlipped : styles.throttleContainer,
                        { opacity: vehicle.throttleFlicker }
                      ]}
                    >
                      <View style={styles.flameParticle1} />
                      <View style={styles.flameParticle2} />
                      <View style={styles.flameParticle3} />
                    </Animated.View>
                  )}
                  
                  {/* Animated Smoke trail for plane */}
                  {vehicle.hasSmoke && (
                    <Animated.View 
                      style={[
                        vehicle.isFlipped ? styles.smokeContainerFlipped : styles.smokeContainer,
                        { opacity: vehicle.smokeOpacity }
                      ]}
                    >
                      <View style={styles.smokePuff1} />
                      <View style={styles.smokePuff2} />
                      <View style={styles.smokePuff3} />
                    </Animated.View>
                  )}
                  
                  {/* Vehicle - Image with direction flip */}
                  {vehicle.image ? (
                    <Image 
                      source={vehicle.image} 
                      style={[
                        styles.vehicleImage,
                        vehicle.isFlipped && { transform: [{ scaleX: -1 }] }
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={[
                      styles.vehicleEmoji,
                      vehicle.isFlipped && { transform: [{ scaleX: -1 }] }
                    ]}>
                      {vehicle.emoji}
                    </Text>
                  )}
                  
                  {/* Animated Rotor blur effect for helicopters/drones */}
                  {vehicle.hasRotor && (
                    <Animated.View 
                      style={[
                        styles.rotorEffect,
                        {
                          transform: [{
                            rotate: vehicle.rotorSpin.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                          }]
                        }
                      ]}
                    >
                      <View style={styles.rotorBlade1} />
                      <View style={styles.rotorBlade2} />
                    </Animated.View>
                  )}
                </View>
                
                {/* Clickable Ad banner hanging below vehicle */}
                <TouchableOpacity 
                  style={[styles.adBanner, { backgroundColor: vehicle.color }]}
                  onPress={(event) => handleAdClick(vehicle.url, event)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adBannerText}>{vehicle.banner}</Text>
                  <Text style={styles.tapHint}>👆 Tap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: SCREEN_WIDTH * 0.9,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  keepButton: {
    backgroundColor: '#44bb44',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counter: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  debugText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  playButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  videoMessage: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  videoSubMessage: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  videoPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 80,
    opacity: 0.3,
  },
  videoThumbnailSmall: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIconSmall: {
    fontSize: 30,
    opacity: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  fullContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  duplicateGroup: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  duplicatePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duplicateThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  duplicateInfo: {
    marginLeft: 15,
    flex: 1,
  },
  duplicateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  duplicateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  duplicateSavings: {
    fontSize: 14,
    color: '#44bb44',
    marginTop: 2,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  categorySize: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalPhotoWrapper: {
    marginRight: 10,
    alignItems: 'center',
  },
  modalPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 5,
  },
  modalPhotoLabel: {
    fontSize: 12,
    color: '#666',
  },
  modalButtons: {
    marginTop: 20,
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalDeleteButton: {
    backgroundColor: '#ff4444',
  },
  modalCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalBackButton: {
    padding: 5,
  },
  modalBackText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalDeleteAllButton: {
    padding: 5,
  },
  modalDeleteAllText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
  },
  mediaGrid: {
    padding: 2,
  },
  mediaGridItem: {
    flex: 1,
    margin: 1,
    aspectRatio: 1,
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#44bb44',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  selectedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  duplicateGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  duplicateScrollView: {
    marginBottom: 10,
  },
  duplicateImageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  duplicateImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  duplicateImageLabel: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  duplicateMoreIndicator: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  duplicateMoreText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectAllButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  imagePlaceholderText: {
    fontSize: 20,
    marginBottom: 2,
  },
  imagePlaceholderLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  duplicateImageNumber: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  swipeCounter: {
    marginBottom: 15,
    alignItems: 'center',
  },
  swipeCountText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  swipeCountWarning: {
    color: '#ff6b35',
  },
  premiumText: {
    fontSize: 16,
    color: '#44bb44',
    fontWeight: '600',
  },
  swipeInstructions: {
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Paywall styles
  paywallContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  paywallHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  paywallClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallCloseText: {
    fontSize: 16,
    color: '#666',
  },
  paywallContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  paywallTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  paywallSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  limitReachedBanner: {
    backgroundColor: '#ffe6e6',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  limitReachedText: {
    fontSize: 16,
    color: '#cc0000',
    textAlign: 'center',
    fontWeight: '600',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pricingContainer: {
    width: '100%',
    marginBottom: 30,
  },
  pricingOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  recommendedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  pricingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  purchaseLoader: {
    marginVertical: 20,
  },
  paywallFooter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Header styles
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  resetText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  // Settings modal styles
  settingsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsClose: {
    width: 60,
  },
  settingsCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedLanguageOption: {
    backgroundColor: '#007AFF',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedLanguageName: {
    color: 'white',
    fontWeight: '600',
  },
  selectedCheck: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  // Paywall blocked screen
  paywallBlocked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8f9fa',
  },
  paywallBlockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  paywallBlockedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Confetti Effects
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  confettiParticle: {
    position: 'absolute',
    zIndex: 2001,
  },
  confettiSquare: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  confettiCircle: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  confettiTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  confettiRectangle: {
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Intelligent Ad Overlay System
  adOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  adVehicle: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1001,
  },
  vehicleContainer: {
    alignItems: 'center',
  },
  vehicleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleWithEffects: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vehicleImage: {
    width: 60,
    height: 60,
    zIndex: 2,
  },
  vehicleEmoji: {
    fontSize: 48,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    zIndex: 2,
  },
  // Real Throttle flame effects for spaceship
  throttleContainer: {
    position: 'absolute',
    left: -30,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  throttleContainerFlipped: {
    position: 'absolute',
    right: -30, // Flames appear behind when going right-to-left
    flexDirection: 'row-reverse', // Reverse flame order
    alignItems: 'center',
    zIndex: 1,
  },
  flameParticle1: {
    width: 12,
    height: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    marginLeft: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  flameParticle2: {
    width: 8,
    height: 15,
    backgroundColor: '#FF4500',
    borderRadius: 4,
    marginLeft: -2,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  flameParticle3: {
    width: 6,
    height: 10,
    backgroundColor: '#FFD700',
    borderRadius: 3,
    marginLeft: -1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  // Real Smoke effects for plane
  smokeContainer: {
    position: 'absolute',
    left: -45,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  smokeContainerFlipped: {
    position: 'absolute',
    right: -45, // Smoke appears behind when going right-to-left
    flexDirection: 'row-reverse', // Reverse smoke puff order
    alignItems: 'center',
    zIndex: 1,
  },
  smokePuff1: {
    width: 20,
    height: 15,
    backgroundColor: 'rgba(150,150,150,0.7)',
    borderRadius: 10,
    marginLeft: 3,
  },
  smokePuff2: {
    width: 16,
    height: 12,
    backgroundColor: 'rgba(180,180,180,0.5)',
    borderRadius: 8,
    marginLeft: -3,
  },
  smokePuff3: {
    width: 12,
    height: 9,
    backgroundColor: 'rgba(200,200,200,0.3)',
    borderRadius: 6,
    marginLeft: -2,
  },
  // Real Rotor effects for helicopters/drones
  rotorEffect: {
    position: 'absolute',
    top: -15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    width: 60,
    height: 60,
  },
  rotorBlade1: {
    position: 'absolute',
    width: 50,
    height: 2,
    backgroundColor: 'rgba(100,100,100,0.8)',
    borderRadius: 1,
  },
  rotorBlade2: {
    position: 'absolute',
    width: 2,
    height: 50,
    backgroundColor: 'rgba(100,100,100,0.8)',
    borderRadius: 1,
  },
  adBanner: {
    paddingHorizontal: 20, // Bigger banner
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 150, // Ensure banner is substantial
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  adBannerText: {
    color: 'white',
    fontSize: 16, // Bigger text
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
