// src/services/ConsentService.ts
// Simplified local storage version (to be replaced with Supabase later)

import { ConsentRecord } from "../types/consent";

const STORAGE_KEY = "aidux_consent_records";

export const ConsentService = {
  saveConsent(consent: ConsentRecord) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing.push(consent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return consent;
  },

  getAllConsents(): ConsentRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  },

  hasValidConsent(patient_id: string): boolean {
    const records = ConsentService.getAllConsents();
    return records.some(
      (r) => r.patient_id === patient_id && !!r.ai_processing_consent
    );
  },
};
