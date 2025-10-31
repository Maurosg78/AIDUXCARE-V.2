/**
 * AiDuxCare — AuditOpsDaemonService
 * Phase: 13A (Audit Ops Continuous Verification Daemon)
 * Market: CA | Language: en-CA
 * WO: WO-2024-003
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export class AuditOpsDaemonService {
  private static outputDir = path.join(process.cwd(), "output");
  private static logPath = path.join(this.outputDir, "audit_ops_status.json");

  /** Compute hash of a file */
  static hashFile(file: string) {
    const full = path.join(this.outputDir, file);
    if (!fs.existsSync(full)) return null;
    return crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  }

  /** Run one audit cycle */
  static runCycle() {
    const files = fs.readdirSync(this.outputDir)
      .filter(f => f.match(/\.(json|pdf|html)$/));
    const checks = files.map(f => ({
      file: f,
      exists: fs.existsSync(path.join(this.outputDir, f)),
      hash: this.hashFile(f)
    }));

    const summary = {
      run_at: new Date().toISOString(),
      total_files: checks.length,
      verified: checks.every(c => c.exists && c.hash),
      entries: checks
    };

    const sig = crypto.createHmac("sha256", "AIDUX-AUDIT-OPS-KEY")
      .update(JSON.stringify(summary))
      .digest("hex");

    const record = { ...summary, signature: sig };
    fs.writeFileSync(this.logPath, JSON.stringify(record, null, 2));
    console.log("[AuditOps] cycle completed:", this.logPath);
    return true;
  }

  /** Start simulated daemon */
  static startDaemon(intervalMs = 5000) {
    console.log("[AuditOps] daemon started (interval:", intervalMs, "ms)");
    this.runCycle();
    setInterval(() => this.runCycle(), intervalMs);
  }
}
