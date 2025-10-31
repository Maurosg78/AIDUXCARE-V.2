/**
 * AiDuxCare — AuditVerificationRegistrySealService E2E
 * Phase 12A (Audit Verification Registry Seal — E-Trust Canada)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AuditVerificationRegistrySealService } from "../../src/services/AuditVerificationRegistrySealService";

describe("🔏 AuditVerificationRegistrySealService — E-Trust Canada Final Seal", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should compute master hash and generate final registry certificate", async () => {
    const ok = await AuditVerificationRegistrySealService.sealAll();
    expect(ok).toBe(true);

    const json = path.join(outputDir, "final_registry_hash.json");
    const pdf  = path.join(outputDir, "audit_registry_certificate.pdf");
    expect(fs.existsSync(json)).toBe(true);
    expect(fs.existsSync(pdf)).toBe(true);

    const data = JSON.parse(fs.readFileSync(json, "utf8"));
    expect(data.verified).toBe(true);
    expect(data.master_hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
