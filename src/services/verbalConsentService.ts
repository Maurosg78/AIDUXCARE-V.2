/**
 * Verbal Consent Service - PHIPA Compliant
 * 
 * Manages verbal consent obtained by physiotherapists for voice recording
 * and AI processing of clinical notes.
 * 
 * Security audit logging:
 * - A.8.2.3: Handling of assets (consent lifecycle)
 * - A.12.4.1: Event logging (all consent operations)
 * - A.12.4.2: Protection of log information (encrypted metadata)
 * 
 * PHIPA Compliance:
 * - Verbal consent explicitly legal under PHIPA
 * - Physiotherapist acts as authorized facilitator (circle of care)
 * - Patient retains full control over decision
 * - Once granted = valid for entire treatment
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';

// ✅ Security audit: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export interface VerbalConsentDetails {
  method: 'verbal_via_physiotherapist';
  obtainedBy: string; // Physiotherapist name/ID
  patientResponse: 'authorized' | 'denied' | 'unable_to_respond';
  fullTextRead: string; // Exact consent text read to patient
  patientUnderstood: boolean;
  voluntarilyGiven: boolean;
  witnessName?: string; // Optional: nurse, family member
  notes?: string; // Additional notes about consent obtaining
}

export interface VerbalConsentTimestamps {
  consentObtained: Date | Timestamp;
  readStarted: Date | Timestamp;
  responseGiven: Date | Timestamp;
  documented: Date | Timestamp;
}

export interface VerbalConsentValidity {
  status: 'active' | 'withdrawn' | 'expired';
  validUntil: Date | Timestamp; // Default: end of treatment
  withdrawnDate?: Date | Timestamp;
  withdrawnBy?: string; // Patient or authorized representative
}

export interface VerbalConsentRecord {
  consentId: string;
  patientId: string;
  physiotherapistId: string;
  hospitalId?: string;
  
  consentDetails: VerbalConsentDetails;
  timestamps: VerbalConsentTimestamps;
  validity: VerbalConsentValidity;
  
  audit: {
    createdBy: string;
    lastModified: Date | Timestamp;
    accessLog: Array<{
      timestamp: Date | Timestamp;
      action: 'created' | 'viewed' | 'withdrawn' | 'expired';
      userId: string;
      ipAddress?: string;
    }>;
  };
}

export interface ConsentVerificationResult {
  hasConsent: boolean;
  consentId?: string;
  status?: 'active' | 'withdrawn' | 'expired';
  obtainedDate?: Date;
  obtainedBy?: string;
  validUntil?: Date;
}

/**
 * Consent text that must be read to patient (PHIPA-aware design goal)
 */
export const VERBAL_CONSENT_TEXT = `
Vamos a grabar nuestra sesión de fisioterapia para generar 
automáticamente las notas médicas usando inteligencia artificial.
La grabación se mantiene segura en servidores canadienses.
¿Autoriza esta grabación y procesamiento de sus datos?
`.trim();

export class VerbalConsentService {
  private static readonly COLLECTION_NAME = 'verbal_consents';
  
  /**
   * Check if patient has valid consent
   * ✅ Security audit: All consent checks are logged
   */
  static async hasConsent(
    patientId: string,
    physiotherapistId?: string
  ): Promise<boolean> {
    try {
      const result = await this.verifyConsent(patientId, physiotherapistId);
      
      // ✅ Security audit: Log consent verification
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_verified',
        userId: physiotherapistId || 'system',
        userRole: physiotherapistId ? 'PHYSIOTHERAPIST' : 'SYSTEM',
        patientId,
        metadata: {
          hasConsent: result.hasConsent,
          status: result.status,
          consentId: result.consentId,
          securityLevel: 'medium',
          timestamp: new Date().toISOString(),
        },
      });
      
      return result.hasConsent && result.status === 'active';
    } catch (error) {
      console.error('[VerbalConsent] Error checking consent:', error);
      
      // ✅ Security audit: Log error
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_verification_failed',
        userId: physiotherapistId || 'system',
        userRole: 'SYSTEM',
        patientId,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          securityLevel: 'high',
          timestamp: new Date().toISOString(),
        },
      });
      
      // Fail-safe: Block recording if consent check fails
      return false;
    }
  }

  /**
   * Verify consent with detailed result
   */
  static async verifyConsent(
    patientId: string,
    physiotherapistId?: string
  ): Promise<ConsentVerificationResult> {
    try {
      const consentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        consentsRef,
        where('patientId', '==', patientId),
        where('validity.status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          hasConsent: false,
          status: undefined,
        };
      }

      // Get most recent active consent
      const consentDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data() as VerbalConsentRecord,
        timestamp: doc.data().timestamps?.consentObtained || doc.data().audit?.createdBy
      }));

      // Sort by consent date (most recent first)
      consentDocs.sort((a, b) => {
        const aTime = a.data.timestamps?.consentObtained instanceof Timestamp
          ? a.data.timestamps.consentObtained.toMillis()
          : a.data.timestamps?.consentObtained instanceof Date
          ? a.data.timestamps.consentObtained.getTime()
          : 0;
        const bTime = b.data.timestamps?.consentObtained instanceof Timestamp
          ? b.data.timestamps.consentObtained.toMillis()
          : b.data.timestamps?.consentObtained instanceof Date
          ? b.data.timestamps.consentObtained.getTime()
          : 0;
        return bTime - aTime;
      });

      const latestConsent = consentDocs[0];
      const consentData = latestConsent.data;

      // Check if consent is still valid
      const validUntil = consentData.validity.validUntil instanceof Timestamp
        ? consentData.validity.validUntil.toDate()
        : consentData.validity.validUntil instanceof Date
        ? consentData.validity.validUntil
        : new Date();

      if (validUntil < new Date()) {
        // Consent expired
        await this.expireConsent(latestConsent.id);
        return {
          hasConsent: false,
          status: 'expired',
        };
      }

      const obtainedDate = consentData.timestamps.consentObtained instanceof Timestamp
        ? consentData.timestamps.consentObtained.toDate()
        : consentData.timestamps.consentObtained instanceof Date
        ? consentData.timestamps.consentObtained
        : new Date();

      return {
        hasConsent: true,
        consentId: latestConsent.id,
        status: 'active',
        obtainedDate,
        obtainedBy: consentData.consentDetails.obtainedBy,
        validUntil,
      };
    } catch (error) {
      console.error('[VerbalConsent] Error verifying consent:', error);
      return {
        hasConsent: false,
      };
    }
  }

  /**
   * Obtain verbal consent from patient
   * ✅ Security audit: All consent operations are logged
   */
  static async obtainConsent(
    patientId: string,
    physiotherapistId: string,
    consentDetails: Omit<VerbalConsentDetails, 'method'>,
    options?: {
      hospitalId?: string;
      validUntil?: Date; // Default: 1 year from now
    }
  ): Promise<{ consentId: string; success: boolean }> {
    try {
      // Validate consent details
      if (consentDetails.patientResponse !== 'authorized') {
        throw new Error('Patient must authorize consent to proceed');
      }

      if (!consentDetails.patientUnderstood || !consentDetails.voluntarilyGiven) {
        throw new Error('Consent must be understood and voluntarily given');
      }

      // Generate consent ID
      const consentId = `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set validity period (default: 1 year from now)
      const validUntil = options?.validUntil || new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const now = Timestamp.now();
      const consentRecord: Omit<VerbalConsentRecord, 'consentDetails' | 'timestamps' | 'validity' | 'audit'> & {
        consentDetails: VerbalConsentDetails;
        timestamps: Omit<VerbalConsentTimestamps, 'consentObtained' | 'readStarted' | 'responseGiven' | 'documented'> & {
          consentObtained: any;
          readStarted: any;
          responseGiven: any;
          documented: any;
        };
        validity: Omit<VerbalConsentValidity, 'validUntil'> & {
          validUntil: any;
        };
        audit: {
          createdBy: string;
          lastModified: any;
          accessLog: any[];
        };
      } = {
        consentId,
        patientId,
        physiotherapistId,
        hospitalId: options?.hospitalId,
        consentDetails: {
          method: 'verbal_via_physiotherapist',
          ...consentDetails,
        },
        timestamps: {
          consentObtained: now,
          readStarted: consentDetails.fullTextRead ? now : serverTimestamp(),
          responseGiven: now,
          documented: now,
        },
        validity: {
          status: 'active',
          validUntil: Timestamp.fromDate(validUntil),
        },
        audit: {
          createdBy: physiotherapistId,
          lastModified: now,
          accessLog: [{
            timestamp: now,
            action: 'created',
            userId: physiotherapistId,
          }],
        },
      };

      // Save to Firestore
      const consentRef = doc(db, this.COLLECTION_NAME, consentId);
      await setDoc(consentRef, consentRecord);

      // ✅ Security audit: Log consent obtained
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_obtained',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        patientId,
        metadata: {
          consentId,
          method: 'verbal_via_physiotherapist',
          patientResponse: consentDetails.patientResponse,
          patientUnderstood: consentDetails.patientUnderstood,
          voluntarilyGiven: consentDetails.voluntarilyGiven,
          witnessName: consentDetails.witnessName,
          validUntil: validUntil.toISOString(),
          securityLevel: 'critical',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`[VerbalConsent] Consent obtained: ${consentId} for patient ${patientId}`);

      return { consentId, success: true };
    } catch (error) {
      console.error('[VerbalConsent] Error obtaining consent:', error);
      
      // ✅ Security audit: Log error
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_obtain_failed',
        userId: physiotherapistId,
        userRole: 'PHYSIOTHERAPIST',
        patientId,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          securityLevel: 'high',
          timestamp: new Date().toISOString(),
        },
      });
      
      throw error;
    }
  }

  /**
   * Withdraw consent (patient right)
   * ✅ Security audit: All withdrawals are logged
   */
  static async withdrawConsent(
    patientId: string,
    consentId: string,
    withdrawnBy: string, // Patient ID or authorized representative
    reason?: string
  ): Promise<boolean> {
    try {
      const consentRef = doc(db, this.COLLECTION_NAME, consentId);
      const consentSnap = await getDoc(consentRef);

      if (!consentSnap.exists()) {
        throw new Error('Consent not found');
      }

      const consentData = consentSnap.data() as VerbalConsentRecord;

      if (consentData.patientId !== patientId) {
        throw new Error('Consent does not belong to this patient');
      }

      if (consentData.validity.status === 'withdrawn') {
        return true; // Already withdrawn
      }

      // Update consent status
      await updateDoc(consentRef, {
        'validity.status': 'withdrawn',
        'validity.withdrawnDate': Timestamp.now(),
        'validity.withdrawnBy': withdrawnBy,
        'audit.lastModified': Timestamp.now(),
        'audit.accessLog': [
          ...(consentData.audit.accessLog || []),
          {
            timestamp: Timestamp.now(),
            action: 'withdrawn',
            userId: withdrawnBy,
          },
        ],
      });

      // ✅ Security audit: Log consent withdrawal
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_withdrawn',
        userId: withdrawnBy,
        userRole: 'PATIENT',
        patientId,
        metadata: {
          consentId,
          reason,
          withdrawnBy,
          securityLevel: 'critical',
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`[VerbalConsent] Consent withdrawn: ${consentId} by ${withdrawnBy}`);

      return true;
    } catch (error) {
      console.error('[VerbalConsent] Error withdrawing consent:', error);
      
      // ✅ Security audit: Log error
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_withdrawal_failed',
        userId: withdrawnBy,
        userRole: 'PATIENT',
        patientId,
        metadata: {
          consentId,
          error: error instanceof Error ? error.message : 'Unknown error',
          securityLevel: 'high',
          timestamp: new Date().toISOString(),
        },
      });
      
      return false;
    }
  }

  /**
   * Expire consent (automatic or manual)
   */
  private static async expireConsent(consentId: string): Promise<void> {
    try {
      const consentRef = doc(db, this.COLLECTION_NAME, consentId);
      const consentSnap = await getDoc(consentRef);

      if (!consentSnap.exists()) {
        return;
      }

      const consentData = consentSnap.data() as VerbalConsentRecord;

      await updateDoc(consentRef, {
        'validity.status': 'expired',
        'audit.lastModified': Timestamp.now(),
        'audit.accessLog': [
          ...(consentData.audit.accessLog || []),
          {
            timestamp: Timestamp.now(),
            action: 'expired',
            userId: 'system',
          },
        ],
      });

      // ✅ Security audit: Log consent expiration
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'verbal_consent_expired',
        userId: 'system',
        userRole: 'SYSTEM',
        patientId: consentData.patientId,
        metadata: {
          consentId,
          securityLevel: 'medium',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[VerbalConsent] Error expiring consent:', error);
    }
  }

  /**
   * Get consent history for a patient
   */
  static async getConsentHistory(patientId: string): Promise<VerbalConsentRecord[]> {
    try {
      const consentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(consentsRef, where('patientId', '==', patientId));
      
      const snapshot = await getDocs(q);
      const consents: VerbalConsentRecord[] = [];

      snapshot.forEach((doc) => {
        consents.push(doc.data() as VerbalConsentRecord);
      });

      // Sort by date (newest first)
      consents.sort((a, b) => {
        const aTime = a.timestamps.consentObtained instanceof Timestamp
          ? a.timestamps.consentObtained.toMillis()
          : a.timestamps.consentObtained instanceof Date
          ? a.timestamps.consentObtained.getTime()
          : 0;
        const bTime = b.timestamps.consentObtained instanceof Timestamp
          ? b.timestamps.consentObtained.toMillis()
          : b.timestamps.consentObtained instanceof Date
          ? b.timestamps.consentObtained.getTime()
          : 0;
        return bTime - aTime;
      });

      return consents;
    } catch (error) {
      console.error('[VerbalConsent] Error getting consent history:', error);
      return [];
    }
  }
}

export default VerbalConsentService;

