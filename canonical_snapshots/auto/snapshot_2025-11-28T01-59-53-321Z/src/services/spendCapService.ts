/**
 * Spend Cap Service
 * 
 * Manages user spend limits, monthly spend tracking, and auto-purchase logic.
 * 
 * Sprint 2A - Day 2: Token Tracking Foundation
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TokenTrackingService } from './tokenTrackingService';

// Canonical Pricing Configuration (shared)
const CANONICAL_PRICING = {
  basePrice: 34.99, // CAD
  tokensIncluded: 1200, // per month
  currency: 'CAD',
  
  tokenPackages: {
    small: { tokens: 300, price: 15.00 },
    medium: { tokens: 600, price: 27.00 },
    large: { tokens: 1000, price: 40.00 }
  },
  
  rolloverPolicy: {
    baseTokensExpire: true,
    purchasedTokensRollover: true,
    maxRolloverMonths: 12
  }
} as const;

export interface SpendCapInfo {
  monthlySpendCap?: number;
  currentMonthSpend: number;
  projectedMonthlySpend: number;
  canSpendMore: boolean;
  remainingCap?: number;
}

/**
 * Spend Cap Service
 * 
 * Handles spend limit management and enforcement
 */
export class SpendCapService {
  private readonly COLLECTION_NAME = 'users';

  /**
   * Set monthly spend cap for user
   */
  async setMonthlySpendCap(userId: string, capCAD: number): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        'subscription.spendControl.monthlySpendCap': capCAD,
        'subscription.spendControl.updatedAt': serverTimestamp()
      });
    } catch (error) {
      console.error('[SpendCapService] Error setting spend cap:', error);
      throw error;
    }
  }

  /**
   * Get monthly spend cap for user
   */
  async getMonthlySpendCap(userId: string): Promise<number | null> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const userData = userSnap.data();
      return userData.subscription?.spendControl?.monthlySpendCap || null;
    } catch (error) {
      console.error('[SpendCapService] Error getting spend cap:', error);
      return null;
    }
  }

  /**
   * Get current month spend
   */
  async getCurrentMonthSpend(userId: string): Promise<number> {
    try {
      // Calculate spend from base subscription + purchases this month
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return 0;
      }

      const userData = userSnap.data();
      const subscription = userData.subscription || {};
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Base subscription cost
      let spend = CANONICAL_PRICING.basePrice;

      // Add purchases made this month
      const purchases = subscription.tokenPurchases || [];
      const thisMonthPurchases = purchases.filter((p: any) => {
        const purchaseDate = p.purchaseDate?.toDate?.() || new Date(p.purchaseDate);
        return purchaseDate.toISOString().slice(0, 7) === currentMonth;
      });

      thisMonthPurchases.forEach((purchase: any) => {
        spend += purchase.priceCAD || 0;
      });

      return spend;
    } catch (error) {
      console.error('[SpendCapService] Error getting current month spend:', error);
      return 0;
    }
  }

  /**
   * Project monthly spend based on current pace
   */
  async projectMonthlySpend(userId: string): Promise<number> {
    try {
      const currentSpend = await this.getCurrentMonthSpend(userId);
      const currentDate = new Date();
      const daysElapsed = currentDate.getDate();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

      if (daysElapsed === 0) {
        return currentSpend;
      }

      return Math.round((currentSpend / daysElapsed) * daysInMonth);
    } catch (error) {
      console.error('[SpendCapService] Error projecting monthly spend:', error);
      return 0;
    }
  }

  /**
   * Check if purchase would exceed spend cap
   */
  async wouldExceedSpendCap(
    userId: string,
    additionalCost: number
  ): Promise<boolean> {
    try {
      const spendCap = await this.getMonthlySpendCap(userId);
      
      // No cap set = no limit
      if (!spendCap) {
        return false;
      }

      const currentSpend = await this.getCurrentMonthSpend(userId);
      return (currentSpend + additionalCost) > spendCap;
    } catch (error) {
      console.error('[SpendCapService] Error checking spend cap:', error);
      return false; // Fail safe: allow purchase if check fails
    }
  }

  /**
   * Check if auto-purchase should be triggered
   */
  async shouldAutoPurchase(userId: string, tokensNeeded: number): Promise<boolean> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return false;
      }

      const userData = userSnap.data();
      const spendControl = userData.subscription?.spendControl || {};

      // Check if auto-purchase is enabled
      if (!spendControl.autoTokenPurchase) {
        return false;
      }

      // Check token availability
      const canUse = await TokenTrackingService.canUseTokens(userId, tokensNeeded);
      if (canUse) {
        return false; // Don't auto-purchase if tokens available
      }

      // Check spend cap
      const preferredPackage = spendControl.preferredPackageSize || 'medium';
      const packageConfig = CANONICAL_PRICING.tokenPackages[preferredPackage];
      
      if (packageConfig && await this.wouldExceedSpendCap(userId, packageConfig.price)) {
        return false; // Don't auto-purchase if would exceed cap
      }

      return true;
    } catch (error) {
      console.error('[SpendCapService] Error checking auto-purchase:', error);
      return false;
    }
  }

  /**
   * Execute auto-purchase
   */
  async executeAutoPurchase(userId: string): Promise<any> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userSnap.data();
      const spendControl = userData.subscription?.spendControl || {};
      const preferredPackage = spendControl.preferredPackageSize || 'medium';

      // Execute purchase via TokenTrackingService
      return await TokenTrackingService.purchaseTokenPackage(userId, preferredPackage);
    } catch (error) {
      console.error('[SpendCapService] Error executing auto-purchase:', error);
      throw error;
    }
  }

  /**
   * Get complete spend cap information
   */
  async getSpendCapInfo(userId: string): Promise<SpendCapInfo> {
    try {
      const monthlySpendCap = await this.getMonthlySpendCap(userId);
      const currentMonthSpend = await this.getCurrentMonthSpend(userId);
      const projectedMonthlySpend = await this.projectMonthlySpend(userId);

      return {
        monthlySpendCap,
        currentMonthSpend,
        projectedMonthlySpend,
        canSpendMore: monthlySpendCap ? currentMonthSpend < monthlySpendCap : true,
        remainingCap: monthlySpendCap ? Math.max(0, monthlySpendCap - currentMonthSpend) : undefined
      };
    } catch (error) {
      console.error('[SpendCapService] Error getting spend cap info:', error);
      return {
        currentMonthSpend: 0,
        projectedMonthlySpend: 0,
        canSpendMore: true
      };
    }
  }
}

// Export singleton instance
export default new SpendCapService();
// Export class for testing
export { SpendCapService as SpendCapServiceClass };

