import { Timestamp } from 'firebase/firestore';
import type { ClinicalNote } from '@/types/notes';

// Tipos de entrada para claridad
export type CreateNoteData = Omit<
  ClinicalNote,
  'id' | 'createdAt' | 'updatedAt' | 'status'
> & { status?: ClinicalNote['status'] };

export type UpdateNoteData = Partial<
  Omit<ClinicalNote, 'id' | 'createdAt' | 'updatedAt'>
>;

// TODO: reemplazar stubs por implementación Firestore real
export async function createNote(data: CreateNoteData): Promise<string> {
  // ejemplo: addDoc(collection(db, 'notes'), {...})
  return 'note-id-stub';
}

export async function updateNote(id: string, updates: UpdateNoteData): Promise<void> {
  // ejemplo: updateDoc(doc(db, 'notes', id), {...})
}

export async function getNoteById(id: string): Promise<ClinicalNote | null> {
  return null;
}

export async function getLastNoteByPatient(patientId: string): Promise<ClinicalNote | null> {
  return null;
}

export async function getLastNotes(patientId: string, count: number): Promise<ClinicalNote[]> {
  return [];
}

// Opcional: helper para firmar
export async function signNote(id: string): Promise<void> {
  // ejemplo: hash S/O/A/P + update status
}

// Back-compat: utilizado por PendingNotesModal (stub hasta query real)
export async function fetchPendingNotes(
  clinicianUid: string,
  patientId?: string
): Promise<ClinicalNote[]> {
  // TODO: implementar consulta real (draft/returned por clinician, opcionalmente por patientId)
  return [];
}
