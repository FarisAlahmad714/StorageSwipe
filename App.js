import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, Alert, Dimensions, ActivityIndicator, Modal, FlatList, Animated } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';
import { categorizePhotos, formatFileSize } from './utils/duplicateDetection';
import { Image as ExpoImage } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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
    selectLanguage: 'Select Language'
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
    selectLanguage: 'Seleccionar Idioma'
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
    selectLanguage: 'Sélectionner la Langue'
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
    selectLanguage: 'اختر اللغة'
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
  
  // Free user limits
  const [swipeCount, setSwipeCount] = useState(0);
  const FREE_SWIPE_LIMIT = 20; // Free users get 20 swipes
  
  // Animation values for swipe gestures
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPermissions();
    initializePurchases();
    loadLanguage();
    loadSwipeCount();
  }, []);

  // Helper function to get translated text
  const t = (key) => translations[currentLanguage][key] || translations.en[key];

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

  // Load saved swipe count
  const loadSwipeCount = async () => {
    try {
      const savedCount = await AsyncStorage.getItem('swipeCount');
      if (savedCount) {
        setSwipeCount(parseInt(savedCount));
      }
    } catch (error) {
      console.log('Error loading swipe count:', error);
    }
  };

  // Save swipe count
  const saveSwipeCount = async (count) => {
    try {
      await AsyncStorage.setItem('swipeCount', count.toString());
      setSwipeCount(count);
    } catch (error) {
      console.log('Error saving swipe count:', error);
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
    // Check swipe limit for free users
    if (!isPremium && swipeCount >= FREE_SWIPE_LIMIT) {
      triggerPaywall();
      return;
    }

    if (currentIndex < photos.length) {
      // Stop video if playing
      if (videoRef.current && photos[currentIndex].mediaType === 'video') {
        videoRef.current.pauseAsync();
      }
      setDeletedPhotos([...deletedPhotos, photos[currentIndex]]);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Increment swipe count for free users
      if (!isPremium) {
        saveSwipeCount(swipeCount + 1);
      }
      
      // Preload next photo immediately for faster display
      if (nextIndex < photos.length) {
        loadPhotoUri(photos[nextIndex]);
      }
      
      resetAnimation();
    }
  };

  const handleKeep = () => {
    // Check swipe limit for free users
    if (!isPremium && swipeCount >= FREE_SWIPE_LIMIT) {
      triggerPaywall();
      return;
    }

    if (currentIndex < photos.length) {
      // Stop video if playing
      if (videoRef.current && photos[currentIndex].mediaType === 'video') {
        videoRef.current.pauseAsync();
      }
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Increment swipe count for free users
      if (!isPremium) {
        saveSwipeCount(swipeCount + 1);
      }
      
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
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
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
                <Text style={styles.featureText}>Unlimited Photo Processing</Text>
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
              
              <TouchableOpacity 
                style={styles.pricingOption}
                onPress={() => handlePurchase('storageswipe_lifetime')}
                disabled={purchaseLoading}
              >
                <Text style={styles.pricingTitle}>Lifetime</Text>
                <Text style={styles.pricingPrice}>$39.99</Text>
                <Text style={styles.pricingSubtext}>One-time payment</Text>
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
    marginBottom: 40,
    textAlign: 'center',
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
});
