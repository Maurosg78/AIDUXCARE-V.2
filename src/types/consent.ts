// src/types/consent.ts
// PIPEDA Compliance — Consent Record Definition
// Market: CA | Language: en-CA | Work Order: WO-2024-002

export interface ConsentRecord {
    patient_id: string; // encrypted or anonymized ID
    ai_processing_consent: boolean;
    cross_border_disclosure: boolean;
    consent_date: string;
    consent_version: string;
    research_vs_clinical: "research" | "clinical";
    withdrawal_date?: string;
    ip_address_hash: string;
  }
  