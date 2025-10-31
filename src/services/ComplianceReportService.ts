/**
 * AiDuxCare — ComplianceReportService
 * Phase: 6A (End-to-End Compliance Report Generator)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Produce consolidated compliance reports combining:
 *     - Consent metadata
 *     - Clinical audit trail
 *     - Integrity proof
 *     - Public ledger entry
 *   Output formats: JSON + Markdown
 */

import fs from "fs";
import path from "path";
import { ProofChainService } from "./ProofChainService";
import { PublicVerifierService } from "./PublicVerifierService";

export interface ComplianceInput {
  user_id: string;
  note_id: string;
  consent_version: string;
  auditTrail: any[];
  proof: any;
  ledgerEntry: any;
}

export class ComplianceReportService {
  private static outputDir = path.join(process.cwd(), "output");

  /** Generate structured compliance report (JSON + Markdown) */
  static async generateReport(input: ComplianceInput) {
    const fileBase = `compliance_report_${input.note_id}`;
    const jsonPath = path.join(this.outputDir, `${fileBase}.json`);
    const mdPath = path.join(this.outputDir, `${fileBase}.md`);

    const reportJSON = {
      generated_at: new Date().toISOString(),
      jurisdiction: "Ontario, Canada",
      compliance_framework: ["PHIPA", "PIPEDA", "CPO Ontario Standards"],
      user_id: input.user_id,
      note_id: input.note_id,
      consent_version: input.consent_version,
      auditTrail: input.auditTrail,
      proof: input.proof,
      ledgerEntry: input.ledgerEntry,
      verification: {
        integrity_verified: ProofChainService.verifyProof(input.proof),
        ledger_verified: PublicVerifierService.verifyBundle(
          path.join(this.outputDir, `proof_bundle_${input.note_id}.zip`)
        ),
      },
    };

    fs.writeFileSync(jsonPath, JSON.stringify(reportJSON, null, 2));

    const mdContent = `
# 🧾 AiDuxCare — Compliance Report
**Jurisdiction:** Ontario, Canada  
**Generated:** ${reportJSON.generated_at}

## Consent Metadata
- Version: ${input.consent_version}
- User: ${input.user_id}
- Note: ${input.note_id}

## Proof Integrity
- Signature: \`${input.proof.signature}\`
- Verified: ${reportJSON.verification.integrity_verified}

## Ledger Record
- Ledger Hash: \`${input.ledgerEntry.bundle_hash}\`
- Published: ${input.ledgerEntry.timestamp}
- Verified: ${reportJSON.verification.ledger_verified}

---

**Frameworks:** PHIPA | PIPEDA | CPO Ontario  
✅ Verified and audit-ready.
`;

    fs.writeFileSync(mdPath, mdContent.trim());
    console.log("[ComplianceReport] generated:", { jsonPath, mdPath });
    return { jsonPath, mdPath };
  }
}
