import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat configuration
const REVENUECAT_API_KEY_IOS = 'appl_kEocVrFmGinDvSxXQvIWQBjzZTK';

// Product IDs (must match App Store Connect and RevenueCat setup)
export const PRODUCT_IDS = {
  MONTHLY: 'com.fwayne714.storageswipe.Monthly',
  ANNUAL: 'com.fwayne714.storageswipe.Annual',
};

// Entitlement identifier from RevenueCat
export const ENTITLEMENT_ID = 'Pro';

class PurchaseManager {
  static async initialize() {
    try {
      const apiKey = REVENUECAT_API_KEY_IOS;
      
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
        isActive: customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
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
      const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      
      return {
        isSubscribed,
        expirationDate: customerInfo.entitlements.active[ENTITLEMENT_ID]?.expirationDate,
        willRenew: customerInfo.entitlements.active[ENTITLEMENT_ID]?.willRenew,
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
        isActive: customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
      };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserId() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.originalUserId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  static async purchaseProduct(productId) {
    try {
      const offerings = await this.getOfferings();
      const packageToPurchase = offerings.find(pkg => 
        pkg.product.identifier === productId
      );
      
      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found in offerings`);
      }
      
      return await this.purchasePackage(packageToPurchase);
    } catch (error) {
      console.error('Error purchasing product:', error);
      return { success: false, error: error.message };
    }
  }

  static async getProductInfo() {
    try {
      const offerings = await this.getOfferings();
      return offerings.map(pkg => ({
        identifier: pkg.product.identifier,
        description: pkg.product.description,
        title: pkg.product.title,
        price: pkg.product.priceString,
        priceAmountMicros: pkg.product.price,
        priceCurrencyCode: pkg.product.currencyCode,
        subscriptionPeriod: pkg.product.subscriptionPeriod,
        packageType: pkg.packageType,
      }));
    } catch (error) {
      console.error('Error getting product info:', error);
      return [];
    }
  }
}

export default PurchaseManager;