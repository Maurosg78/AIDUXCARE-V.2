export interface PatientId {
  value: string;
}

export interface EncounterId {
  value: string;
}

export interface NoteId {
  value: string;
}

export interface Patient {
  id: PatientId;
  givenName: string;
  familyName: string;
  dateOfBirthISO: string;
}

export interface Encounter {
  id: EncounterId;
  patientId: PatientId;
  startedAtISO: string;
  endedAtISO?: string;
  location?: string;
}

export interface ClinicalNote {
  id: NoteId;
  encounterId: EncounterId;
  patientId: PatientId;
  mimeType: 'text/markdown' | 'text/plain';
  content: string;
  createdAtISO: string;
}

export interface EmrPort {
  getPatient(id: PatientId): Promise<Patient | null>;
  upsertPatient(p: Patient): Promise<Patient>;
  upsertEncounter(e: Encounter): Promise<Encounter>;
  upsertClinicalNote(n: ClinicalNote): Promise<ClinicalNote>;
}
