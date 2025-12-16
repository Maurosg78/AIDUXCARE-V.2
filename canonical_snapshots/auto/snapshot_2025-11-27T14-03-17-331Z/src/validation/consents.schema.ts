import { z } from "zod";
import { FlexibleTimestamp } from "./timestamps";

export const ConsentTypeEnum = z.enum(["data_processing", "ai_assisted", "research"]);
const STRICT = process.env.VALIDATION_STRICT === "true";

function normalizeConsentType(t: unknown): unknown {
  if (typeof t !== "string") return t;
  const s = t.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map: Record<string, "data_processing" | "ai_assisted" | "research"> = {
    data_processing: "data_processing",
    dataproc: "data_processing",
    privacy: "data_processing",
    gdpr: "data_processing",
    ai_assisted: "ai_assisted",
    ai: "ai_assisted",
    ai_assistance: "ai_assisted",
    aiassisted: "ai_assisted",
    research: "research",
    study: "research",
  };
  return map[s] ?? (["data_processing", "ai_assisted", "research"].includes(s) ? (s as any) : t);
}

function toBooleanLoose(v: unknown): unknown {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true","1","yes","y","si","sí","active","enabled","on","granted","accepted","approved","opt_in","optin"].includes(s)) return true;
    if (["false","0","no","n","inactive","disabled","off","revoked","denied","opt_out","optout"].includes(s)) return false;
  }
  return v;
}

export const ConsentSchema = z
  .preprocess((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const r: any = { ...(raw as any) };

    // ids
    if (r.patient_id && !r.patientId) r.patientId = r.patient_id;

    // tipo
    const typeCandidates = [
      r.consentType, r.type, r.consent_type, r.category, r.kind, r.consent, r.topic, r.scope, r.policy, r.label, r.name,
    ].filter((x) => typeof x !== "undefined");
    if (!r.consentType && typeCandidates.length) r.consentType = typeCandidates[0];
    if (r.consentType) r.consentType = normalizeConsentType(r.consentType);

    // timestamps primero (para el fallback de granted)
    if (r.granted_at && !r.grantedAt) r.grantedAt = r.granted_at;
    if (r.revoked_at && !r.revokedAt) r.revokedAt = r.revoked_at;

    // active (varias formas)
    const activeCands = [r.active, r.is_active, r.isActive, r.status];
    for (const c of activeCands) {
      const coerced = toBooleanLoose(c);
      if (typeof coerced === "boolean") { r.active = coerced; break; }
    }

    // granted: ampliar aliases (snake & camel)
    const grantedCandidates = [
      r.granted, r.accepted, r.consented, r.is_granted, r.isGranted, r.value, r.status,
      r.allow, r.allowed, r.enabled, r.grant, r.granted_flag, r.grantedFlag, r.flag,
      r.approved, r.given, r.agree, r.agreed, r.hasConsented, r.consentGiven,
      r.opt_in, r.optin, r.opted_in, r.optedIn, r.opted_out, r.optedOut
    ].filter((x) => typeof x !== "undefined");

    if (typeof r.granted === "undefined" && grantedCandidates.length) {
      const coerced = toBooleanLoose(grantedCandidates[0]);
      if (typeof coerced === "boolean") r.granted = coerced;
    }

    // Fallback: deducir desde timestamps/active si sigue indefinido
    if (typeof r.granted === "undefined") {
      if (typeof r.revokedAt !== "undefined" && r.revokedAt !== null) {
        r.granted = false;
      } else if (typeof r.grantedAt !== "undefined" && r.grantedAt !== null) {
        r.granted = true;
      } else if (typeof r.active === "boolean") {
        r.granted = r.active;
      }
    }

    return r;
  }, z.object({
    id: z.string().min(1).optional(),
    patientId: z.string().min(STRICT ? 10 : 1),
    consentType: ConsentTypeEnum,
    granted: z.boolean(),
    grantedAt: FlexibleTimestamp,
    revokedAt: FlexibleTimestamp.nullish().optional(),
    active: z.boolean().optional(),
  }))
  .superRefine((v, ctx) => {
    if (v.revokedAt && v.active === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active"],
        message: "active must be false when revokedAt is present",
      });
    }
  });

export type Consent = z.infer<typeof ConsentSchema>;
