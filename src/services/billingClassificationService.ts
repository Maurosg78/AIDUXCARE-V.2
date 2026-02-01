/**
 * WO-BILLING-READINESS-FOUNDATION: Classify encounter for billing.
 * Pure, deterministic. No SOAP, no side effects, no complex heuristics.
 */

import type { BillingType } from '@/types/billing';

export class BillingClassificationService {
  /**
   * Classify encounter for billing.
   * Rules (explicit, simple):
   * 1) If encounter has signal for MVA → 'MVA'
   * 2) If encounter has signal for WSIB → 'WSIB'
   * 3) If no signal → 'PRIVATE'
   * 4) If critical data missing → 'UNKNOWN'
   */
  static classifyEncounter(encounter: { id?: string; patientId?: string; [key: string]: unknown }): BillingType {
    if (!encounter?.id || !encounter?.patientId) {
      return 'UNKNOWN';
    }
    const source = (encounter as { source?: string }).source;
    const billingType = (encounter as { billingType?: BillingType }).billingType;
    if (billingType === 'MVA' || source === 'mva') return 'MVA';
    if (billingType === 'WSIB' || source === 'wsib') return 'WSIB';
    return 'PRIVATE';
  }
}
