/**
 * AiDuxCare — AuditDashboardService E2E
 * Phase: 7C (Unified Audit Dashboard)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AuditDashboardService } from "../../src/services/AuditDashboardService";
import { InsuranceLiabilitySyncService } from "../../src/services/InsuranceLiabilitySyncService";
import { ExternalRegulatorValidationService } from "../../src/services/ExternalRegulatorValidationService";
import { RegulatorExportService } from "../../src/services/RegulatorExportService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";
import { ProofChainService } from "../../src/services/ProofChainService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { AuditSummaryPDFService } from "../../src/services/AuditSummaryPDFService";

describe("📊 AuditDashboardService — Unified Audit Dashboard", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should build unified dashboard with all linked artefacts", async () => {
    const proof = await ProofChainService.generateProof("user-D", "note-D700", "hashD700", "1.1");
    const auditTrail = [{ event: "CREATE" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-D",
      note_id: "note-D700",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    await AuditSummaryPDFService.createPDF(report.mdPath);
    await RegulatorExportService.createExportBundle("note-D700");
    ExternalRegulatorValidationService.validateBundle("note-D700");
    InsuranceLiabilitySyncService.syncAll();

    const dashboard = AuditDashboardService.buildDashboard();
    expect(Array.isArray(dashboard)).toBe(true);
    const found = dashboard.find((d) => d.note_id === "note-D700");
    expect(found).toBeDefined();
    expect(fs.existsSync(path.join(outputDir, "audit_dashboard.json"))).toBe(true);
  });
});
