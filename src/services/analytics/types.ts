/**
 * Analytics Types
 */

export enum AnalyticsCategory {
  USER = 'user',
  SESSION = 'session',
  WORKFLOW = 'workflow',
  FEATURE = 'feature',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  COST = 'cost',
}

export interface AnalyticsEvent {
  category: AnalyticsCategory;
  action: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface SanitizedPayload {
  event: string;
  category: AnalyticsCategory;
  metadata: Record<string, any>;
  environment: string;
  version: string;
  timestamp: number;
  phiCompliant: boolean;
  userIdHash?: string;
  patientIdHash?: string;
  sessionIdHash?: string;
}



