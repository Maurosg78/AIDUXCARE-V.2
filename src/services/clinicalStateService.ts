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

import { checkConsentViaServer } from './consentServerService';
import sessionService from './sessionService';
import { PatientService } from './patientService';
import { getBaselineById } from './clinicalBaselineService';

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
 * Baseline: WO-IA-CLOSE-01 use persisted clinical_baselines only when patient.activeBaselineId exists.
 * If no activeBaselineId → hasBaseline false (block follow-up). Old builder code kept but not used as primary.
 */
async function getBaselineSafe(patientId: string): Promise<{
  hasBaseline: boolean;
  baselineSOAP?: ClinicalState['baselineSOAP'];
}> {
  const patient = await PatientService.getPatientById(patientId);
  if (!patient?.activeBaselineId) {
    return { hasBaseline: false };
  }
  const baseline = await getBaselineById(patient.activeBaselineId);
  if (!baseline) {
    return { hasBaseline: false };
  }
  const snap = baseline.snapshot;
  const date = baseline.createdAt && typeof (baseline.createdAt as { toDate?: () => Date }).toDate === 'function'
    ? (baseline.createdAt as { toDate: () => Date }).toDate()
    : baseline.createdAt instanceof Date
      ? baseline.createdAt
      : new Date();
  return {
    hasBaseline: true,
    baselineSOAP: {
      subjective: snap.keyFindings?.[0] ?? '',
      objective: (snap.keyFindings?.slice(1) ?? []).join('\n') ?? '',
      assessment: snap.primaryAssessment ?? '',
      plan: snap.planSummary ?? '',
      encounterId: baseline.sourceSoapId ?? baseline.id,
      date,
    },
  };
}
