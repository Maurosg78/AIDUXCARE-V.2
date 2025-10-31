/**
 * AiDuxCare — EMRBridgeService E2E
 * Phase: 4A (Cross-System Audit Bridge)
 */
import { describe, it, expect, vi } from "vitest";
import { EMRBridgeService } from "../../src/services/EMRBridgeService";
import { ClinicalAuditTrailService } from "../../src/services/ClinicalAuditTrailService";

vi.mock("../../src/services/ClinicalAuditTrailService", () => ({
  ClinicalAuditTrailService: {
    record: vi.fn(async (event) => {
      console.log("[MOCK_AUDIT] sync recorded:", event);
      return { data: [event], error: null };
    }),
  },
}));

describe("🌉 EMRBridgeService — Cross-System Audit Bridge", () => {
  it("✅ should create integrity hash and sync to JaneApp", async () => {
    const { hash, response } = await EMRBridgeService.bridgeAuditEvent(
      "user-123",
      "note-abc",
      { subjective: "ok", plan: "continue" },
      "1.1",
      "provider-001",
      "janeapp"
    );
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(response.status).toBe(200);
  });

  it("🧩 should create integrity hash and sync to Noterro", async () => {
    const { hash, response } = await EMRBridgeService.bridgeAuditEvent(
      "user-999",
      "note-xyz",
      { objective: "stable" },
      "1.1",
      "provider-002",
      "noterro"
    );
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(response.status).toBe(200);
  });
});
