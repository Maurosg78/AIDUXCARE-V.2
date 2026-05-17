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

type ClinicalStateOptions = {
  currentSessionId?: string;
  asOfDateKey?: string;
};

const normalizeDateKey = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T12:00:00`);
  return Number.isFinite(parsed.getTime()) ? trimmed : null;
};

const localDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateKeyFromUnknown = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = normalizeDateKey(value);
    if (normalized) return normalized;
    const parsedTime = Date.parse(value);
    return Number.isFinite(parsedTime) ? localDateKey(new Date(parsedTime)) : null;
  }
  if (value instanceof Date) return localDateKey(value);
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') return localDateKey(toDate.call(value));
  }
  return null;
};

const isOnOrBeforeDateKey = (sourceDateKey: string | null, asOfDateKey?: string): boolean => {
  const normalizedAsOf = normalizeDateKey(asOfDateKey);
  if (!normalizedAsOf) return true;
  return sourceDateKey != null && sourceDateKey <= normalizedAsOf;
};

const normalizeOptions = (options?: string | ClinicalStateOptions): ClinicalStateOptions => {
  if (typeof options === 'string') return { currentSessionId: options };
  return options ?? {};
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
  options?: string | ClinicalStateOptions
): Promise<ClinicalState> {
  const normalizedOptions = normalizeOptions(options);
  const [baselineResult, consentResult, isFirstSession] = await Promise.all([
    getBaselineSafe(patientId, userId, normalizedOptions.asOfDateKey),
    checkConsentViaServer(patientId),
    sessionService.isFirstSession(patientId, userId),
  ]);

  const status: ClinicalState['consent']['status'] =
    (consentResult.status === 'ongoing' || consentResult.status === 'session-only' || consentResult.status === 'declined')
      ? (consentResult.status as ClinicalState['consent']['status'])
      : null;
  const consent: ClinicalState['consent'] = {
    hasValidConsent: consentResult.hasValidConsent,
    status,
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
 * Legacy: if patient.activeBaselineId exists, use getBaselineById first.
 * Fallback: if no usable activeBaselineId, use last note from consultations (finalized initial SOAP); optional lazy persist.
 */
async function getBaselineSafe(
  patientId: string,
  userId?: string,
  asOfDateKey?: string
): Promise<{
  hasBaseline: boolean;
  baselineSOAP?: ClinicalState['baselineSOAP'];
}> {
  const normalizedAsOfDateKey = normalizeDateKey(asOfDateKey);
  const patient = await PatientService.getPatientById(patientId);

  // A3: Legacy path — activeBaselineId has priority
  if (patient?.activeBaselineId) {
    const baseline = await getBaselineById(patient.activeBaselineId);
    if (baseline) {
      const snap = baseline.snapshot;
      const date =
        baseline.createdAt && typeof (baseline.createdAt as { toDate?: () => Date }).toDate === 'function'
          ? (baseline.createdAt as { toDate: () => Date }).toDate()
          : baseline.createdAt instanceof Date
            ? baseline.createdAt
            : new Date();
      let sourceDateKey = dateKeyFromUnknown(date);
      if (baseline.sourceSoapId) {
        try {
          const sourceNote = await PersistenceService.getNoteById(baseline.sourceSoapId);
          sourceDateKey = dateKeyFromUnknown(sourceNote?.clinicalDate) ?? dateKeyFromUnknown(sourceNote?.createdAt) ?? sourceDateKey;
        } catch {
          /* use baseline createdAt */
        }
      }
      if (!isOnOrBeforeDateKey(sourceDateKey, normalizedAsOfDateKey ?? undefined)) {
        console.info('[FOLLOWUP-ASOF] Active baseline ignored because it is newer than requested clinical date', {
          patientId,
          asOfDateKey: normalizedAsOfDateKey,
          sourceDateKey,
          baselineId: baseline.id,
        });
      } else {
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
    }
  }

  // A1: Fallback — last finalized initial SOAP from consultations
  let notes: Awaited<ReturnType<typeof PersistenceService.getNotesByPatient>>;
  try {
    notes = await PersistenceService.getNotesByPatient(patientId);
  } catch {
    return { hasBaseline: false };
  }
  if (!notes?.length) {
    return { hasBaseline: false };
  }
  // getNotesByPatient returns orderBy('createdAt', 'desc'); for historical follow-ups,
  // choose the most recent note available as of the requested clinical date.
  const firstNote = notes.find((note) => {
    if (!note.soapData) return false;
    const noteDateKey = dateKeyFromUnknown(note.clinicalDate) ?? dateKeyFromUnknown(note.createdAt);
    return isOnOrBeforeDateKey(noteDateKey, normalizedAsOfDateKey ?? undefined);
  });
  if (!firstNote) {
    return { hasBaseline: false };
  }
  const soapData = firstNote.soapData;
  if (!soapData) {
    return { hasBaseline: false };
  }
  // Consultations notes are saved when SOAP is finalized; no status field → treat as finalized (WO conservative fallback)
  const baselineSOAP: ClinicalState['baselineSOAP'] = {
    subjective: soapData.subjective ?? '',
    objective: soapData.objective ?? '',
    assessment: soapData.assessment ?? '',
    plan: soapData.plan ?? '',
    encounterId: firstNote.sessionId ?? firstNote.id,
    date: new Date(firstNote.createdAt),
  };

  // A2: Optional lazy persist — do not block follow-up on failure
  if (userId && !normalizedAsOfDateKey) {
    try {
      const baselineId = await createBaseline({
        patientId,
        sourceSoapId: firstNote.id,
        sourceSessionId: firstNote.sessionId ?? undefined,
        snapshot: {
          primaryAssessment: soapData.assessment ?? '',
          keyFindings: [soapData.subjective ?? '', soapData.objective ?? ''].filter(Boolean),
          planSummary: soapData.plan ?? '',
        },
        createdBy: userId,
      });
      await PatientService.updatePatient(patientId, { activeBaselineId: baselineId });
      console.info('[BASELINE][AUTO] Baseline auto-generated from finalized Initial SOAP', {
        patientId,
        baselineId,
        noteId: firstNote.id,
      });
    } catch (_err) {
      // Do not block; baselineSOAP from note is still returned
    }
  }

  return { hasBaseline: true, baselineSOAP };
}
