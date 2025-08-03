import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FolderNode = ({ 
  folder, 
  position, 
  isActive, 
  isDragging,
  onLayout,
  draggedPhotoPosition,
  onLongPress 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Calculate distance from dragged photo
  useEffect(() => {
    if (isDragging && draggedPhotoPosition) {
      const distance = Math.sqrt(
        Math.pow(draggedPhotoPosition.x - position.x, 2) + 
        Math.pow(draggedPhotoPosition.y - position.y, 2)
      );
      
      // Activate if within 100 pixels from touch point
      const isNear = distance < 100;
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: isNear ? 1.3 : 1,
          tension: 40,
          friction: 3,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: isNear ? 1 : 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();

      // Pulse effect when very close
      if (isNear && distance < 60) { // Pulse when closer
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 400,
              useNativeDriver: true
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true
            })
          ])
        ).start();
      } else {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
      }
    } else {
      // Reset when not dragging
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
      pulseAnim.setValue(1);
    }
  }, [isDragging, draggedPhotoPosition, position]);

  const animatedStyle = {
    transform: [
      { scale: Animated.multiply(scaleAnim, pulseAnim) }
    ]
  };

  const glowStyle = {
    opacity: glowAnim
  };

  const handleLongPress = () => {
    if (!folder.isNew && onLongPress) {
      Alert.alert(
        'Delete Folder',
        `Remove "${folder.name}" from quick access?\n\nThis won't delete photos, just removes the folder shortcut.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => onLongPress(folder)
          }
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
      disabled={isDragging} // Disable touch when dragging
    >
      <Animated.View 
        style={[styles.container, animatedStyle]}
        onLayout={onLayout}
        pointerEvents={isDragging ? 'none' : 'auto'} // Allow drag pass-through
      >
      {/* Glow effect */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
          style={styles.glow}
        />
      </Animated.View>

      {/* Folder icon container */}
      <View style={[
        styles.folderContainer,
        folder.isNew && styles.newFolderContainer,
        isActive && styles.activeContainer
      ]}>
        <Text style={styles.folderIcon}>
          {folder.isNew ? '➕' : folder.icon || '📁'}
        </Text>
      </View>

      {/* Folder name */}
      <Text style={[
        styles.folderName,
        folder.isNew && styles.newFolderName
      ]} numberOfLines={1}>
        {folder.name}
      </Text>

      {/* Item count badge */}
      {!folder.isNew && folder.count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{folder.count}</Text>
        </View>
      )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    margin: 5,
  },
  glowContainer: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  folderContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  newFolderContainer: {
    backgroundColor: '#f0f0f0',
    borderStyle: 'dashed',
    borderColor: '#999',
  },
  activeContainer: {
    borderColor: '#007AFF',
    borderWidth: 3,
    backgroundColor: '#E6F3FF',
  },
  folderIcon: {
    fontSize: 28,
  },
  folderName: {
    marginTop: 5,
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  newFolderName: {
    color: '#666',
    fontStyle: 'italic',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default FolderNode;