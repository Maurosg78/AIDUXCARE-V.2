// Market: CA | Language: en-CA
// Aidux North — Regulatory-to-Code (CPO Ontario, Section 6 conceptual translation)
// MVP Fields: assessment, plan, followUp, patientId, clinicianId, signature, datetime (ISO 8601 Z)

export type CpoComplianceInput = {
  assessment: string;
  plan: string;
  followUp: string;
  patientId: string;
  clinicianId: string;
  signature: string;
  datetime: string; // ISO 8601 with trailing Z (UTC), e.g. 2025-09-26T10:00:00Z
};

export type ValidationResult = {
  success: boolean;
  errors: string[];
};

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// Strict ISO 8601 UTC with trailing Z, seconds required, optional .mmm
const ISO_Z_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isIsoZDatetime(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_Z_REGEX.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

export function runCpoRules(input: CpoComplianceInput): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmpty(input.assessment)) errors.push("CPO-2025-Doc-Assessment: assessment must be non-empty.");
  if (!isNonEmpty(input.plan)) errors.push("CPO-2025-Doc-Plan: plan must be non-empty.");
  if (!isNonEmpty(input.followUp)) errors.push("CPO-2025-Doc-FollowUp: followUp must be non-empty.");
  if (!isNonEmpty(input.patientId)) errors.push("CPO-2025-Doc-PatientId: patientId must be non-empty.");
  if (!isNonEmpty(input.clinicianId)) errors.push("CPO-2025-Doc-ClinicianId: clinicianId must be non-empty.");
  if (!isNonEmpty(input.signature)) errors.push("CPO-2025-Doc-Signature: signature must be non-empty.");
  if (!isIsoZDatetime(input.datetime)) errors.push("CPO-2025-Doc-DateTime: datetime must be ISO 8601 UTC with trailing Z.");

  return { success: errors.length === 0, errors };
}

// Backwards-compatible alias as per DoD wording
export const CpoRules = { runCpoRules };
