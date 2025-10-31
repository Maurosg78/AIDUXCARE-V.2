import fs from "fs";
import path from "path";
import crypto from "crypto";

export class AuditTrailPublisherService {
  private static outputDir = path.join(process.cwd(), "output");
  private static ledgerPath = path.join(this.outputDir, "public_audit_ledger.json");

  static publish() {
    const proofPath = path.join(this.outputDir, "verification_proof.json");
    if (!fs.existsSync(proofPath)) throw new Error("❌ Missing verification proof for ledger publish");
    const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
    const entry = {
      ledger_id: crypto.randomUUID(),
      chain_id: proof.chain_id,
      verified: proof.verified,
      recorded_at: new Date().toISOString(),
      record_hash: crypto.createHash("sha256").update(JSON.stringify(proof)).digest("hex"),
      authority: "Canadian Public Ledger (AiDuxCare Mock)"
    };
    fs.writeFileSync(this.ledgerPath, JSON.stringify(entry, null, 2));
    console.log("[AuditTrailPublisher] ledger entry created:", this.ledgerPath);
    return entry;
  }
}
