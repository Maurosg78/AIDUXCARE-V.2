import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * PHIPAAnalytics - PHIPA/PIPEDA Compliant Analytics Service
 * 
 * Automatically strips PHI from all analytics events before logging.
 * Uses SHA-256 hashing for sensitive identifiers.
 */

// PHI field patterns to strip
const PHI_FIELDS = [
  // Direct identifiers
  'patientName',
  'firstName',
  'lastName',
  'fullName',
  'name',
  'patientEmail',
  'email',
  'phoneNumber',
  'phone',
  'address',
  'postalCode',
  'zipCode',
  'healthCard',
  'ohipNumber',
  'sin',
  'ssn',
  'dateOfBirth',
  'dob',
  
  // Clinical content
  'transcript',
  'transcriptContent',
  'audioData',
  'recording',
  'soapContent',
  'clinicalNotes',
  'medicalHistory',
  'diagnosis',
  'symptoms',
  'medications',
  'treatmentPlan',
  
  // Document content
  'documentContent',
  'fileContent',
  'attachmentData',
  'pdfContent',
  'imageData',
];

// Patterns to detect PHI in strings
const PHI_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
  /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g, // Canadian health card patterns
  /\b\d{9}\b/g, // SSN/SIN patterns
];

export class PHIPAAnalytics {
  private static instance: PHIPAAnalytics;
  
  private constructor() {}
  
  public static getInstance(): PHIPAAnalytics {
    if (!PHIPAAnalytics.instance) {
      PHIPAAnalytics.instance = new PHIPAAnalytics();
    }
    return PHIPAAnalytics.instance;
  }

  /**
   * Track an analytics event
   */
  public async track(event: {
    category: string;
    action: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Sanitize metadata
      const sanitized = await this.sanitizePayload({
        event: event.action,
        category: event.category,
        metadata: event.metadata || {},
        timestamp: Date.now(),
      });

      // Log to Firestore
      await addDoc(collection(db, 'analytics_events'), sanitized);

      // Also log to Firebase Analytics if available
      if (analytics) {
        logEvent(analytics, event.action, {
          category: event.category,
          ...sanitized.metadata,
        });
      }

      console.log('[Analytics] Event tracked:', event.action);
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * Sanitize payload by removing PHI
   */
  private async sanitizePayload(payload: any): Promise<any> {
    const sanitized = { ...payload };

    // Strip PHI fields
    sanitized.metadata = this.stripPHIFields(sanitized.metadata || {});

    // Hash sensitive IDs
    sanitized.metadata = await this.hashSensitiveFields(sanitized.metadata);

    // Detect and remove PHI patterns in strings
    sanitized.metadata = this.detectAndRemovePHIPatterns(sanitized.metadata);

    // Add compliance flag
    sanitized.phiCompliant = true;
    sanitized.environment = import.meta.env.MODE;
    sanitized.version = import.meta.env.VITE_APP_VERSION || '0.1.0';

    return sanitized;
  }

  /**
   * Strip known PHI fields
   */
  private stripPHIFields(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.stripPHIFields(item));
    }

    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip if key is PHI field
      if (PHI_FIELDS.some(phi => key.toLowerCase().includes(phi.toLowerCase()))) {
        console.warn(`[Analytics] Stripped PHI field: ${key}`);
        continue;
      }

      // Recursively clean nested objects
      if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.stripPHIFields(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * Hash sensitive identifiers (userId, patientId, sessionId)
   */
  private async hashSensitiveFields(obj: any): Promise<any> {
    if (typeof obj !== 'object' || obj === null) return obj;

    const fieldsToHash = ['userId', 'patientId', 'sessionId', 'clinicianId'];
    const hashed: any = { ...obj };

    for (const field of fieldsToHash) {
      if (obj[field]) {
        hashed[`${field}Hash`] = await this.hashString(obj[field]);
        delete hashed[field]; // Remove original
        console.log(`[Analytics] Hashed ${field}`);
      }
    }

    return hashed;
  }

  /**
   * SHA-256 hash a string
   */
  private async hashString(str: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback: simple hash (not cryptographic)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Detect and remove PHI patterns in string values
   */
  private detectAndRemovePHIPatterns(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.detectAndRemovePHIPatterns(item));
    }

    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        let cleanedValue = value;
        
        // Check for PHI patterns
        for (const pattern of PHI_PATTERNS) {
          if (pattern.test(cleanedValue)) {
            console.warn(`[Analytics] Detected PHI pattern in ${key}, redacting`);
            cleanedValue = cleanedValue.replace(pattern, '[REDACTED]');
          }
        }
        
        cleaned[key] = cleanedValue;
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.detectAndRemovePHIPatterns(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  // Convenience methods for common events
  public trackUserEvent(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'user', action, metadata });
  }

  public trackAuthEvent(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'auth', action, metadata });
  }

  public trackSessionEvent(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'session', action, metadata });
  }

  public trackWorkflowEvent(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'workflow', action, metadata });
  }

  public trackFeatureUsage(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'feature', action, metadata });
  }

  public trackPerformance(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'performance', action, metadata });
  }

  public trackError(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'error', action, metadata });
  }

  public trackCost(action: string, metadata?: Record<string, any>) {
    return this.track({ category: 'cost', action, metadata });
  }
}

// Export singleton instance
export const phipaAnalytics = PHIPAAnalytics.getInstance();

// Export convenience functions
export const AnalyticsEvents = {
  // User lifecycle
  userSignup: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackUserEvent('user_signup', metadata),
  
  userLogin: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackUserEvent('user_login', metadata),
  
  userLogout: () => 
    phipaAnalytics.trackUserEvent('user_logout'),
  
  userActivated: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackUserEvent('user_activated', metadata),

  // Session events
  sessionStarted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackSessionEvent('session_started', metadata),
  
  sessionCompleted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackSessionEvent('session_completed', metadata),
  
  sessionAbandoned: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackSessionEvent('session_abandoned', metadata),

  // Recording events
  recordingStarted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('recording_started', metadata),
  
  recordingStopped: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('recording_stopped', metadata),

  // Transcription events
  transcriptionStarted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('transcription_started', metadata),
  
  transcriptionCompleted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('transcription_completed', metadata),
  
  transcriptionFailed: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackError('transcription_failed', metadata),

  // Analysis events
  analysisRequested: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('analysis_requested', metadata),
  
  analysisCompleted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('analysis_completed', metadata),
  
  analysisFailed: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackError('analysis_failed', metadata),

  // Evaluation events
  evaluationPhaseEntered: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('evaluation_phase_entered', metadata),
  
  evaluationTestSelected: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('evaluation_test_selected', metadata),
  
  evaluationTestCompleted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('evaluation_test_completed', metadata),
  
  evaluationSidebarUsed: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackFeatureUsage('evaluation_sidebar_used', metadata),

  // SOAP events
  soapGenerationStarted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('soap_generation_started', metadata),
  
  soapGenerationCompleted: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('soap_generation_completed', metadata),
  
  soapEdited: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('soap_edited', metadata),
  
  soapExported: (metadata?: Record<string, any>) => 
    phipaAnalytics.trackWorkflowEvent('soap_exported', metadata),

  // Performance tracking
  trackPerformance: (metric: string, metadata?: Record<string, any>) => 
    phipaAnalytics.trackPerformance(metric, metadata),

  // Error tracking
  trackError: (error: string, metadata?: Record<string, any>) => 
    phipaAnalytics.trackError(error, metadata),

  // Cost tracking
  trackCost: (service: string, metadata?: Record<string, any>) => 
    phipaAnalytics.trackCost(service, metadata),
};
