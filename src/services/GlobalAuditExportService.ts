import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

export class GlobalAuditExportService {
  private static outputDir = path.join(process.cwd(), "output");
  private static manifestPath = path.join(this.outputDir, "audit_manifest.json");
  private static bundlePath = path.join(this.outputDir, "trustbridge_audit_bundle.zip");

  static generate() {
    const files = fs.readdirSync(this.outputDir).filter(f => !f.endsWith(".zip"));
    const entries = files.map(f => {
      const filePath = path.join(this.outputDir, f);
      const data = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha512").update(data).digest("hex");
      return { file: f, size_kb: (data.length / 1024).toFixed(2), sha512: hash };
    });

    const forensicHash = crypto
      .createHash("sha512")
      .update(entries.map(e => e.sha512).join(""))
      .digest("hex");

    const manifest = {
      audit_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      total_files: entries.length,
      files: entries,
      forensic_hash: forensicHash,
      status: "AUDIT_READY",
    };

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));

    // Crear el ZIP con todos los archivos
    execSync(`cd ${this.outputDir} && zip -r trustbridge_audit_bundle.zip * >/dev/null`);
    console.log("[GlobalAuditExport] bundle generated:", this.bundlePath);

    return { manifest, bundle: this.bundlePath };
  }
}
