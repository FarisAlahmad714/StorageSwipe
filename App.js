import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, Alert, Dimensions, ActivityIndicator } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPhotoUri, setCurrentPhotoUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Video player for current video
  const player = useVideoPlayer(currentPhotoUri, (player) => {
    if (photos[currentIndex]?.mediaType === 'video' && currentPhotoUri) {
      player.loop = true;
      player.volume = 1;
    }
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  // Load photo URI when index changes - ALL hooks must be before conditional returns
  useEffect(() => {
    const loadCurrentPhotoUri = async () => {
      const photo = photos[currentIndex];
      if (photo) {
        try {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(photo);
          setCurrentPhotoUri(assetInfo.localUri || assetInfo.uri);
        } catch (error) {
          console.error('Error loading photo URI:', error);
        }
      }
    };
    
    if (photos.length > 0 && currentIndex < photos.length) {
      loadCurrentPhotoUri();
    }
  }, [currentIndex, photos]);

  // Monitor video player state
  useEffect(() => {
    if (player) {
      setIsPlaying(player.playing);
    }
  }, [player?.playing]);

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
        
        // Update loading message
        if (allAssets.length % 500 === 0) {
          console.log(`Loading media library: ${allAssets.length} items...`);
        }
      }
      
      console.log(`✓ Loaded ${allAssets.length} photos and videos`);
      
      // For now, just get info for the current photo as needed
      setPhotos(allAssets);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos: ' + error.message);
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (currentIndex < photos.length) {
      // Stop video if playing
      if (player && photos[currentIndex].mediaType === 'video') {
        player.pause();
      }
      setDeletedPhotos([...deletedPhotos, photos[currentIndex]]);
      setCurrentPhotoUri(null); // Clear current photo
      setIsPlaying(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeep = () => {
    if (currentIndex < photos.length) {
      // Stop video if playing
      if (player && photos[currentIndex].mediaType === 'video') {
        player.pause();
      }
      setCurrentPhotoUri(null); // Clear current photo
      setIsPlaying(false);
      setCurrentIndex(currentIndex + 1);
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

  const currentPhoto = photos[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>StorageSwipe</Text>
        <Text style={styles.subtitle}>Swipe through your photos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading your media library...</Text>
            <Text style={styles.loadingSubtext}>This might take a moment for large libraries</Text>
          </View>
        ) : currentIndex < photos.length ? (
          <>
            <View style={styles.card}>
              {currentPhotoUri ? (
                currentPhoto.mediaType === 'video' ? (
                  <VideoView 
                    player={player}
                    style={styles.photo}
                    contentFit="cover"
                    nativeControls={false}
                  />
                ) : (
                  <Image 
                    source={{ uri: currentPhotoUri }} 
                    style={styles.photo}
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
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
              {currentPhoto.mediaType === 'video' && currentPhotoUri && player && (
                <TouchableOpacity 
                  style={styles.playButton} 
                  onPress={() => {
                    if (player.playing) {
                      player.pause();
                      setIsPlaying(false);
                    } else {
                      player.play();
                      setIsPlaying(true);
                    }
                  }}
                >
                  <Text style={styles.playButtonText}>{isPlaying ? '⏸️ Pause' : '▶️ Play'}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.keepButton]} onPress={handleKeep}>
                <Text style={styles.buttonText}>Keep</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.counter}>{photos.length - currentIndex} photos remaining</Text>
          </>
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
      </ScrollView>
    </SafeAreaView>
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
});
