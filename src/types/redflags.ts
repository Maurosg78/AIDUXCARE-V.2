/**
 * WO-001: Red Flags Acknowledgement types
 * Captures justification at acknowledgement time to avoid re-asking in SOAP.
 */

import type { Timestamp } from 'firebase/firestore';

export type RedFlagDecision = 'refer' | 'treat_with_monitoring';

export interface RedFlagAcknowledgement {
  flagId: string;
  acknowledged: boolean;
  acknowledgedAt: Timestamp;
  decision?: RedFlagDecision;
  /** WO-001: Captured when decision = treat_with_monitoring */
  justification?: string;
  justifiedAt?: Timestamp;
}
