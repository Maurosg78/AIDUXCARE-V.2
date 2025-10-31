import fs from "fs";
import path from "path";
import crypto from "crypto";

export class CrossTrustSyncLedgerService {
  private static outputDir = path.join(process.cwd(), "output");
  private static ledgerPath = path.join(this.outputDir, "crosstrust_sync_ledger.json");

  static sync() {
    const exchangePath = path.join(this.outputDir, "crosstrust_exchange.json");
    const data = JSON.parse(fs.readFileSync(exchangePath, "utf8"));
    const record = {
      ledger_id: crypto.randomUUID(),
      jurisdiction: "EU-GDPR",
      chain_id: data.chain_id,
      synced_at: new Date().toISOString(),
      record_hash: crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex"),
      verified: true
    };
    fs.writeFileSync(this.ledgerPath, JSON.stringify(record, null, 2));
    console.log("[CrossTrustSync] ledger record generated:", this.ledgerPath);
    return record;
  }
}
