import type { TrajectoryConfidence } from './trajectoryClassifier';
import type { TrajectoryLabel } from './patientTrajectoryMemory';

/**
 * Minimal structured longitudinal facts persisted per encounter.
 * These fields are deterministic and can be trusted over re-parsing free text later.
 */
export interface EncounterLongitudinalSnapshot {
  painScore?: number;
  hepAdherenceRate?: number;
  trajectory?: TrajectoryLabel;
  trajectoryConfidence?: TrajectoryConfidence;
}
