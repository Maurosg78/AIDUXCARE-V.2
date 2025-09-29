// Market: CA | Language: en-CA
// Vitest EVALs — CPO compliance must pass in CI (one pass case, one fail case)

import { describe, it, expect } from "vitest";
import ComplianceRunner from "../../../../src/core/compliance/cpo/ComplianceRunner";

// PASS: all fields valid
describe("CPO Compliance — passing case", () => {
  it("should not throw when all required fields are valid", () => {
    const valid = {
      assessment: "Shoulder pain assessment — findings consistent with rotator cuff tendinopathy.",
      plan: "Progressive loading + manual therapy; reassess in 2 weeks.",
      followUp: "Follow-up booked for 2025-10-10.",
      patientId: "patient-123",
      clinicianId: "clinician-456",
      signature: "Dr. Physio, PT",
      datetime: "2025-09-29T10:00:00Z",
    };
    expect(() => ComplianceRunner.assertCpoCompliance(valid)).not.toThrow();
  });
});

// FAIL: missing fields + bad datetime
describe("CPO Compliance — failing case", () => {
  it("should throw with detailed errors when fields are invalid", () => {
    const invalid = {
      assessment: "",
      plan: " ",
      followUp: "",
      patientId: "",
      clinicianId: "",
      signature: " ",
      datetime: "2025-09-29 10:00:00", // not ISO Z
    } as any;

    expect(() => ComplianceRunner.assertCpoCompliance(invalid)).toThrowError(/CPO Compliance failed/);
  });
});
