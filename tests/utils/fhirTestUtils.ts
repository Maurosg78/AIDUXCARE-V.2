// tests/utils/fhirTestUtils.ts
/**
 * FHIR Test Utilities
 * 
 * Helper functions for FHIR resource testing, particularly for snapshot testing
 * where we need to scrub dynamic values (timestamps, IDs, etc.)
 */

/**
 * Scrubs dynamic values from a FHIR resource to make snapshot testing stable.
 * 
 * Removes/normalizes:
 * - IDs (replaced with 'SCRUBBED_ID')
 * - Timestamps (meta.lastUpdated, meta.versionId, createdAt, updatedAt, etc.)
 * - Version IDs
 * 
 * @param resource - The FHIR resource to scrub
 * @returns A scrubbed copy of the resource with stable values
 */
export function scrubFhirResource<T extends Record<string, any>>(resource: T): T {
  // Evita flakiness en snapshots: timestamps, ids, meta, etc.
  const clone = structuredClone(resource);

  // normalizaciones comunes
  if (clone.id) clone.id = 'SCRUBBED_ID';
  if (clone.meta) {
    if (clone.meta.lastUpdated) clone.meta.lastUpdated = 'SCRUBBED_LAST_UPDATED';
    if (clone.meta.versionId) clone.meta.versionId = 'SCRUBBED_VERSION';
  }

  // Si hay timestamps anidados típicos
  for (const k of ['createdAt', 'updatedAt', 'timestamp', 'date']) {
    if (k in clone) clone[k] = 'SCRUBBED_DATE';
  }

  return clone;
}

