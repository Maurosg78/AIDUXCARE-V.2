/**
 * Token Tracking Service Unit Tests
 * 
 * Sprint 2A - Day 3: Testing & Production Polish
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TokenTrackingService } from '../tokenTrackingService';
import type { TokenUsage, TokenAllocation } from '../tokenTrackingService';

// Mock Firestore
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: vi.fn((date) => ({ toMillis: () => date.getTime() }))
  }
}));

describe('TokenTrackingService', () => {
  let tokenTrackingService: TokenTrackingService;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenTrackingService = new TokenTrackingService();
  });

  describe('getCurrentTokenUsage', () => {
    test('returns correct token usage for user with base tokens only', async () => {
      // Mock user data with base tokens
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 300,
            baseTokensRemaining: 900,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      const usage = await tokenTrackingService.getCurrentTokenUsage('user123');

      expect(usage.baseTokensRemaining).toBe(900);
      expect(usage.purchasedTokensBalance).toBe(0);
      expect(usage.totalAvailable).toBe(900);
      expect(usage.monthlyUsage).toBe(300);
    });

    test('includes purchased tokens in total available', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 1100,
            baseTokensRemaining: 100,
            purchasedTokensBalance: 500,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'purchase1',
            data: () => ({ tokensRemaining: 300, status: 'active' })
          },
          {
            id: 'purchase2',
            data: () => ({ tokensRemaining: 200, status: 'active' })
          }
        ]
      } as any);

      const usage = await tokenTrackingService.getCurrentTokenUsage('user123');

      expect(usage.baseTokensRemaining).toBe(100);
      expect(usage.purchasedTokensBalance).toBe(500);
      expect(usage.totalAvailable).toBe(600);
    });
  });

  describe('canUseTokens', () => {
    test('returns true when user has sufficient tokens', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 500,
            baseTokensRemaining: 700,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      const canUse = await tokenTrackingService.canUseTokens('user123', 100);
      expect(canUse).toBe(true);
    });

    test('returns false when user has insufficient tokens', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 1100,
            baseTokensRemaining: 100,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      const canUse = await tokenTrackingService.canUseTokens('user123', 200);
      expect(canUse).toBe(false);
    });

    test('returns false on error (fail safe)', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      const canUse = await tokenTrackingService.canUseTokens('user123', 100);
      expect(canUse).toBe(false);
    });
  });

  describe('allocateTokens', () => {
    test('allocates base tokens first when sufficient', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 500,
            baseTokensRemaining: 700,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      const allocation = await tokenTrackingService.allocateTokens('user123', 100);

      expect(allocation.source).toBe('base');
      expect(allocation.tokensAllocated).toBe(100);
      expect(allocation.remainingAfter).toBe(600);
      expect(allocation.purchaseIdUsed).toBeUndefined();
    });

    test('falls back to purchased tokens when base insufficient', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 1100,
            baseTokensRemaining: 100,
            purchasedTokensBalance: 500,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'purchase1',
            data: () => ({
              tokensRemaining: 300,
              status: 'active',
              purchaseDate: { toDate: () => new Date('2025-01-01') }
            })
          }
        ]
      } as any);

      const allocation = await tokenTrackingService.allocateTokens('user123', 200);

      expect(allocation.source).toBe('purchased');
      expect(allocation.tokensAllocated).toBe(200);
      expect(allocation.purchaseIdUsed).toBe('purchase1');
    });

    test('throws error when insufficient tokens total', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 1100,
            baseTokensRemaining: 100,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      await expect(
        tokenTrackingService.allocateTokens('user123', 200)
      ).rejects.toThrow('Insufficient tokens');
    });
  });

  describe('recordTokenUsage', () => {
    test('records token usage and updates user allocation', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 500,
            baseTokensRemaining: 700,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      const result = await tokenTrackingService.recordTokenUsage('user123', 'session456', 50);

      expect(result.success).toBe(true);
      expect(result.tokensConsumed).toBe(50);
      expect(result.source).toBe('base');
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('purchaseTokenPackage', () => {
    test('successfully purchases small package', async () => {
      const mockUserData = {
        subscription: {
          tokenAllocation: {
            baseTokensMonthly: 1200,
            baseTokensUsed: 500,
            baseTokensRemaining: 700,
            purchasedTokensBalance: 0,
            currentBillingCycle: '2025-01'
          }
        }
      };

      const { getDoc, setDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      } as any);

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      const result = await tokenTrackingService.purchaseTokenPackage('user123', 'small');

      expect(result.success).toBe(true);
      expect(result.tokensAdded).toBe(300);
      expect(result.newBalance).toBe(300);
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    test('handles purchase errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      const result = await tokenTrackingService.purchaseTokenPackage('user123', 'small');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('resetMonthlyCycle', () => {
    test('resets base tokens to 1200 and expires old purchases', async () => {
      const { updateDoc } = await import('firebase/firestore');
      const { getDocs } = await import('firebase/firestore');

      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      await tokenTrackingService.resetMonthlyCycle('user123');

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = vi.mocked(updateDoc).mock.calls[0];
      expect(updateCall[1]).toMatchObject({
        'subscription.tokenAllocation.baseTokensUsed': 0,
        'subscription.tokenAllocation.baseTokensRemaining': 1200,
      });
      expect(updateCall[1]['subscription.tokenAllocation.currentBillingCycle']).toBeDefined();
      expect(updateCall[1]['subscription.tokenAllocation.lastResetDate']).toBeInstanceOf(Date);
    });
  });
});

