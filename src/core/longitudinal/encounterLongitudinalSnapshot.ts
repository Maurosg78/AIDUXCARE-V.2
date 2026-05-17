import type { TrajectoryConfidence } from './trajectoryClassifier';
import type { TrajectoryLabel } from './patientTrajectoryMemory';
import type {
  LongitudinalEvidenceSet,
  LongitudinalResponseToTreatment,
  LongitudinalTolerance,
  UpToFiveItems,
  UpToThreeItems,
  UpToTwoItems,
} from './longitudinalExtraction';
import type { LongitudinalSignal } from '@/types/longitudinal';

/**
 * Minimal structured longitudinal facts persisted per encounter.
 * These fields are deterministic and can be trusted over re-parsing free text later.
 */
export interface EncounterLongitudinalSnapshot {
  // Purpose: comparable pain fact per encounter.
  // Persistence rule: safe to auto-persist only if explicit.
  // Evidence requirement: explicit pain evidence.
  painScore?: number | null;

  // Purpose: preserve numeric HEP adherence when available.
  // Persistence rule: safe to auto-persist only if explicit.
  // Evidence requirement: explicit adherence percentage evidence.
  hepAdherenceRate?: number | null;

  // Purpose: per-visit trajectory hint only.
  // Persistence rule: guarded hint, not source of truth.
  // Evidence requirement: explicit comparison context.
  // DO NOT use snapshot trajectory as source of truth
  trajectory?: TrajectoryLabel | null;

  // Purpose: preserve confidence of per-visit trajectory hint.
  // Persistence rule: persist only with trajectory hint.
  // Evidence requirement: same evidence used for trajectory hint.
  trajectoryConfidence?: TrajectoryConfidence | null;

  // Purpose: preserve ROM direction of change.
  // Persistence rule: guarded fact only.
  // Evidence requirement: explicit ROM or mobility evidence.
  romStatus?: 'improved' | 'stable' | 'decreased' | null;

  // Purpose: preserve functional direction of change.
  // Persistence rule: guarded fact only.
  // Evidence requirement: explicit functional evidence.
  functionStatus?: 'improved' | 'stable' | 'decreased' | null;

  // Purpose: preserve adherence as a reusable discrete fact.
  // Persistence rule: safe to auto-persist when explicit.
  // Evidence requirement: explicit adherence evidence.
  adherenceLevel?: 'high' | 'medium' | 'low' | null;

  // Purpose: preserve what was done during the encounter beyond SOAP compression.
  // Persistence rule: guarded fact only.
  // Evidence requirement: explicit treatment evidence.
  // TODO: normalize to controlled vocabulary in future iteration
  treatmentPerformed?: UpToFiveItems<string>;

  // Purpose: preserve immediate clinical response to treatment.
  // Persistence rule: guarded fact only.
  // Evidence requirement: explicit response evidence.
  responseToTreatment?: LongitudinalResponseToTreatment | null;

  // Purpose: preserve tolerance to intervention.
  // Persistence rule: safe to auto-persist when explicit.
  // Evidence requirement: explicit tolerance evidence.
  tolerance?: LongitudinalTolerance | null;

  // Purpose: preserve concrete limitations that matter longitudinally.
  // Persistence rule: guarded fact only, max 3 items.
  // Evidence requirement: explicit limitation evidence.
  // TODO: normalize to controlled vocabulary in future iteration
  keyLimitations?: UpToThreeItems<string>;

  // Purpose: preserve concrete barriers to progress.
  // Persistence rule: guarded fact only, max 2 items.
  // Evidence requirement: explicit barrier evidence.
  // TODO: normalize to controlled vocabulary in future iteration
  barriersToProgress?: UpToTwoItems<string>;

  // Purpose: preserve grounded alerts only.
  // Persistence rule: guarded fact only, max 2 items.
  // Evidence requirement: explicit alert evidence.
  alerts?: UpToTwoItems<string>;

  // Purpose: keep strongest bounded evidence attached to persisted facts.
  // Persistence rule: safe to auto-persist when facts are persisted.
  // Evidence requirement: primary evidence for guarded facts whenever possible.
  evidence?: LongitudinalEvidenceSet;

  // Purpose: preserve compact clinical continuity signals that may be lost in SOAP compression.
  // Persistence rule: compact facts only; never raw transcript.
  // Evidence requirement: extracted from post-processed Vertex analysis or structured clinician input.
  signals?: LongitudinalSignal[];
}
