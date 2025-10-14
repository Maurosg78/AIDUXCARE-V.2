import { z } from "zod";
import { FlexibleTimestamp } from "./timestamps";

export const NoteStatusEnum = z.enum(["draft", "submitted", "signed"]);

export const NoteMetadataSchema = z.object({
  sessionDuration: z.number().int().positive(),
  aiAssisted: z.boolean(),
  version: z.string().regex(/^\d+\.\d+$/),
});

const STRICT = process.env.VALIDATION_STRICT === "true";

export const ClinicalNoteSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const r: any = { ...(raw as any) };

  // aliases legacy → canonical
  if (r.patient_id && !r.patientId) r.patientId = r.patient_id;
  if (r.clinic_id && !r.clinicianId) r.clinicianId = r.clinic_id;
  if (r.note_id && !r.id) r.id = r.note_id;
  if (r.uuid && !r.id) r.id = r.uuid;

  // timestamps (names + shapes)
  if (r.created_at && !r.createdAt) r.createdAt = r.created_at;
  if (r.signed_at && !r.signedAt) r.signedAt = r.signed_at;

  // SOAP aliases
  if (r.subj && !r.subjective) r.subjective = r.subj;
  if (r.obj && !r.objective) r.objective = r.obj;
  if ((r.assess || r.assessment_text) && !r.assessment) r.assessment = r.assess ?? r.assessment_text;

  // inmutabilidad: si está signed y trae hash, marcamos immutable_signed=true si no viene
  if (r.status === "signed" && r.immutable_hash && typeof r.immutable_signed === "undefined") {
    r.immutable_signed = true;
  }

  return r;
}, z.object({
  id: z.string().min(1).optional(),
  patientId: z.string().min(STRICT ? 10 : 1),
  clinicianId: z.string().min(STRICT ? 10 : 1),
  status: NoteStatusEnum,
  subjective: z.string().max(5000).optional().default(""),
  objective: z.string().max(5000).optional().default(""),
  assessment: z.string().max(5000).optional().default(""),
  plan: z.string().max(5000).optional().default(""),
  createdAt: FlexibleTimestamp,
  signedAt: FlexibleTimestamp.nullish(),
  metadata: NoteMetadataSchema.optional(),
  immutable_hash: z.string().min(1).optional(),
  immutable_signed: z.boolean().optional(),
})).superRefine((val, ctx) => {
  // Si está firmada, debe tener hash y el flag true
  if (val.status === "signed") {
    if (!val.immutable_hash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["immutable_hash"],
        message: "immutable_hash required when status is 'signed'",
      });
    }
    if (val.immutable_signed !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["immutable_signed"],
        message: "immutable_signed must be true when status is 'signed'",
      });
    }
  }
});

export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>;
