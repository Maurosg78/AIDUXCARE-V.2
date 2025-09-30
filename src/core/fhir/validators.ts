export function scrubFhirResource(resource: any) {
  const scrubbed = { ...resource };
  delete scrubbed.id;
  delete scrubbed.meta;
  return scrubbed;
}

export function validate(resource: any): { valid: boolean; errors?: string[] } {
  if (!resource || !resource.resourceType) {
    return { valid: false, errors: ['Missing resourceType'] };
  }
  
  // Validación básica por tipo
  if (resource.resourceType === 'Patient') {
    if (!resource.name || resource.name.length === 0) {
      return { valid: false, errors: ['Patient must have name'] };
    }
  }
  
  if (resource.resourceType === 'Encounter') {
    if (!resource.status) {
      return { valid: false, errors: ['Encounter must have status'] };
    }
  }
  
  return { valid: true };
}
