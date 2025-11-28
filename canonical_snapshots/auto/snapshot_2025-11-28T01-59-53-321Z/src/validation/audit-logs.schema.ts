import { z } from "zod";
import { FlexibleTimestamp } from "./timestamps";

export const AuditActionEnum = z.enum(["CREATE", "UPDATE", "SUBMIT", "SIGN", "DELETE"]);
export const EntityTypeEnum = z.enum(["note", "patient", "consent", "system"]);

function normalizeAction(a: unknown): unknown {
  if (typeof a !== "string") return a;
  const lower = a.toLowerCase();
  const last = lower.includes(".") ? lower.split(".").pop()! : lower;
  const map: Record<string, string> = {
    created: "CREATE",
    create: "CREATE",
    updated: "UPDATE",
    update: "UPDATE",
    submitted: "SUBMIT",
    submit: "SUBMIT",
    signed: "SIGN",
    sign: "SIGN",
    deleted: "DELETE",
    delete: "DELETE",
  };
  return map[last] ?? a.toUpperCase();
}

const ForbiddenMetaKeys = new Set(["subjective", "objective", "assessment", "plan", "soap", "phi"]);
function forbidSoapKeys(obj: unknown): string[] {
  if (!obj || typeof obj !== "object") return [];
  const hits: string[] = [];
  for (const k of Object.keys(obj as Record<string, unknown>)) {
    if (ForbiddenMetaKeys.has(k.toLowerCase())) hits.push(k);
  }
  return hits;
}

function isValidAction(x: unknown): x is z.infer<typeof AuditActionEnum> {
  return typeof x === "string" && ["CREATE","UPDATE","SUBMIT","SIGN","DELETE"].includes(x);
}

export const AuditLogSchema = z
  .preprocess((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const r: any = { ...(raw as any) };

    // Aliases de ids/actor
    if (r.actor_id && !r.userId) r.userId = r.actor_id;
    if (r.actorId && !r.userId) r.userId = r.actorId;
    if (r.user_id && !r.userId) r.userId = r.user_id;

    // Aliases de entity
    if (r.entity_type && !r.entityType) r.entityType = r.entity_type;
    if (typeof r.entityType === "string") r.entityType = r.entityType.toLowerCase();
    if (r.entity_id && !r.entityId) r.entityId = r.entity_id;

    // Aliases de IP y timestamp
    if (r.ip && !r.ipAddress) r.ipAddress = r.ip;
    if (r.ts && !r.timestamp) r.timestamp = r.ts;
    if (r.created_at && !r.timestamp) r.timestamp = r.created_at;
    if (r.at && !r.timestamp) r.timestamp = r.at;

    // Aliases de acción
    if (r.event && !r.action) r.action = r.event;
    if (r.action) r.action = normalizeAction(r.action);

    // Si es 'system' y la acción no cae en el enum, degradar a UPDATE
    if (r.entityType === "system" && !isValidAction(r.action)) {
      r.action = "UPDATE";
    }

    // Meta
    if (r.metadata && !r.meta) r.meta = r.metadata;

    return r;
  }, z.object({
    id: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    action: AuditActionEnum,
    entityType: EntityTypeEnum,
    entityId: z.string().min(1).optional(), // permitido omitir para 'system'
    oldValue: z.record(z.any()).optional(),
    newValue: z.record(z.any()).optional(),
    reason: z.string().optional(),
    timestamp: FlexibleTimestamp,
    ipAddress: z.string().ip().optional(),
    meta: z.record(z.any()).optional(),
  }))
  .superRefine((v, ctx) => {
    // Reglas de obligatoriedad según entityType
    if (v.entityType !== "system" && !v.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "userId required unless entityType is 'system'",
      });
    }
    if (v.entityType !== "system" && !v.entityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entityId"],
        message: "entityId required unless entityType is 'system'",
      });
    }

    // Bloquear claves PHI/SOAP en meta/old/new
    for (const [container, obj] of [
      ["meta" as const, v.meta],
      ["oldValue" as const, v.oldValue],
      ["newValue" as const, v.newValue],
    ]) {
      const hits = forbidSoapKeys(obj);
      for (const k of hits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ([container as 'oldValue'|'newValue'|'meta', k as string | number] as (string | number)[]),
          message: "PHI/SOAP keys are not allowed",
        });
      }
    }
  });

export type AuditLog = z.infer<typeof AuditLogSchema>;
