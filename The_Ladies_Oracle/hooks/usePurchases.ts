/**
 * Purchases — Phase 1 stub.
 *
 * Real in-app purchases need a native module (RevenueCat's react-native-purchases is the
 * recommended one), which means an EAS development build and App Store / Play products.
 * Until then the paywall shows the tiers and prices, and these functions explain that
 * purchasing arrives with the store release. Membership can be set for testing by
 * creating users/{uid}/billing/plan { tier: 'elite' } in the Firestore console.
 *
 * Phase 2 (when you have the build):
 *   npx expo install react-native-purchases
 *   Purchases.configure({ apiKey, appUserID: auth.currentUser.uid })
 *   purchase(productId) → Purchases.purchaseStoreProduct(...) → RevenueCat webhook → backend writes billing/plan
 *   restore()           → Purchases.restorePurchases()
 * The rest of the app keys off billing/plan, so nothing else changes.
 */
import { Alert } from 'react-native';
import { PlanPrice, PlanInfo } from '../lib/plans';

export const PURCHASES_AVAILABLE = false;

export function usePurchases() {
  const purchase = async (plan: PlanInfo, price: PlanPrice) => {
    Alert.alert(
      'Coming with the App Store release',
      `${plan.name} (${price.label}${price.period ? ` ${price.period}` : ''}) will be available to buy once The Ladies’ Oracle is on the App Store. Until then, enjoy your two questions a week.`,
    );
    return false;
  };

  const restore = async () => {
    Alert.alert('Nothing to restore yet', 'Purchases will be restorable once the app is on the App Store.');
    return false;
  };

  return { purchase, restore, available: PURCHASES_AVAILABLE };
}
