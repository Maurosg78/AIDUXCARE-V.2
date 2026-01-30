/**
 * WO-CLINICAL-STATE-REHYDRATION-001 — Clinical State Service
 *
 * Single source of truth for rehydrated clinical state (baseline + consent + first session).
 * No sessionStorage. No UI logic. No duplicate checks.
 *
 * WO-CLINICAL-CONTINUITY-CONTRACT-001: This service implements the Canonical Clinical Continuity Contract.
 * - hasBaseline === true ONLY when the last documented encounter has complete, non-placeholder SOAP (see docs/CLINICAL-CONTINUITY-CANONICAL-CONTRACT.md).
 * - Baseline always refers to the last documented session; no default or empty baseline for follow-up.
 */

import { buildFollowUpClinicalBaseline, FollowUpNotAllowedError } from './followUp/FollowUpClinicalBaselineBuilder';
import { checkConsentViaServer } from './consentServerService';
import sessionService from './sessionService';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export type ClinicalState = {
  hasBaseline: boolean;
  baselineSOAP?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    encounterId: string;
    date: Date;
  };
  consent: {
    hasValidConsent: boolean;
    status: 'ongoing' | 'session-only' | 'declined' | null;
  };
  isFirstSession: boolean;
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Get rehydrated clinical state for a patient.
 * Sources: FollowUpClinicalBaselineBuilder (baseline), checkConsentViaServer (consent), sessionService.isFirstSession.
 *
 * @param patientId - Patient ID
 * @param userId - User ID (for consent and first-session checks)
 * @param currentSessionId - Optional current session ID (reserved for future use)
 */
export async function getClinicalState(
  patientId: string,
  userId: string,
  currentSessionId?: string
): Promise<ClinicalState> {
  const [baselineResult, consentResult, isFirstSession] = await Promise.all([
    getBaselineSafe(patientId),
    checkConsentViaServer(patientId),
    sessionService.isFirstSession(patientId, userId),
  ]);

  const consent = {
    hasValidConsent: consentResult.hasValidConsent,
    status: consentResult.status ?? null,
  };

  if (baselineResult.hasBaseline && baselineResult.baselineSOAP) {
    return {
      hasBaseline: true,
      baselineSOAP: baselineResult.baselineSOAP,
      consent,
      isFirstSession,
    };
  }

  return {
    hasBaseline: false,
    consent,
    isFirstSession,
  };
}

/**
 * Baseline: last documented encounter with complete SOAP only (Canonical Contract §3).
 * FollowUpClinicalBaselineBuilder enforces completeness; no baseline → hasBaseline false.
 */
async function getBaselineSafe(patientId: string): Promise<{
  hasBaseline: boolean;
  baselineSOAP?: ClinicalState['baselineSOAP'];
}> {
  try {
    const baseline = await buildFollowUpClinicalBaseline(patientId);
    const date = baseline.previousSOAP.date instanceof Date
      ? baseline.previousSOAP.date
      : new Date(baseline.previousSOAP.date);
    return {
      hasBaseline: true,
      baselineSOAP: {
        subjective: baseline.previousSOAP.subjective,
        objective: baseline.previousSOAP.objective,
        assessment: baseline.previousSOAP.assessment,
        plan: baseline.previousSOAP.plan,
        encounterId: baseline.previousSOAP.encounterId,
        date,
      },
    };
  } catch (e) {
    const isNotAllowed =
      e instanceof FollowUpNotAllowedError ||
      (e && typeof e === 'object' && (e as Error).name === 'FollowUpNotAllowedError');
    if (isNotAllowed) {
      return { hasBaseline: false };
    }
    throw e;
  }
}
