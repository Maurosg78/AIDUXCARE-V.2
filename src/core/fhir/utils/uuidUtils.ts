/**
 * UUID Utilities for FHIR Resources
 * Generates deterministic UUIDs for consistent references
 */

/**
 * Generate a deterministic UUID based on input string
 * @param input Input string to generate UUID from
 * @returns Deterministic UUID string
 */
export function generateDeterministicUuid(input: string): string {
  // Simple hash function for deterministic UUID generation
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and format as UUID
  const positiveHash = Math.abs(hash);
  const uuid = positiveHash.toString(16).padStart(8, '0');
  
  // Format: urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return `urn:uuid:${uuid}-${uuid.slice(0, 4)}-${uuid.slice(4, 8)}-${uuid.slice(0, 4)}-${uuid}${uuid.slice(0, 4)}`;
}

/**
 * Generate a deterministic reference for FHIR resources
 * @param resourceType Type of FHIR resource
 * @param id Resource ID
 * @returns Deterministic reference string
 */
export function generateFhirReference(resourceType: string, id: string): string {
  return generateDeterministicUuid(`${resourceType}/${id}`);
}

/**
 * Generate a deterministic UUID for internal references
 * @param prefix Prefix for the UUID
 * @param id Internal ID
 * @returns Deterministic UUID string
 */
export function generateInternalUuid(prefix: string, id: string): string {
  return generateDeterministicUuid(`${prefix}-${id}`);
}

