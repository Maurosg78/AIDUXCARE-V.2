import { describe, it, expect } from "vitest";
import { ClinicalNoteSchema } from "../../src/validation/notes.schema";

describe("ClinicalNoteSchema", () => {
  it("acepta un borrador válido (draft)", () => {
    const ok = ClinicalNoteSchema.parse({
      patient_id: "pt-001",
      clinic_id: "cl-001",
      author_id: "dr-001",
      status: "draft",
      createdAt: "2025-10-10T10:00:00Z",
      updatedAt: "2025-10-10T10:05:00Z",
      subjective: "Lower back pain",
    });
    expect(ok.status).toBe("draft");
  });

  it("acepta una nota firmada válida (signed) con hash y flag", () => {
    const ok = ClinicalNoteSchema.parse({
      patient_id: "pt-002",
      clinic_id: "cl-001",
      author_id: "dr-002",
      status: "signed",
      createdAt: "2025-10-11T09:00:00Z",
      updatedAt: "2025-10-11T09:10:00Z",
      immutable_signed: true,
      immutable_hash: "sha256:dummyhash12345",
    });
    expect(ok.immutable_signed).toBe(true);
  });

  it("rechaza signed sin immutable_hash/immutable_signed", () => {
    const res = ClinicalNoteSchema.safeParse({
      patient_id: "pt-003",
      clinic_id: "cl-001",
      author_id: "dr-003",
      status: "signed",
      createdAt: "2025-10-11T09:00:00Z",
      updatedAt: "2025-10-11T09:10:00Z",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza status inválido", () => {
    const res = ClinicalNoteSchema.safeParse({
      patient_id: "pt-004",
      clinic_id: "cl-001",
      author_id: "dr-004",
      status: "in_progress",
      createdAt: "2025-10-10T10:00:00Z",
      updatedAt: "2025-10-10T10:05:00Z",
    });
    expect(res.success).toBe(false);
  });

  it("acepta Timestamp-like de Firestore (seconds/nanoseconds)", () => {
    const ok = ClinicalNoteSchema.parse({
      patient_id: "pt-005",
      clinic_id: "cl-001",
      author_id: "dr-005",
      status: "draft",
      createdAt: { seconds: 1700000000, nanoseconds: 0 },
      updatedAt: { seconds: 1700003600, nanoseconds: 0 },
    });
    expect(ok.createdAt).toBeTruthy();
  });
});
