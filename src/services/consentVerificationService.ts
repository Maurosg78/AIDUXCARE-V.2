/**
 * Consent Verification Service
 * 
 * Handles the mandatory consent verification step between patient registration
 * and workflow access. Manages SMS digital consent and manual fallback with
 * complete audit trail for legal compliance.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { collection, doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { SMSService } from './smsService';
import { PatientConsentService } from './patientConsentService';
import { checkConsentViaServer } from './consentServerService';

export type SMSConsentStatus = 'sending' | 'sent' | 'confirmed' | 'failed' | 'timeout';
export type ConsentMethod = 'sms' | 'manual' | null;

export interface ConsentVerificationState {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  smsStatus: SMSConsentStatus;
  consentMethod: ConsentMethod;
  consentTimestamp: Date | null;
  fisioIpAddress: string;
  auditTrail: AuditEvent[];
}

export interface AuditEvent {
  event: 'sms_sent' | 'sms_confirmed' | 'manual_checkbox_checked' | 'consent_verified' | 'timeout' | 'error';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentVerificationResult {
  verified: boolean;
  method: ConsentMethod;
  timestamp: Date;
  auditId: string;
}

const CONSENT_VERIFICATION_COLLECTION = 'consent_verifications';
const SMS_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Consent Verification Service
 * 
 * Manages the mandatory consent verification step with SMS and manual fallback
 */
export class ConsentVerificationService {
  /**
   * Initialize consent verification for a patient
   * 
   * @param patientId - Patient ID
   * @param patientName - Patient name
   * @param patientPhone - Patient phone number (optional, for SMS)
   * @param clinicName - Clinic name
   * @param physiotherapistId - Physiotherapist user ID
   * @param physiotherapistName - Physiotherapist name
   * @returns Promise<ConsentVerificationState>
   */
  static async initializeVerification(
    patientId: string,
    patientName: string,
    patientPhone?: string,
    clinicName: string = 'AiduxCare Clinic',
    physiotherapistId: string = 'temp-user',
    physiotherapistName: string = 'Your physiotherapist'
  ): Promise<ConsentVerificationState> {
    try {
      // ✅ WO-CONSENT-CLEANUP-03: Check consent via Cloud Function (server-side only)
      const consentResult = await checkConsentViaServer(patientId);
      const hasConsent = consentResult.hasValidConsent;
      if (hasConsent) {
        // Return verified state immediately
        return {
          patientId,
          patientName,
          patientPhone,
          smsStatus: 'confirmed',
          consentMethod: 'sms', // Assume SMS was used previously
          consentTimestamp: new Date(),
          fisioIpAddress: 'client-side', // TODO: Get from backend
          auditTrail: [{
            event: 'consent_verified',
            timestamp: new Date(),
            metadata: { existing: true },
          }],
        };
      }

      // Get IP address (client-side approximation)
      const ipAddress = await ConsentVerificationService.getClientIP();

      // Initialize state
      const initialState: ConsentVerificationState = {
        patientId,
        patientName,
        patientPhone,
        smsStatus: 'sending',
        consentMethod: null,
        consentTimestamp: null,
        fisioIpAddress: ipAddress,
        auditTrail: [{
          event: 'sms_sent',
          timestamp: new Date(),
          ipAddress,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }],
      };

      // Send SMS if phone available
      if (patientPhone) {
        try {
          // Generate consent token
          const token = await PatientConsentService.generateConsentToken(
            patientId,
            patientName,
            patientPhone,
            undefined, // email
            clinicName,
            physiotherapistId,
            physiotherapistName
          );

          // Send SMS
          await SMSService.sendConsentLink(
            patientPhone,
            patientName,
            clinicName,
            physiotherapistName,
            token
          );

          initialState.smsStatus = 'sent';
          initialState.auditTrail.push({
            event: 'sms_sent',
            timestamp: new Date(),
            ipAddress,
            metadata: { token, phone: patientPhone },
          });

          // Save initial state to Firestore
          await ConsentVerificationService.saveVerificationState(initialState);

          // Start timeout monitoring (client-side polling for MVP)
          ConsentVerificationService.startSMSTimeout(patientId, SMS_TIMEOUT_MS);

        } catch (error) {
          console.error('[CONSENT VERIFICATION] SMS send failed:', error);
          initialState.smsStatus = 'failed';
          initialState.auditTrail.push({
            event: 'error',
            timestamp: new Date(),
            metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      } else {
        // No phone available, skip SMS
        initialState.smsStatus = 'failed';
        initialState.auditTrail.push({
          event: 'error',
          timestamp: new Date(),
          metadata: { reason: 'no_phone_available' },
        });
      }

      // Save state to Firestore
      await ConsentVerificationService.saveVerificationState(initialState);

      return initialState;
    } catch (error) {
      console.error('❌ [CONSENT VERIFICATION] Error initializing:', error);
      throw error;
    }
  }

  /**
   * Check SMS consent status (polling for MVP)
   * 
   * @param patientId - Patient ID
   * @returns Promise<SMSConsentStatus>
   */
  static async checkSMSStatus(patientId: string): Promise<SMSConsentStatus> {
    try {
      // ✅ WO-CONSENT-CLEANUP-03: Check consent via Cloud Function (server-side only)
      const consentResult = await checkConsentViaServer(patientId);
      const hasConsent = consentResult.hasValidConsent;
      if (hasConsent) {
        return 'confirmed';
      }

      // Get verification state
      const state = await ConsentVerificationService.getVerificationState(patientId);
      if (!state) {
        return 'failed';
      }

      return state.smsStatus;
    } catch (error) {
      console.error('[CONSENT VERIFICATION] Error checking SMS status:', error);
      return 'failed';
    }
  }

  /**
   * Record manual consent verification
   * 
   * @param patientId - Patient ID
   * @param ipAddress - IP address of physiotherapist
   * @returns Promise<ConsentVerificationResult>
   */
  static async recordManualConsent(
    patientId: string,
    ipAddress: string = 'client-side'
  ): Promise<ConsentVerificationResult> {
    try {
      // Get current state
      const state = await ConsentVerificationService.getVerificationState(patientId);
      if (!state) {
        throw new Error('Consent verification not initialized');
      }

      // Create audit event
      const auditEvent: AuditEvent = {
        event: 'manual_checkbox_checked',
        timestamp: new Date(),
        ipAddress,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        metadata: {
          method: 'manual',
          patientId,
        },
      };

      // Update state
      const updatedState: ConsentVerificationState = {
        ...state,
        consentMethod: 'manual',
        consentTimestamp: new Date(),
        fisioIpAddress: ipAddress,
        auditTrail: [...state.auditTrail, auditEvent],
      };

      // Save to Firestore
      const auditId = await ConsentVerificationService.saveVerificationState(updatedState);

      // Create consent record (manual method)
      await PatientConsentService.recordConsent(
        state.auditTrail.find(e => e.event === 'sms_sent')?.metadata?.token as string || 'manual',
        'ongoing', // Manual consent is always ongoing
        state.patientName // Use patient name as signature
      );

      // Add final verification event
      const verificationEvent: AuditEvent = {
        event: 'consent_verified',
        timestamp: new Date(),
        ipAddress,
        metadata: { method: 'manual', auditId },
      };

      updatedState.auditTrail.push(verificationEvent);
      await ConsentVerificationService.saveVerificationState(updatedState);

      return {
        verified: true,
        method: 'manual',
        timestamp: new Date(),
        auditId,
      };
    } catch (error) {
      console.error('❌ [CONSENT VERIFICATION] Error recording manual consent:', error);
      throw error;
    }
  }

  /**
   * Get verification state for a patient
   * 
   * @param patientId - Patient ID
   * @returns Promise<ConsentVerificationState | null>
   */
  static async getVerificationState(patientId: string): Promise<ConsentVerificationState | null> {
    try {
      // WO-FS-QUERY-01: Verify ownership before reading
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('❌ [CONSENT VERIFICATION] User not authenticated');
        return null;
      }

      const docRef = doc(db, CONSENT_VERIFICATION_COLLECTION, patientId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // WO-FS-QUERY-01: Verify ownership - do not return document if ownerUid doesn't match
      if (data.ownerUid && data.ownerUid !== currentUser.uid) {
        console.warn('❌ [CONSENT VERIFICATION] Document ownership mismatch');
        return null;
      }

      return {
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        smsStatus: data.smsStatus,
        consentMethod: data.consentMethod,
        consentTimestamp: data.consentTimestamp?.toDate() || null,
        fisioIpAddress: data.fisioIpAddress,
        auditTrail: (data.auditTrail || []).map((event: any) => ({
          ...event,
          timestamp: event.timestamp?.toDate() || new Date(),
        })),
      };
    } catch (error) {
      console.error('❌ [CONSENT VERIFICATION] Error getting state:', error);
      return null;
    }
  }

  /**
   * Save verification state to Firestore
   * 
   * @param state - Verification state
   * @returns Promise<string> - Document ID
   */
  private static async saveVerificationState(state: ConsentVerificationState): Promise<string> {
    try {
      // WO-FS-DATA-03: Enforce ownership on all Firestore writes
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('Missing authenticated user for ownership');
      }
      
      const docRef = doc(db, CONSENT_VERIFICATION_COLLECTION, state.patientId);
      
      const stateData = {
        ...state,
        ownerUid: currentUser.uid, // WO-FS-DATA-03: Always set from authenticated user
        consentTimestamp: state.consentTimestamp ? Timestamp.fromDate(state.consentTimestamp) : null,
        auditTrail: state.auditTrail.map(event => ({
          ...event,
          timestamp: Timestamp.fromDate(event.timestamp),
        })),
        updatedAt: serverTimestamp(),
      };
      
      // WO-FS-DATA-03: Final validation - ownerUid must be present
      if (!stateData.ownerUid) {
        throw new Error('Missing ownerUid: cannot save consent verification without ownership');
      }

      await setDoc(docRef, stateData, { merge: true });
      return docRef.id;
    } catch (error) {
      console.error('❌ [CONSENT VERIFICATION] Error saving state:', error);
      throw error;
    }
  }

  /**
   * Start SMS timeout monitoring
   * 
   * @param patientId - Patient ID
   * @param timeoutMs - Timeout in milliseconds
   */
  private static startSMSTimeout(patientId: string, timeoutMs: number): void {
    setTimeout(async () => {
      const state = await ConsentVerificationService.getVerificationState(patientId);
      if (state && state.smsStatus === 'sent' && !state.consentTimestamp) {
        // Timeout reached, update status
        const updatedState: ConsentVerificationState = {
          ...state,
          smsStatus: 'timeout',
          auditTrail: [
            ...state.auditTrail,
            {
              event: 'timeout',
              timestamp: new Date(),
              metadata: { timeoutMs },
            },
          ],
        };
        await ConsentVerificationService.saveVerificationState(updatedState);
      }
    }, timeoutMs);
  }

  /**
   * Get client IP address (client-side approximation)
   * 
   * @returns Promise<string>
   */
  private static async getClientIP(): Promise<string> {
    // TODO: Get real IP from backend in production
    // For MVP, return client-side indicator
    try {
      // Try to get IP from a service (optional)
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'client-side';
    } catch {
      return 'client-side';
    }
  }

  /**
   * Check if consent is verified for a patient
   * 
   * @param patientId - Patient ID
   * @returns Promise<boolean>
   */
  static async isConsentVerified(patientId: string): Promise<boolean> {
    try {
      // ✅ WO-CONSENT-CLEANUP-03: Check consent via Cloud Function (server-side only)
      const consentResult = await checkConsentViaServer(patientId);
      const hasConsent = consentResult.hasValidConsent;
      if (hasConsent) {
        return true;
      }

      // Check verification state
      const state = await ConsentVerificationService.getVerificationState(patientId);
      return state?.consentTimestamp !== null && state?.consentMethod !== null;
    } catch (error) {
      console.error('❌ [CONSENT VERIFICATION] Error checking verification:', error);
      return false;
    }
  }
}

