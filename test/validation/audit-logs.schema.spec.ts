import { describe, it, expect } from "vitest";
import { AuditLogSchema } from "../../src/validation/audit-logs.schema";

describe("AuditLogSchema", () => {
  it("acepta audit de creación de nota válido", () => {
    const input = {
      entity_type: "note",
      entity_id: "note-001",
      event: "note.created",
      at: "2025-10-10T10:00:00Z",
      actor_id: "dr-001",
      meta: { status: "draft", attempt: 1, ai: false },
    };
    const r = AuditLogSchema.safeParse(input);
    expect(r.success).toBe(true);
  });

  it("acepta evento 'system' sin actor_id", () => {
    const input = {
      entity_type: "system",
      entity_id: "healthcheck",
      event: "system.health_ok",
      at: { seconds: 1_696_938_400, nanoseconds: 0 },
      meta: { check: "ok" },
    };
    const r = AuditLogSchema.safeParse(input);
    expect(r.success).toBe(true);
  });

  it("rechaza meta con claves de PHI (subjective/objective/...)", () => {
    const input = {
      entity_type: "note",
      entity_id: "note-002",
      event: "note.updated",
      at: "2025-10-10T10:05:00Z",
      actor_id: "dr-001",
      meta: { subjective: "texto libre NO permitido" },
    };
    const r = AuditLogSchema.safeParse(input);
    expect(r.success).toBe(false);
  });

  it("rechaza evento con formato inválido", () => {
    const input = {
      entity_type: "note",
      entity_id: "note-003",
      event: "Note Created", // inválido
      at: "2025-10-10T10:10:00Z",
      actor_id: "dr-001",
    };
    const r = AuditLogSchema.safeParse(input);
    expect(r.success).toBe(false);
  });

  it("rechaza falta de actor_id cuando entity_type != system", () => {
    const input = {
      entity_type: "consent",
      entity_id: "cons-001",
      event: "consent.granted",
      at: "2025-10-10T09:00:00Z",
      // actor_id falta → inválido
    };
    const r = AuditLogSchema.safeParse(input);
    expect(r.success).toBe(false);
  });
});
