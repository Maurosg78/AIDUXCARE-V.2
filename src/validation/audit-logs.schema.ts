import { z } from "zod";

const IsoDateString = z.string().refine(
  (v) => !Number.isNaN(Date.parse(v)),
  { message: "at must be ISO-8601 or Firestore Timestamp-like" }
);

const FirestoreTimestampLike = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
}).strict();

const TimestampOrISO = z.union([IsoDateString, FirestoreTimestampLike]);

// Permitimos un conjunto acotado de entidades
export const EntityType = z.enum(["note", "consent", "user", "system"]);

// Formato de evento: segmentos en minúsculas con puntos (p.ej., note.created)
// Evita strings libres tipo "Created a note with text..."
const EventString = z.string().regex(
  /^[a-z]+(\.[a-z_]+)*$/,
  "event must be dot.notation, lowercase (e.g., 'note.created')"
);

// Meta permitido: sólo valores primitivos (string/number/boolean)
// y sin claves que sugieran PHI libre (subjective/objective/assessment/plan)
const MetaRecord = z.record(
  z.union([z.string().max(200), z.number(), z.boolean()])
).optional();

const FORBIDDEN_META_KEYS = new Set(["subjective","objective","assessment","plan"]);

export const AuditLogSchema = z.object({
  entity_type: EntityType,
  entity_id: z.string().min(1, "entity_id required"),
  event: EventString,
  at: TimestampOrISO,
  // actor_id puede faltar en eventos "system"
  actor_id: z.string().min(1).optional(),
  meta: MetaRecord,
}).superRefine((val, ctx) => {
  // Si no es system → actor_id requerido
  if (val.entity_type !== "system" && !val.actor_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actor_id"],
      message: "actor_id required unless entity_type is 'system'",
    });
  }

  // Evitar claves de PHI libre en meta
  if (val.meta) {
    for (const k of Object.keys(val.meta)) {
      if (FORBIDDEN_META_KEYS.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meta", k],
          message: `Forbidden meta key for PHI-free audit logs: '${k}'`,
        });
      }
    }
  }
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export function validateAuditLog(input: unknown): AuditLog {
  return AuditLogSchema.parse(input);
}
export function safeValidateAuditLog(input: unknown) {
  return AuditLogSchema.safeParse(input);
}
