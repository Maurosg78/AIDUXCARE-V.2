import type { TrajectoryConfidence } from './trajectoryClassifier';
import type { TrajectoryLabel } from './patientTrajectoryMemory';

/**
 * Minimal structured longitudinal facts persisted per encounter.
 * These fields are deterministic and can be trusted over re-parsing free text later.
 */
export interface EncounterLongitudinalSnapshot {
  painScore?: number | null;
  hepAdherenceRate?: number | null;
  trajectory?: TrajectoryLabel | null;
  trajectoryConfidence?: TrajectoryConfidence | null;
  romStatus?: 'improved' | 'stable' | 'decreased' | null;
  functionStatus?: 'improved' | 'stable' | 'decreased' | null;
  adherenceLevel?: 'high' | 'medium' | 'low' | null;
  keyLimitations?: string[];
  alerts?: string[];
}
