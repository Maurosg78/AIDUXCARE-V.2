// ADR-004: Lookup service for clinical evidence by diagnosis
// Returns null if diagnosis not in library — Vertex works without local base

import { EVIDENCE_REGISTRY, getEvidenceRegistryEntry } from './EVIDENCE_REGISTRY';
import type { DiagnosisEvidence } from './types';
import type { DiagnosisKey } from './EVIDENCE_REGISTRY';

export const lookupEvidence = async (
  diagnosisId: string
): Promise<DiagnosisEvidence | null> => {
  const isRegistered = diagnosisId in EVIDENCE_REGISTRY;

  if (!isRegistered) {
    return null;
  }

  const diagnosisKey = diagnosisId as DiagnosisKey;
  const entry = getEvidenceRegistryEntry(diagnosisKey);

  if (entry.status !== 'approved') {
    return null;
  }

  const module = await import(entry.file);
  const evidence = module.default as DiagnosisEvidence;
  return evidence;
};
