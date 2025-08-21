// src/core/fhir/__tests__/snapshots/patient.snapshot.test.ts
import { describe, it, expect } from 'vitest';
import { convertPatientToFhir } from '../../adapters/internalToFhir';
import { scrubFhirResource } from '../../../../../tests/utils/fhirTestUtils';

describe('FHIR Patient snapshot', () => {
  it('matches expected snapshot for a representative internal patient', () => {
    const internalPatient = {
      id: 'pt-0001',
      firstName: 'María',
      lastName: 'García',
      dateOfBirth: '1988-03-15',
      gender: 'female' as const,
      email: 'maria.garcia@email.com',
      phone: '+34 600 123 456',
      address: {
        street: 'Calle Mayor 123',
        city: 'Madrid',
        state: 'Madrid',
        zipCode: '28001',
        country: 'Spain'
      },
      medicalRecordNumber: 'MRN-001',
      insuranceNumber: 'INS-001',
      ssn: '123-45-6789',
      isActive: true
    };

    const fhirPatient = convertPatientToFhir(internalPatient);
    
    // Validación básica previa al snapshot
    expect(fhirPatient.resourceType).toBe('Patient');
    
    // Limpiar campos dinámicos antes del snapshot
    const scrubbedPatient = scrubFhirResource(fhirPatient);
    expect(scrubbedPatient).toMatchSnapshot();
  });
});
