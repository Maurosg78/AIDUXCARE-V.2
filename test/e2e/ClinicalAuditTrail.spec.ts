/**
 * AiDuxCare — ClinicalAuditTrailService E2E
 * WO: WO-2024-002 Phase 3A
 */
import { describe, it, expect, vi } from "vitest";
import { ClinicalAuditTrailService } from "../../src/services/ClinicalAuditTrailService";
import { supabase } from "../../src/services/ConsentAuditService";

vi.mock("../../src/services/ConsentAuditService", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(async (payload: any) => {
        console.log("[MOCK_SUPABASE] clinical_audit_trail insert:", payload);
        return { data: payload, error: null };
      }),
    })),
  },
}));

describe("🩺 ClinicalAuditTrailService — Logging", () => {
  it("✅ should record CREATE event linked to consent version", async () => {
    const event = {
      user_id: "00000000-0000-0000-0000-000000000001",
      note_id: "note-001",
      event_type: "CREATE",
      description: "SOAP note created",
      consent_version: "1.1",
    };
    const result = await ClinicalAuditTrailService.record(event);
    expect(result.error).toBeNull();
    expect(result.data[0].event_type).toBe("CREATE");
    expect(result.data[0].consent_version).toBe("1.1");
  });

  it("🕒 should auto-assign timestamp when missing", async () => {
    const event = {
      user_id: "user-001",
      event_type: "VIEW",
      description: "Note viewed",
    };
    const result = await ClinicalAuditTrailService.record(event);
    expect(result.data[0].timestamp).toBeDefined();
  });

  it("🔗 should handle errors gracefully", async () => {
    (supabase.from as any).mockReturnValueOnce({
      insert: vi.fn(async () => ({ data: null, error: new Error("DB down") })),
    });
    const result = await ClinicalAuditTrailService.record({
      user_id: "user-002",
      event_type: "DELETE",
      description: "Test delete fail",
    });
    expect(result.error).not.toBeNull();
  });
});
