import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CtoFinalReportService } from "../../src/services/CtoFinalReportService";

describe("📜 CtoFinalReportService — Executive Seal", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate final_report_manifest.json and PDF", () => {
    const result = CtoFinalReportService.generate();
    expect(result.manifest.status).toBe("FINALIZED");
    expect(fs.existsSync(path.join(outputDir, "trustbridge_final_report.pdf"))).toBe(true);
  });
});
