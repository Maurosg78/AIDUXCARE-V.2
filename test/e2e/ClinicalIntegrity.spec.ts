/**
 * AiDuxCare — ClinicalIntegrityService E2E
 * WO: WO-2024-002 Phase 3B
 */
import { describe, it, expect, vi } from "vitest";
import { ClinicalIntegrityService } from "../../src/services/ClinicalIntegrityService";
import { ClinicalAuditTrailService } from "../../src/services/ClinicalAuditTrailService";

vi.mock("../../src/services/ClinicalAuditTrailService", () => ({
  ClinicalAuditTrailService: {
    record: vi.fn(async (event) => {
      console.log("[MOCK_AUDIT] integrity event:", event);
      return { data: [event], error: null };
    }),
  },
}));

describe("🧬 ClinicalIntegrityService — Hash & Audit Link", () => {
  it("✅ should generate deterministic SHA-256 hash", () => {
    const hash1 = ClinicalIntegrityService.generateIntegrityHash({ s: "test" }, "1.1");
    const hash2 = ClinicalIntegrityService.generateIntegrityHash({ s: "test" }, "1.1");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("🩺 should record hash event into ClinicalAuditTrailService", async () => {
    const hash = await ClinicalIntegrityService.recordIntegrityEvent(
      "user-001",
      "note-001",
      { subjective: "ok" },
      "1.1"
    );
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("🔍 should verify integrity correctly", () => {
    const note = { subjective: "patient fine" };
    const hash = ClinicalIntegrityService.generateIntegrityHash(note, "1.1");
    const valid = ClinicalIntegrityService.verifyIntegrity(note, "1.1", hash);
    const invalid = ClinicalIntegrityService.verifyIntegrity({ subjective: "changed" }, "1.1", hash);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
