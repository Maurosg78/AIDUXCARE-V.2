import fs from "fs";
import path from "path";
import crypto from "crypto";

export class GlobalTrustManifestService {
  private static outputDir = path.join(process.cwd(), "output");
  private static manifestPath = path.join(this.outputDir, "global_trust_manifest.json");

  static build() {
    const chain = JSON.parse(fs.readFileSync(path.join(this.outputDir, "trustbridge_final_chain.json"), "utf8"));
    const proof = JSON.parse(fs.readFileSync(path.join(this.outputDir, "verification_proof.json"), "utf8"));
    const ledgerCA = JSON.parse(fs.readFileSync(path.join(this.outputDir, "public_audit_ledger.json"), "utf8"));
    const ledgerEU = JSON.parse(fs.readFileSync(path.join(this.outputDir, "crosstrust_sync_ledger.json"), "utf8"));
    const ack = JSON.parse(fs.readFileSync(path.join(this.outputDir, "crosstrust_ack.json"), "utf8"));

    const manifest = {
      manifest_id: crypto.randomUUID(),
      compiled_at: new Date().toISOString(),
      jurisdictions: ["Canada", "European Union"],
      trust_chain: {
        id: chain.id,
        master_hash: chain.master_chain_hash,
        verification_status: proof.status,
      },
      ledgers: {
        canada: ledgerCA,
        european_union: ledgerEU
      },
      cross_ack: ack,
      global_checksum: crypto.createHash("sha256").update(
        chain.master_chain_hash + ledgerCA.ledger_id + ledgerEU.ledger_id + ack.agreement_id
      ).digest("hex"),
      verified: true
    };

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
    console.log("[GlobalTrustManifest] built:", this.manifestPath);
    return manifest;
  }
}
