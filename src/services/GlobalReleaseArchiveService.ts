import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

export class GlobalReleaseArchiveService {
  private static outputDir = path.join(process.cwd(), "output");
  private static releasePath = path.join(this.outputDir, "aiduxcare_north_v1.0_CA_release.zip");
  private static manifestPath = path.join(this.outputDir, "global_release_manifest.json");
  private static readmePath = path.join(this.outputDir, "README_RELEASE.md");

  static assemble() {
    const timestamp = new Date().toISOString();
    const artifacts = fs.readdirSync(this.outputDir)
      .filter(f => f.endsWith(".json") || f.endsWith(".pdf") || f.endsWith(".zip"))
      .map(f => {
        const p = path.join(this.outputDir, f);
        const buf = fs.readFileSync(p);
        const hash = crypto.createHash("sha512").update(buf).digest("hex");
        return { file: f, size_kb: (buf.length / 1024).toFixed(2), sha512: hash };
      });

    const releaseHash = crypto
      .createHash("sha512")
      .update(artifacts.map(a => a.sha512).join(""))
      .digest("hex");

    execSync(`cd ${this.outputDir} && zip -r aiduxcare_north_v1.0_CA_release.zip * >/dev/null`);

    const manifest = {
      release_id: crypto.randomUUID(),
      version: "v1.0-CA",
      generated_at: timestamp,
      artifacts,
      total_artifacts: artifacts.length,
      release_hash: releaseHash,
      region: "CA-ON",
      locale: "en-CA",
      organization: "AiDuxCare / Niagara Innovation Hub",
      status: "RELEASE_READY",
    };

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));

    const readme = `# 🚀 AiDuxCare North — Release Package v1.0-CA

**Generated at:** ${timestamp}  
**Release ID:** ${manifest.release_id}  
**Region:** ${manifest.region}  
**Locale:** ${manifest.locale}  
**Organization:** ${manifest.organization}

## Included Artifacts
${artifacts.map(a => `- ${a.file} (${a.size_kb} KB)  
  SHA-512: \`${a.sha512.slice(0,64)}...\``).join("\n")}

---

✅ **Status:** ${manifest.status}  
🔏 **Version:** ${manifest.version}  
📦 **Bundle:** aiduxcare_north_v1.0_CA_release.zip  
💡 *Generated automatically by AiDuxCare TrustBridge Framework.*
`;

    fs.writeFileSync(this.readmePath, readme);
    console.log("[ReleaseArchive] Release bundle generated:", this.releasePath);
    return manifest;
  }
}
