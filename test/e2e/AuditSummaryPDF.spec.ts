/**
 * AiDuxCare — AuditSummaryPDFService E2E
 * Phase: 6B (Niagara CTO Audit Summary)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AuditSummaryPDFService } from "../../src/services/AuditSummaryPDFService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";
import { ProofChainService } from "../../src/services/ProofChainService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";

describe("🧾 AuditSummaryPDFService — Niagara CTO Audit Summary", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should build and sign PDF from compliance markdown", async () => {
    const proof = await ProofChainService.generateProof("user-A", "note-CTO", "hashCTO", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);

    const report = await ComplianceReportService.generateReport({
      user_id: "user-A",
      note_id: "note-CTO",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });

    const pdf = await AuditSummaryPDFService.createPDF(report.mdPath);
    expect(fs.existsSync(pdf.pdfPath)).toBe(true);
    expect(pdf.seal).toMatch(/^[a-f0-9]{64}$/);
  });
});
