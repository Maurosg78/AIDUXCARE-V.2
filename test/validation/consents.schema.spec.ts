import { describe, it, expect } from "vitest";
import { ConsentSchema } from "../../src/validation/consents.schema";

describe("ConsentSchema", () => {
  it("acepta consentimiento activo válido (granted, sin revokedAt)", () => {
    const input = {
      patient_id: "pt-001",
      scope: "data_processing",
      grantedAt: "2025-10-09T08:00:00Z",
      active: true,
    };
    const r = ConsentSchema.safeParse(input);
    expect(r.success).toBe(true);
  });

  it("acepta consentimiento revocado (revokedAt presente, active false)", () => {
    const input = {
      patient_id: "pt-001",
      scope: "data_processing",
      grantedAt: "2025-10-09T08:00:00Z",
      revokedAt: { seconds: 1_696_870_400, nanoseconds: 0 },
      active: false,
    };
    const r = ConsentSchema.safeParse(input);
    expect(r.success).toBe(true);
  });

  it("rechaza active=true cuando hay revokedAt", () => {
    const input = {
      patient_id: "pt-001",
      scope: "telemedicine",
      grantedAt: "2025-10-09T08:00:00Z",
      revokedAt: "2025-10-10T08:00:00Z",
      active: true,
    };
    const r = ConsentSchema.safeParse(input);
    expect(r.success).toBe(false);
  });

  it("rechaza sin patient_id", () => {
    const input: any = {
      scope: "research_opt_in",
      grantedAt: "2025-10-09T08:00:00Z",
      active: true,
    };
    const r = ConsentSchema.safeParse(input);
    expect(r.success).toBe(false);
  });

  it("rechaza grantedAt inválido", () => {
    const input = {
      patient_id: "pt-001",
      scope: "marketing_opt_in",
      grantedAt: "not-a-date",
      active: true,
    };
    const r = ConsentSchema.safeParse(input);
    expect(r.success).toBe(false);
  });
});
