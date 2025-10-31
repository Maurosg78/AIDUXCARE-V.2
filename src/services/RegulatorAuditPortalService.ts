/**
 * AiDuxCare — RegulatorAuditPortalService
 * Phase: 8C (Public Compliance Chain Viewer)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Generate a static HTML audit portal summarizing:
 *     - Blockchain ledger chain
 *     - Unified audit dashboard
 *     - Federated exchange log
 *     - Verification summaries
 *   Intended for external regulators (e.g., CPO Ontario, PHIPA audits)
 */

import fs from "fs";
import path from "path";

export class RegulatorAuditPortalService {
  private static outputDir = path.join(process.cwd(), "output");
  private static portalPath = path.join(this.outputDir, "regulator_audit_portal.html");

  /** Safe JSON read */
  private static readJSON(file: string) {
    const full = path.join(this.outputDir, file);
    if (!fs.existsSync(full)) return [];
    try {
      return JSON.parse(fs.readFileSync(full, "utf8"));
    } catch {
      return [];
    }
  }

  /** Generate static HTML audit portal */
  static buildPortal(): string {
    const ledger = this.readJSON("blockchain_ledger.json");
    const dashboard = this.readJSON("audit_dashboard.json");
    const exchanges = this.readJSON("federated_exchange_log.json");

    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8" />
<title>AiDuxCare — Regulator Audit Portal</title>
<style>
  body { font-family: Inter, Arial, sans-serif; margin: 2rem; background: #f9fafb; color: #111; }
  h1 { color: #2563eb; }
  h2 { margin-top: 2rem; color: #1e40af; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 0.9rem; }
  th { background: #eff6ff; text-align: left; }
  tr:nth-child(even) { background: #f3f4f6; }
  code { background: #eef; padding: 2px 4px; border-radius: 4px; font-size: 0.8rem; }
  footer { margin-top: 3rem; text-align: center; font-size: 0.8rem; color: #555; }
</style>
</head>
<body>
<h1>🏛️ AiDuxCare — Regulator Audit Portal</h1>
<p>Market: <strong>Canada</strong> | Language: <strong>en-CA</strong></p>
<p>Generated: ${new Date().toISOString()}</p>

<h2>⛓️ Blockchain Ledger Overview (${ledger.length} blocks)</h2>
<table>
  <tr><th>#</th><th>Note ID</th><th>Record Hash</th><th>Block Hash</th><th>Timestamp</th></tr>
  ${ledger
    .map(
      (b: any) =>
        `<tr><td>${b.index}</td><td>${b.note_id}</td><td><code>${b.record_hash.slice(
          0,
          10
        )}</code></td><td><code>${b.block_hash.slice(0, 10)}</code></td><td>${b.timestamp}</td></tr>`
    )
    .join("")}
</table>

<h2>📊 Unified Audit Dashboard (${dashboard.length} entries)</h2>
<table>
  <tr><th>Note ID</th><th>Proof?</th><th>Report?</th><th>Validation?</th><th>Insurance?</th></tr>
  ${dashboard
    .map(
      (d: any) =>
        `<tr><td>${d.note_id}</td><td>${!!d.proof}</td><td>${!!d.compliance_report}</td><td>${
          !!d.regulator_validation
        }</td><td>${!!d.insurance_record}</td></tr>`
    )
    .join("")}
</table>

<h2>🌐 Federated Exchanges (${exchanges.length} bundles)</h2>
<table>
  <tr><th>ID</th><th>Source</th><th>Target</th><th>Range</th><th>Verified</th><th>Timestamp</th></tr>
  ${exchanges
    .map(
      (e: any) =>
        `<tr><td><code>${e.id.slice(0, 8)}</code></td><td>${e.source}</td><td>${e.target}</td><td>${e.range}</td><td>${e.verified}</td><td>${e.timestamp}</td></tr>`
    )
    .join("")}
</table>

<footer>
  <p>© ${new Date().getFullYear()} AiDuxCare Niagara CTO — Legal Compliance Chain Portal</p>
  <p>Generated under WO-2024-002 | PHIPA / PIPEDA / CPO Ontario</p>
</footer>
</body>
</html>`;

    fs.writeFileSync(this.portalPath, html);
    console.log("[RegulatorPortal] generated:", this.portalPath);
    return this.portalPath;
  }
}
