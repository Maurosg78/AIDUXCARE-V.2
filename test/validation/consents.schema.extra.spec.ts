import { describe, it, expect } from "vitest";
import { ConsentSchema } from "../../src/validation/consents.schema";

describe("ConsentSchema - extras", () => {
  it("acepta aliases de consentType (consent_type/kind)", () => {
    const r1 = ConsentSchema.safeParse({
      patient_id: "pt-1",
      consent_type: "ai_assisted",
      granted: true,
      granted_at: "2025-10-14T10:00:00Z",
    });
    expect(r1.success).toBe(true);

    const r2 = ConsentSchema.safeParse({
      patient_id: "pt-1",
      kind: "research",
      granted: false,
      granted_at: { seconds: 1734200000, nanoseconds: 0 },
    });
    expect(r2.success).toBe(true);
  });

  it("acepta aliases de granted (accepted/consented/is_granted/value:boolean)", () => {
    for (const sample of [
      { accepted: true },
      { consented: false },
      { is_granted: true },
      { value: false },
    ]) {
      const r = ConsentSchema.safeParse({
        patient_id: "pt-1",
        consent_type: "data_processing",
        granted_at: "2025-10-14T10:00:00Z",
        ...sample,
      });
      expect(r.success).toBe(true);
    }
  });

  it("rechaza active=true cuando hay revokedAt", () => {
    const r = ConsentSchema.safeParse({
      patient_id: "pt-1",
      consent_type: "research",
      granted: true,
      granted_at: "2025-10-14T10:00:00Z",
      revoked_at: "2025-10-14T11:00:00Z",
      active: true,
    });
    expect(r.success).toBe(false);
  });
});
