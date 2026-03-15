/** Clinical jurisdiction identifier (e.g. CA-ON for PHIPA). */
export type ClinicalJurisdiction = string;

import { getActiveJurisdiction } from '../jurisdiction/JurisdictionEngine';

/**
 * Jurisdiction for consent (e.g. CA-ON for PHIPA). Used by consent flow and domain.
 *
 * Phase 1:
 *  - Delegates to JurisdictionEngine
 *  - Still effectively returns CA-ON only (no behavior change)
 */
export function getCurrentJurisdiction(): ClinicalJurisdiction {
  return getActiveJurisdiction();
}
