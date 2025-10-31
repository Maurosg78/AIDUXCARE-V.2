/**
 * AiDuxCare — RegulatorExportService E2E
 * Phase: 6C (Regulator Export Bundle)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RegulatorExportService } from "../../src/services/RegulatorExportService";
import { AuditSummaryPDFService } from "../../src/services/AuditSummaryPDFService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { ProofChainService } from "../../src/services/ProofChainService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";

describe("📦 RegulatorExportService — Export Bundle", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate regulator ZIP bundle with manifest", async () => {
    const proof = await ProofChainService.generateProof("user-R", "note-R900", "hashR900", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-R",
      note_id: "note-R900",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);

    const zip = await RegulatorExportService.createExportBundle("note-R900");
    expect(fs.existsSync(zip)).toBe(true);

    const manifestPath = path.join(outputDir, "manifest_note-R900.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(Array.isArray(manifest)).toBe(true);
    expect(manifest.length).toBeGreaterThan(3);
  });
});
