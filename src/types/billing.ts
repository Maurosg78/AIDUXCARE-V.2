/**
 * WO-BILLING-READINESS-FOUNDATION: Billing types and export shape.
 * Encounter = billable unit. No real invoicing; technical foundation only.
 */

export type BillingType = 'WSIB' | 'MVA' | 'PRIVATE' | 'UNKNOWN';

export interface BillingEncounterExport {
  encounterId: string;
  patientId: string;
  encounterDate: string; // ISO
  visitType: 'initial' | 'follow-up';
  sessionNumber: number;
  status: 'completed' | 'signed' | string;
  billingType: BillingType;
}
