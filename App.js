import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, Alert, Dimensions, ActivityIndicator, Modal, FlatList, Animated } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';
import { categorizePhotos, formatFileSize } from './utils/duplicateDetection';
import { Image as ExpoImage } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  
  // Animation values for swipe gestures
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPermissions();
  }, []);

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
        <Text style={styles.title}>StorageSwipe</Text>
        <Text style={styles.subtitle}>Clean up your photo library</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'swipe' && styles.activeTab]} 
          onPress={() => setViewMode('swipe')}
        >
          <Text style={[styles.tabText, viewMode === 'swipe' && styles.activeTabText]}>Swipe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'categories' && styles.activeTab]} 
          onPress={() => setViewMode('categories')}
        >
          <Text style={[styles.tabText, viewMode === 'categories' && styles.activeTabText]}>Categories</Text>
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
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.keepButton]} onPress={handleKeep}>
                <Text style={styles.buttonText}>Keep</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.counter}>{photos.length - currentIndex} photos remaining</Text>
            
            <View style={styles.swipeInstructions}>
              <Text style={styles.swipeText}>💡 Swipe left to delete • Swipe right to keep</Text>
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
              Confirm Delete ({deletedPhotos.length} photos)
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
});
