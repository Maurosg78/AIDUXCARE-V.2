/**
 * Token Tracking Service
 * 
 * Manages token consumption, allocation, and tracking for user sessions.
 * Implements canonical pricing v1.1 with base tokens and purchased token packages.
 * 
 * Sprint 2A - Day 2: Token Tracking Foundation
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SessionType } from './sessionTypeService';

// Canonical Pricing Configuration
export const CANONICAL_PRICING = {
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

export interface TokenUsage {
  baseTokensRemaining: number;
  purchasedTokensBalance: number;
  totalAvailable: number;
  monthlyUsage: number;
  projectedMonthlyUsage: number;
  billingCycle: string; // 'YYYY-MM'
  billingCycleStart: Date;
  billingCycleEnd: Date;
}

export interface TokenAllocation {
  source: 'base' | 'purchased';
  tokensAllocated: number;
  remainingAfter: number;
  purchaseIdUsed?: string;
}

export interface TokenConsumptionResult {
  success: boolean;
  tokensConsumed: number;
  source: 'base' | 'purchased';
  remainingTokens: number;
  purchaseIdUsed?: string;
}

export interface PurchaseResult {
  success: boolean;
  purchaseId: string;
  tokensAdded: number;
  newBalance: number;
  expiresAt: Date;
  error?: string;
}

/**
 * Token Tracking Service
 * 
 * Handles token allocation, consumption tracking, and purchase management
 */
export class TokenTrackingService {
  private readonly COLLECTION_NAME = 'users';
  private readonly PURCHASES_COLLECTION = 'token_purchases';

  /**
   * Get current token usage for a user
   */
  async getCurrentTokenUsage(userId: string): Promise<TokenUsage> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userSnap.data();
      const subscription = userData.subscription || {};
      const tokenAllocation = subscription.tokenAllocation || {};

      // Get current billing cycle
      const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
      const billingCycle = tokenAllocation.currentBillingCycle || currentMonth;

      // Calculate billing cycle dates
      const cycleStart = new Date(`${billingCycle}-01`);
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      cycleEnd.setDate(0); // Last day of month

      // Get base tokens remaining
      const baseTokensMonthly = tokenAllocation.baseTokensMonthly || CANONICAL_PRICING.tokensIncluded;
      const baseTokensUsed = tokenAllocation.baseTokensUsed || 0;
      const baseTokensRemaining = Math.max(0, baseTokensMonthly - baseTokensUsed);

      // Get purchased tokens balance (sum of all active purchases)
      const purchasedTokensBalance = await this.getPurchasedTokensBalance(userId);

      // Calculate monthly usage
      const monthlyUsage = baseTokensUsed;

      // Project monthly usage (simple projection based on days elapsed)
      const daysElapsed = Math.floor((Date.now() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysInMonth = cycleEnd.getDate();
      const projectedMonthlyUsage = daysElapsed > 0 
        ? Math.round((monthlyUsage / daysElapsed) * daysInMonth)
        : monthlyUsage;

      return {
        baseTokensRemaining,
        purchasedTokensBalance,
        totalAvailable: baseTokensRemaining + purchasedTokensBalance,
        monthlyUsage,
        projectedMonthlyUsage,
        billingCycle,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd
      };
    } catch (error) {
      console.error('[TokenTrackingService] Error getting token usage:', error);
      throw error;
    }
  }

  /**
   * Check if user can use requested tokens
   */
  async canUseTokens(userId: string, requestedTokens: number): Promise<boolean> {
    try {
      const usage = await this.getCurrentTokenUsage(userId);
      return usage.totalAvailable >= requestedTokens;
    } catch (error) {
      console.error('[TokenTrackingService] Error checking token availability:', error);
      return false; // Fail safe: don't block if check fails
    }
  }

  /**
   * Allocate tokens for use (base → purchased priority)
   */
  async allocateTokens(userId: string, tokensNeeded: number): Promise<TokenAllocation> {
    try {
      const usage = await this.getCurrentTokenUsage(userId);
      
      if (usage.totalAvailable < tokensNeeded) {
        throw new Error(`Insufficient tokens. Available: ${usage.totalAvailable}, Needed: ${tokensNeeded}`);
      }

      // Priority: Use base tokens first, then purchased
      if (usage.baseTokensRemaining >= tokensNeeded) {
        // Use base tokens
        return {
          source: 'base',
          tokensAllocated: tokensNeeded,
          remainingAfter: usage.baseTokensRemaining - tokensNeeded
        };
      } else {
        // Use base tokens + purchased tokens
        const baseTokensToUse = usage.baseTokensRemaining;
        const purchasedTokensNeeded = tokensNeeded - baseTokensToUse;
        
        // Find purchase to use (FIFO - oldest first)
        const purchaseId = await this.findPurchaseToUse(userId, purchasedTokensNeeded);
        
        return {
          source: 'purchased',
          tokensAllocated: tokensNeeded,
          remainingAfter: usage.purchasedTokensBalance - purchasedTokensNeeded,
          purchaseIdUsed: purchaseId
        };
      }
    } catch (error) {
      console.error('[TokenTrackingService] Error allocating tokens:', error);
      throw error;
    }
  }

  /**
   * Record token usage for a session
   */
  async recordTokenUsage(
    userId: string,
    sessionId: string,
    tokensUsed: number
  ): Promise<TokenConsumptionResult> {
    try {
      // Allocate tokens first
      const allocation = await this.allocateTokens(userId, tokensUsed);

      // Update user's token allocation
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userSnap.data();
      const subscription = userData.subscription || {};
      const tokenAllocation = subscription.tokenAllocation || {};
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Update token allocation
      const updates: any = {
        'subscription.tokenAllocation.baseTokensUsed': (tokenAllocation.baseTokensUsed || 0) + 
          (allocation.source === 'base' ? tokensUsed : Math.min(tokensUsed, tokenAllocation.baseTokensRemaining || 0)),
        'subscription.tokenAllocation.currentBillingCycle': currentMonth,
        'subscription.tokenAllocation.lastResetDate': serverTimestamp()
      };

      // If using purchased tokens, update purchase record
      if (allocation.source === 'purchased' && allocation.purchaseIdUsed) {
        await this.consumePurchasedTokens(userId, allocation.purchaseIdUsed, tokensUsed);
      }

      await updateDoc(userRef, updates);

      // Get updated usage
      const updatedUsage = await this.getCurrentTokenUsage(userId);

      return {
        success: true,
        tokensConsumed: tokensUsed,
        source: allocation.source,
        remainingTokens: updatedUsage.totalAvailable,
        purchaseIdUsed: allocation.purchaseIdUsed
      };
    } catch (error) {
      console.error('[TokenTrackingService] Error recording token usage:', error);
      return {
        success: false,
        tokensConsumed: 0,
        source: 'base',
        remainingTokens: 0
      };
    }
  }

  /**
   * Reset monthly cycle (base tokens reset to 1200)
   */
  async resetMonthlyCycle(userId: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const currentMonth = new Date().toISOString().slice(0, 7);

      await updateDoc(userRef, {
        'subscription.tokenAllocation.baseTokensUsed': 0,
        'subscription.tokenAllocation.baseTokensRemaining': CANONICAL_PRICING.tokensIncluded,
        'subscription.tokenAllocation.currentBillingCycle': currentMonth,
        'subscription.tokenAllocation.lastResetDate': serverTimestamp()
      });

      // Expire old purchased tokens (12 months)
      await this.expireOldPurchases(userId);
    } catch (error) {
      console.error('[TokenTrackingService] Error resetting monthly cycle:', error);
      throw error;
    }
  }

  /**
   * Purchase token package
   */
  async purchaseTokenPackage(
    userId: string,
    packageType: 'small' | 'medium' | 'large'
  ): Promise<PurchaseResult> {
    try {
      const packageConfig = CANONICAL_PRICING.tokenPackages[packageType];
      if (!packageConfig) {
        throw new Error(`Invalid package type: ${packageType}`);
      }

      // Create purchase record
      const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const purchaseDate = new Date();
      const expiresAt = new Date(purchaseDate);
      expiresAt.setMonth(expiresAt.getMonth() + CANONICAL_PRICING.rolloverPolicy.maxRolloverMonths);

      const purchaseRef = doc(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION, purchaseId);
      await setDoc(purchaseRef, {
        userId,
        packageType,
        tokens: packageConfig.tokens,
        priceCAD: packageConfig.price,
        purchaseDate: Timestamp.fromDate(purchaseDate),
        tokensRemaining: packageConfig.tokens,
        expiresAt: Timestamp.fromDate(expiresAt),
        status: 'active'
      });

      // Update user's purchased tokens balance
      const currentUsage = await this.getCurrentTokenUsage(userId);
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        'subscription.tokenAllocation.purchasedTokensBalance': 
          (currentUsage.purchasedTokensBalance || 0) + packageConfig.tokens
      });

      return {
        success: true,
        purchaseId,
        tokensAdded: packageConfig.tokens,
        newBalance: currentUsage.purchasedTokensBalance + packageConfig.tokens,
        expiresAt
      };
    } catch (error) {
      console.error('[TokenTrackingService] Error purchasing token package:', error);
      return {
        success: false,
        purchaseId: '',
        tokensAdded: 0,
        newBalance: 0,
        expiresAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check spend limit (for future integration with SpendCapService)
   */
  async checkSpendLimit(userId: string, additionalCost: number): Promise<boolean> {
    // This will be enhanced when SpendCapService is integrated
    // For now, always return true (no limit)
    return true;
  }

  /**
   * Get purchased tokens balance (sum of all active purchases)
   */
  private async getPurchasedTokensBalance(userId: string): Promise<number> {
    try {
      const purchasesRef = collection(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION);
      const q = query(
        purchasesRef,
        where('status', '==', 'active'),
        where('expiresAt', '>', Timestamp.now())
      );
      
      const snapshot = await getDocs(q);
      let balance = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        balance += data.tokensRemaining || 0;
      });
      
      return balance;
    } catch (error) {
      console.error('[TokenTrackingService] Error getting purchased tokens balance:', error);
      return 0;
    }
  }

  /**
   * Find purchase to use (FIFO - oldest first)
   */
  private async findPurchaseToUse(userId: string, tokensNeeded: number): Promise<string | undefined> {
    try {
      const purchasesRef = collection(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION);
      const q = query(
        purchasesRef,
        where('status', '==', 'active'),
        where('expiresAt', '>', Timestamp.now())
      );
      
      const snapshot = await getDocs(q);
      const purchases = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aDate = a.purchaseDate?.toDate?.() || new Date(0);
          const bDate = b.purchaseDate?.toDate?.() || new Date(0);
          return aDate.getTime() - bDate.getTime(); // Oldest first
        });

      // Find first purchase with enough tokens
      for (const purchase of purchases) {
        if ((purchase.tokensRemaining || 0) >= tokensNeeded) {
          return purchase.id;
        }
      }

      return purchases[0]?.id; // Use first available if none has enough
    } catch (error) {
      console.error('[TokenTrackingService] Error finding purchase to use:', error);
      return undefined;
    }
  }

  /**
   * Consume purchased tokens from a specific purchase
   */
  private async consumePurchasedTokens(
    userId: string,
    purchaseId: string,
    tokensToConsume: number
  ): Promise<void> {
    try {
      const purchaseRef = doc(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION, purchaseId);
      const purchaseSnap = await getDoc(purchaseRef);

      if (!purchaseSnap.exists()) {
        throw new Error(`Purchase ${purchaseId} not found`);
      }

      const purchaseData = purchaseSnap.data();
      const tokensRemaining = Math.max(0, (purchaseData.tokensRemaining || 0) - tokensToConsume);

      await updateDoc(purchaseRef, {
        tokensRemaining,
        status: tokensRemaining > 0 ? 'active' : 'exhausted'
      });
    } catch (error) {
      console.error('[TokenTrackingService] Error consuming purchased tokens:', error);
      throw error;
    }
  }

  /**
   * Expire old purchased tokens (after 12 months)
   */
  private async expireOldPurchases(userId: string): Promise<void> {
    try {
      const purchasesRef = collection(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION);
      const q = query(purchasesRef, where('status', '==', 'active'));
      
      const snapshot = await getDocs(q);
      const now = Timestamp.now();
      
      const batch = snapshot.docs
        .filter(doc => {
          const expiresAt = doc.data().expiresAt;
          return expiresAt && expiresAt.toMillis() < now.toMillis();
        })
        .map(doc => updateDoc(doc.ref, { status: 'expired' }));

      await Promise.all(batch);
    } catch (error) {
      console.error('[TokenTrackingService] Error expiring old purchases:', error);
      // Don't throw - expiration is not critical
    }
  }
}

// Export singleton instance
export default new TokenTrackingService();
// Export class for testing
export { TokenTrackingService as TokenTrackingServiceClass };

