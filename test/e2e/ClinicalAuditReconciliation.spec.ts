import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ClinicalAuditReconciliationService } from "../../src/services/ClinicalAuditReconciliationService";

describe("🩺 ClinicalAuditReconciliationService — TrustBridge Closure", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate clinical_audit_reconciliation.json", () => {
    const result = ClinicalAuditReconciliationService.reconcile();
    expect(result.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "clinical_audit_reconciliation.json"))).toBe(true);
  });
});
