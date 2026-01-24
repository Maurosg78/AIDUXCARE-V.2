/**
 * Patient Consent Service
 * 
 * Manages patient consent tokens and consent records for PHIPA-compliant
 * cross-border AI processing consent via SMS/Portal approach.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

// UUID generator - uses crypto.randomUUID if available, otherwise fallback
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface PatientConsentToken {
  token: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  clinicName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  consentGiven?: {
    scope: 'ongoing' | 'session-only' | 'declined';
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    digitalSignature?: string;
  };
}

export interface PatientConsent {
  patientId: string;
  patientName: string;
  clinicName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  consentScope: 'ongoing' | 'session-only' | 'declined';
  consented: boolean;
  consentDate: Date;
  consentVersion: string;
  tokenUsed: string; // Reference to consent token
  digitalSignature?: string;
  ipAddress?: string;
  userAgent?: string;
  languageUsed?: string; // ✅ Phase 2: Language used for consent ('en' | 'fr' | 'es')
  obtainmentMethod?: 'SMS' | 'Portal' | 'Email' | 'Manual'; // ✅ Phase 2: Method used to obtain consent
}

// Bloque 1: Tipo de documento Firestore para PatientConsent
type PatientConsentDoc = {
  consentVersion?: string;
  consentDate?: Timestamp | { toDate(): Date };
  consentScope?: 'ongoing' | 'session-only' | 'declined';
  patientId?: string;
  patientName?: string;
  [key: string]: any; // Para campos adicionales que puedan existir
};

const CONSENT_VERSION = '1.0.0';
const TOKEN_EXPIRATION_DAYS = 7; // Token valid for 7 days
const TOKEN_COLLECTION = 'patient_consent_tokens';
const CONSENT_COLLECTION = 'patient_consent'; // ✅ Canonical collection (matches Cloud Function)

/**
 * Patient Consent Service
 * 
 * Handles generation of consent tokens, SMS delivery, and consent record management
 */
export class PatientConsentService {
  /**
   * Generate a unique consent token for a patient
   * 
   * @param patientId - Patient ID
   * @param patientName - Patient name
   * @param patientPhone - Patient phone number (for SMS)
   * @param patientEmail - Patient email (optional, for email fallback)
   * @param clinicName - Clinic name
   * @param physiotherapistId - Physiotherapist user ID
   * @param physiotherapistName - Physiotherapist name
   * @param sessionId - Optional session ID (for first session tracking)
   * @returns Promise<string> - Unique consent token
   */
  static async generateConsentToken(
    patientId: string,
    patientName: string,
    patientPhone?: string,
    patientEmail?: string,
    clinicName: string = 'AiduxCare Clinic',
    physiotherapistId: string = 'temp-user',
    physiotherapistName: string = 'Your physiotherapist',
    sessionId?: string
  ): Promise<string> {
    try {
      // Prioridad 1.1: Hardening - asegurar nombre seguro con fallback
      const safePhysioName = (physiotherapistName || '').trim() || 'Your physiotherapist';

      // Generate unique token
      const token = generateUUID();

      // Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRATION_DAYS);

      // Create token document
      const tokenData: Omit<PatientConsentToken, 'createdAt' | 'expiresAt'> & {
        createdAt: any;
        expiresAt: any;
      } = {
        token,
        patientId,
        patientName,
        patientPhone: patientPhone || null,
        patientEmail: patientEmail || null,
        clinicName,
        physiotherapistId,
        physiotherapistName: safePhysioName,
        sessionId: sessionId || null,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        used: false,
      };

      // Save to Firestore
      const tokenRef = doc(db, TOKEN_COLLECTION, token);
      await setDoc(tokenRef, tokenData);

      console.log('[PATIENT CONSENT] Token generated:', {
        token,
        patientId,
        patientName,
        expiresAt: expiresAt.toISOString(),
      });

      return token;
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error generating token:', error);
      throw new Error('Failed to generate consent token');
    }
  }

  /**
   * Get consent token data by token string
   * 
   * @param token - Consent token
   * @returns Promise<PatientConsentToken | null>
   */
  static async getConsentByToken(token: string): Promise<PatientConsentToken | null> {
    try {
      const tokenRef = doc(db, TOKEN_COLLECTION, token);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) {
        return null;
      }

      const data = tokenSnap.data();

      // Check if token is expired
      const expiresAt = data.expiresAt?.toDate();
      if (expiresAt && new Date() > expiresAt) {
        console.warn('[PATIENT CONSENT] Token expired:', token);
        return null;
      }

      // Check if token is already used
      if (data.used) {
        console.warn('[PATIENT CONSENT] Token already used:', token);
        return null;
      }

      return {
        token: data.token,
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail,
        clinicName: data.clinicName,
        physiotherapistId: data.physiotherapistId,
        physiotherapistName: data.physiotherapistName,
        sessionId: data.sessionId,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        used: data.used || false,
        consentGiven: data.consentGiven ? {
          scope: data.consentGiven.scope,
          timestamp: data.consentGiven.timestamp?.toDate() || new Date(),
          ipAddress: data.consentGiven.ipAddress,
          userAgent: data.consentGiven.userAgent,
          digitalSignature: data.consentGiven.digitalSignature,
        } : undefined,
      };
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error getting token:', error);
      return null;
    }
  }

  /**
   * Record patient consent decision
   * 
   * @param token - Consent token
   * @param scope - Consent scope (ongoing, session-only, or declined)
   * @param digitalSignature - Optional digital signature
   * @param languageUsed - Language used for consent ('en' | 'fr' | 'es')
   * @param obtainmentMethod - Method used to obtain consent ('SMS' | 'Portal' | 'Email' | 'Manual')
   * @returns Promise<void>
   */
  static async recordConsent(
    token: string,
    scope: 'ongoing' | 'session-only' | 'declined',
    digitalSignature?: string,
    languageUsed?: string,
    obtainmentMethod?: 'SMS' | 'Portal' | 'Email' | 'Manual'
  ): Promise<void> {
    try {
      console.log('[PATIENT CONSENT] recordConsent called:', { token, scope, hasSignature: !!digitalSignature });
      
      // Get token data
      const tokenData = await PatientConsentService.getConsentByToken(token);
      if (!tokenData) {
        console.error('[PATIENT CONSENT] Token not found or invalid:', token);
        throw new Error('Invalid or expired token');
      }

      console.log('[PATIENT CONSENT] Token data retrieved:', { patientId: tokenData.patientId, used: tokenData.used });

      // ✅ CRITICAL FIX: Mark token as used (may fail on mobile if not authenticated, but consent record creation should still work)
      const tokenRef = doc(db, TOKEN_COLLECTION, token);
      const usedAt = new Date();
      try {
        await setDoc(tokenRef, {
          used: true,
          usedAt: serverTimestamp(),
          consentGiven: {
            scope,
            timestamp: serverTimestamp(),
            ipAddress: 'client-side', // TODO: Get from backend in production
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            ...(digitalSignature && digitalSignature.trim() ? { digitalSignature: digitalSignature.trim() } : {}),
          },
        }, { merge: true });
        console.log('[PATIENT CONSENT] Token marked as used successfully');
      } catch (tokenError: any) {
        // ✅ FIX: If token update fails (e.g., permission denied on mobile), log but continue
        // The consent record creation is more important and should still work
        console.warn('[PATIENT CONSENT] Failed to mark token as used (may be permission issue on mobile):', tokenError);
        // Don't throw - continue to create consent record
      }

      // Create consent record
      const consented = scope !== 'declined';

      // Build consent record - only include optional fields if provided (Firestore doesn't accept undefined)
      const consentRecord: any = {
        patientId: tokenData.patientId,
        patientName: tokenData.patientName,
        clinicName: tokenData.clinicName,
        physiotherapistId: tokenData.physiotherapistId,
        physiotherapistName: tokenData.physiotherapistName,
        consentScope: scope,
        consented,
        consentDate: serverTimestamp(),
        consentVersion: CONSENT_VERSION,
        tokenUsed: token,
        ipAddress: 'client-side', // TODO: Get from backend
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };

      // Only add optional fields if they exist
      if (digitalSignature && digitalSignature.trim()) {
        consentRecord.digitalSignature = digitalSignature.trim();
      }

      // ✅ Phase 2: Add language and method fields
      if (languageUsed) {
        consentRecord.languageUsed = languageUsed;
      }

      if (obtainmentMethod) {
        consentRecord.obtainmentMethod = obtainmentMethod;
      }

      const consentRef = doc(db, CONSENT_COLLECTION, `${tokenData.patientId}_${Date.now()}`);
      console.log('[PATIENT CONSENT] Attempting to create consent record:', {
        patientId: tokenData.patientId,
        scope,
        consented,
        consentId: consentRef.id,
      });
      
      await setDoc(consentRef, consentRecord);

      console.log('[PATIENT CONSENT] ✅ Consent recorded successfully:', {
        patientId: tokenData.patientId,
        scope,
        consented,
        consentId: consentRef.id,
      });
    } catch (error: any) {
      console.error('❌ [PATIENT CONSENT] Error recording consent:', error);
      console.error('❌ [PATIENT CONSENT] Error details:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      });
      
      // ✅ FIX: Provide more specific error messages for mobile debugging
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied. Please ensure you are accessing the consent link correctly.');
      } else if (error?.code === 'unavailable') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error?.message?.includes('Invalid or expired token')) {
        throw new Error('Invalid or expired token. Please request a new consent link from your clinic.');
      }
      
      throw error;
    }
  }

  /**
   * Check if patient has valid ongoing consent
   * 
   * @deprecated WO-CONSENT-CLEANUP-03: This function is DEPRECATED. Use checkConsentViaServer() from consentServerService instead.
   * This function attempts to read Firestore directly, which violates security rules.
   * ALL consent checks MUST go through Cloud Functions (server-side).
   * 
   * @param patientId - Patient ID
   * @returns Promise<boolean>
   */
  static async hasConsent(patientId: string, professionalId?: string): Promise<boolean> {
    console.error('❌ [DEPRECATED] PatientConsentService.hasConsent() is DEPRECATED. Use checkConsentViaServer() from consentServerService instead.');
    console.error('❌ This function violates WO-CONSENT-CLEANUP-03: All consent checks MUST go through Cloud Functions.');
    throw new Error('PatientConsentService.hasConsent() is deprecated. Use checkConsentViaServer() from consentServerService instead.');
    try {
      // ✅ Get current user for security filter (required by Firestore rules)
      const currentUser = auth.currentUser;
      const userId = professionalId || currentUser?.uid;
      
      if (!userId) {
        console.warn('[PATIENT CONSENT] User not authenticated, cannot check consent');
        return false;
      }

      const consentRef = collection(db, CONSENT_COLLECTION);
      // ✅ Query by patientId AND professionalId (required by Firestore rules)
      // Filter by status in memory to avoid composite index requirement
      const q = query(
        consentRef,
        where('patientId', '==', patientId),
        where('professionalId', '==', userId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return false;
      }

      // Filter in memory: status === 'granted' and valid version
      const consents = snapshot.docs
        .map(doc => doc.data())
        .filter(consent => {
          const status = consent.consentStatus || consent.status;
          return status === 'granted';
        })
        .filter(consent => 
          consent.consentVersion === CONSENT_VERSION || 
          consent.consentTextVersion === CONSENT_VERSION
        );

      return consents.length > 0;
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error checking consent:', error);
      return false; // Fail-safe: no consent = block AI processing
    }
  }

  /**
   * Get current consent status for a patient
   * 
   * @deprecated WO-CONSENT-CLEANUP-03: This function is DEPRECATED. Use checkConsentViaServer() from consentServerService instead.
   * This function attempts to read Firestore directly, which violates security rules.
   * ALL consent checks MUST go through Cloud Functions (server-side).
   * 
   * @param patientId - Patient ID
   * @returns Promise with consent status: 'ongoing' | 'session-only' | 'declined' | null
   */
  static async getConsentStatus(patientId: string, professionalId?: string): Promise<'ongoing' | 'session-only' | 'declined' | null> {
    console.error('❌ [DEPRECATED] PatientConsentService.getConsentStatus() is DEPRECATED. Use checkConsentViaServer() from consentServerService instead.');
    console.error('❌ This function violates WO-CONSENT-CLEANUP-03: All consent checks MUST go through Cloud Functions.');
    throw new Error('PatientConsentService.getConsentStatus() is deprecated. Use checkConsentViaServer() from consentServerService instead.');
    try {
      // ✅ Get current user for security filter (required by Firestore rules)
      const currentUser = auth.currentUser;
      const userId = professionalId || currentUser?.uid;
      
      if (!userId) {
        console.warn('[PATIENT CONSENT] User not authenticated, cannot get consent status');
        return null;
      }

      const consentRef = collection(db, CONSENT_COLLECTION);
      // ✅ Query by patientId AND professionalId (required by Firestore rules)
      // Filter by status in memory to avoid composite index requirement
      const q = query(
        consentRef,
        where('patientId', '==', patientId),
        where('professionalId', '==', userId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Get the most recent consent with status === 'granted'
      // Bloque 1: Mapeo con tipo correcto para Firestore docs
      const consents = snapshot.docs
        .map(doc => {
          const data = doc.data() as PatientConsentDoc;
          return { id: doc.id, ...data };
        })
        .filter(consent => {
          const status = consent.consentStatus || (consent as any).status;
          return status === 'granted';
        })
        .filter(consent => 
          consent.consentVersion === CONSENT_VERSION || 
          (consent as any).consentTextVersion === CONSENT_VERSION
        )
        .sort((a, b) => {
          const aDate = a.consentDate?.toDate?.() || new Date(0);
          const bDate = b.consentDate?.toDate?.() || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });

      if (consents.length === 0) {
        return null;
      }

      const latestConsent = consents[0];
      return latestConsent.consentScope || null;
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error getting consent status:', error);
      return null;
    }
  }

  /**
   * Mark consent as authorized manually by physiotherapist
   * Used when patient reads document in clinic and physio marks as authorized
   * 
   * @param token - Consent token
   * @param scope - Consent scope (ongoing or session-only)
   * @param physiotherapistId - Physiotherapist ID who is authorizing
   * @returns Promise<void>
   */
  static async markConsentAsAuthorized(
    token: string,
    scope: 'ongoing' | 'session-only',
    physiotherapistId: string
  ): Promise<void> {
    try {
      // Get token data
      const tokenData = await PatientConsentService.getConsentByToken(token);
      if (!tokenData) {
        throw new Error('Invalid or expired token');
      }

      // Verify physiotherapist matches
      if (tokenData.physiotherapistId !== physiotherapistId) {
        throw new Error('Unauthorized: Physiotherapist mismatch');
      }

      // Mark token as used
      const tokenRef = doc(db, TOKEN_COLLECTION, token);
      await setDoc(tokenRef, {
        used: true,
        consentGiven: {
          scope,
          timestamp: serverTimestamp(),
          ipAddress: 'manual-authorization',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          digitalSignature: `Authorized by ${physiotherapistId}`,
        },
      }, { merge: true });

      // Create consent record
      const consentRecord: any = {
        patientId: tokenData.patientId,
        patientName: tokenData.patientName,
        clinicName: tokenData.clinicName,
        physiotherapistId: tokenData.physiotherapistId,
        physiotherapistName: tokenData.physiotherapistName,
        consentScope: scope,
        consented: true,
        consentDate: serverTimestamp(),
        consentVersion: CONSENT_VERSION,
        tokenUsed: token,
        ipAddress: 'manual-authorization',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        digitalSignature: `Authorized by ${physiotherapistId}`,
        authorizedByPhysiotherapist: true,
      };

      const consentRef = doc(db, CONSENT_COLLECTION, `${tokenData.patientId}_${Date.now()}`);
      await setDoc(consentRef, consentRecord);

      console.log('[PATIENT CONSENT] Consent authorized manually:', {
        patientId: tokenData.patientId,
        scope,
        physiotherapistId,
      });
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error authorizing consent:', error);
      throw error;
    }
  }

  /**
   * Record manual consent (without SMS token)
   * Used when physiotherapist obtains consent verbally or in person
   * 
   * @param patientId - Patient ID
   * @param physiotherapistId - Physiotherapist ID who obtained consent
   * @param scope - Consent scope (default: 'ongoing')
   * @returns Promise<void>
   */
  static async recordManualConsent(
    patientId: string,
    physiotherapistId: string,
    scope: 'ongoing' | 'session-only' = 'ongoing'
  ): Promise<void> {
    try {
      // Get patient data
      const patientRef = doc(db, 'patients', patientId);
      const patientSnap = await getDoc(patientRef);
      const patientData = patientSnap.data();

      // Get physiotherapist data
      const physioRef = doc(db, 'professional_profiles', physiotherapistId);
      const physioSnap = await getDoc(physioRef);
      const physioData = physioSnap.data();

      // Create consent record without token
      const consentRecord: any = {
        patientId,
        patientName: patientData?.fullName || patientData?.firstName || 'Unknown',
        clinicName: physioData?.clinicName || physioData?.practiceName || 'Unknown Clinic',
        physiotherapistId,
        physiotherapistName: physioData?.displayName || physioData?.firstName || 'Unknown',
        consentScope: scope,
        consented: true,
        consentDate: serverTimestamp(),
        consentVersion: CONSENT_VERSION,
        obtainmentMethod: 'Manual',
        ipAddress: 'manual-authorization',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        digitalSignature: `Manual consent recorded by ${physiotherapistId}`,
        authorizedByPhysiotherapist: true,
      };

      const consentRef = doc(db, CONSENT_COLLECTION, `${patientId}_${Date.now()}`);
      await setDoc(consentRef, consentRecord);

      console.log('[PATIENT CONSENT] Manual consent recorded:', {
        patientId,
        scope,
        physiotherapistId,
      });
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error recording manual consent:', error);
      throw error;
    }
  }

  /**
   * Get current consent version
   * 
   * @returns Current consent version string
   */

  /**
   * Record verbal consent (granted or declined)
   * PHIPA/PIPEDA compliant with audit trail
   * 
   * @param details - Verbal consent details including status and reasons
   */
  static async recordVerbalConsent(details: {
    patientId: string;
    professionalId: string;
    patientName: string;
    consentStatus: 'granted' | 'declined';
    consentTextVersion: string;
    witnessStatement: string;
    patientUnderstanding?: string;
    declineReasons?: string;
    declineNotes?: string;
  }): Promise<void> {
    try {
      const consentRecord: any = {
        patientId: details.patientId,
        patientName: details.patientName,
        professionalId: details.professionalId,
        consentMethod: 'verbal',
        consentStatus: details.consentStatus,
        status: details.consentStatus, // For query compatibility
        consentTextVersion: details.consentTextVersion,
        witnessStatement: details.witnessStatement,
        patientUnderstanding: details.patientUnderstanding || null,
        consentDate: serverTimestamp(),
        consentVersion: CONSENT_VERSION,
        obtainmentMethod: 'Verbal',
        jurisdiction: 'CA-ON',
        
        // Declined consent fields (PHIPA compliance requirement)
        ...(details.consentStatus === 'declined' && {
          declineReasons: details.declineReasons,
          declineNotes: details.declineNotes || null,
          declinedAt: serverTimestamp(),
        }),
        
        // Granted consent fields
        ...(details.consentStatus === 'granted' && {
          consented: true,
          consentScope: 'ongoing',
          authorizedByPhysiotherapist: true,
        }),
      };

      const consentRef = doc(db, 'patient_consent', `${details.patientId}_${Date.now()}`);
      await setDoc(consentRef, consentRecord);

      console.log('[PATIENT CONSENT] Verbal consent recorded:', {
        patientId: details.patientId,
        status: details.consentStatus,
        method: 'verbal',
      });
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error recording verbal consent:', error);
      throw error;
    }
  }
  static getConsentVersion(): string {
    return CONSENT_VERSION;
  }

  /**
   * Record SMS consent request (state: sms_requested)
   * Called when SMS is successfully sent to patient
   * 
   * @param patientId - Patient ID
   * @param professionalId - Professional ID
   * @param patientName - Patient name
   * @param token - Consent token that was sent
   * @returns Promise<void>
   */
  static async recordSMSConsentRequest(
    patientId: string,
    professionalId: string,
    patientName: string,
    token: string
  ): Promise<void> {
    try {
      const consentRecord: any = {
        patientId,
        patientName,
        professionalId,
        consentMethod: 'digital',
        consentStatus: 'sms_requested',
        status: 'sms_requested', // For query compatibility
        consentTextVersion: CONSENT_VERSION,
        requestedAt: serverTimestamp(),
        tokenUsed: token,
        jurisdiction: 'CA-ON',
        consented: false, // Not yet granted
      };

      const consentRef = doc(db, 'patient_consent', `${patientId}_${Date.now()}`);
      await setDoc(consentRef, consentRecord);

      console.log('[PATIENT CONSENT] SMS consent request recorded:', {
        patientId,
        token,
        status: 'sms_requested',
      });
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error recording SMS consent request:', error);
      throw error;
    }
  }

  /**
   * Check if patient has SMS consent request pending
   * 
   * @param patientId - Patient ID
   * @param professionalId - Professional ID
   * @returns Promise<boolean> - true if sms_requested exists
   */
  static async hasSMSConsentRequest(
    patientId: string,
    professionalId: string
  ): Promise<boolean> {
    try {
      const consentRef = collection(db, 'patient_consent');
      const q = query(
        consentRef,
        where('patientId', '==', patientId),
        where('professionalId', '==', professionalId),
        where('consentStatus', '==', 'sms_requested')
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      // Handle permission errors gracefully - query may require composite index
      // or Firestore rules may restrict multi-field queries. This is a non-critical
      // optimization check, so we fail silently and let the system continue normally.
      if (error?.code === 'permission-denied' || error?.code === 'missing-or-insufficient-permissions') {
        // Silently handle - query may need composite index or rule adjustment
        // System will work normally without this optimization
        console.debug('[PATIENT CONSENT] Permission error checking SMS request (non-critical):', error.code);
      } else {
        // Log other errors (network, etc.) but don't spam console
        console.warn('[PATIENT CONSENT] Error checking SMS consent request:', error?.code || error?.message || 'Unknown error');
      }
      return false;
    }
  }
}

