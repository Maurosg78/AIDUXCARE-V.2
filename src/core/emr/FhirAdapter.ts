import { EmrPort, Patient, Encounter, ClinicalNote, PatientId, EncounterId, NoteId } from './EmrPort';

export class FhirAdapter implements EmrPort {
  private patients = new Map<string, Patient>();
  private encounters = new Map<string, Encounter>();
  private notes = new Map<string, ClinicalNote>();

  async getPatient(id: PatientId): Promise<Patient | null> {
    return this.patients.get(id.value) ?? null;
  }

  async upsertPatient(p: Patient): Promise<Patient> {
    this.patients.set(p.id.value, p);
    return p;
  }

  async upsertEncounter(e: Encounter): Promise<Encounter> {
    this.encounters.set(e.id.value, e);
    return e;
  }

  async upsertClinicalNote(n: ClinicalNote): Promise<ClinicalNote> {
    this.notes.set(n.id.value, n);
    return n;
  }
}
