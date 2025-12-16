/**
 * Session State Types
 * 
 * Defines the structure for session state persistence across routes
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import type { SOAPNote } from './vertex-ai';

export type SessionType = 'initial' | 'followup' | 'wsib' | 'mva' | 'emergency' | 'certificate';
export type SessionSubtype = 'acute' | 'certificate' | 'postsurgical' | 'insurance' | undefined;
export type OutputType = 'soap' | 'wsib-form' | 'mva-form' | 'certificate' | 'referral' | 'prescription';

export interface SessionState {
  sessionId: string;
  patientId: string;
  patientName?: string;
  sessionType: SessionType;
  subtype?: SessionSubtype;
  additionalOutputs: OutputType[];
  transcript: string;
  soapNote?: SOAPNote;
  isRecording: boolean;
  startTime: Date;
  lastUpdated: Date;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
}

export interface SessionStateUpdate {
  transcript?: string;
  soapNote?: SOAPNote;
  isRecording?: boolean;
  additionalOutputs?: OutputType[];
  status?: SessionState['status'];
}

export interface SessionStatePersistence {
  save: (state: SessionState) => Promise<void>;
  load: (sessionId: string) => Promise<SessionState | null>;
  update: (sessionId: string, update: SessionStateUpdate) => Promise<void>;
  delete: (sessionId: string) => Promise<void>;
  list: () => Promise<SessionState[]>;
  clearExpired: () => Promise<void>;
}

