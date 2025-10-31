/**
 * AiDuxCare — ComplianceReportService E2E
 * Phase: 6A (End-to-End Compliance Report Generator)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ProofChainService } from "../../src/services/ProofChainService";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { ComplianceReportService } from "../../src/services/ComplianceReportService";

describe("📜 ComplianceReportService — End-to-End Report", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate complete compliance report (JSON + Markdown)", async () => {
    const proof = await ProofChainService.generateProof("user-CA", "note-900", "hash900", "1.1");
    const auditTrail = [{ event: "CREATE" }, { event: "SYNC" }];
    const bundle = await LegalProofBundleService.createBundle(proof, auditTrail);
    const ledgerEntry = PublicVerifierService.publishToLedger(bundle);
    const report = await ComplianceReportService.generateReport({
      user_id: "user-CA",
      note_id: "note-900",
      consent_version: "1.1",
      auditTrail,
      proof,
      ledgerEntry,
    });
    expect(fs.existsSync(report.jsonPath)).toBe(true);
    expect(fs.existsSync(report.mdPath)).toBe(true);
  });
});
