/**
 * WO-IA-CLOSE-01: Clinical Baselines — persist and read baseline from SOAP final.
 * Collection: clinical_baselines/{baselineId}
 * No refactor. No expansion.
 */

import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
