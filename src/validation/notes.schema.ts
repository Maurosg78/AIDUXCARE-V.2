import { z } from "zod";

/**
 * Helpers
 */
const IsoDateString = z.string().refine(
  (v) => !Number.isNaN(Date.parse(v)),
  { message: "createdAt/updatedAt must be ISO-8601" }
);

// Firestore Timestamp (emulador/SDK) — forma laxa para no acoplar el validador
const FirestoreTimestampLike = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
}).strict();

const TimestampOrISO = z.union([IsoDateString, FirestoreTimestampLike]);

/**
 * Clinical Note schema (Canada-first, en-CA)
 * - Matches Section 5 (Data Architecture)
 */
export const NoteStatus = z.enum(["draft", "signed"]);

export const ClinicalNoteSchema = z.object({
  // required
  patient_id: z.string().min(3, "patient_id must be a string id"),
  clinic_id: z.string().min(2, "clinic_id must be a string id"),
  author_id: z.string().min(2, "author_id must be a string id"),
  status: NoteStatus,
  createdAt: TimestampOrISO,
  updatedAt: TimestampOrISO,

  // immutable flags/hash (required only when signed)
  immutable_signed: z.boolean().optional(),
  immutable_hash: z.string().min(10, "immutable_hash too short").optional(),

  // optional SOAP fields (guardrails length)
  subjective: z.string().max(5000, "subjective too long").optional(),
  objective: z.string().max(5000, "objective too long").optional(),
  assessment: z.string().max(5000, "assessment too long").optional(),
  plan: z.string().max(5000, "plan too long").optional(),

  // misc metadata (kept minimal)
  metadata: z
    .object({
      sessionDuration: z.number().int().nonnegative().optional(),
      aiAssisted: z.boolean().optional(),
      version: z.string().optional(),
    })
    .partial()
    .optional(),
})
.superRefine((val, ctx) => {
  // If signed → require immutable flags
  if (val.status === "signed") {
    if (!val.immutable_signed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["immutable_signed"],
        message: "immutable_signed must be true when status is 'signed'",
      });
    }
    if (!val.immutable_hash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["immutable_hash"],
        message: "immutable_hash is required when status is 'signed'",
      });
    }
  }
});

export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>;

/** Validate helper (returns parsed data or throws ZodError) */
export function validateNote(input: unknown): ClinicalNote {
  return ClinicalNoteSchema.parse(input);
}

/** Safe helper (no throw) */
export function safeValidateNote(input: unknown) {
  return ClinicalNoteSchema.safeParse(input);
}
