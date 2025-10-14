import { describe, it, expect } from "vitest";
import { ClinicalNoteSchema } from "../../src/validation/notes.schema";

describe("ClinicalNoteSchema - extras", () => {
  it("resuelve aliases snake_case → camelCase", () => {
    const r = ClinicalNoteSchema.safeParse({
      patient_id: "pt-123",
      clinic_id: "cl-777",
      status: "draft",
      created_at: "2025-10-14T10:00:00Z",
    });
    expect(r.success).toBe(true);
    const v = (r as any).data;
    expect(v.patientId).toBe("pt-123");
    expect(v.clinicianId).toBe("cl-777");
    expect(v.createdAt).toBeDefined();
  });

  it("exige immutable_hash cuando status='signed'", () => {
    const r = ClinicalNoteSchema.safeParse({
      patient_id: "pt-1",
      clinic_id: "cl-1",
      status: "signed",
      created_at: "2025-10-14T10:00:00Z",
    });
    expect(r.success).toBe(false);
  });

  it("marca immutable_signed=true cuando status='signed' y llega immutable_hash", () => {
    const r = ClinicalNoteSchema.safeParse({
      patient_id: "pt-1",
      clinic_id: "cl-1",
      status: "signed",
      created_at: "2025-10-14T10:00:00Z",
      immutable_hash: "sha256:abc",
    });
    expect(r.success).toBe(true);
    const v = (r as any).data;
    expect(v.immutable_signed).toBe(true);
  });

  it("normaliza SOAP en draft (strings vacíos por defecto)", () => {
    const r = ClinicalNoteSchema.safeParse({
      patient_id: "pt-1",
      clinic_id: "cl-1",
      status: "draft",
      created_at: "2025-10-14T10:00:00Z",
    });
    expect(r.success).toBe(true);
    const v = (r as any).data;
    expect(v.subjective).toBeTypeOf("string");
    expect(v.objective).toBeTypeOf("string");
    expect(v.assessment).toBeTypeOf("string");
    expect(v.plan).toBeTypeOf("string");
  });

  it("acepta timestamps flexibles (ISO, epoch ms, {seconds,nanoseconds})", () => {
    // ISO
    expect(ClinicalNoteSchema.safeParse({
      patient_id: "pt-1", clinic_id: "cl-1", status: "draft", created_at: "2025-10-14T10:00:00Z",
    }).success).toBe(true);

    // epoch ms
    expect(ClinicalNoteSchema.safeParse({
      patient_id: "pt-1", clinic_id: "cl-1", status: "draft", created_at: 1734200000000,
    }).success).toBe(true);

    // {seconds,nanoseconds}
    expect(ClinicalNoteSchema.safeParse({
      patient_id: "pt-1", clinic_id: "cl-1", status: "draft",
      created_at: { seconds: 1734200000, nanoseconds: 0 },
    }).success).toBe(true);
  });
});
