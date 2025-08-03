# 📱 StorageSwipe App Store Submission Guide

## Pre-Submission Checklist

### 1. **Apple Developer Account** ($99/year)
- [ ] Sign up at [developer.apple.com](https://developer.apple.com)
- [ ] Complete tax forms and banking info

- [ ] Wait for approval (24-48 hours)

### 2. **App Store Connect Setup**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "+" → "New App"
3. Fill in:
   - **Bundle ID**: `com.yourcompany.storageswipe`
   - **SKU**: `STORAGESWIPE001`
   - **App Name**: StorageSwipe

### 3. **In-App Purchases Setup**
1. In App Store Connect → Your App → "In-App Purchases"
2. Create subscriptions:
   ```
   Monthly: com.storageswipe.premium.monthly - $2.99
   Yearly: com.storageswipe.premium.yearly - $19.99
   ```
3. Add localized descriptions for each

### 4. **RevenueCat Setup** (Easiest for IAP)
1. Sign up at [RevenueCat.com](https://www.revenuecat.com)
2. Create new project
3. Add your products from App Store Connect
4. Get your API keys
5. Update `purchaseManager.js` with real keys

## 📝 Required App Store Assets

### Screenshots (Required)
- **iPhone 6.5"**: 1284 × 2778 pixels (iPhone 14 Pro Max)
- **iPhone 5.5"**: 1242 × 2208 pixels (iPhone 8 Plus)
- **iPad 12.9"**: 2048 × 2732 pixels (if supporting iPad)

**What to show:**
1. Main swipe interface
2. Folder organization feature
3. Categories view
4. Before/after storage saved
5. Premium features

### App Information
```
App Name: StorageSwipe
Subtitle: Clean Photos with a Swipe
Category: Productivity / Photo & Video

Description:
StorageSwipe revolutionizes photo management with an intuitive swipe interface. Delete unwanted photos left, keep favorites right, or drag to organize into folders - all in one smooth motion.

Features:
• Swipe left to delete, right to keep
• NEW: Drag photos to folder nodes for instant organization
• Smart categories: Screenshots, WhatsApp, Camera, and more
• Create custom albums on the fly
• Multi-language support
• See storage saved in real-time

Premium Features:
• Unlimited photo processing
• Advanced organization tools
• Priority support
• Ad-free experience

Keywords: photo cleaner, storage manager, gallery organizer, swipe photos, delete duplicates
```

### App Review Information
```
Demo Account: Not needed (uses device photos)
Notes: App requires photo library access to function. 
       All deletions require user confirmation.
```

## 🚀 Building for Submission

### 1. **Prepare for Production**
```bash
# Update app.json
{
  "expo": {
    "name": "StorageSwipe",
    "slug": "storageswipe",
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1",
      "bundleIdentifier": "com.yourcompany.storageswipe",
      "supportsTablet": false,
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "StorageSwipe needs access to your photos to help you organize and clean your gallery.",
        "NSPhotoLibraryAddUsageDescription": "StorageSwipe needs permission to save organized photos to albums."
      }
    }
  }
}
```

### 2. **Build with EAS**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios
```

### 3. **Testing with TestFlight**
1. Upload build to App Store Connect
2. Add internal testers
3. Test all IAP in sandbox environment
4. Fix any crashes or issues

## ⚠️ Common Rejection Reasons to Avoid

1. **Metadata Issues**
   - Don't mention other platforms (Android)
   - Don't use Apple trademarks incorrectly
   - Ensure screenshots show actual app UI

2. **Functionality**
   - Must handle photo permissions properly
   - Can't delete photos without clear user action
   - Must provide restore purchases option

3. **In-App Purchases**
   - Clear description of what premium offers
   - Must be able to use app without purchase
   - Include privacy policy URL

## 📋 Submission Steps

1. **In Xcode** (if using EAS, skip this):
   - Archive → Distribute App → App Store Connect

2. **In App Store Connect**:
   - Upload build
   - Fill all metadata
   - Add screenshots
   - Submit for review

3. **Review Timeline**:
   - Usually 24-48 hours
   - May take up to 7 days
   - Expedited review available for critical issues

## 🎯 Post-Launch

1. **Monitor Reviews** - Respond to user feedback
2. **Track Analytics** - RevenueCat dashboard + App Analytics
3. **Plan Updates** - iOS favors apps with regular updates
4. **Marketing** - ASO optimization, social media, Product Hunt

## Need Help?

- **RevenueCat Docs**: https://docs.revenuecat.com
- **App Store Guidelines**: https://developer.apple.com/app-store/guidelines/
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/

Good luck with your launch! 🚀