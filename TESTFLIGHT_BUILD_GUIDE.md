# 🚀 StorageSwipe TestFlight/Production Build Guide

## 🔧 Issues Fixed

1. **@expo/fingerprint module missing** - Added to package.json
2. **iOS deployment target mismatch** - Updated Podfile to enforce iOS 15.1 for all pods
3. **EAS configuration** - Enhanced eas.json with proper production settings

## 📋 Step-by-Step Build Process

### 1. Install Dependencies
```bash
# Clean install to avoid npm errors
rm -rf node_modules
npm install

# For iOS, also update pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 2. Set Environment Variable (Windows)
```powershell
# In PowerShell
$env:EAS_SKIP_AUTO_FINGERPRINT = "1"

# Or use cmd wrapper
cmd /c "set EAS_SKIP_AUTO_FINGERPRINT=1 && npx eas-cli@latest build --platform ios --profile production"
```

### 3. Build for Production
```bash
# Option 1: Direct build
npx eas-cli@latest build --platform ios --profile production

# Option 2: Build and submit to TestFlight
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

### 4. Build for TestFlight (Internal Testing)
```bash
# Use preview profile for internal testing
npx eas-cli@latest build --platform ios --profile preview
```

## 🔍 Troubleshooting

### If you get npm install errors:
```bash
# Clear npm cache
rm -rf ~/.npm
rm -rf node_modules
npm cache clean --force
npm install
```

### If build fails with pod errors:
```bash
cd ios
pod deintegrate
pod install --repo-update
cd ..
```

### If you still get fingerprint errors:
The fingerprint module is optional. Always use:
```bash
cmd /c "set EAS_SKIP_AUTO_FINGERPRINT=1 && npx eas-cli@latest build --platform ios --profile production"
```

## 📱 After Successful Build

1. **Wait for build completion** (usually 15-30 minutes)
2. **Download the .ipa file** from the EAS build page
3. **Upload to TestFlight**:
   - Use Transporter app (recommended)
   - Or use `eas submit --platform ios`

## ✅ Pre-flight Checklist

- [ ] Bundle ID matches App Store Connect: `com.fwayne714.storageswipe`
- [ ] Version number is incremented if needed
- [ ] Build number is incremented
- [ ] All permissions are properly described in Info.plist
- [ ] App icons are included (1024x1024)
- [ ] Launch screen is configured

## 🎯 Quick Commands Reference

```bash
# Full production build and submit
cmd /c "set EAS_SKIP_AUTO_FINGERPRINT=1 && npx eas-cli@latest build --platform ios --profile production --auto-submit"

# Just build
cmd /c "set EAS_SKIP_AUTO_FINGERPRINT=1 && npx eas-cli@latest build --platform ios --profile production"

# Submit existing build
npx eas-cli@latest submit --platform ios --latest

# Check build status
npx eas-cli@latest build:list --platform ios
```

## 🆘 Support Resources

- EAS Build Issues: https://docs.expo.dev/build/troubleshooting/
- TestFlight Guide: https://developer.apple.com/testflight/
- App Store Connect: https://appstoreconnect.apple.com

## 📌 Important Notes

1. The app is already configured with proper Apple credentials
2. The iOS deployment target is set to 15.1
3. All necessary permissions are included in Info.plist
4. The bundle identifier is: `com.fwayne714.storageswipe`

Good luck with your submission! 🎉