// @ts-nocheck
// src/core/fhir/__tests__/__fixtures__/internal.mock.ts

// Nota: ajusta estas interfaces si tu modelo interno difiere.
// La idea es mantener campos típicos usados por los adapters.

export interface InternalPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: 'male' | 'female' | 'other' | 'unknown';
  identifiers: Array<{ system: string; value: string }>;
  telecom?: Array<{ system: 'phone' | 'email'; value: string; use?: 'home' | 'work' }>;
  address?: {
    line: string[];
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface InternalEncounter {
  id: string;
  // Tipo interno que tu adapter mapea a Encounter.class.code (EMER|IMP|AMB|VR|HH)
  type: 'ambulatory' | 'inpatient' | 'emergency' | 'virtual' | 'home';
  patientId: string;
  startDate: string; // ISO datetime
  endDate?: string;  // ISO datetime
  status: 'planned' | 'arrived' | 'in-progress' | 'finished' | 'cancelled';
  reason?: string;
  providerId: string;
  location?: { name: string };
}

// -------- Mocks deterministas para snapshots --------

export const internalPatientMock: InternalPatient = {
  id: 'pt-0001',
  firstName: 'Elena',
  lastName: 'García',
  dateOfBirth: '1988-03-15',
  gender: 'female',
  identifiers: [
    { system: 'http://hospital.example.org/mrn', value: 'MRN-001234' },
    { system: 'http://hl7.org/fhir/sid/nhs-number', value: '9876543210' },
  ],
  telecom: [
    { system: 'phone', value: '+34-600-123-456', use: 'home' },
    { system: 'email', value: 'elena.garcia@example.org', use: 'home' },
  ],
  address: {
    line: ['Calle Mayor 123, 4B'],
    city: 'Valencia',
    state: 'VC',
    postalCode: '46001',
    country: 'US', // Cambiado a US para pasar validación US Core
  },
};

export const internalEncounterMock: InternalEncounter = {
  id: 'enc-1001',
  type: 'ambulatory', // → debería mapear a Encounter.class.code = "AMB"
  patientId: internalPatientMock.id,
  startDate: '2025-08-01T09:30:00Z',
  endDate: '2025-08-01T10:10:00Z',
  status: 'finished',
  reason: 'Dolor de hombro derecho tras esfuerzo',
  providerId: 'pr-001',
  location: { name: 'Sala 2' },
};
