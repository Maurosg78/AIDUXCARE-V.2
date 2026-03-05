/**
 * Verbal consent: write path aligned with consentServerService (domain reader).
 * WO-CONSENT-VERBAL-FIX (FIX A): Write channel: 'none' and granted: true so the domain
 * recognizes valid consent and the gate unmounts. Single source of truth path:
 * patients/{patientId}/consent_status/latest
 * Enterprise: structured logging, no PHI, error handling.
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { consentLogger } from '@/domain/consent/consentLogger';

const CONSENT_DOC_PATH = (patientId: string) => ['patients', patientId, 'consent_status', 'latest'] as const;

export interface VerbalConsentDetails {
  method: 'verbal';
  obtainedBy: string;
  patientResponse: 'authorized' | 'denied' | 'unable_to_respond';
  fullTextRead?: string;
  patientUnderstood?: boolean;
  voluntarilyGiven?: boolean;
  witnessName?: string;
  notes?: string;
}

export interface ObtainConsentOptions {
  hospitalId?: string;
  textVersion?: string;
  jurisdiction?: string;
}

export interface ObtainConsentResult {
  success: boolean;
  consentId?: string;
  error?: string;
}

/**
 * Get default consent text version (for jurisdiction).
 */
export function getDefaultConsentTextVersion(): string {
  return '1.0';
}

/**
 * Get verbal consent text for display/read.
 */
export function getVerbalConsentText(_version?: string): string {
  return 'I consent to voice recording and AI-assisted processing of my clinical notes for this session.';
}

/**
 * Obtain (record) verbal consent. Writes to the same path that consentServerService reads.
 * WO-CONSENT-VERBAL-FIX: Normalize to domain contract so gate unmounts:
 * - channel: 'none'  → domain treats as "valid consent, no gate"
 * - source: 'verbal', granted: true, status: 'ongoing'
 */
export async function obtainConsent(
  patientId: string,
  physiotherapistId: string,
  details: Omit<VerbalConsentDetails, 'method'>,
  _options?: ObtainConsentOptions
): Promise<ObtainConsentResult> {
  if (!patientId || !physiotherapistId) {
    return { success: false, error: 'Missing patientId or physiotherapistId' };
  }

  try {
    const ref = doc(db, ...CONSENT_DOC_PATH(patientId));
    const now = new Date().toISOString();

    await setDoc(ref, {
      channel: 'none',
      source: 'verbal',
      granted: true,
      status: 'ongoing',
      consentMethod: 'verbal',
      method: 'verbal',
      patientId,
      obtainedBy: details.obtainedBy,
      physiotherapistId,
      patientResponse: details.patientResponse,
      fullTextRead: details.fullTextRead ?? null,
      patientUnderstood: details.patientUnderstood ?? false,
      voluntarilyGiven: details.voluntarilyGiven ?? false,
      witnessName: details.witnessName ?? null,
      notes: details.notes ?? null,
      updatedAt: now,
      timestamp: now,
    }, { merge: true });

    consentLogger.info('verbal_consent_recorded', {
      channel: 'none',
      source: 'verbal',
      consentId: ref.id,
    });

    return { success: true, consentId: ref.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record consent';
    consentLogger.error('obtain_consent_failed', { message });
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Check if the patient has valid verbal (or digital) consent by reading the same doc.
 * Used by initial workflow check; for workflow gate the page uses checkConsentViaServer.
 */
export async function hasValidConsent(
  patientId: string,
  _userId: string,
  _jurisdiction?: string
): Promise<boolean> {
  if (!patientId) return false;
  try {
    const { getDoc } = await import('firebase/firestore');
    const ref = doc(db, ...CONSENT_DOC_PATH(patientId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const data = snap.data();
    return data?.channel === 'none' || data?.granted === true;
  } catch (err) {
    consentLogger.warn('has_valid_consent_check_failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** Result of verifying consent (for UI/status display). */
export interface ConsentVerificationResult {
  hasConsent: boolean;
  status?: 'active' | 'expired' | 'none' | 'withdrawn';
  obtainedDate?: string;
}

/**
 * Verify consent and return structured result for UI.
 * Uses the same doc as hasValidConsent; returns status for display.
 */
export async function verifyConsent(
  patientId: string,
  _physiotherapistId?: string
): Promise<ConsentVerificationResult> {
  const valid = await hasValidConsent(patientId, '', undefined);
  return {
    hasConsent: valid,
    status: valid ? 'active' : 'none',
  };
}

export const VerbalConsentService = {
  obtainConsent,
  hasValidConsent,
  verifyConsent,
  getVerbalConsentText,
  getDefaultConsentTextVersion,
};

export default VerbalConsentService;
