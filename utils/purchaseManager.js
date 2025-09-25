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
      console.log('All offerings:', Object.keys(offerings.all));
      
      // Try current first, then default
      const currentOffering = offerings.current || offerings.all['default'];
      
      if (currentOffering !== null) {
        console.log('Using offering:', currentOffering.identifier);
        console.log('Available packages:', currentOffering.availablePackages.map(p => p.product.identifier));
        return currentOffering.availablePackages;
      }
      
      console.log('No offerings found');
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
      
      // Handle specific error cases
      let errorMessage = error.message || 'Purchase failed';
      if (error.code === 'PURCHASES_ERROR_PAYMENT_PENDING') {
        errorMessage = 'Payment is pending approval';
      } else if (error.code === 'PURCHASES_ERROR_INVALID_RECEIPT') {
        errorMessage = 'Receipt validation failed';
      } else if (error.userCancelled) {
        errorMessage = 'Purchase cancelled';
      }
      
      return { success: false, error: errorMessage, code: error.code };
    }
  }

  static async checkSubscriptionStatus() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      const isSubscribed = entitlement !== undefined;
      
      return {
        isSubscribed,
        expirationDate: entitlement?.expirationDate,
        willRenew: entitlement?.willRenew,
        periodType: entitlement?.periodType,
        productIdentifier: entitlement?.productIdentifier,
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Return false on error - don't assume premium access
      return { 
        isSubscribed: false, 
        error: error.message,
        expirationDate: null,
        willRenew: false 
      };
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
      // Preferred path: purchase via Offerings/Package
      const offerings = await this.getOfferings();
      const packageToPurchase = offerings.find((pkg) =>
        pkg?.product?.identifier === productId
      );

      if (packageToPurchase) {
        return await this.purchasePackage(packageToPurchase);
      }

      // Fallback: directly purchase by product identifier
      // This covers cases where Offerings are not configured or not yet available
      try {
        const { customerInfo } = await Purchases.purchaseProduct(productId);
        return {
          success: true,
          customerInfo,
          isActive: customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined,
        };
      } catch (purchaseError) {
        if (!purchaseError.userCancelled) {
          console.error('Direct product purchase error:', purchaseError);
        }
        let errorMessage = purchaseError.message || 'Purchase failed';
        // Map common validation/receipt issues to clearer messages
        if (
          purchaseError.code === 'PURCHASES_ERROR_INVALID_RECEIPT' ||
          purchaseError.code === 'INVALID_RECEIPT'
        ) {
          errorMessage = 'Receipt validation failed. Please try again.';
        } else if (purchaseError.userCancelled) {
          errorMessage = 'Purchase cancelled';
        }
        return { success: false, error: errorMessage, code: purchaseError.code };
      }
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
