import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

export class CtoDigitalSignatureService {
  private static outputDir = path.join(process.cwd(), "output");
  private static privateKeyPath = path.join(process.cwd(), "NiagaraRootKey.pem");
  private static manifestPath = path.join(this.outputDir, "final_delivery_manifest.json");
  private static bundlePath = path.join(this.outputDir, "aiduxcare_final_delivery.zip");

  static sign() {
    const changelog = path.join(this.outputDir, "aiduxcare_executive_changelog.pdf");
    const releaseZip = path.join(this.outputDir, "aiduxcare_north_v1.0_CA_release.zip");

    if (!fs.existsSync(changelog) || !fs.existsSync(releaseZip)) {
      throw new Error("Missing required artifacts for signature.");
    }

    // Generate signature using OpenSSL (CLI)
    execSync(
      `openssl dgst -sha512 -sign ${this.privateKeyPath} -out ${changelog}.sig ${changelog}`
    );

    const changelogBuf = fs.readFileSync(changelog);
    const sigBuf = fs.readFileSync(`${changelog}.sig`);
    const releaseBuf = fs.readFileSync(releaseZip);

    const hashChangelog = crypto.createHash("sha512").update(changelogBuf).digest("hex");
    const hashRelease = crypto.createHash("sha512").update(releaseBuf).digest("hex");
    const hashSignature = crypto.createHash("sha512").update(sigBuf).digest("hex");

    const manifest = {
      delivery_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      artifacts: [
        { file: "aiduxcare_executive_changelog.pdf", sha512: hashChangelog },
        { file: "aiduxcare_executive_changelog.sig", sha512: hashSignature },
        { file: "aiduxcare_north_v1.0_CA_release.zip", sha512: hashRelease },
      ],
      region: "CA-ON",
      organization: "AiDuxCare / Niagara Innovation Hub",
      version: "v1.0-CA",
      status: "SIGNED",
    };

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));

    // Bundle everything into final ZIP
    execSync(
      `cd ${this.outputDir} && zip -r aiduxcare_final_delivery.zip aiduxcare_executive_changelog.pdf aiduxcare_executive_changelog.sig aiduxcare_north_v1.0_CA_release.zip final_delivery_manifest.json >/dev/null`
    );

    console.log("[CTO Signature] Final signed package created:", this.bundlePath);
    return manifest;
  }
}
