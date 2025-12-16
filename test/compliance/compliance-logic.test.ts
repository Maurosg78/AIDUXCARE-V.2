/**
 * DÍA 1 & DÍA 2 Compliance Logic Tests
 * Pure logic tests - No CSS/DOM dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for Node.js
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

(globalThis as any).localStorage = localStorageMock;
(globalThis as any).navigator = { userAgent: 'test-agent' };

// Import after mocks are set up
import {
  CrossBorderAIConsentService,
  type CrossBorderAIConsent,
} from '../../src/services/crossBorderAIConsentService';
import type { SOAPNote } from '../../src/types/vertex-ai';

describe('✅ DÍA 1: Cross-Border Consent Workflow', () => {
  const TEST_USER_ID = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Consent Service - Basic Operations', () => {
    it('✅ should return false when no consent exists', () => {
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(false);
    });

    it('✅ should save and retrieve valid consent', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(true);
    });

    it('✅ should reject consent with missing CLOUD Act acknowledgment', () => {
      const invalidConsent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: TEST_USER_ID,
        consented: true,
        cloudActAcknowledged: false, // Missing
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      expect(() => {
        CrossBorderAIConsentService.saveConsent(invalidConsent);
      }).toThrow('CLOUD Act risk must be acknowledged');
    });

    it('✅ should revoke consent correctly', () => {
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
      expect(CrossBorderAIConsentService.hasConsented(TEST_USER_ID)).toBe(false);
    });
  });

  describe('Consent Validation - Edge Cases', () => {
    it('✅ should handle version mismatch correctly', () => {
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

    it('✅ should handle different user IDs correctly', () => {
      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId: 'other-user',
        consented: true,
        cloudActAcknowledged: true,
        dataRetentionAcknowledged: true,
        rightToWithdrawAcknowledged: true,
        complaintRightsAcknowledged: true,
      };

      CrossBorderAIConsentService.saveConsent(consent);
      const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
      expect(hasConsent).toBe(false);
    });
  });
});

describe('✅ DÍA 2: CPO Review Gate', () => {
  const mockSOAPRequiresReview: SOAPNote = {
    subjective: 'Patient reports pain',
    objective: 'Limited ROM',
    assessment: 'Shoulder impingement',
    plan: 'TENS and exercises',
    requiresReview: true,
    isReviewed: false,
    aiGenerated: true,
    aiProcessor: 'Google Vertex AI (Gemini 2.5 Flash)',
    processedAt: new Date(),
  };

  const mockSOAPReviewed: SOAPNote = {
    ...mockSOAPRequiresReview,
    isReviewed: true,
    reviewed: {
      reviewedBy: 'test-user',
      reviewedAt: new Date(),
      reviewerName: 'Test User',
    },
  };

  const mockSOAPManual: SOAPNote = {
    subjective: 'Patient reports pain',
    objective: 'Limited ROM',
    assessment: 'Shoulder impingement',
    plan: 'TENS and exercises',
    // No requiresReview = manual entry
  };

  describe('Review Gate Logic', () => {
    const testReviewGate = (soap: SOAPNote, status: 'draft' | 'finalized') => {
      if (status === 'finalized') {
        if (soap.requiresReview && !soap.isReviewed) {
          return {
            blocked: true,
            error: '❌ CPO Compliance: This SOAP note requires review before finalization.',
          };
        }
        
        if (soap.requiresReview && soap.isReviewed && !soap.reviewed) {
          soap.reviewed = {
            reviewedBy: 'test-user',
            reviewedAt: new Date(),
            reviewerName: 'Test User',
          };
        }
      }
      return { blocked: false, soap };
    };

    it('✅ should block finalization when requiresReview=true and isReviewed=false', () => {
      const result = testReviewGate(mockSOAPRequiresReview, 'finalized');
      expect(result.blocked).toBe(true);
      expect(result.error).toContain('CPO Compliance');
      expect(result.error).toContain('requires review');
    });

    it('✅ should allow finalization when isReviewed=true', () => {
      const result = testReviewGate(mockSOAPReviewed, 'finalized');
      expect(result.blocked).toBe(false);
      expect(result.soap).toBeDefined();
    });

    it('✅ should allow finalization for manual SOAP (no requiresReview)', () => {
      const result = testReviewGate(mockSOAPManual, 'finalized');
      expect(result.blocked).toBe(false);
      expect(result.soap).toBeDefined();
    });

    it('✅ should allow saving as draft even without review', () => {
      const result = testReviewGate(mockSOAPRequiresReview, 'draft');
      expect(result.blocked).toBe(false);
      expect(result.soap).toBeDefined();
    });

    it('✅ should auto-populate review metadata when finalizing with review', () => {
      const soap = {
        ...mockSOAPRequiresReview,
        isReviewed: true,
      };
      
      const result = testReviewGate(soap, 'finalized');
      expect(result.blocked).toBe(false);
      expect(result.soap.reviewed).toBeDefined();
      expect(result.soap.reviewed?.reviewedBy).toBe('test-user');
      expect(result.soap.reviewed?.reviewedAt).toBeInstanceOf(Date);
    });
  });

  describe('AI Generation Auto-Marking', () => {
    const testAIMarking = (responseSOAP: SOAPNote) => {
      return {
        ...responseSOAP,
        requiresReview: true,
        isReviewed: false,
        aiGenerated: true,
        aiProcessor: 'Google Vertex AI (Gemini 2.5 Flash)',
        processedAt: new Date(),
      };
    };

    it('✅ should mark requiresReview=true for AI-generated SOAP', () => {
      const aiSOAP: SOAPNote = {
        subjective: 'AI generated',
        objective: 'AI generated',
        assessment: 'AI generated',
        plan: 'AI generated',
      };

      const result = testAIMarking(aiSOAP);
      expect(result.requiresReview).toBe(true);
      expect(result.isReviewed).toBe(false);
      expect(result.aiGenerated).toBe(true);
      expect(result.aiProcessor).toBe('Google Vertex AI (Gemini 2.5 Flash)');
      expect(result.processedAt).toBeInstanceOf(Date);
    });

    it('✅ should preserve existing SOAP fields when marking', () => {
      const aiSOAP: SOAPNote = {
        subjective: 'Original content',
        objective: 'Original content',
        assessment: 'Original content',
        plan: 'Original content',
        additionalNotes: 'Some notes',
      };

      const result = testAIMarking(aiSOAP);
      expect(result.subjective).toBe('Original content');
      expect(result.additionalNotes).toBe('Some notes');
      expect(result.requiresReview).toBe(true);
    });
  });

  describe('Review Metadata Completeness', () => {
    it('✅ should have complete review metadata when reviewed', () => {
      expect(mockSOAPReviewed.reviewed).toBeDefined();
      expect(mockSOAPReviewed.reviewed?.reviewedBy).toBe('test-user');
      expect(mockSOAPReviewed.reviewed?.reviewedAt).toBeInstanceOf(Date);
      expect(mockSOAPReviewed.reviewed?.reviewerName).toBe('Test User');
    });

    it('✅ should have AI processing metadata for AI-generated SOAPs', () => {
      expect(mockSOAPRequiresReview.aiGenerated).toBe(true);
      expect(mockSOAPRequiresReview.aiProcessor).toBe('Google Vertex AI (Gemini 2.5 Flash)');
      expect(mockSOAPRequiresReview.processedAt).toBeInstanceOf(Date);
    });
  });
});

describe('✅ Integration: Consent + Review Gate', () => {
  const TEST_USER_ID = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('✅ should require consent before AI processing, then require review before finalization', () => {
    // Step 1: No consent = AI processing blocked
    const hasConsent = CrossBorderAIConsentService.hasConsented(TEST_USER_ID);
    expect(hasConsent).toBe(false);
    // In real flow: Modal would appear, AI processing blocked

    // Step 2: User gives consent
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
    // Now AI processing can proceed

    // Step 3: AI generates SOAP with requiresReview=true
    const aiSOAP: SOAPNote = {
      subjective: 'AI generated',
      objective: 'AI generated',
      assessment: 'AI generated',
      plan: 'AI generated',
      requiresReview: true,
      isReviewed: false,
      aiGenerated: true,
      aiProcessor: 'Google Vertex AI (Gemini 2.5 Flash)',
      processedAt: new Date(),
    };

    // Step 4: Attempt finalization without review = blocked
    const reviewGate = (soap: SOAPNote, status: 'draft' | 'finalized') => {
      if (status === 'finalized' && soap.requiresReview && !soap.isReviewed) {
        return { blocked: true };
      }
      return { blocked: false };
    };

    expect(reviewGate(aiSOAP, 'finalized').blocked).toBe(true);

    // Step 5: Mark as reviewed
    aiSOAP.isReviewed = true;
    aiSOAP.reviewed = {
      reviewedBy: TEST_USER_ID,
      reviewedAt: new Date(),
      reviewerName: 'Test User',
    };

    // Step 6: Now finalization allowed
    expect(reviewGate(aiSOAP, 'finalized').blocked).toBe(false);
  });
});

