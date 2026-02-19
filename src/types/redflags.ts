/**
 * Red flag acknowledgement types for WO-001.
 * Captures user decision and justification at Physical Evaluation step
 * so SOAP Generation can pre-fill and avoid asking again.
 */

import type { Timestamp } from 'firebase/firestore';

export type RedFlagDecision = 'refer' | 'treat_with_monitoring';

export interface RedFlagAcknowledgement {
  flagId: string;
  acknowledged: boolean;
  acknowledgedAt: Timestamp;
  decision?: RedFlagDecision;
  /** Captured when decision is treat_with_monitoring (WO-001) */
  justification?: string;
  justifiedAt?: Timestamp;
}
