/**
 * AiDuxCare — FederatedProofExchangeService E2E
 * Phase: 8B (Cross-Clinic Audit Replication)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FederatedProofExchangeService } from "../../src/services/FederatedProofExchangeService";
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

describe("🌐 FederatedProofExchangeService — Cross-Clinic Replication", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should create, send and verify federated exchange between clinics", async () => {
    const proof = await ProofChainService.generateProof("user-F", "note-F800", "hashF800", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-F",
      note_id: "note-F800",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);
    await RegulatorExportService.createExportBundle("note-F800");
    ExternalRegulatorValidationService.validateBundle("note-F800");
    InsuranceLiabilitySyncService.syncAll();
    AuditDashboardService.buildDashboard();
    BlockchainLedgerService.buildLedger();

    const bundleMeta = FederatedProofExchangeService.createBundle("Niagara", "Toronto", 0, 5);
    expect(bundleMeta.source).toBe("Niagara");

    const bundlePath = path.join(outputDir, "exchange_Niagara_to_Toronto.json");
    const verified = FederatedProofExchangeService.verifyBundle(bundlePath, "Niagara");
    expect(verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "federated_exchange_log.json"))).toBe(true);
  });
});
