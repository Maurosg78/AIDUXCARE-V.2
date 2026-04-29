import { Timestamp } from 'firebase/firestore';

export type RedFlagHistoryDecision =
  | 'continue'
  | 'referral_stop'
  | 'referral_continue_partial';

export type RedFlagHistoryStatus =
  | 'reviewed'
  | 'pending';

export type RedFlagHistoryVisitType =
  | 'initial'
  | 'follow-up'
  | 'unknown';

export interface RedFlagHistoryEntry {
  id: string;
  flagText: string;
  firstDetected: Date | Timestamp;
  lastReviewed: Date | Timestamp;
  reviewedBy: string;
  decision: RedFlagHistoryDecision;
  sessionId: string;
  status: RedFlagHistoryStatus;
  visitType: RedFlagHistoryVisitType;
  updatedAt?: Date | Timestamp;
  createdAt?: Date | Timestamp;
}

export interface UpsertRedFlagHistoryInput {
  patientId: string;
  flagText: string;
  reviewedBy: string;
  decision: RedFlagHistoryDecision;
  sessionId: string;
  status: RedFlagHistoryStatus;
  visitType?: RedFlagHistoryVisitType;
  detectedAt?: Date;
}

export interface RedFlagHistoryResolution {
  incomingFlagText: string;
  historyId: string;
  matchedEntry: RedFlagHistoryEntry | null;
  status: 'known_reviewed' | 'known_pending' | 'new_pending';
}
