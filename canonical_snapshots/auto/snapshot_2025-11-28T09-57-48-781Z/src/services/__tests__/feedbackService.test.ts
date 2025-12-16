import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collection, addDoc } from 'firebase/firestore';

// Mock logger FIRST (before importing feedbackService)
vi.mock('@/shared/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
}));

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: {},
}));

// Import AFTER mocks are set up
import { FeedbackService, FeedbackType, FeedbackSeverity } from '../feedbackService';

describe('✅ FASE 1: FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.lastError
    if (typeof window !== 'undefined') {
      window.lastError = undefined;
    }
  });

  describe('submitFeedback', () => {
    it('✅ should submit feedback to Firestore', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'test-id' } as any);

      const feedback = {
        type: 'bug' as FeedbackType,
        severity: 'critical' as FeedbackSeverity,
        description: 'Test bug description',
        url: 'http://localhost:5173/workflow',
        userAgent: 'test-agent',
      };

      await FeedbackService.submitFeedback(feedback);

      expect(collection).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled();
    });

    it('✅ should capture auto context (URL, userAgent)', () => {
      const context = FeedbackService.getAutoContext();

      expect(context.url).toBeDefined();
      expect(context.userAgent).toBeDefined();
      expect(context.context).toBeDefined();
      expect(context.context?.currentPage).toBeDefined();
    });

    it('✅ should handle critical severity errors', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'test-id' } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const feedback = {
        type: 'bug' as FeedbackType,
        severity: 'critical' as FeedbackSeverity,
        description: 'Critical bug',
        url: 'http://localhost:5173/workflow',
        userAgent: 'test-agent',
      };

      await FeedbackService.submitFeedback(feedback);

      // Critical errors should log to console
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('submitErrorFeedback', () => {
    it('✅ should submit error feedback automatically', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'test-id' } as any);

      const error = new Error('Test error message');
      error.stack = 'Error stack trace';

      await FeedbackService.submitErrorFeedback(error, { extra: 'context' });

      expect(addDoc).toHaveBeenCalled();
      const callArgs = mockAddDoc.mock.calls[0][1] as any;
      
      expect(callArgs.type).toBe('bug');
      expect(callArgs.severity).toBe('critical');
      expect(callArgs.description).toContain('Test error message');
      expect(callArgs.context?.errorMessage).toBe('Test error message');
      expect(callArgs.context?.stackTrace).toBeDefined();
    });
  });

  describe('getAutoContext', () => {
    it('✅ should capture current page URL', () => {
      const context = FeedbackService.getAutoContext();
      expect(context.url).toBe(window.location.href);
    });

    it('✅ should capture user agent', () => {
      const context = FeedbackService.getAutoContext();
      expect(context.userAgent).toBe(navigator.userAgent);
    });

    it('✅ should capture current page path', () => {
      const context = FeedbackService.getAutoContext();
      expect(context.context?.currentPage).toBe(window.location.pathname);
    });
  });
});

