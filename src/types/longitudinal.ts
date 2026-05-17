import type { Timestamp } from 'firebase/firestore';

export type LongitudinalSignalType =
  | 'pain_change'
  | 'function_change'
  | 'adherence_change'
  | 'medication_change'
  | 'objective_measure_change'
  | 'patient_concern_repeated'
  | 'treatment_response'
  | 'plan_change_reason';

export type LongitudinalSignalSource =
  | 'vertex_analysis'
  | 'clinician_transcript'
  | 'objective_test';

export interface LongitudinalSignal {
  signalType: LongitudinalSignalType;
  value: string;
  source: LongitudinalSignalSource;
  sessionId: string;
  timestamp: Timestamp;
}

export interface EncounterLongitudinalSignalSnapshot {
  encounterId?: string;
  sessionId: string;
  patientId: string;
  professionalId: string;
  signals: LongitudinalSignal[];
  createdAt: Timestamp;
  capturedFromVertexAnalysis: boolean;
}
