/**
 * Utilidades para tests de FHIR
 * Limpia campos dinámicos como timestamps para hacer snapshots estables
 */

/**
 * Limpia campos dinámicos de un recurso FHIR para hacer snapshots estables
 * @param fhirResource Recurso FHIR a limpiar
 * @returns Recurso FHIR con campos dinámicos normalizados
 */
export function scrubFhirResource(fhirResource: Record<string, unknown>): Record<string, unknown> {
  const scrubbed = structuredClone(fhirResource);
  
  // Limpiar timestamps dinámicos
  if (scrubbed.meta?.lastUpdated) {
    (scrubbed.meta as Record<string, unknown>).lastUpdated = '2020-01-01T00:00:00Z';
  }
  
  if (scrubbed.meta?.versionId) {
    (scrubbed.meta as Record<string, unknown>).versionId = '1';
  }
  
  // Limpiar otros campos dinámicos comunes
  if (scrubbed.id && typeof scrubbed.id === 'string' && scrubbed.id.startsWith('urn:uuid:')) {
    scrubbed.id = scrubbed.id.replace('urn:uuid:', 'test-');
  }
  
  return scrubbed;
}

/**
 * Limpia múltiples recursos FHIR en un array
 * @param fhirResources Array de recursos FHIR
 * @returns Array de recursos FHIR limpios
 */
export function scrubFhirResources(fhirResources: Record<string, unknown>[]): Record<string, unknown>[] {
  return fhirResources.map(scrubFhirResource);
}
