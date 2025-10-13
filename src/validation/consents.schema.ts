import { z } from "zod";

const IsoDateString = z.string().refine(
  (v) => !Number.isNaN(Date.parse(v)),
  { message: "timestamp must be ISO-8601 or Firestore Timestamp-like" }
);

const FirestoreTimestampLike = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
}).strict();

const TimestampOrISO = z.union([IsoDateString, FirestoreTimestampLike]);

/**
 * Consent schema (Canada-first, en-CA)
 * Minimal, pero con reglas útiles:
 * - patient_id y scope requeridos
 * - grantedAt requerido al crear
 * - revokedAt opcional; si existe => active debe ser false
 * - active por defecto true si no hay revokedAt
 */
export const ConsentScope = z.enum([
  "data_processing",
  "research_opt_in",
  "marketing_opt_in",
  "telemedicine",
]);

export const ConsentSchema = z.object({
  patient_id: z.string().min(3, "patient_id required"),
  scope: ConsentScope,
  grantedAt: TimestampOrISO,
  revokedAt: TimestampOrISO.nullish().optional(),
  active: z.boolean().optional(),
}).superRefine((val, ctx) => {
  // Si hay revokedAt => active debe ser false (o no presente)
  if (val.revokedAt != null) {
    if (val.active === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active"],
        message: "active must be false when consent has been revoked",
      });
    }
  }
});

export type Consent = z.infer<typeof ConsentSchema>;

export function validateConsent(input: unknown): Consent {
  return ConsentSchema.parse(input);
}
export function safeValidateConsent(input: unknown) {
  return ConsentSchema.safeParse(input);
}
