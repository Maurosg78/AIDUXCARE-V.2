import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logger from '@/shared/utils/logger';

/**
 * Feedback Service
 * 
 * Captures user feedback during beta testing period.
 * Critical for 1-month physiotherapist testing program.
 */

export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'other';
export type FeedbackSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface UserFeedback {
  type: FeedbackType;
  severity: FeedbackSeverity;
  description: string;
  userId?: string;
  sessionId?: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  context?: {
    currentPage?: string;
    workflowStep?: string;
    errorMessage?: string;
    stackTrace?: string;
  };
}

export class FeedbackService {
  private static readonly COLLECTION_NAME = 'user_feedback';

  /**
   * Helper function to remove undefined values from objects (Firestore doesn't accept undefined)
   */
  private static cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(this.cleanUndefined.bind(this)).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.cleanUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }

  /**
   * Submit user feedback to Firestore
   */
  static async submitFeedback(feedback: Omit<UserFeedback, 'timestamp'>): Promise<void> {
    try {
      const feedbackData: Omit<UserFeedback, 'timestamp'> & { timestamp: any } = {
        ...feedback,
        timestamp: serverTimestamp(),
      };

      // ✅ FIX: Clean undefined values before saving to Firestore
      const cleanedFeedbackData = this.cleanUndefined(feedbackData);

      await addDoc(collection(db, this.COLLECTION_NAME), cleanedFeedbackData);

      logger.info('[FEEDBACK] Feedback submitted:', {
        type: feedback.type,
        severity: feedback.severity,
        url: feedback.url,
      });

      // If critical severity, log to console for immediate attention
      if (feedback.severity === 'critical') {
        console.error('🚨 [CRITICAL FEEDBACK]', feedback);
        // TODO: Send email notification to team (implement later)
      }
    } catch (error) {
      logger.error('[FEEDBACK] Error submitting feedback:', error);
      console.error('❌ [FEEDBACK] Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Auto-capture context for feedback (URL, user agent, current page state)
   */
  static getAutoContext(): Pick<UserFeedback, 'url' | 'userAgent' | 'context'> {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: {
        currentPage: window.location.pathname,
        errorMessage: window.lastError?.message,
        stackTrace: window.lastError?.stack,
      },
    };
  }

  /**
   * Capture error context automatically
   */
  static async submitErrorFeedback(
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await this.submitFeedback({
        type: 'bug',
        severity: 'critical',
        description: `Error: ${error.message}\n\nStack: ${error.stack || 'N/A'}`,
        ...this.getAutoContext(),
        context: {
          ...this.getAutoContext().context,
          errorMessage: error.message,
          stackTrace: error.stack,
          ...context,
        },
      });
    } catch (err) {
      console.error('❌ [FEEDBACK] Failed to submit error feedback:', err);
    }
  }
}

// Global error tracking helper
declare global {
  interface Window {
    lastError?: Error;
  }
}

// Capture unhandled errors globally
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    window.lastError = new Error(event.message);
    window.lastError.stack = event.error?.stack;
  });

  window.addEventListener('unhandledrejection', (event) => {
    window.lastError = new Error(event.reason?.message || 'Unhandled promise rejection');
  });
}

