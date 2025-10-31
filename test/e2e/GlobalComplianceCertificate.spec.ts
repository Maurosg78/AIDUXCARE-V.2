import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GlobalComplianceCertificateService } from "../../src/services/GlobalComplianceCertificateService";

describe("🏅 GlobalComplianceCertificateService — Global Seal PDF", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should issue global_final_certificate.pdf", async () => {
    const pdfPath = GlobalComplianceCertificateService.issue();
    await new Promise((resolve) => setTimeout(resolve, 500)); // Espera a que se cierre el stream
    expect(fs.existsSync(path.join(outputDir, "global_final_certificate.pdf"))).toBe(true);
  });
});
