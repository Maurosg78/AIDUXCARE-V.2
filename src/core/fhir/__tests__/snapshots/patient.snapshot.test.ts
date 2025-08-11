// src/core/fhir/__tests__/snapshots/patient.snapshot.test.ts
import { describe, it, expect } from 'vitest';
import { internalPatientMock } from '../__fixtures__/internal.mock';
// Importar desde el index principal
import { toFhir } from '../../index';

describe('FHIR Patient snapshot', () => {
  it('matches expected snapshot for a representative internal patient', () => {
    const fhirPatient = toFhir(internalPatientMock, { profile: 'US_CORE' });
    // Validación básica previa al snapshot
    expect(fhirPatient.resourceType).toBe('Patient');
    expect(fhirPatient).toMatchSnapshot();
  });
});
