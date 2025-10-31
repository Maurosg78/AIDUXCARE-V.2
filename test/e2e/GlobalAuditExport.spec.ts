import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GlobalAuditExportService } from "../../src/services/GlobalAuditExportService";

describe("🧾 GlobalAuditExportService — Forensic Bundle", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate audit_manifest.json and ZIP bundle", () => {
    const result = GlobalAuditExportService.generate();
    expect(result.manifest.status).toBe("AUDIT_READY");
    expect(fs.existsSync(path.join(outputDir, "audit_manifest.json"))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "trustbridge_audit_bundle.zip"))).toBe(true);
  });
});
