import type { Timestamp } from 'firebase/firestore';

export interface SecondaryClinicalMemory {
  recurringSignals?: string[];
  adherencePatterns?: string[];
  contextualThreads?: string[];
  unresolvedTopics?: string[];
  softWarnings?: string[];
  suggestedAttentionPoints?: string[];
  sourceSessionId: string;
  sourceVisitType: 'initial' | 'followup' | 'ongoing';
  createdAt: Timestamp;
}
