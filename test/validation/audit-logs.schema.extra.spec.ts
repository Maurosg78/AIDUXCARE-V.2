import { describe, it, expect } from "vitest";
import { AuditLogSchema } from "../../src/validation/audit-logs.schema";

describe("AuditLogSchema - extras", () => {
  it("normaliza action 'note.created' → 'CREATE'", () => {
    const r = AuditLogSchema.safeParse({
      userId: "u-1",
      entity_type: "note",
      entity_id: "n-1",
      event: "note.created",
      created_at: "2025-10-14T10:00:00Z",
    });
    expect(r.success).toBe(true);
    const v = (r as any).data;
    expect(v.action).toBe("CREATE");
  });

  it("permite entityType='system' sin userId", () => {
    const r = AuditLogSchema.safeParse({
      entity_type: "system",
      entity_id: "sys-evt",
      event: "note.updated",
      created_at: "2025-10-14T10:00:00Z",
    });
    expect(r.success).toBe(true);
  });

  it("resuelve aliases actor_id/entity_type/entity_id", () => {
    const r = AuditLogSchema.safeParse({
      actor_id: "usr-9",
      entity_type: "patient",
      entity_id: "pt-9",
      event: "note.signed",
      ts: { seconds: 1734200000, nanoseconds: 0 },
      ip: "192.168.1.10",
    });
    expect(r.success).toBe(true);
    const v = (r as any).data;
    expect(v.userId).toBe("usr-9");
    expect(v.entityType).toBe("patient");
    expect(v.entityId).toBe("pt-9");
    expect(v.ipAddress).toBe("192.168.1.10");
    expect(v.action).toBe("SIGN");
  });

  it("acepta timestamp flexible (epoch ms)", () => {
    const r = AuditLogSchema.safeParse({
      userId: "u-1",
      entityType: "note",
      entityId: "n-1",
      action: "update",
      timestamp: 1734200000000,
    });
    expect(r.success).toBe(true);
  });
});
