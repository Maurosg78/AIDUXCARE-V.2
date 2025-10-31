/**
 * AiDuxCare — BlockchainLedgerService
 * Phase: 8A (Immutable Blockchain Ledger — Niagara Compliance Mirror)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Immutable blockchain-like ledger mirroring audit_dashboard.json.
 *   - Each block represents a note_id record
 *   - Includes SHA-256 of the record and previous block hash
 *   - Cryptographically verifiable chain for compliance auditing
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface LedgerBlock {
  index: number;
  note_id: string;
  record_hash: string;
  prev_hash: string;
  block_hash: string;
  timestamp: string;
  signature: string;
}

export class BlockchainLedgerService {
  private static outputDir = path.join(process.cwd(), "output");
  private static dashboardPath = path.join(this.outputDir, "audit_dashboard.json");
  private static ledgerPath = path.join(this.outputDir, "blockchain_ledger.json");

  /** Compute SHA-256 hash */
  static sha256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /** Sign payload with mock CTO key */
  static signPayload(data: string): string {
    return crypto.createHmac("sha256", "CTO-NIAGARA-MOCK-PRIVATE-KEY").update(data).digest("hex");
  }

  /** Build immutable ledger */
  static buildLedger(): LedgerBlock[] {
    if (!fs.existsSync(this.dashboardPath)) throw new Error("audit_dashboard.json missing.");
    const dashboard = JSON.parse(fs.readFileSync(this.dashboardPath, "utf8"));
    const ledger: LedgerBlock[] = [];

    let prevHash = "0".repeat(64);

    dashboard.forEach((entry: any, index: number) => {
      const recordHash = this.sha256(JSON.stringify(entry));
      const timestamp = new Date().toISOString();
      const blockData = `${index}${entry.note_id}${recordHash}${prevHash}${timestamp}`;
      const blockHash = this.sha256(blockData);
      const signature = this.signPayload(blockHash);

      const block: LedgerBlock = {
        index,
        note_id: entry.note_id,
        record_hash: recordHash,
        prev_hash: prevHash,
        block_hash: blockHash,
        timestamp,
        signature,
      };

      ledger.push(block);
      prevHash = blockHash;
    });

    fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));
    console.log("[BlockchainLedger] built:", { count: ledger.length });
    return ledger;
  }

  /** Validate ledger integrity deterministically */
  static validateLedger(): boolean {
    if (!fs.existsSync(this.ledgerPath)) throw new Error("blockchain_ledger.json missing.");
    const ledger = JSON.parse(fs.readFileSync(this.ledgerPath, "utf8"));

    for (let i = 1; i < ledger.length; i++) {
      const prev = ledger[i - 1];
      const curr = ledger[i];
      const recalculated = this.sha256(
        `${curr.index}${curr.note_id}${curr.record_hash}${curr.prev_hash}${curr.timestamp}`
      );
      if (curr.prev_hash !== prev.block_hash || curr.block_hash !== recalculated) {
        console.error("[BlockchainLedger] integrity check failed at index:", i);
        return false;
      }
    }

    console.log("[BlockchainLedger] integrity validated.");
    return true;
  }
}
