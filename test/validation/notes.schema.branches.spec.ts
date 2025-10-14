import { describe, it, expect } from "vitest";
import { ClinicalNoteSchema } from "../../src/validation/notes.schema";

describe("ClinicalNoteSchema branches", () => {
  it("require immutable_hash cuando status='signed' (branch)", () => {
    expect(ClinicalNoteSchema.safeParse({
      patient_id:"p1", clinic_id:"c1", status:"signed", created_at:"2025-10-14T10:00:00Z"
    }).success).toBe(false);
  });
  it("permite submitted con SOAP completo (branch positiva)", () => {
    const r = ClinicalNoteSchema.safeParse({
      patient_id:"p1", clinic_id:"c1", status:"submitted", created_at:"2025-10-14T10:00:00Z",
      subjective:"s", objective:"o", assessment:"a", plan:"p"
    });
    expect(r.success).toBe(true);
  });
  it("alias SOAP subj/obj/assess -> subjective/objective/assessment", () => {
    const r = ClinicalNoteSchema.safeParse({
      patient_id:"p1", clinic_id:"c1", status:"draft", created_at:"2025-10-14T10:00:00Z",
      subj:"s", obj:"o", assess:"a", plan:"p"
    });
    expect(r.success).toBe(true);
    const v:any = (r as any).data;
    expect(v.subjective).toBe("s");
    expect(v.objective).toBe("o");
    expect(v.assessment).toBe("a");
  });
});
