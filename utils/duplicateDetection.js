import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';

// Fast duplicate detection using file properties instead of image processing
const createFastHash = (photo) => {
  // Use file size + dimensions + filename as hash - much faster than image processing
  const filename = (photo.filename || '').replace(/\.(jpg|jpeg|png|heic)$/i, '');
  return `${photo.fileSize || 0}_${photo.width}_${photo.height}_${filename.slice(-10)}`;
};

export const findDuplicates = async (photos) => {
  console.log(`🔍 Fast scanning ${photos.length} photos...`);
  
  const hashGroups = {};
  
  // Fast processing - no batches needed
  photos.forEach(photo => {
    if (photo.mediaType === 'video') return; // Skip videos
    
    const hash = createFastHash(photo);
    
    if (!hashGroups[hash]) {
      hashGroups[hash] = [];
    }
    hashGroups[hash].push(photo);
  });
  
  // Find duplicates
  const actualDuplicates = {};
  let totalDuplicateCount = 0;
  
  Object.entries(hashGroups).forEach(([hash, group]) => {
    if (group.length > 1) {
      // Sort by creation time
      group.sort((a, b) => a.creationTime - b.creationTime);
      actualDuplicates[hash] = group;
      totalDuplicateCount += group.length - 1;
    }
  });
  
  console.log(`✅ Found ${Object.keys(actualDuplicates).length} groups with ${totalDuplicateCount} duplicates`);
  
  return {
    processedPhotos: photos,
    duplicateGroups: actualDuplicates,
    totalDuplicates: totalDuplicateCount
  };
};

export const getCategoryFromPhoto = (photo) => {
  const filename = photo.filename?.toLowerCase() || '';
  const uri = photo.uri?.toLowerCase() || '';
  const albumId = photo.albumId?.toLowerCase() || '';
  
  
  // Videos first (highest priority)
  if (photo.mediaType === 'video') {
    return 'video';
  }
  
  // Screenshot detection - iOS patterns
  if (filename.includes('screenshot') || 
      filename.includes('screen shot') ||
      filename.match(/^screenshot\s/i) ||
      filename.match(/^img_[0-9]{4,5}\.png$/i) || // iOS screenshots are often PNG
      filename.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}.*\.png$/i) || // Date-based PNG
      (photo.width === 1170 && photo.height === 2532) || // iPhone 12/13/14 Pro
      (photo.width === 1179 && photo.height === 2556) || // iPhone 14 Pro Max
      (photo.width === 1290 && photo.height === 2796) || // iPhone 15 Pro Max
      (photo.width === 1125 && photo.height === 2436) || // iPhone X/XS/11 Pro
      (photo.width === 828 && photo.height === 1792)) { // iPhone XR/11
    return 'screenshot';
  }
  
  // Android screenshot patterns
  if (filename.match(/^screenshot[-_][0-9]/i) ||
      filename.match(/^screen[-_][0-9]/i)) {
    return 'screenshot';
  }
  
  // WhatsApp media - check multiple indicators
  if (uri.includes('whatsapp') || 
      uri.includes('group.net.whatsapp') ||
      filename.includes('whatsapp') ||
      albumId.includes('whatsapp') ||
      filename.match(/^img-[0-9]{8}-wa[0-9]{4}/i) || // WhatsApp pattern
      filename.match(/^whatsapp[-_]/i) ||
      filename.match(/^wa[0-9]{4}/i) ||
      filename.match(/^ptt-[0-9]/i) || // WhatsApp voice notes 
      (uri.includes('group containers') && uri.includes('whatsapp'))) {
    return 'whatsapp';
  }
  
  // Instagram/Social Media - look for specific patterns
  if (uri.includes('instagram') || 
      filename.includes('instagram') ||
      albumId.includes('instagram') ||
      filename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i) || // Instagram UUID pattern
      filename.match(/^[0-9]{13,}_[0-9]/i) || // Instagram timestamp pattern
      (uri.includes('group containers') && uri.includes('instagram')) ||
      filename.match(/^img_[0-9]{4}_[0-9]{6}_[0-9]{3}/i)) { // Instagram saved pattern
    return 'downloads';
  }
  
  // Snapchat
  if (uri.includes('snapchat') || 
      filename.includes('snapchat') ||
      (uri.includes('group containers') && uri.includes('snapchat'))) {
    return 'downloads';
  }
  
  // TikTok
  if (uri.includes('tiktok') || 
      filename.includes('tiktok') ||
      filename.match(/^[0-9]{19}/i) || // TikTok video ID pattern
      (uri.includes('group containers') && uri.includes('tiktok'))) {
    return 'downloads';
  }
  
  // Downloads/Saved images
  if (uri.includes('download') || 
      uri.includes('downloads') ||
      albumId.includes('download') ||
      filename.match(/^download/i) ||
      filename.match(/^image[0-9]+\.(jpg|jpeg|png)$/i) || // Generic downloaded images
      filename.match(/^[0-9a-f]{32}\.(jpg|jpeg|png)$/i)) { // Hash-based filenames
    return 'downloads';
  }
  
  // Camera photos - various patterns
  if (filename.match(/^img_[0-9]{4,}\.jpg$/i) || // iOS camera
      filename.match(/^dsc[0-9]{4,}/i) || // Digital camera
      filename.match(/^[0-9]{8}_[0-9]{6}\.jpg$/i) || // Date_time pattern
      filename.match(/^photo_[0-9]/i) ||
      filename.match(/^cam[0-9]/i)) {
    return 'camera';
  }
  
  return 'other';
};

export const categorizePhotos = (photos) => {
  const categories = {
    screenshot: [],
    whatsapp: [],
    camera: [],
    downloads: [],
    video: [],
    other: []
  };
  
  // Filter out temporary files that cause crashes
  const validPhotos = photos.filter(photo => 
    !photo.uri.includes('/T/TemporaryItems/') && 
    !photo.uri.includes('NSIRD_screencaptureui') &&
    !photo.uri.includes('/var/folders/') // Exclude all temp folder files
  );
  
  validPhotos.forEach(photo => {
    const category = getCategoryFromPhoto(photo);
    categories[category].push(photo);
  });
  
  return categories;
};

export const getStorageStats = (photos) => {
  const stats = {
    totalSize: 0,
    photoCount: 0,
    videoCount: 0,
    byCategory: {},
    largeFiles: [] // Files over 50MB
  };
  
  const categories = categorizePhotos(photos);
  
  photos.forEach(photo => {
    const size = photo.fileSize || 0;
    stats.totalSize += size;
    
    if (photo.mediaType === 'video') {
      stats.videoCount++;
    } else {
      stats.photoCount++;
    }
    
    if (size > 50 * 1024 * 1024) { // 50MB
      stats.largeFiles.push({
        ...photo,
        readableSize: formatFileSize(size)
      });
    }
  });
  
  // Calculate size by category
  Object.keys(categories).forEach(category => {
    const categorySize = categories[category].reduce((acc, photo) => acc + (photo.fileSize || 0), 0);
    stats.byCategory[category] = {
      count: categories[category].length,
      size: categorySize,
      readableSize: formatFileSize(categorySize)
    };
  });
  
  stats.readableTotalSize = formatFileSize(stats.totalSize);
  
  return stats;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};