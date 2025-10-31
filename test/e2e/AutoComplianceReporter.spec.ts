/**
 * AiDuxCare — AutoComplianceReporterService E2E
 * Phase 13B (Automated Compliance Reporter)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AutoComplianceReporterService } from "../../src/services/AutoComplianceReporterService";

describe("📋 AutoComplianceReporterService — Automated Compliance Reporter", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate JSON and HTML compliance reports with signature", () => {
    const ok = AutoComplianceReporterService.run();
    expect(ok).toBe(true);

    const json = path.join(outputDir, "compliance_report.json");
    const html = path.join(outputDir, "compliance_report.html");

    expect(fs.existsSync(json)).toBe(true);
    expect(fs.existsSync(html)).toBe(true);

    const data = JSON.parse(fs.readFileSync(json, "utf8"));
    expect(data.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(data.compliance_score).toBeGreaterThan(50);
  });
});
