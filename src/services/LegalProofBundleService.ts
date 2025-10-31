/**
 * AiDuxCare — LegalProofBundleService
 * Phase: 5A (Regulatory Export & Evidence Packaging)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Generate immutable Legal Proof Bundle (.zip) including:
 *     - proof-of-transmission JSON (from ProofChainService)
 *     - digital signature
 *     - audit trail snapshot
 *     - printable PDF summary (mock)
 */

import fs from "fs";
import path from "path";
import { ProofRecord } from "./ProofChainService";

export class LegalProofBundleService {
  static async createBundle(proof: ProofRecord, auditLog: any[]): Promise<string> {
    const dir = path.join(process.cwd(), "output");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const bundlePath = path.join(dir, `proof_bundle_${proof.note_id}.zip`);
    const jsonPath = path.join(dir, `proof_${proof.note_id}.json`);
    const pdfPath = path.join(dir, `proof_${proof.note_id}.pdf`);
    const auditPath = path.join(dir, `audit_${proof.note_id}.json`);

    // Simulate evidence export
    fs.writeFileSync(jsonPath, JSON.stringify(proof, null, 2));
    fs.writeFileSync(auditPath, JSON.stringify(auditLog, null, 2));
    fs.writeFileSync(
      pdfPath,
      `AiDuxCare Legal Proof Bundle\n\nNote ID: ${proof.note_id}\nUser: ${proof.user_id}\nConsent: ${proof.consent_version}\nTimestamp: ${proof.timestamp}\nSignature: ${proof.signature}\n\n---\nCertified under AiDuxCare Regulatory Framework`
    );

    // Zip bundle (mock, no compression)
    const content = [
      `FILE: ${jsonPath}`,
      `FILE: ${auditPath}`,
      `FILE: ${pdfPath}`,
    ].join("\n");
    fs.writeFileSync(bundlePath, content);

    console.log("[LegalProofBundle] created:", bundlePath);
    return bundlePath;
  }

  static verifyBundleExists(note_id: string): boolean {
    const dir = path.join(process.cwd(), "output");
    const file = path.join(dir, `proof_bundle_${note_id}.zip`);
    return fs.existsSync(file);
  }
}
