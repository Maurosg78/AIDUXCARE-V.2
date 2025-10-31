/**
 * AiDuxCare — CTOComplianceReportGenerator E2E
 * Phase: 9A (Compliance Closure Report)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CTOComplianceReportGenerator } from "../../src/reports/CTOComplianceReportGenerator";

describe("🧾 CTOComplianceReportGenerator — Final Audit Report", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate consolidated markdown report and bundle", async () => {
    const reportPath = CTOComplianceReportGenerator.buildReport();
    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, "utf8");
    expect(content.includes("Compliance Artifacts Summary")).toBe(true);

    await CTOComplianceReportGenerator.bundleArtifacts();
    const bundlePath = path.join(outputDir, "compliance_chain_proof.zip");
    expect(fs.existsSync(bundlePath)).toBe(true);
  });
});
