/**
 * WO-IA-CLOSE-01: Clinical Baselines — persist and read baseline from SOAP final.
 * WO-MINIMAL-BASELINE: createBaselineFromMinimalSOAP for existing patients (paste/form → baseline).
 * Collection: clinical_baselines/{baselineId}
 */

import { collection, doc, setDoc, getDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/** SOAP shape for baseline creation (S/O/A/P). */
export interface SOAPForBaseline {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/** Audit: source of minimal baseline. */
export type MinimalBaselineSource = 'vertex_from_paste' | 'manual_minimal';

const PLAN_REQUIRED_MSG =
  'Para poder generar follow-ups, necesitamos saber qué tratamiento está en curso.';
const MIN_PLAN_LENGTH = 15;
const GENERIC_PLAN_PATTERNS = [/^paciente en tratamiento\.?$/i, /^en tratamiento\.?$/i, /^n\/a\.?$/i];

function hasValidPlan(plan: string): boolean {
  const trimmed = (plan ?? '').trim();
  if (trimmed.length < MIN_PLAN_LENGTH) return false;
  if (GENERIC_PLAN_PATTERNS.some((re) => re.test(trimmed))) return false;
  return true;
}

export interface ClinicalBaselineSnapshot {
  primaryAssessment: string;
  keyFindings: string[];
  precautions?: string[];
  planSummary: string;
}

export interface ClinicalBaseline {
  id: string;
  patientId: string;
  sourceSoapId: string;
  sourceSessionId?: string;
  snapshot: ClinicalBaselineSnapshot;
  createdAt: unknown;
  createdBy: string;
}

const COLLECTION_NAME = 'clinical_baselines';

/**
 * Create a baseline document. Returns the new baseline id.
 */
export async function createBaseline(params: {
  patientId: string;
  sourceSoapId: string;
  sourceSessionId?: string;
  snapshot: ClinicalBaselineSnapshot;
  createdBy: string;
}): Promise<string> {
  const ref = doc(collection(db, COLLECTION_NAME));
  const id = ref.id;
  const now = serverTimestamp();
  await setDoc(ref, {
    patientId: params.patientId,
    sourceSoapId: params.sourceSoapId,
    ...(params.sourceSessionId != null && params.sourceSessionId !== '' && { sourceSessionId: params.sourceSessionId }),
    snapshot: {
      primaryAssessment: params.snapshot.primaryAssessment ?? '',
      keyFindings: Array.isArray(params.snapshot.keyFindings) ? params.snapshot.keyFindings : [],
      ...(params.snapshot.precautions != null && params.snapshot.precautions.length > 0 && { precautions: params.snapshot.precautions }),
      planSummary: params.snapshot.planSummary ?? '',
    },
    createdAt: now,
    createdBy: params.createdBy,
  });
  return id;
}

/**
 * WO-MINIMAL-BASELINE: Create a baseline from structured SOAP (from paste+Vertex or manual minimal form).
 * Guard-rail: Plan must be explicit and non-generic; otherwise throws with user-facing message.
 * Audit: source, createdFrom stored in document.
 */
export async function createBaselineFromMinimalSOAP(params: {
  patientId: string;
  soap: SOAPForBaseline;
  createdBy: string;
  source: MinimalBaselineSource;
}): Promise<string> {
  if (!hasValidPlan(params.soap.plan)) {
    throw new Error(PLAN_REQUIRED_MSG);
  }
  const ref = doc(collection(db, COLLECTION_NAME));
  const id = ref.id;
  const now = serverTimestamp();
  const snapshot: ClinicalBaselineSnapshot = {
    primaryAssessment: (params.soap.assessment ?? '').trim(),
    keyFindings: [(params.soap.subjective ?? '').trim(), (params.soap.objective ?? '').trim()],
    planSummary: (params.soap.plan ?? '').trim(),
  };
  await setDoc(ref, {
    patientId: params.patientId,
    sourceSoapId: id,
    snapshot: {
      primaryAssessment: snapshot.primaryAssessment,
      keyFindings: snapshot.keyFindings,
      planSummary: snapshot.planSummary,
    },
    createdAt: now,
    createdBy: params.createdBy,
    source: params.source,
    createdFrom: 'patient_existing',
  });
  return id;
}

/**
 * Get a baseline by id. Returns null if not found.
 */
export async function getBaselineById(baselineId: string): Promise<ClinicalBaseline | null> {
  const ref = doc(db, COLLECTION_NAME, baselineId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    patientId: data.patientId ?? '',
    sourceSoapId: data.sourceSoapId ?? '',
    sourceSessionId: data.sourceSessionId,
    snapshot: {
      primaryAssessment: data.snapshot?.primaryAssessment ?? '',
      keyFindings: Array.isArray(data.snapshot?.keyFindings) ? data.snapshot.keyFindings : [],
      precautions: data.snapshot?.precautions,
      planSummary: data.snapshot?.planSummary ?? '',
    },
    createdAt: data.createdAt,
    createdBy: data.createdBy ?? '',
  };
}

/**
 * WO-DASHBOARD-01: Check if patient has any baseline (e.g. closed initial assessment).
 * Use when patient.activeBaselineId is missing but a baseline may exist (legacy or partial update).
 */
export async function hasBaselineForPatient(patientId: string): Promise<boolean> {
  const ref = collection(db, COLLECTION_NAME);
  const q = query(ref, where('patientId', '==', patientId), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}
