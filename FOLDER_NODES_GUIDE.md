# StorageSwipe Folder Nodes System Guide

## Overview
The new folder nodes system allows users to organize photos into albums while swiping through their gallery. Photos can be:
- **Swiped left** → Delete
- **Swiped right** → Keep
- **Dragged to folder nodes** → Organize into albums

## How It Works

### 1. **Folder Node Layout**
Folder nodes are positioned around the edges of the swipe area:
```
┌─────────────────────────────┐
│ [📷]    [📱]    [💬]   [⬇️] │  <- Top folders
│                             │
│ [⭐]    SWIPE AREA     [💼] │  <- Side folders
│                             │
│ [👨‍👩‍👧‍👦]  [😂]    [➕]   [...] │  <- Bottom folders
└─────────────────────────────┘
```

### 2. **Drag & Drop Interaction**
- Start dragging a photo in any direction
- Folder nodes will react when the photo gets close:
  - **Grow in size** when photo is within 100px
  - **Pulse animation** when photo is within 50px
  - **Glow effect** to indicate active drop zone

### 3. **Creating New Folders**
- Drag photo to the "➕ New" folder node
- A modal appears to:
  - Enter folder name
  - Choose an emoji icon
  - Create the album

### 4. **Visual Feedback**
- Photo becomes slightly transparent when dragging
- Scale down effect for better drag feel
- Folder nodes show item count badges
- Success animation when photo is added to folder

## Default Folders
- 📷 **Camera** - Photos taken with camera
- 📱 **Screenshots** - Screen captures
- 💬 **WhatsApp** - WhatsApp images
- ⬇️ **Downloads** - Downloaded images
- ⭐ **Favorites** - Starred photos
- 💼 **Work** - Work-related images
- 👨‍👩‍👧‍👦 **Family** - Family photos
- 😂 **Memes** - Funny images

## Technical Details

### Key Components:
1. **FolderNode.js** - Individual folder node component with animations
2. **albumManager.js** - Handles album creation and photo organization
3. **Enhanced gesture handling** - Detects both swipes and drags

### iOS Permissions:
- Uses `MediaLibrary.createAlbumAsync()` for album creation
- Requires photo library write permissions
- Compatible with iOS 14+ limited photo access

### Features:
- Real-time folder detection during drag
- Smooth animations using React Native Reanimated
- Persistent custom folders using AsyncStorage
- Album item counts from MediaLibrary API

## User Benefits
1. **Faster Organization** - Organize while reviewing photos
2. **Visual Feedback** - Clear indication of actions
3. **Custom Categories** - Create personalized albums
4. **Efficient Workflow** - Delete, keep, or organize in one gesture

## Future Enhancements
- Bulk operations (select multiple photos)
- Smart suggestions based on photo content
- Folder customization (colors, order)
- Export organized albums