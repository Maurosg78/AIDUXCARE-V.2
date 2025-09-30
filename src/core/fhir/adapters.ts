export function toFhirPatient(internalPatient: any) {
  return {
    resourceType: 'Patient',
    id: internalPatient.id,
    name: [{
      family: internalPatient.lastName,
      given: [internalPatient.firstName]
    }]
  };
}

export function toFhirEncounter(internalEncounter: any) {
  // Mapear tipos a códigos FHIR
  const classMapping: Record<string, string> = {
    'emergency': 'EMER',
    'inpatient': 'IMP',
    'outpatient': 'AMB',
    'ambulatory': 'AMB'
  };
  
  return {
    resourceType: 'Encounter',
    id: internalEncounter.id,
    class: { code: classMapping[internalEncounter.type] || 'AMB' },
    status: 'finished'
  };
}

export function toFhirObservation(internalObs: any) {
  return {
    resourceType: 'Observation',
    id: internalObs.id,
    status: 'final',
    code: { text: internalObs.name },
    valueQuantity: internalObs.value ? { value: internalObs.value } : undefined
  };
}

// Función genérica toFhir que delega según el tipo
export function toFhir(resource: any, type: string) {
  switch (type) {
    case 'Patient':
      return toFhirPatient(resource);
    case 'Encounter':
      return toFhirEncounter(resource);
    case 'Observation':
      return toFhirObservation(resource);
    default:
      throw new Error(`Unknown resource type: ${type}`);
  }
}
