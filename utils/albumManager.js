import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_ALBUMS_KEY = 'storageswipe_custom_albums';

// Default system folders to display - reduced for cleaner UI
export const DEFAULT_FOLDERS = [
  { id: 'camera', name: 'Camera', icon: '📷', isSystem: true },
  { id: 'favorites', name: 'Favorites', icon: '⭐', isSystem: true },
  { id: 'screenshots', name: 'Screenshots', icon: '📱', isSystem: true },
  { id: 'work', name: 'Work', icon: '💼', isCustom: true },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', isCustom: true },
];

// Album Manager Class
export class AlbumManager {
  static async getCustomAlbums() {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_ALBUMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading custom albums:', error);
      return [];
    }
  }

  static async saveCustomAlbums(albums) {
    try {
      await AsyncStorage.setItem(CUSTOM_ALBUMS_KEY, JSON.stringify(albums));
    } catch (error) {
      console.error('Error saving custom albums:', error);
    }
  }

  static async getAllFolders() {
    const customAlbums = await this.getCustomAlbums();
    
    // Get actual album counts from MediaLibrary
    const folders = await Promise.all(
      [...DEFAULT_FOLDERS, ...customAlbums].map(async (folder) => {
        try {
          const album = await MediaLibrary.getAlbumAsync(folder.name);
          return {
            ...folder,
            count: album ? album.assetCount : 0,
            albumId: album?.id
          };
        } catch (error) {
          return { ...folder, count: 0 };
        }
      })
    );

    // Add the "New Folder" option
    folders.push({
      id: 'new',
      name: 'New',
      icon: '➕',
      isNew: true,
      count: 0
    });

    return folders;
  }
  
  static async getExistingAlbums() {
    try {
      // Get all albums from the device
      const albums = await MediaLibrary.getAlbumsAsync();
      return albums.map(album => ({
        id: album.id,
        name: album.title,
        count: album.assetCount,
        type: album.type,
        isSystem: true
      }));
    } catch (error) {
      console.error('Error getting existing albums:', error);
      return [];
    }
  }

  static async createAlbum(name, icon = '📁') {
    try {
      // Check if album already exists
      const existing = await MediaLibrary.getAlbumAsync(name);
      if (existing) {
        return { success: false, error: 'Album already exists' };
      }

      // Save to custom albums
      const customAlbums = await this.getCustomAlbums();
      const newAlbum = {
        id: `custom_${Date.now()}`,
        name,
        icon,
        isCustom: true
      };
      
      customAlbums.push(newAlbum);
      await this.saveCustomAlbums(customAlbums);

      return { success: true, album: newAlbum };
    } catch (error) {
      console.error('Error creating album:', error);
      return { success: false, error: error.message };
    }
  }

  static async addAssetToAlbum(asset, albumName) {
    try {
      let album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (!album) {
        // Create album with the asset
        album = await MediaLibrary.createAlbumAsync(albumName, asset);
        return { success: true, created: true };
      } else {
        // Add asset to existing album
        await MediaLibrary.addAssetsToAlbumAsync([asset], album);
        return { success: true, created: false };
      }
    } catch (error) {
      console.error('Error adding asset to album:', error);
      return { success: false, error: error.message };
    }
  }

  static async removeAssetFromAlbum(asset, albumName) {
    try {
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album) {
        await MediaLibrary.removeAssetsFromAlbumAsync([asset], album);
        return { success: true };
      }
      return { success: false, error: 'Album not found' };
    } catch (error) {
      console.error('Error removing asset from album:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCustomAlbum(albumId) {
    try {
      const customAlbums = await this.getCustomAlbums();
      const filtered = customAlbums.filter(a => a.id !== albumId);
      await this.saveCustomAlbums(filtered);
      return { success: true };
    } catch (error) {
      console.error('Error deleting custom album:', error);
      return { success: false, error: error.message };
    }
  }

  static async renameAlbum(albumId, newName) {
    try {
      const customAlbums = await this.getCustomAlbums();
      const album = customAlbums.find(a => a.id === albumId);
      
      if (album) {
        album.name = newName;
        await this.saveCustomAlbums(customAlbums);
        return { success: true };
      }
      
      return { success: false, error: 'Album not found' };
    } catch (error) {
      console.error('Error renaming album:', error);
      return { success: false, error: error.message };
    }
  }
}

// Helper function to determine which folder a photo belongs to based on its path
export const detectPhotoFolder = (photo) => {
  const uri = photo.uri.toLowerCase();
  
  if (uri.includes('screenshot')) return 'screenshots';
  if (uri.includes('whatsapp')) return 'whatsapp';
  if (uri.includes('dcim') || uri.includes('camera')) return 'camera';
  if (uri.includes('download')) return 'downloads';
  
  return null;
};