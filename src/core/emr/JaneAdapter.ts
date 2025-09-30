import { EmrPort, Patient, Encounter, ClinicalNote, PatientId } from './EmrPort';

export class JaneAdapter implements EmrPort {
  async getPatient(_: PatientId): Promise<Patient | null> {
    throw new Error('JaneAdapter not implemented: credentials required');
  }
  
  async upsertPatient(_: Patient): Promise<Patient> {
    throw new Error('JaneAdapter not implemented: credentials required');
  }
  
  async upsertEncounter(_: Encounter): Promise<Encounter> {
    throw new Error('JaneAdapter not implemented: credentials required');
  }
  
  async upsertClinicalNote(_: ClinicalNote): Promise<ClinicalNote> {
    throw new Error('JaneAdapter not implemented: credentials required');
  }
}
