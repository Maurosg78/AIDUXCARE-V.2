/**
 * Cross-Border AI Consent Service
 * 
 * Manages explicit consent for cross-border AI processing (OpenAI/Vertex AI)
 * Required for PHIPA s. 18 compliance (cross-border processing with express consent)
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

export interface CrossBorderAIConsent {
  userId: string;
  patientId?: string; // NEW: Patient-specific consent (for first session)
  consentDate: Date;
  consented: boolean;
  consentScope: 'ongoing' | 'session-only'; // NEW: Ongoing for all future sessions or just this one
  cloudActAcknowledged: boolean; // Required: CLOUD Act risk disclosure
  consentVersion: string; // For future consent updates
  dataRetentionAcknowledged: boolean; // Required: 10+ years retention disclosure
  rightToWithdrawAcknowledged: boolean; // Required: right to withdraw disclosure
  complaintRightsAcknowledged: boolean; // Required: IPC Ontario complaint rights
  userAgent?: string;
  ipAddress?: string;
}

export interface ConsentStatus {
  hasConsent: boolean;
  consentDate: Date | null;
  isExpired: boolean;
  consentVersion: string | null;
}

const CONSENT_VERSION = '1.0.0'; // Update when consent terms change
const CONSENT_STORAGE_KEY = 'aiduxcare_crossborder_ai_consent';
const PATIENT_CONSENT_STORAGE_KEY_PREFIX = 'aiduxcare_patient_ai_consent_'; // For patient-specific consent
const CONSENT_EXPIRATION_DAYS = 365; // Consent valid for 1 year (can be adjusted)

/**
 * Cross-Border AI Consent Service
 * 
 * Handles consent for AI processing that requires cross-border data transfer
 * (Google Vertex AI, OpenAI) with US CLOUD Act disclosure
 */
export class CrossBorderAIConsentService {
  private static instance: CrossBorderAIConsentService;

  private constructor() {}

  public static getInstance(): CrossBorderAIConsentService {
    if (!CrossBorderAIConsentService.instance) {
      CrossBorderAIConsentService.instance = new CrossBorderAIConsentService();
    }
    return CrossBorderAIConsentService.instance;
  }

  /**
   * Check if user has consented to cross-border AI processing
   * 
   * @param userId - User ID to check consent for
   * @param patientId - Optional patient ID for patient-specific consent
   * @returns true if user/patient has valid consent, false otherwise
   */
  static hasConsented(userId: string, patientId?: string): boolean {
    try {
      // If patientId provided, check patient-specific consent first
      if (patientId) {
        const patientStatus = CrossBorderAIConsentService.getPatientConsentStatus(patientId);
        if (patientStatus.hasConsent && !patientStatus.isExpired) {
          return true; // Patient has ongoing consent
        }
      }
      
      // Fallback to user-level consent
      const status = CrossBorderAIConsentService.getConsentStatus(userId);
      return status.hasConsent && !status.isExpired;
    } catch (error) {
      console.error('❌ [CROSS-BORDER CONSENT] Error checking consent:', error);
      return false; // Fail-safe: no consent = block AI processing
    }
  }

  /**
   * Save consent for cross-border AI processing
   * 
   * @param consent - Consent data to save
   * @returns Promise that resolves when consent is saved
   */
  static saveConsent(consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'>): void {
    try {
      // Validate consent - all acknowledgments must be true
      if (!consent.consented) {
        throw new Error('User must explicitly consent to cross-border AI processing');
      }
      if (!consent.cloudActAcknowledged) {
        throw new Error('CLOUD Act risk must be acknowledged');
      }
      if (!consent.dataRetentionAcknowledged) {
        throw new Error('Data retention (10+ years) must be acknowledged');
      }
      if (!consent.rightToWithdrawAcknowledged) {
        throw new Error('Right to withdraw must be acknowledged');
      }
      if (!consent.complaintRightsAcknowledged) {
        throw new Error('Complaint rights (IPC Ontario) must be acknowledged');
      }

      // Prepare consent with metadata
      const consentData: CrossBorderAIConsent = {
        ...consent,
        consentDate: new Date(),
        consentVersion: CONSENT_VERSION,
        consentScope: consent.consentScope || 'ongoing', // Default to ongoing
        userAgent: navigator.userAgent,
        // IP address would be obtained from backend in production
        ipAddress: 'client-side',
      };

      // If patientId provided, save patient-specific consent
      if (consent.patientId) {
        const patientKey = `${PATIENT_CONSENT_STORAGE_KEY_PREFIX}${consent.patientId}`;
        localStorage.setItem(patientKey, JSON.stringify(consentData));
        console.log('[CROSS-BORDER CONSENT] Patient-specific consent saved:', {
          patientId: consent.patientId,
          scope: consentData.consentScope,
          version: CONSENT_VERSION,
        });
      }

      // Also save user-level consent (for backward compatibility)
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));

      console.log('[CROSS-BORDER CONSENT] Consent saved successfully:', {
        userId: consent.userId,
        patientId: consent.patientId || 'none',
        scope: consentData.consentScope,
        version: CONSENT_VERSION,
        date: consentData.consentDate,
      });

      // TODO: Send to audit service for compliance logging
      // AuditService.log({
      //   userId: consent.userId,
      //   patientId: consent.patientId,
      //   action: 'consent_given',
      //   timestamp: new Date(),
      //   metadata: { consentVersion: CONSENT_VERSION, scope: consentData.consentScope },
      // });
    } catch (error) {
      console.error('❌ [CROSS-BORDER CONSENT] Error saving consent:', error);
      throw error; // Re-throw for error handling in UI
    }
  }

  /**
   * Get patient-specific consent status
   * 
   * @param patientId - Patient ID to check consent for
   * @returns ConsentStatus object with consent details
   */
  static getPatientConsentStatus(patientId: string): ConsentStatus {
    try {
      const patientKey = `${PATIENT_CONSENT_STORAGE_KEY_PREFIX}${patientId}`;
      const stored = localStorage.getItem(patientKey);
      if (!stored) {
        return {
          hasConsent: false,
          consentDate: null,
          isExpired: false,
          consentVersion: null,
        };
      }

      const consent = JSON.parse(stored) as CrossBorderAIConsent;
      
      // Check if consent is expired
      const consentDate = new Date(consent.consentDate);
      const expirationDate = new Date(consentDate);
      expirationDate.setDate(expirationDate.getDate() + CONSENT_EXPIRATION_DAYS);
      const isExpired = new Date() > expirationDate;

      // Check if consent version matches current version
      const versionMatches = consent.consentVersion === CONSENT_VERSION;

      // For ongoing consent, check if still valid
      const isValid = consent.consentScope === 'ongoing' || !isExpired;

      return {
        hasConsent: consent.consented && versionMatches && isValid,
        consentDate: consentDate,
        isExpired,
        consentVersion: consent.consentVersion,
      };
    } catch (error) {
      console.error('❌ [CROSS-BORDER CONSENT] Error getting patient consent status:', error);
      return {
        hasConsent: false,
        consentDate: null,
        isExpired: false,
        consentVersion: null,
      };
    }
  }

  /**
   * Get consent status for a user
   * 
   * @param userId - User ID to get consent status for
   * @returns ConsentStatus object with consent details
   */
  static getConsentStatus(userId: string): ConsentStatus {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        return {
          hasConsent: false,
          consentDate: null,
          isExpired: false,
          consentVersion: null,
        };
      }

      const consent = JSON.parse(stored) as CrossBorderAIConsent;
      
      // Check if consent is for this user
      if (consent.userId !== userId) {
        return {
          hasConsent: false,
          consentDate: null,
          isExpired: false,
          consentVersion: null,
        };
      }

      // Check if consent is expired
      const consentDate = new Date(consent.consentDate);
      const expirationDate = new Date(consentDate);
      expirationDate.setDate(expirationDate.getDate() + CONSENT_EXPIRATION_DAYS);
      const isExpired = new Date() > expirationDate;

      // Check if consent version matches current version
      const versionMatches = consent.consentVersion === CONSENT_VERSION;

      return {
        hasConsent: consent.consented && versionMatches && !isExpired,
        consentDate: consentDate,
        isExpired,
        consentVersion: consent.consentVersion,
      };
    } catch (error) {
      console.error('❌ [CROSS-BORDER CONSENT] Error getting consent status:', error);
      return {
        hasConsent: false,
        consentDate: null,
        isExpired: false,
        consentVersion: null,
      };
    }
  }

  /**
   * Check if consent is valid (not expired, correct version, user matches)
   * 
   * @param userId - User ID to validate consent for
   * @returns true if consent is valid, false otherwise
   */
  static isConsentValid(userId: string): boolean {
    const status = CrossBorderAIConsentService.getConsentStatus(userId);
    return status.hasConsent && !status.isExpired;
  }

  /**
   * Revoke consent for cross-border AI processing
   * 
   * @param userId - User ID to revoke consent for
   */
  static revokeConsent(userId: string): void {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const consent = JSON.parse(stored) as CrossBorderAIConsent;
        // Only revoke if it's for this user
        if (consent.userId === userId) {
          localStorage.removeItem(CONSENT_STORAGE_KEY);
          console.log('[CROSS-BORDER CONSENT] Consent revoked for user:', userId);

          // TODO: Send to audit service for compliance logging
          // AuditService.log({
          //   userId,
          //   action: 'consent_revoked',
          //   timestamp: new Date(),
          // });
        }
      }
    } catch (error) {
      console.error('❌ [CROSS-BORDER CONSENT] Error revoking consent:', error);
      throw error;
    }
  }

  /**
   * Get current consent version
   * 
   * @returns Current consent version string
   */
  static getConsentVersion(): string {
    return CONSENT_VERSION;
  }

  /**
   * Check if consent needs to be renewed (expired or version mismatch)
   * 
   * @param userId - User ID to check
   * @returns true if consent needs renewal, false otherwise
   */
  static needsRenewal(userId: string): boolean {
    const status = CrossBorderAIConsentService.getConsentStatus(userId);
    return status.isExpired || status.consentVersion !== CONSENT_VERSION;
  }
}

// Export singleton instance
export const crossBorderAIConsentService = CrossBorderAIConsentService.getInstance();

