/**
 * Cross-Border AI Consent Service Tests
 * DÍA 1 Compliance Testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CrossBorderAIConsentService,
  type CrossBorderAIConsent,
} from '../crossBorderAIConsentService';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Set up localStorage mock for both browser and Node
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// For Node.js environment (Vitest)
(globalThis as any).localStorage = localStorageMock;
(globalThis as any).navigator = { userAgent: 'test-agent' };

describe('CrossBorderAIConsentService', () => {
  const TEST_USER_ID = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('hasConsented', () => {
    it('should return false when no consent exists', () => {
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(false);
    });

    it('should return true when valid consent exists', () => {
      const consent: CrossBorderAIConsent = {
        userId: TEST_USER_ID,
        consentDate: new Date(),
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
        consentVersion: '1.0.0',
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(true);
    });

    it('should return false when consent is expired', () => {
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 2); // 2 years ago = expired
      
      const consent: CrossBorderAIConsent = {
        userId: TEST_USER_ID,
        consentDate: expiredDate,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
        consentVersion: '1.0.0',
      };

      localStorage.setItem('aiduxcare_crossborder_ai_consent', JSON.stringify(consent));
      
      const status = CrossBorderAIConsentService.getConsentStatus(TEST_USER_ID);
      // Consent is expired (>365 days old)
      expect(status.hasConsent).toBe(false);
      expect(status.isExpired).toBe(true);
    });

    it('should return false when consent version mismatch', () => {
      const consent: CrossBorderAIConsent = {
        userId: TEST_USER_ID,
        consentDate: new Date(),
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
        consentVersion: '0.9.0', // Old version
      };

      localStorage.setItem('aiduxcare_crossborder_ai_consent', JSON.stringify(consent));
      
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(false);
    });

    it('should return false for different user', () => {
      const consent: CrossBorderAIConsent = {
        userId: 'other-user',
        consentDate: new Date(),
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
        consentVersion: '1.0.0',
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(false);
    });
  });

  describe('saveConsent', () => {
    it('should save valid consent successfully', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      expect(() => {
        CrossBorderAIConsentService.saveConsent(consent);
      }).not.toThrow();

      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(true);
    });

    it('should throw error when consent is false', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: false, // Invalid
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      expect(() => {
        CrossBorderAIConsentService.saveConsent(consent);
      }).toThrow();
    });

    it('should throw error when missing cloudActAcknowledged', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: false, // Missing
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      expect(() => {
        CrossBorderAIConsentService.saveConsent(consent);
      }).toThrow('CLOUD Act risk must be acknowledged');
    });

    it('should throw error when missing dataRetentionAcknowledged', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: false, // Missing
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      expect(() => {
        CrossBorderAIConsentService.saveConsent(consent);
      }).toThrow('Data retention');
    });

    it('should save with current version automatically', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      CrossBorderAIConsentService.saveConsent(consent);

      const stored = localStorage.getItem('aiduxcare_crossborder_ai_consent');
      const savedConsent = JSON.parse(stored!) as CrossBorderAIConsent;
      expect(savedConsent.consentVersion).toBe('1.0.0');
    });
  });

  describe('getConsentStatus', () => {
    it('should return correct status for valid consent', () => {
      const consent: CrossBorderAIConsent = {
        userId: TEST_USER_ID,
        consentDate: new Date(),
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
        consentVersion: '1.0.0',
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const status = CrossBorderAIConsentService.getConsentStatus(TEST_USER_ID);

      expect(status.hasConsent).toBe(true);
      expect(status.consentVersion).toBe('1.0.0');
      expect(status.isExpired).toBe(false);
    });

    it('should return false for non-existent consent', () => {
      const status = CrossBorderAIConsentService.getConsentStatus(TEST_USER_ID);
      expect(status.hasConsent).toBe(false);
      expect(status.consentDate).toBeNull();
    });
  });

  describe('revokeConsent', () => {
    it('should revoke existing consent', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      CrossBorderAIConsentService.saveConsent(consent);
      expect(CrossBorderAIConsentService.hasConsented(TEST_USER_ID)).toBe(true);

      CrossBorderAIConsentService.revokeConsent(TEST_USER_ID);

      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(false);
    });

    it('should handle revoking non-existent consent gracefully', () => {
      expect(() => {
        CrossBorderAIConsentService.revokeConsent(TEST_USER_ID);
      }).not.toThrow();
    });
  });

  describe('isConsentValid', () => {
    it('should return true for valid consent', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const isValid = CrossBorderAIConsentService.isConsentValid(TEST_USER_ID);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid consent', () => {
      const isValid = CrossBorderAIConsentService.isConsentValid(TEST_USER_ID);
      expect(isValid).toBe(false);
    });
  });

  describe('needsRenewal', () => {
    it('should return false for valid current consent', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const needsRenewal = CrossBorderAIConsentService.needsRenewal(TEST_USER_ID);
      expect(needsRenewal).toBe(false);
    });

    it('should return true for version mismatch', () => {
      const consent: CrossBorderAIConsent = {
        userId: TEST_USER_ID,
        consentDate: new Date(),
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
        consentVersion: '0.9.0', // Old version
      };

      localStorage.setItem('aiduxcare_crossborder_ai_consent', JSON.stringify(consent));
      const needsRenewal = CrossBorderAIConsentService.needsRenewal(TEST_USER_ID);
      expect(needsRenewal).toBe(true);
    });
  });
});

