/**
 * AiDuxCare — RegulatorAuditPortalService E2E
 * Phase: 8C (Public Compliance Chain Viewer)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RegulatorAuditPortalService } from "../../src/services/RegulatorAuditPortalService";
import { BlockchainLedgerService } from "../../src/services/BlockchainLedgerService";
import { FederatedProofExchangeService } from "../../src/services/FederatedProofExchangeService";
import { AuditDashboardService } from "../../src/services/AuditDashboardService";
import { InsuranceLiabilitySyncService } from "../../src/services/InsuranceLiabilitySyncService";
import { ExternalRegulatorValidationService } from "../../src/services/ExternalRegulatorValidationService";
import { RegulatorExportService } from "../../src/services/RegulatorExportService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";
import { ProofChainService } from "../../src/services/ProofChainService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { AuditSummaryPDFService } from "../../src/services/AuditSummaryPDFService";

describe("🏛️ RegulatorAuditPortalService — Public Compliance Chain Viewer", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate regulator audit portal HTML", async () => {
    const proof = await ProofChainService.generateProof("user-P", "note-P600", "hashP600", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-P",
      note_id: "note-P600",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);
    await RegulatorExportService.createExportBundle("note-P600");
    ExternalRegulatorValidationService.validateBundle("note-P600");
    InsuranceLiabilitySyncService.syncAll();
    AuditDashboardService.buildDashboard();
    BlockchainLedgerService.buildLedger();
    FederatedProofExchangeService.createBundle("Niagara", "Kingston", 0, 3);

    const portalPath = RegulatorAuditPortalService.buildPortal();
    expect(fs.existsSync(portalPath)).toBe(true);
    const html = fs.readFileSync(portalPath, "utf8");
    expect(html.includes("Regulator Audit Portal")).toBe(true);
  });
});
