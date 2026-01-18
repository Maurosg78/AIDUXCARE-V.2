/**
 * Token Package Service
 * 
 * Manages token package purchases, rollover, and purchase history.
 * 
 * Sprint 2A - Day 2: Token Tracking Foundation
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { collection, query, where, getDocs, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { tokenTrackingService } from './tokenTrackingService';
import { CANONICAL_PRICING } from './tokenTrackingService';

export interface TokenPackage {
  type: 'small' | 'medium' | 'large';
  tokens: number;
  priceCAD: number;
  pricePerToken: number;
}

export interface TokenPurchase {
  id: string;
  packageType: 'small' | 'medium' | 'large';
  tokens: number;
  priceCAD: number;
  purchaseDate: Date;
  tokensRemaining: number;
  expiresAt: Date;
  status: 'active' | 'exhausted' | 'expired';
}

export interface PurchasedToken {
  purchaseId: string;
  tokensRemaining: number;
  expiresAt: Date;
  purchaseDate: Date;
}

/**
 * Token Package Service
 * 
 * Handles token package purchases and rollover management
 */
export class TokenPackageService {
  private readonly COLLECTION_NAME = 'users';
  private readonly PURCHASES_COLLECTION = 'token_purchases';

  /**
   * Get available token packages
   */
  async getAvailablePackages(): Promise<TokenPackage[]> {
    return Object.entries(CANONICAL_PRICING.tokenPackages).map(([type, config]) => ({
      type: type as 'small' | 'medium' | 'large',
      tokens: config.tokens,
      priceCAD: config.price,
      pricePerToken: config.price / config.tokens
    }));
  }

  /**
   * Purchase token package
   */
  async purchasePackage(
    userId: string,
    packageType: 'small' | 'medium' | 'large',
    paymentMethodId?: string // For future Stripe integration
  ): Promise<any> {
    try {
      // Use tokenTrackingService for purchase
      const result = await tokenTrackingService.purchaseTokenPackage(userId, packageType);
      
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      return result;
    } catch (error) {
      console.error('[TokenPackageService] Error purchasing package:', error);
      throw error;
    }
  }

  /**
   * Get user purchase history
   */
  async getUserPurchaseHistory(userId: string): Promise<TokenPurchase[]> {
    try {
      const purchasesRef = collection(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION);
      const q = query(purchasesRef, orderBy('purchaseDate', 'desc'));
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          packageType: data.packageType,
          tokens: data.tokens,
          priceCAD: data.priceCAD,
          purchaseDate: data.purchaseDate?.toDate?.() || new Date(data.purchaseDate),
          tokensRemaining: data.tokensRemaining || 0,
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
          status: data.status || 'active'
        };
      });
    } catch (error) {
      console.error('[TokenPackageService] Error getting purchase history:', error);
      return [];
    }
  }

  /**
   * Get rollover tokens (active purchases)
   */
  async getRolloverTokens(userId: string): Promise<PurchasedToken[]> {
    try {
      const purchasesRef = collection(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION);
      const q = query(
        purchasesRef,
        where('status', '==', 'active'),
        where('expiresAt', '>', Timestamp.now())
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          purchaseId: doc.id,
          tokensRemaining: data.tokensRemaining || 0,
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
          purchaseDate: data.purchaseDate?.toDate?.() || new Date(data.purchaseDate)
        };
      });
    } catch (error) {
      console.error('[TokenPackageService] Error getting rollover tokens:', error);
      return [];
    }
  }

  /**
   * Expire old purchases (after 12 months)
   */
  async expireOldPurchases(userId: string): Promise<void> {
    try {
      // This is handled by TokenTrackingService, but we can call it here for consistency
      const purchasesRef = collection(db, this.COLLECTION_NAME, userId, this.PURCHASES_COLLECTION);
      const q = query(
        purchasesRef,
        where('status', '==', 'active'),
        where('expiresAt', '<=', Timestamp.now())
      );
      
      const snapshot = await getDocs(q);
      
      // Update expired purchases
      // Bloque 5E: Usar updateDoc del SDK modular (doc.ref.update no existe en v9)
      const updates = snapshot.docs.map(doc => {
        return updateDoc(doc.ref, { status: 'expired' });
      });

      await Promise.all(updates);
    } catch (error) {
      console.error('[TokenPackageService] Error expiring old purchases:', error);
      // Don't throw - expiration is not critical
    }
  }

  /**
   * Get package recommendation based on usage
   */
  async getPackageRecommendation(userId: string): Promise<string> {
    try {
      const usage = await tokenTrackingService.getCurrentTokenUsage(userId);
      const projectedUsage = usage.projectedMonthlyUsage;
      const baseTokens = CANONICAL_PRICING.tokensIncluded;

      // If projected usage is close to base tokens, recommend small package
      if (projectedUsage <= baseTokens * 1.1) {
        return 'small';
      }

      // If projected usage is 1.5x base tokens, recommend medium
      if (projectedUsage <= baseTokens * 1.5) {
        return 'medium';
      }

      // Otherwise recommend large
      return 'large';
    } catch (error) {
      console.error('[TokenPackageService] Error getting package recommendation:', error);
      return 'medium'; // Default recommendation
    }
  }
}

// Export singleton instance
export default new TokenPackageService();

