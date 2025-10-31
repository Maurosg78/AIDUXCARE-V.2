/**
 * AiDuxCare — AuditOpsDaemonService E2E
 * Phase 13A (Continuous Verification Daemon)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AuditOpsDaemonService } from "../../src/services/AuditOpsDaemonService";

describe("🛰 AuditOpsDaemonService — Continuous Verification", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate audit_ops_status.json with valid signature", () => {
    const ok = AuditOpsDaemonService.runCycle();
    expect(ok).toBe(true);

    const log = path.join(outputDir, "audit_ops_status.json");
    expect(fs.existsSync(log)).toBe(true);

    const data = JSON.parse(fs.readFileSync(log, "utf8"));
    expect(data.verified).toBe(true);
    expect(data.signature).toMatch(/^[a-f0-9]{64}$/);
  });
});
