/**
 * WO-CLINICAL-STATE-REHYDRATION-001 — Clinical State Service
 *
 * Single source of truth for rehydrated clinical state (baseline + consent + first session).
 * No sessionStorage. No UI logic. No duplicate checks.
 *
 * WO-AUTO-BASELINE-01: Baseline effective from finalized initial SOAP.
 * - If patient.activeBaselineId exists → use persisted clinical_baselines (legacy path).
 * - If not → fallback: last note from consultations (finalized initial SOAP) as baseline; optional lazy persist.
 *
 * Existing patients (not from in-app initial): Many patients will be added by the therapist without
 * an in-app initial assessment. We still need one source of truth: baseline comes only from here.
 * To allow follow-up for those patients, we need a defined "minimum baseline" (see
 * docs/product/BASELINE_PACIENTES_EXISTENTES.md): what we ask the therapist to enter so we have
 * enough context (condition + current treatment). That input must persist into the same sources
 * this service reads (consultations or clinical_baselines) — no extra sources.
 */

import { checkConsentViaServer } from './consentServerService';
import sessionService from './sessionService';
import { PatientService } from './patientService';
import { getBaselineById, createBaseline } from './clinicalBaselineService';
import { PersistenceService } from './PersistenceService';

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
    getBaselineSafe(patientId, userId),
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
 * WO-AUTO-BASELINE-01: Baseline from persisted clinical_baselines (priority) or fallback from last finalized initial SOAP.
 *
 * FIX-PHASE0-BASELINE-HYDRATION: Always use most recent note (INITIAL or FOLLOWUP) as baseline source.
 * This ensures FOLLOWUP #2 uses FOLLOWUP #1 as baseline (same-day visits), not the original INITIAL from weeks ago.
 *
 * Priority: (1) Most recent note from consultations (INITIAL or FOLLOWUP)
 *           (2) Fallback: patient.activeBaselineId if no notes exist
 */
async function getBaselineSafe(
  patientId: string,
  userId?: string
): Promise<{
  hasBaseline: boolean;
  baselineSOAP?: ClinicalState['baselineSOAP'];
}> {
  // A1: PRIMARY — Most recent finalized SOAP from consultations (INITIAL or FOLLOWUP)
  let notes: Awaited<ReturnType<typeof PersistenceService.getNotesByPatient>>;
  try {
    notes = await PersistenceService.getNotesByPatient(patientId);
  } catch (err) {
    // If consultations query fails, try patient.activeBaselineId as fallback
    console.warn('[DEBUG-BASELINE] Consultations query failed, falling back to activeBaselineId:', err);
    return await getBaselineFromActiveId(patientId);
  }

  if (!notes?.length) {
    // If no notes exist, try patient.activeBaselineId as fallback
    console.log('[DEBUG-BASELINE] No notes found, falling back to patient.activeBaselineId');
    return await getBaselineFromActiveId(patientId);
  }

  // 🔍 DEBUG-BASELINE: Ver TODAS las notas (temporal para investigación CTO)
  console.log('[DEBUG-BASELINE] Total notes found:', notes.length);
  notes.forEach((note, index) => {
    const planPreview = note.soapData?.plan?.substring(0, 100) ?? '(no plan)';
    const hasEnglish = /[a-zA-Z]{3,}/.test(planPreview);
    console.log(`[DEBUG-BASELINE] Note ${index}:`, {
      id: note.id,
      visitType: note.visitType,
      createdAt: note.createdAt,
      planPreview: planPreview + (planPreview.length >= 100 ? '...' : ''),
      languageHint: hasEnglish ? 'English?' : 'Spanish?',
    });
  });

  // getNotesByPatient returns orderBy('createdAt', 'desc') → first = most recent
  const mostRecentNote = notes[0];
  console.log('[DEBUG-BASELINE] Selected as baseline:', {
    id: mostRecentNote.id,
    visitType: mostRecentNote.visitType,
    createdAt: mostRecentNote.createdAt,
    fullPlan: mostRecentNote.soapData?.plan,
  });
  const soapData = mostRecentNote.soapData;
  if (!soapData) {
    return { hasBaseline: false };
  }

  // Consultations notes are saved when SOAP is finalized; no status field → treat as finalized (WO conservative fallback)
  const baselineSOAP: ClinicalState['baselineSOAP'] = {
    subjective: soapData.subjective ?? '',
    objective: soapData.objective ?? '',
    assessment: soapData.assessment ?? '',
    plan: soapData.plan ?? '',
    encounterId: mostRecentNote.sessionId ?? mostRecentNote.id,
    date: new Date(mostRecentNote.createdAt),
  };

  // A2: Optional lazy persist — do not block follow-up on failure
  // NOTE: Only persist if this is the FIRST time we're creating a baseline for this patient
  // Don't overwrite activeBaselineId if it already exists (preserve INITIAL baseline reference)
  const patient = await PatientService.getPatientById(patientId);
  if (userId && !patient?.activeBaselineId) {
    try {
      const baselineId = await createBaseline({
        patientId,
        sourceSoapId: mostRecentNote.id,
        sourceSessionId: mostRecentNote.sessionId ?? undefined,
        snapshot: {
          primaryAssessment: soapData.assessment ?? '',
          keyFindings: [soapData.subjective ?? '', soapData.objective ?? ''].filter(Boolean),
          planSummary: soapData.plan ?? '',
        },
        createdBy: userId,
      });
      await PatientService.updatePatient(patientId, { activeBaselineId: baselineId });
      console.info('[BASELINE][AUTO] Baseline auto-generated from finalized SOAP', {
        patientId,
        baselineId,
        noteId: mostRecentNote.id,
      });
    } catch (_err) {
      // Do not block; baselineSOAP from note is still returned
    }
  }

  return { hasBaseline: true, baselineSOAP };
}

/**
 * A3: Fallback helper — Get baseline from patient.activeBaselineId
 * Only used when consultations query fails or returns no notes
 */
async function getBaselineFromActiveId(
  patientId: string
): Promise<{
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

  console.log('[DEBUG-BASELINE] Using fallback from clinical_baselines:', {
    baselineId: patient.activeBaselineId,
    planSummary: baseline.snapshot?.planSummary?.substring(0, 100),
  });

  const snap = baseline.snapshot;
  const date =
    baseline.createdAt && typeof (baseline.createdAt as { toDate?: () => Date }).toDate === 'function'
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
