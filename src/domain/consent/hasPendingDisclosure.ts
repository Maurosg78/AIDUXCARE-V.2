/**
 * ✅ WO-CONSENT-VERBAL-NON-BLOCKING-01: Domain helper for disclosure status
 * 
 * This is a PURE domain function - does NOT block UI, does NOT infer legal state.
 * It only answers: "Does this patient have a pending disclosure obligation?"
 * 
 * Usage:
 * - UI can show reminder banner if true
 * - UI can offer retry buttons if true
 * - UI MUST NOT block workflow if true
 */

import { DisclosureService } from '@/services/disclosureService';

/**
 * Check if patient has pending disclosure
 * Domain helper - does NOT block UI
 * 
 * @param patientId - Patient ID
 * @param professionalId - Professional ID
 * @returns Promise<boolean> - true if disclosure is pending or failed
 */
export async function hasPendingDisclosure(
  patientId: string,
  professionalId: string
): Promise<boolean> {
  return await DisclosureService.hasPendingDisclosure(patientId, professionalId);
}
