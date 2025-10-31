/**
 * AiDuxCare — InsuranceLiabilitySyncService E2E
 * Phase: 7B (Insurance Liability Sync)
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
import { InsuranceLiabilitySyncService } from "../../src/services/InsuranceLiabilitySyncService";

describe("💼 InsuranceLiabilitySyncService — Insurance Liability Sync", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate insurance audit log from validation ledger", async () => {
    const proof = await ProofChainService.generateProof("user-I", "note-I200", "hashI200", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-I",
      note_id: "note-I200",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);
    await RegulatorExportService.createExportBundle("note-I200");

    ExternalRegulatorValidationService.validateBundle("note-I200", "CPO Ontario");

    const log = InsuranceLiabilitySyncService.syncAll("Mock Health Insurance Ltd.");
    expect(Array.isArray(log)).toBe(true);
    expect(log.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(outputDir, "insurance_audit_log.json"))).toBe(true);
    expect(log[0].acknowledged).toBe(true);
  });
});
