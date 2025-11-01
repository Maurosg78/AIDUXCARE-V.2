import fs from "fs";
import path from "path";
import crypto from "crypto";

export class NiagaraCertificationPackageService {
  private static outputDir = path.join(process.cwd(), "output");
  private static certDir = path.join(process.cwd(), "niagara_cert_package");
  private static manifestPath = path.join(this.certDir, "cert_package_manifest.json");
  private static readmePath = path.join(this.certDir, "README_CA.md");

  static build() {
    if (!fs.existsSync(this.certDir)) fs.mkdirSync(this.certDir);

    const files = [
      "trustbridge_final_report.pdf",
      "trustbridge_audit_bundle.zip",
      "final_report_manifest.json",
      "audit_manifest.json"
    ];

    const entries = files.map(f => {
      const src = path.join(this.outputDir, f);
      if (!fs.existsSync(src)) {
        throw new Error(`Missing artifact: ${f}`);
      }
      const dest = path.join(this.certDir, f);
      fs.copyFileSync(src, dest);

      const data = fs.readFileSync(dest);
      const hash = crypto.createHash("sha512").update(data).digest("hex");
      return { file: f, sha512: hash, size_kb: (data.length / 1024).toFixed(2) };
    });

    const manifest = {
      package_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      artifacts: entries,
      total_artifacts: entries.length,
      status: "CERT_READY",
      region: "CA-ON",
      organization: "AiDuxCare / Niagara Innovation Hub",
      version: "v1.0-CA",
    };
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));

    const readme = `# 🍁 AiDuxCare — Niagara Certification Package (v1.0-CA)

**Generated at:** ${manifest.generated_at}  
**Package ID:** ${manifest.package_id}  
**Region:** ${manifest.region}  
**Organization:** ${manifest.organization}  

## Included Artifacts
${entries.map(e => `- ${e.file} (${e.size_kb} KB)  
  SHA-512: \`${e.sha512.slice(0, 64)}... \``).join("\n")}

---

✅ **Status:** ${manifest.status}  
🔏 **Version:** ${manifest.version}  
📜 *Prepared automatically by AiDuxCare TrustBridge framework.*
`;
    fs.writeFileSync(this.readmePath, readme);

    console.log("[NiagaraCert] package created:", this.certDir);
    return { manifest, path: this.certDir };
  }
}
