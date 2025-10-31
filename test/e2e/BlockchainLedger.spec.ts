/**
 * AiDuxCare — BlockchainLedgerService E2E
 * Phase: 8A (Immutable Blockchain Ledger — Niagara Compliance Mirror)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { BlockchainLedgerService } from "../../src/services/BlockchainLedgerService";
import { AuditDashboardService } from "../../src/services/AuditDashboardService";
import { InsuranceLiabilitySyncService } from "../../src/services/InsuranceLiabilitySyncService";
import { ExternalRegulatorValidationService } from "../../src/services/ExternalRegulatorValidationService";
import { RegulatorExportService } from "../../src/services/RegulatorExportService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";
import { ProofChainService } from "../../src/services/ProofChainService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { AuditSummaryPDFService } from "../../src/services/AuditSummaryPDFService";

describe("⛓️ BlockchainLedgerService — Immutable Niagara Compliance Ledger", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should build and validate blockchain ledger from dashboard", async () => {
    const proof = await ProofChainService.generateProof("user-B", "note-B900", "hashB900", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-B",
      note_id: "note-B900",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);
    await RegulatorExportService.createExportBundle("note-B900");
    ExternalRegulatorValidationService.validateBundle("note-B900");
    InsuranceLiabilitySyncService.syncAll();
    AuditDashboardService.buildDashboard();

    const ledger = BlockchainLedgerService.buildLedger();
    expect(Array.isArray(ledger)).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "blockchain_ledger.json"))).toBe(true);

    const isValid = BlockchainLedgerService.validateLedger();
    expect(isValid).toBe(true);
  });
});
