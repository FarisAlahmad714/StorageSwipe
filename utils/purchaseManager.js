import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat configuration
const REVENUECAT_API_KEY_IOS = 'YOUR_IOS_API_KEY'; // Get from RevenueCat dashboard
const REVENUECAT_API_KEY_ANDROID = 'YOUR_ANDROID_API_KEY';

// Product IDs (must match App Store Connect)
export const PRODUCT_IDS = {
  MONTHLY: 'com.storageswipe.premium.monthly',
  YEARLY: 'com.storageswipe.premium.yearly',
};

class PurchaseManager {
  static async initialize() {
    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
      
      await Purchases.configure({ apiKey });
      
      // Enable debug logs in development
      if (__DEV__) {
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }
      
      return true;
    } catch (error) {
      console.error('Purchase initialization error:', error);
      return false;
    }
  }

  static async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (error) {
      console.error('Error getting offerings:', error);
      return [];
    }
  }

  static async purchasePackage(packageToPurchase) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return {
        success: true,
        customerInfo,
        isActive: customerInfo.entitlements.active['premium'] !== undefined
      };
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
      return { success: false, error: error.message };
    }
  }

  static async checkSubscriptionStatus() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isSubscribed = customerInfo.entitlements.active['premium'] !== undefined;
      
      return {
        isSubscribed,
        expirationDate: customerInfo.entitlements.active['premium']?.expirationDate,
        willRenew: customerInfo.entitlements.active['premium']?.willRenew,
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { isSubscribed: false };
    }
  }

  static async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return {
        success: true,
        isActive: customerInfo.entitlements.active['premium'] !== undefined
      };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PurchaseManager;