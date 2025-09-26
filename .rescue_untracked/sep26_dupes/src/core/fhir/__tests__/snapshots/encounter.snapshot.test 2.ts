// src/core/fhir/__tests__/snapshots/encounter.snapshot.test.ts
import { describe, it, expect } from 'vitest';

import { convertEncounterToFhir } from '../../adapters/internalToFhir';
import { scrubFhirResource } from '../../../../../tests/utils/fhirTestUtils';

describe('FHIR Encounter snapshot', () => {
  it('matches expected snapshot for an ambulatory encounter', () => {
    const internalEncounter = {
      id: 'enc-1001',
      patientId: 'patient-123',
      startDate: '2025-01-20T09:00:00Z',
      endDate: '2025-01-20T10:00:00Z',
      type: 'ambulatory' as const,
      status: 'finished' as const,
      reason: 'Consulta de seguimiento',
      providerId: 'provider-456',
      location: 'Consultorio 3'
    };

    const fhirEncounter = convertEncounterToFhir(internalEncounter);
    
    // Validación básica previa al snapshot
    expect(fhirEncounter.resourceType).toBe('Encounter');
    expect(fhirEncounter.status).toBe('finished');
    
    // Limpiar campos dinámicos antes del snapshot
    const scrubbedEncounter = scrubFhirResource(fhirEncounter);
    expect(scrubbedEncounter).toMatchSnapshot();
  });
});
