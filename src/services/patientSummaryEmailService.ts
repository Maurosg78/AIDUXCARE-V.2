/**
 * patientSummaryEmailService
 *
 * Calls the `sendPatientSummary` Cloud Function to email the session
 * summary (HEP + in-clinic treatment) to the patient.
 *
 * Spain pilot only — callers must gate behind isSpainPilot().
 */

import { httpsCallable } from 'firebase/functions';
import { getFunctionsInstance } from '@/lib/firebase';

export interface PatientSummaryEmailPayload {
  patientEmail: string;
  patientFirstName: string;
  professionalName: string;
  professionalTitle: string;
  visitDate: string;
  inClinicItems: string[];
  hepItems: string[];
  customMessage?: string;
}

interface PatientSummaryEmailResult {
  ok: boolean;
  id?: string;
}

export async function sendPatientSummaryEmail(
  payload: PatientSummaryEmailPayload
): Promise<PatientSummaryEmailResult> {
  const fn = httpsCallable<PatientSummaryEmailPayload, PatientSummaryEmailResult>(
    getFunctionsInstance(),
    'sendPatientSummary'
  );
  const result = await fn(payload);
  return result.data;
}
