export type NoteStatus = 'draft' | 'submitted' | 'signed';

export interface ClinicalNote {
  id: string;
  patientId: string;
  visitId?: string;
  clinicianUid: string;
  status: NoteStatus;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  signedHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NoteError {
  NOT_FOUND = 'ERR_NOTE_NOT_FOUND',
  IMMUTABLE = 'ERR_NOTE_IMMUTABLE',
  INVALID_STATUS = 'ERR_INVALID_STATUS',
  UNAUTHORIZED = 'ERR_UNAUTHORIZED'
}
