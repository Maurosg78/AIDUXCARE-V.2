import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import type { SecondaryClinicalMemory } from '@/domain/secondaryClinicalMemory';
import { db } from '@/lib/firebase';

function sanitizeToArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => v && v !== 'N/A' && v !== 'None' && v !== 'No' && v !== 'Ninguno');
  }
  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (!cleaned || cleaned === 'N/A' || cleaned === 'None' || cleaned === 'No' || cleaned === 'Ninguno') {
      return [];
    }
    return [cleaned];
  }
  return [];
}

export function extractSecondaryClinicalMemory(
  vertexResponse: any,
  sessionId: string,
  visitType: 'initial' | 'followup' | 'ongoing'
): SecondaryClinicalMemory | null {
  const recurringSignals = [
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.psychological),
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.social),
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.patient_strengths),
  ];

  const adherencePatterns = sanitizeToArray(vertexResponse?.planHomeProgram);

  const contextualThreads = [
    ...sanitizeToArray(vertexResponse?.conversation_highlights?.medical_history),
    ...sanitizeToArray(vertexResponse?.conversation_highlights?.medications),
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.legal_or_employment_context),
  ];

  const unresolvedTopics = sanitizeToArray(vertexResponse?.considerations);

  const softWarnings = [
    ...sanitizeToArray(vertexResponse?.medicolegal_alerts?.yellow_flags),
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.functional_limitations),
  ];

  const suggestedAttentionPoints = [
    ...sanitizeToArray(vertexResponse?.planInClinic),
    ...sanitizeToArray(vertexResponse?.additionalNotes),
    ...sanitizeToArray(vertexResponse?.conversation_highlights?.summary),
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.occupational),
    ...sanitizeToArray(vertexResponse?.biopsychosocial_factors?.protective_factors),
  ];

  const hasClinicalContent =
    recurringSignals.length > 0 ||
    adherencePatterns.length > 0 ||
    contextualThreads.length > 0 ||
    unresolvedTopics.length > 0 ||
    softWarnings.length > 0 ||
    suggestedAttentionPoints.length > 0;

  if (!hasClinicalContent) {
    return null;
  }

  return {
    ...(recurringSignals.length > 0 ? { recurringSignals } : {}),
    ...(adherencePatterns.length > 0 ? { adherencePatterns } : {}),
    ...(contextualThreads.length > 0 ? { contextualThreads } : {}),
    ...(unresolvedTopics.length > 0 ? { unresolvedTopics } : {}),
    ...(softWarnings.length > 0 ? { softWarnings } : {}),
    ...(suggestedAttentionPoints.length > 0 ? { suggestedAttentionPoints } : {}),
    sourceSessionId: sessionId,
    sourceVisitType: visitType,
    createdAt: serverTimestamp() as unknown as SecondaryClinicalMemory['createdAt'],
  };
}

export async function persistSecondaryClinicalMemory(
  encounterId: string,
  memory: SecondaryClinicalMemory
): Promise<void> {
  try {
    const encounterRef = doc(db, 'encounters', encounterId);
    await updateDoc(encounterRef, {
      secondaryClinicalMemory: memory,
    });
  } catch (error) {
    console.error('[SecondaryClinicalMemory] Persist failed:', error);
  }
}
