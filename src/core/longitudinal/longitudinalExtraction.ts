import type { SOAPNote } from '@/types/vertex-ai';

export function safeNullable<T>(value: T | undefined): T | null {
  const safeValue = value ?? null;
  return safeValue;
}

export type UpToTwoItems<T> =
  | [T]
  | [T, T];

export type UpToThreeItems<T> =
  | [T]
  | [T, T]
  | [T, T, T];

export type UpToFiveItems<T> =
  | [T]
  | [T, T]
  | [T, T, T]
  | [T, T, T, T]
  | [T, T, T, T, T];

export type LongitudinalEvidenceConfidence =
  | 'high'
  | 'guarded';

export type LongitudinalEvidenceSource =
  | 'vertex-output'
  | 'clinical-transcript'
  | 'clinician-additions'
  | 'prior-context'
  | 'previous-encounter';

export type LongitudinalEvidenceSection =
  | 'subjective'
  | 'objective'
  | 'assessment'
  | 'plan'
  | 'clinician-notes'
  | 'longitudinal-context';

export interface LongitudinalEvidence {
  source: LongitudinalEvidenceSource;
  sourceSections?: UpToTwoItems<LongitudinalEvidenceSection>;
  evidenceSnippet?: string;
  confidence: LongitudinalEvidenceConfidence;
  derivedFrom?: UpToTwoItems<string>;
}

export interface LongitudinalEvidenceSet {
  primary?: LongitudinalEvidence;
  secondary?: UpToTwoItems<LongitudinalEvidence>;
}

export type LongitudinalResponseToTreatment =
  | 'improved'
  | 'stable'
  | 'worsened'
  | 'not_clear';

export type LongitudinalTolerance =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'not_clear';

export type LongitudinalTrajectoryHint =
  | 'improved'
  | 'plateau'
  | 'regressed'
  | 'fluctuating'
  | null;

export interface LongitudinalExtraction {
  // Purpose: preserve what was done today even if SOAP plan is compressed.
  // Nullable default: undefined.
  // Max size: 5 items.
  // Safe-to-persist: yes, only when clearly grounded in objective/plan/clinician-notes.
  // Evidence requirement: at least one primary evidence item.
  // TODO: normalize to controlled vocabulary in future iteration
  treatmentPerformed?: UpToFiveItems<string>;

  // Purpose: preserve immediate response after treatment.
  // Nullable default: null.
  // Safe-to-persist: yes, when response is explicit.
  // Evidence requirement: explicit clinical response evidence.
  responseToTreatment?: LongitudinalResponseToTreatment | null;

  // Purpose: preserve tolerance to treatment/intervention.
  // Nullable default: null.
  // Safe-to-persist: yes, when tolerance is explicitly described.
  // Evidence requirement: explicit tolerance evidence.
  tolerance?: LongitudinalTolerance | null;

  // Purpose: preserve pain as a comparable longitudinal fact.
  // Nullable default: null.
  // Safe-to-persist: yes, when numeric pain is explicit.
  // Evidence requirement: explicit pain score evidence.
  painScore?: number | null;

  // Purpose: preserve ROM direction of change without storing narrative prose.
  // Nullable default: null.
  // Safe-to-persist: yes, as a guarded discrete fact.
  // Evidence requirement: explicit mobility or ROM evidence.
  romStatus?: 'improved' | 'stable' | 'decreased' | null;

  // Purpose: preserve functional direction of change.
  // Nullable default: null.
  // Safe-to-persist: yes, as a guarded discrete fact.
  // Evidence requirement: explicit functional evidence.
  functionStatus?: 'improved' | 'stable' | 'decreased' | null;

  // Purpose: preserve adherence in a reusable discrete form.
  // Nullable default: null.
  // Safe-to-persist: yes, when adherence is explicit.
  // Evidence requirement: explicit percentage or adherence statement.
  adherenceLevel?: 'high' | 'medium' | 'low' | null;

  // Purpose: capture persistent clinically relevant limitations for future visits.
  // Nullable default: undefined.
  // Max size: 3 items.
  // Safe-to-persist: yes, only for concrete limitations.
  // Evidence requirement: explicit limitation evidence.
  // TODO: normalize to controlled vocabulary in future iteration
  keyLimitations?: UpToThreeItems<string>;

  // Purpose: preserve explicit alerts that are clinically relevant and grounded.
  // Nullable default: undefined.
  // Max size: 2 items.
  // Safe-to-persist: guarded only, never speculative.
  // Evidence requirement: explicit alert evidence.
  alerts?: UpToTwoItems<string>;

  // Purpose: provide a per-visit trajectory hint only.
  // Nullable default: null.
  // Safe-to-persist: guarded only.
  // Evidence requirement: explicit comparison context.
  trajectory?: LongitudinalTrajectoryHint;

  // Purpose: preserve concrete blockers to progression.
  // Nullable default: undefined.
  // Max size: 2 items.
  // Safe-to-persist: guarded only when barrier is explicit.
  // Evidence requirement: explicit barrier evidence.
  // TODO: normalize to controlled vocabulary in future iteration
  barriersToProgress?: UpToTwoItems<string>;

  // Purpose: preserve strongest and bounded supporting evidence.
  // Nullable default: undefined.
  // Safe-to-persist: yes.
  // Evidence requirement: primary should be present when any guarded fact is persisted.
  evidence?: LongitudinalEvidenceSet;
}

export interface LongitudinalState {
  patientId: string;
  updatedFromEncounterId: string;
  updatedAt: string;

  // Purpose: patient-level trajectory used for longitudinal reasoning.
  // Persistence rule: computed only by future deterministic builder.
  // Evidence requirement: derived from persisted encounter snapshots, never raw Vertex text.
  // DO NOT use snapshot trajectory as source of truth
  trajectory?: LongitudinalTrajectoryHint;

  // Purpose: latest comparable pain fact at patient-level.
  // Persistence rule: computed from snapshots only.
  // Evidence requirement: snapshot-backed.
  latestPainScore?: number | null;

  // Purpose: latest patient-level ROM status summary.
  // Persistence rule: computed from snapshots only.
  // Evidence requirement: snapshot-backed.
  romStatus?: 'improved' | 'stable' | 'decreased' | null;

  // Purpose: latest patient-level function status summary.
  // Persistence rule: computed from snapshots only.
  // Evidence requirement: snapshot-backed.
  functionStatus?: 'improved' | 'stable' | 'decreased' | null;

  // Purpose: latest patient-level adherence status summary.
  // Persistence rule: computed from snapshots only.
  // Evidence requirement: snapshot-backed.
  adherenceLevel?: 'high' | 'medium' | 'low' | null;

  // Purpose: current bounded limitations relevant for follow-up reasoning.
  // Persistence rule: computed from snapshots only, max 3 items.
  // Evidence requirement: snapshot-backed.
  // TODO: normalize to controlled vocabulary in future iteration
  keyLimitations?: UpToThreeItems<string>;

  // Purpose: current bounded barriers relevant for progression reasoning.
  // Persistence rule: computed from snapshots only, max 2 items.
  // Evidence requirement: snapshot-backed.
  // TODO: normalize to controlled vocabulary in future iteration
  barriersToProgress?: UpToTwoItems<string>;

  // Purpose: current bounded alerts relevant for follow-up reasoning.
  // Persistence rule: computed from snapshots only, max 2 items.
  // Evidence requirement: snapshot-backed.
  alerts?: UpToTwoItems<string>;
}

export type SOAPOutput = SOAPNote;

export type VertexClinicalOutput = {
  soap: SOAPOutput;
  longitudinalExtraction?: LongitudinalExtraction;
};
