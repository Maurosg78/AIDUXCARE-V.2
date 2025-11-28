/**
 * Spend Cap Service Unit Tests
 * 
 * Sprint 2A - Day 3: Testing & Production Polish
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SpendCapServiceClass as SpendCapService } from '../spendCapService';

// Mock Firestore
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}));

vi.mock('../tokenTrackingService', () => ({
  TokenTrackingService: {
    canUseTokens: vi.fn(),
    purchaseTokenPackage: vi.fn()
  }
}));

describe('SpendCapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setMonthlySpendCap', () => {
    test('sets spend cap for user', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await SpendCapService.setMonthlySpendCap('user123', 100.00);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'subscription.spendControl.monthlySpendCap': 100.00
        })
      );
    });
  });

  describe('getMonthlySpendCap', () => {
    test('returns spend cap when set', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {
            monthlySpendCap: 100.00
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const cap = await SpendCapService.getMonthlySpendCap('user123');

      expect(cap).toBe(100.00);
    });

    test('returns null when no cap set', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {}
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const cap = await SpendCapService.getMonthlySpendCap('user123');

      expect(cap).toBeNull();
    });
  });

  describe('getCurrentMonthSpend', () => {
    test('calculates spend from base subscription and purchases', async () => {
      const mockUserData = {
        subscription: {
          tokenPurchases: [
            {
              purchaseDate: { toDate: () => new Date('2025-01-15') },
              priceCAD: 15.00
            },
            {
              purchaseDate: { toDate: () => new Date('2025-01-20') },
              priceCAD: 27.00
            }
          ]
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const spend = await SpendCapService.getCurrentMonthSpend('user123');

      // Base subscription: $34.99 + Purchases: $15 + $27 = $76.99
      expect(spend).toBeCloseTo(76.99, 2);
    });

    test('only includes purchases from current month', async () => {
      const mockUserData = {
        subscription: {
          tokenPurchases: [
            {
              purchaseDate: { toDate: () => new Date('2024-12-15') },
              priceCAD: 15.00
            },
            {
              purchaseDate: { toDate: () => new Date('2025-01-20') },
              priceCAD: 27.00
            }
          ]
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const spend = await SpendCapService.getCurrentMonthSpend('user123');

      // Base subscription: $34.99 + Current month purchase: $27 = $61.99
      expect(spend).toBeCloseTo(61.99, 2);
    });
  });

  describe('projectMonthlySpend', () => {
    test('projects monthly spend based on current pace', async () => {
      const mockUserData = {
        subscription: {
          tokenPurchases: [
            {
              purchaseDate: { toDate: () => new Date('2025-01-15') },
              priceCAD: 15.00
            }
          ]
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      // Mock current date to be Jan 15 (mid-month)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15'));

      const projected = await SpendCapService.projectMonthlySpend('user123');

      // Base: $34.99, Purchase: $15, Total: $49.99
      // Projected: $49.99 * (31/15) ≈ $103.31
      expect(projected).toBeGreaterThan(49.99);

      vi.useRealTimers();
    });
  });

  describe('wouldExceedSpendCap', () => {
    test('returns true when purchase would exceed cap', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {
            monthlySpendCap: 50.00
          },
          tokenPurchases: []
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      // Current spend: $34.99 (base), Additional: $27.00, Total: $61.99 > $50.00
      const wouldExceed = await SpendCapService.wouldExceedSpendCap('user123', 27.00);

      expect(wouldExceed).toBe(true);
    });

    test('returns false when purchase would not exceed cap', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {
            monthlySpendCap: 100.00
          },
          tokenPurchases: []
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      // Current spend: $34.99 (base), Additional: $15.00, Total: $49.99 < $100.00
      const wouldExceed = await SpendCapService.wouldExceedSpendCap('user123', 15.00);

      expect(wouldExceed).toBe(false);
    });

    test('returns false when no cap set', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {},
          tokenPurchases: []
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const wouldExceed = await SpendCapService.wouldExceedSpendCap('user123', 1000.00);

      expect(wouldExceed).toBe(false);
    });
  });

  describe('shouldAutoPurchase', () => {
    test('returns true when auto-purchase enabled and tokens needed', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {
            autoTokenPurchase: true,
            preferredPackageSize: 'medium'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { TokenTrackingService } = await import('../tokenTrackingService');
      vi.mocked(TokenTrackingService.canUseTokens).mockResolvedValue(false);

      const shouldAuto = await SpendCapService.shouldAutoPurchase('user123', 100);

      expect(shouldAuto).toBe(true);
    });

    test('returns false when auto-purchase disabled', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {
            autoTokenPurchase: false
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const shouldAuto = await SpendCapService.shouldAutoPurchase('user123', 100);

      expect(shouldAuto).toBe(false);
    });

    test('returns false when tokens available', async () => {
      const mockUserData = {
        subscription: {
          spendControl: {
            autoTokenPurchase: true
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { TokenTrackingService } = await import('../tokenTrackingService');
      vi.mocked(TokenTrackingService.canUseTokens).mockResolvedValue(true);

      const shouldAuto = await SpendCapService.shouldAutoPurchase('user123', 100);

      expect(shouldAuto).toBe(false);
    });
  });
});

