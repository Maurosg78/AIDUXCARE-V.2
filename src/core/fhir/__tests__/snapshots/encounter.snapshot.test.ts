// src/core/fhir/__tests__/snapshots/encounter.snapshot.test.ts
import { describe, it, expect } from 'vitest';
import { internalEncounterMock } from '../__fixtures__/internal.mock';
// Importar desde el index principal
import { toFhirEncounter } from '../../index';

describe('FHIR Encounter snapshot', () => {
  it('matches expected snapshot for an ambulatory encounter', () => {
    const fhirEncounter = toFhirEncounter(internalEncounterMock, { profile: 'US_CORE' });
    // Comprobaciones mínimas coherentes con el Sprint 2
    expect(fhirEncounter.resourceType).toBe('Encounter');

    // Asegura que class.code sea el mapeo correcto (AMB)
    // según la regla que definimos (ambulatory → AMB)
    expect(fhirEncounter.class?.code).toBe('AMB');

    // Referencias coherentes (Patient/Practitioner/Organization si tu adapter las genera)
    // Nota: Ajusta según tu implementación (reference vs. display)
    if (Array.isArray(fhirEncounter.participant)) {
      expect(fhirEncounter.participant[0]).toBeDefined();
    }

    expect(fhirEncounter).toMatchSnapshot();
  });
});
