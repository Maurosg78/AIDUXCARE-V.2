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
import { db } from '../lib/firebase';

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
const CONSENT_COLLECTION = 'patient_consents';

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
      // Get token data
      const tokenData = await PatientConsentService.getConsentByToken(token);
      if (!tokenData) {
        throw new Error('Invalid or expired token');
      }

      // Mark token as used
      const tokenRef = doc(db, TOKEN_COLLECTION, token);
      const usedAt = new Date();
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

      console.log('[PATIENT CONSENT] Token marked as used:', {
        token,
        patientId: tokenData.patientId,
        requestedByUid: tokenData.physiotherapistId,
        requestedByName: tokenData.physiotherapistName,
        usedAt: usedAt.toISOString(),
      });

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
      await setDoc(consentRef, consentRecord);

      console.log('[PATIENT CONSENT] Consent recorded:', {
        patientId: tokenData.patientId,
        scope,
        consented,
      });
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Check if patient has valid ongoing consent
   * 
   * @param patientId - Patient ID
   * @returns Promise<boolean>
   */
  static async hasConsent(patientId: string): Promise<boolean> {
    try {
      const consentRef = collection(db, CONSENT_COLLECTION);
      const q = query(
        consentRef,
        where('patientId', '==', patientId),
        where('consented', '==', true),
        where('consentScope', '==', 'ongoing')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return false;
      }

      // Check if consent is still valid (not expired, correct version)
      const consents = snapshot.docs.map(doc => doc.data());
      const validConsent = consents.find(
        consent => consent.consentVersion === CONSENT_VERSION
      );

      return !!validConsent;
    } catch (error) {
      console.error('❌ [PATIENT CONSENT] Error checking consent:', error);
      return false; // Fail-safe: no consent = block AI processing
    }
  }

  /**
   * Get current consent status for a patient
   * 
   * @param patientId - Patient ID
   * @returns Promise with consent status: 'ongoing' | 'session-only' | 'declined' | null
   */
  static async getConsentStatus(patientId: string): Promise<'ongoing' | 'session-only' | 'declined' | null> {
    try {
      const consentRef = collection(db, CONSENT_COLLECTION);
      const q = query(
        consentRef,
        where('patientId', '==', patientId),
        where('consented', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Get the most recent consent
      // Bloque 1: Mapeo con tipo correcto para Firestore docs
      const consents = snapshot.docs
        .map(doc => {
          const data = doc.data() as PatientConsentDoc;
          return { id: doc.id, ...data };
        })
        .filter(consent => consent.consentVersion === CONSENT_VERSION)
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
  static getConsentVersion(): string {
    return CONSENT_VERSION;
  }
}

