import { describe, it, expect } from "vitest";
import { ConsentSchema } from "../../src/validation/consents.schema";

describe("ConsentSchema branches", () => {
  it("acepta aliases booleanos -> granted (accepted/value)", () => {
    const r1 = ConsentSchema.safeParse({
      patient_id: "p1",
      consent_type: "research",
      accepted: true, // alias → granted
      granted_at: "2025-10-14T10:00:00Z",
    });
    expect(r1.success).toBe(true);

    const r2 = ConsentSchema.safeParse({
      patient_id: "p1",
      consent_type: "research",
      value: false, // alias → granted
      granted_at: { seconds: 1734200000, nanoseconds: 0 },
    });
    expect(r2.success).toBe(true);
  });

  it("rechaza active=true cuando hay revokedAt", () => {
    const r = ConsentSchema.safeParse({
      patient_id: "p1",
      consent_type: "data_processing",
      granted: true,
      granted_at: "2025-10-14T10:00:00Z",
      revoked_at: "2025-10-14T11:00:00Z",
      active: true,
    });
    expect(r.success).toBe(false);
  });
});
