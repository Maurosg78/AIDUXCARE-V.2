import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

import type {
  ClinicalDecision,
  ClinicalDecisionReason,
  ClinicalDecisionStatus,
  ClinicalDecisionsSnapshot,
} from './types';

const PATIENTS_COLLECTION = 'patients';
const CLINICAL_DECISIONS_SUBCOLLECTION = 'clinicalDecisions';
const SESSIONS_COLLECTION = 'sessions';

function normalizeDecisionText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es-ES');
}

function getClinicalDecisionsCollectionRef(patientId: string) {
  return collection(
    db,
    PATIENTS_COLLECTION,
    patientId,
    CLINICAL_DECISIONS_SUBCOLLECTION,
  );
}

function getSessionDocRef(sessionId: string) {
  return doc(db, SESSIONS_COLLECTION, sessionId);
}

function mapClinicalDecision(id: string, data: Record<string, unknown>): ClinicalDecision {
  return {
    id,
    kind: data.kind as ClinicalDecision['kind'],
    status: data.status as ClinicalDecisionStatus,
    source: data.source as ClinicalDecision['source'],
    text: String(data.text ?? ''),
    decidedBy: String(data.decidedBy ?? ''),
    decidedAt: String(data.decidedAt ?? ''),
    sessionId: String(data.sessionId ?? ''),
    patientId: String(data.patientId ?? ''),
    reason: (data.reason ?? null) as ClinicalDecisionReason,
    ...(typeof data.note === 'string' && data.note.trim() !== '' ? { note: data.note } : {}),
    ...(typeof data.medicationDose === 'string' ? { medicationDose: data.medicationDose } : {}),
    ...(typeof data.medicationFrequency === 'string' ? { medicationFrequency: data.medicationFrequency } : {}),
    ...(typeof data.medicationState === 'string'
      ? { medicationState: data.medicationState as ClinicalDecision['medicationState'] }
      : {}),
  };
}

export async function saveClinicalDecision(
  decision: Omit<ClinicalDecision, 'id'>,
): Promise<ClinicalDecision> {
  const collectionRef = getClinicalDecisionsCollectionRef(decision.patientId);
  const decisionRef = doc(collectionRef);
  const persistedDecision: ClinicalDecision = {
    ...decision,
    id: decisionRef.id,
  };

  await setDoc(decisionRef, persistedDecision);

  return persistedDecision;
}

export async function getPatientClinicalDecisions(
  patientId: string,
): Promise<ClinicalDecision[]> {
  const collectionRef = getClinicalDecisionsCollectionRef(patientId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((decisionDoc) => {
    const rawData = decisionDoc.data() as Record<string, unknown>;
    return mapClinicalDecision(decisionDoc.id, rawData);
  });
}

export async function filterRedFlagsAgainstDecisions(
  patientId: string,
  incomingRedFlags: string[],
): Promise<{
  active: string[];
  previouslyReviewed: Array<{
    text: string;
    status: ClinicalDecisionStatus;
    reason: ClinicalDecisionReason;
  }>;
}> {
  const decisions = await getPatientClinicalDecisions(patientId);
  const redFlagDecisionsByText = new Map(
    decisions
      .filter((decision) => decision.kind === 'red_flag')
      .map((decision) => [normalizeDecisionText(decision.text), decision] as const),
  );
  const active: string[] = [];
  const previouslyReviewed: Array<{
    text: string;
    status: ClinicalDecisionStatus;
    reason: ClinicalDecisionReason;
  }> = [];

  for (const redFlag of incomingRedFlags) {
    const normalizedRedFlag = normalizeDecisionText(redFlag);
    const previousDecision = redFlagDecisionsByText.get(normalizedRedFlag);

    if (
      previousDecision?.status === 'resolved' ||
      previousDecision?.status === 'false_positive'
    ) {
      continue;
    }

    if (
      previousDecision?.status === 'monitoring' ||
      previousDecision?.reason === 'controlled_condition'
    ) {
      previouslyReviewed.push({
        text: redFlag,
        status: previousDecision.status,
        reason: previousDecision.reason,
      });
      continue;
    }

    active.push(redFlag);
  }

  return {
    active,
    previouslyReviewed,
  };
}

export async function saveClinicalDecisionsSnapshot(
  sessionId: string,
  decisions: ClinicalDecision[],
): Promise<void> {
  const snapshot: ClinicalDecisionsSnapshot = {
    sessionId,
    capturedAt: new Date().toISOString(),
    decisions,
  };
  const sessionRef = getSessionDocRef(sessionId);

  await setDoc(sessionRef, { clinicalDecisionsSnapshot: snapshot }, { merge: true });
}
