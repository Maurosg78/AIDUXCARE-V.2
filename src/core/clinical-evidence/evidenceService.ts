// ADR-004: Lookup service for clinical evidence by diagnosis
// Returns null if diagnosis not in library — Vertex works without local base

import { EVIDENCE_REGISTRY, getEvidenceRegistryEntry } from './EVIDENCE_REGISTRY';
import type { DiagnosisEvidence } from './types';
import type { DiagnosisKey } from './EVIDENCE_REGISTRY';

const EVIDENCE_MODULES: Record<DiagnosisKey, () => Promise<{ default: DiagnosisEvidence }>> = {
  'fascitis-plantar': () => import('./diagnoses/fascitis-plantar'),
};

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

  const loadEvidenceModule = EVIDENCE_MODULES[diagnosisKey];
  const module = await loadEvidenceModule();
  const evidence = module.default;
  return evidence;
};
