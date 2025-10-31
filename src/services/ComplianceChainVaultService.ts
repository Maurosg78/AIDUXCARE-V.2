/**
 * AiDuxCare — ComplianceChainVaultService
 * Phase: 9B (Immutable Offsite Backup + Notary Simulation)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Simulate secure, encrypted offsite backup of full compliance chain,
 *   producing vault archive + notary attestation for regulator review.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import archiver from "archiver";

export class ComplianceChainVaultService {
  private static outputDir = path.join(process.cwd(), "output");
  private static vaultPath = path.join(this.outputDir, "compliance_vault.zip");
  private static encryptedPath = path.join(this.outputDir, "compliance_vault.zip.enc");
  private static attestationPath = path.join(this.outputDir, "vault_attestation.json");

  /** Encrypt buffer (AES-256-GCM mock) */
  static encryptBuffer(buffer: Buffer, key: string): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", crypto.createHash("sha256").update(key).digest(), iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
  }

  /** Build encrypted vault */
  static async buildVault(): Promise<void> {
    await this.createVault();
    const vaultData = fs.readFileSync(this.vaultPath);
    const encrypted = this.encryptBuffer(vaultData, "AIDUX-VAULT-KEY-NIAGARA");
    fs.writeFileSync(this.encryptedPath, encrypted);
    console.log("[ComplianceVault] encrypted:", this.encryptedPath);
    this.createAttestation();
  }

  /** Create ZIP with all compliance artifacts */
  private static async createVault(): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(this.vaultPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", () => {
        console.log("[ComplianceVault] vault created:", this.vaultPath);
        resolve();
      });
      archive.on("error", (err) => reject(err));
      archive.pipe(output);

      fs.readdirSync(this.outputDir).forEach((f) => {
        if (f.match(/\.(json|html|md|zip)$/)) {
          archive.file(path.join(this.outputDir, f), { name: f });
        }
      });

      archive.finalize();
    });
  }

  /** Create notary-style attestation */
  private static createAttestation() {
    const timestamp = new Date().toISOString();
    const vaultHash = crypto.createHash("sha256").update(fs.readFileSync(this.encryptedPath)).digest("hex");
    const signature = crypto.createHmac("sha256", "AIDUX-NOTARY-OFFICIAL").update(vaultHash).digest("hex");

    const record = {
      id: crypto.randomUUID(),
      vault_hash: vaultHash,
      signature,
      timestamp,
      notary_office: "Niagara Compliance Trust (Mock)",
      verified: true,
    };

    fs.writeFileSync(this.attestationPath, JSON.stringify(record, null, 2));
    console.log("[ComplianceVault] attestation:", this.attestationPath);
  }
}
