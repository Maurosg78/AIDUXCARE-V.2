import fs from "fs";
import path from "path";
import crypto from "crypto";

export class NiagaraVerificationGatewayService {
  private static outputDir = path.join(process.cwd(), "output");
  private static proofPath = path.join(this.outputDir, "verification_proof.json");

  static loadChain() {
    const file = path.join(this.outputDir, "trustbridge_final_chain.json");
    if (!fs.existsSync(file)) throw new Error("❌ Missing chain file for verification");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  static verify(chainId: string) {
    const chain = this.loadChain();
    const valid = chain.id === chainId && chain.verified === true;
    const sig = crypto.createHmac("sha256", "AIDUX-VERIFY-KEY")
      .update(chain.master_chain_hash)
      .digest("hex");
    const proof = {
      chain_id: chainId,
      verified: valid,
      status: valid ? "VALID" : "REVOKED",
      checked_at: new Date().toISOString(),
      signature: sig,
      authority: "Niagara Gateway Verification Service"
    };
    fs.writeFileSync(this.proofPath, JSON.stringify(proof, null, 2));
    console.log("[NiagaraGateway] proof generated:", this.proofPath);
    return proof;
  }
}
