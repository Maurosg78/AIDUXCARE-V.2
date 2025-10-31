import fs from "fs";
import path from "path";
import crypto from "crypto";

export class CrossTrustExchangeService {
  private static outputDir = path.join(process.cwd(), "output");
  private static exchangePath = path.join(this.outputDir, "crosstrust_exchange.json");

  static generate() {
    const chainPath = path.join(this.outputDir, "trustbridge_final_chain.json");
    const chain = JSON.parse(fs.readFileSync(chainPath, "utf8"));
    const bundle = {
      source: "Canada",
      target: "European Union",
      chain_id: chain.id,
      master_hash: chain.master_chain_hash,
      exported_at: new Date().toISOString(),
      checksum: crypto.createHash("sha256").update(JSON.stringify(chain)).digest("hex"),
      verified: true
    };
    fs.writeFileSync(this.exchangePath, JSON.stringify(bundle, null, 2));
    console.log("[CrossTrust] exchange bundle generated:", this.exchangePath);
    return bundle;
  }
}
