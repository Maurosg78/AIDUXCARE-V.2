/**
 * AiDuxCare — DigitalConsentLedgerService
 * Phase: 8D (Patient-Facing Proof Mirror)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Build a patient-facing JSON + HTML mirror of audit and ledger data,
 *   showing consent, proof, and verification events in human-readable form.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface PatientConsentRecord {
  note_id: string;
  consent_version: string;
  proof_hash: string;
  ledger_hash: string;
  timestamp: string;
  qr_verification: string;
}

export class DigitalConsentLedgerService {
  private static outputDir = path.join(process.cwd(), "output");
  private static patientLedger = path.join(this.outputDir, "patient_consent_ledger.json");
  private static patientPortal = path.join(this.outputDir, "patient_consent_portal.html");

  /** Generate a QR mock (base64 of hash) */
  static generateQR(hash: string): string {
    return Buffer.from(`VERIFY:${hash}`).toString("base64");
  }

  /** Build the patient-facing ledger */
  static buildLedger(): PatientConsentRecord[] {
    const dashboardPath = path.join(this.outputDir, "audit_dashboard.json");
    const ledgerPath = path.join(this.outputDir, "blockchain_ledger.json");
    if (!fs.existsSync(dashboardPath) || !fs.existsSync(ledgerPath))
      throw new Error("Required audit data missing.");

    const dashboard = JSON.parse(fs.readFileSync(dashboardPath, "utf8"));
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
    const records: PatientConsentRecord[] = [];

    dashboard.forEach((entry: any) => {
      const block = ledger.find((b: any) => b.note_id === entry.note_id);
      if (!block) return;
      const record: PatientConsentRecord = {
        note_id: entry.note_id,
        consent_version: entry.compliance_report?.consent_version || "unknown",
        proof_hash: entry.proof?.signature?.slice(0, 16) || "n/a",
        ledger_hash: block.block_hash,
        timestamp: block.timestamp,
        qr_verification: this.generateQR(block.block_hash),
      };
      records.push(record);
    });

    fs.writeFileSync(this.patientLedger, JSON.stringify(records, null, 2));
    console.log("[DigitalConsentLedger] built:", { count: records.length });
    return records;
  }

  /** Generate patient portal HTML */
  static buildPortal(): string {
    const data = fs.existsSync(this.patientLedger)
      ? JSON.parse(fs.readFileSync(this.patientLedger, "utf8"))
      : [];

    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<title>AiDuxCare — Patient Consent Ledger</title>
<style>
  body { font-family: Inter, Arial, sans-serif; margin: 2rem; background: #fafafa; color: #111; }
  h1 { color: #2563eb; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 0.9rem; }
  th { background: #e0f2fe; text-align: left; }
  code { background: #eef; padding: 2px 4px; border-radius: 4px; }
  tr:nth-child(even) { background: #f3f4f6; }
  footer { margin-top: 3rem; text-align: center; font-size: 0.8rem; color: #555; }
</style>
</head>
<body>
<h1>🩺 AiDuxCare — Patient Consent Ledger</h1>
<p>This mirror allows patients to review how their consent and records were processed
under PHIPA / PIPEDA standards.</p>
<table>
<tr><th>Note ID</th><th>Consent</th><th>Proof</th><th>Ledger Hash</th><th>QR (Mock)</th><th>Timestamp</th></tr>
${data
  .map(
    (r: any) =>
      `<tr><td>${r.note_id}</td><td>${r.consent_version}</td><td><code>${r.proof_hash}</code></td><td><code>${r.ledger_hash.slice(
        0,
        12
      )}</code></td><td><code>${r.qr_verification.slice(0, 16)}...</code></td><td>${r.timestamp}</td></tr>`
  )
  .join("")}
</table>
<footer>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>© ${new Date().getFullYear()} AiDuxCare — Legal Consent Mirror (Niagara CTO)</p>
</footer>
</body>
</html>`;

    fs.writeFileSync(this.patientPortal, html);
    console.log("[DigitalConsentLedger] portal generated:", this.patientPortal);
    return this.patientPortal;
  }
}
