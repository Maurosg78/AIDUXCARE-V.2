/**
 * AiDuxCare — PublicVerifierService
 * Phase: 5B (Public Ledger Proof)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Publish and verify proof bundle hashes in a simulated public ledger.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface LedgerEntry {
  id: string;
  bundle_hash: string;
  timestamp: string;
}

export class PublicVerifierService {
  private static ledgerPath = path.join(process.cwd(), "output", "public_ledger.json");

  /** Compute SHA256 hash of any file */
  static hashFile(filePath: string): string {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /** Append hash record to local ledger */
  static publishToLedger(bundlePath: string): LedgerEntry {
    const hash = this.hashFile(bundlePath);
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      bundle_hash: hash,
      timestamp: new Date().toISOString(),
    };
    const ledger = fs.existsSync(this.ledgerPath)
      ? JSON.parse(fs.readFileSync(this.ledgerPath, "utf8"))
      : [];
    ledger.push(entry);
    fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));
    console.log("[PublicVerifier] published:", entry);
    return entry;
  }

  /** Validate if a given bundle matches a published ledger hash */
  static verifyBundle(bundlePath: string): boolean {
    const hash = this.hashFile(bundlePath);
    if (!fs.existsSync(this.ledgerPath)) return false;
    const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(this.ledgerPath, "utf8"));
    return ledger.some((e) => e.bundle_hash === hash);
  }
}
