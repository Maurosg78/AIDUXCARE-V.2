/**
 * AiDuxCare — ExternalRegulatorValidationService E2E
 * Phase: 7A (External Regulator Validation)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ExternalRegulatorValidationService } from "../../src/services/ExternalRegulatorValidationService";
import { RegulatorExportService } from "../../src/services/RegulatorExportService";
import { ProofChainService } from "../../src/services/ProofChainService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";
import { AuditSummaryPDFService } from "../../src/services/AuditSummaryPDFService";

describe("🏛️ ExternalRegulatorValidationService — Regulator Verification", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should record external validation result (even if not public-verified)", async () => {
    const proof = await ProofChainService.generateProof("user-V", "note-V700", "hashV700", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-V",
      note_id: "note-V700",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);
    await RegulatorExportService.createExportBundle("note-V700");

    const record = ExternalRegulatorValidationService.validateBundle("note-V700", "CPO Ontario");
    expect(typeof record.verified).toBe("boolean");
    expect(record.regulator).toBe("CPO Ontario");
    expect(fs.existsSync(path.join(outputDir, "external_validation_ledger.json"))).toBe(true);
  });
});
