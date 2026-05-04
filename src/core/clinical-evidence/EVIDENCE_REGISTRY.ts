// ADR-004: Registry of all approved diagnoses in evidence library
// New diagnosis requires CTO clinical review before entry

type EvidenceRegistryStatus = 'pending_papers' | 'approved';

type EvidenceRegistryEntry = {
  readonly file: string;
  readonly status: EvidenceRegistryStatus;
  readonly version: string;
  readonly lastReviewed: string | null;
};

export const EVIDENCE_REGISTRY = {
  'fascitis-plantar': {
    file: './diagnoses/fascitis-plantar',
    status: 'approved',
    version: '1.0.0',
    lastReviewed: '2026-05-04',
  },
} as const satisfies Record<string, EvidenceRegistryEntry>;

export type DiagnosisKey = keyof typeof EVIDENCE_REGISTRY;

export const getEvidenceRegistryEntry = (
  diagnosisId: DiagnosisKey
): EvidenceRegistryEntry => {
  const entry = EVIDENCE_REGISTRY[diagnosisId];
  return entry;
};
