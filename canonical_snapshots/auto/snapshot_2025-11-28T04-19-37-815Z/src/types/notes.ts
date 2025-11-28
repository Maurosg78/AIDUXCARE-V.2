import { Timestamp } from "firebase/firestore";

export interface ClinicalNote {
  id: string;
  patientId: string;
  visitId?: string;
  clinicianUid: string;
  status: "draft" | "submitted" | "signed";
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  signedHash?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum NoteError {
  NOT_FOUND = "ERR_NOTE_NOT_FOUND",
  IMMUTABLE = "ERR_NOTE_IMMUTABLE",
  INVALID_STATUS = "ERR_INVALID_STATUS",
}
