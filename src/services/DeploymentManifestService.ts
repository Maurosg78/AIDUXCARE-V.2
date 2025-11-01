import fs from "fs";
import path from "path";
import crypto from "crypto";
import child_process from "child_process";

export class DeploymentManifestService {
  private static outputDir = path.join(process.cwd(), "output");
  private static manifestPath = path.join(this.outputDir, "deployment_manifest.json");

  static generate() {
    const commit = child_process.execSync("git rev-parse HEAD").toString().trim();
    const branch = child_process.execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
    const tag = child_process.execSync("git describe --tags --abbrev=0").toString().trim();

    const artifacts = fs.readdirSync(this.outputDir)
      .filter(f => f.endsWith(".json") || f.endsWith(".pdf") || f.endsWith(".zip"))
      .map(f => {
        const p = path.join(this.outputDir, f);
        const buf = fs.readFileSync(p);
        const hash = crypto.createHash("sha512").update(buf).digest("hex");
        return { file: f, sha512: hash, size_kb: (buf.length / 1024).toFixed(2) };
      });

    const manifest = {
      deployment_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      build: {
        branch,
        commit,
        tag,
        version: "v1.0-CA",
        locale: "en-CA",
        region: "CA-ON",
      },
      regulatory: ["PHIPA", "PIPEDA", "CPO Ontario", "Niagara Innovation Hub"],
      artifacts,
      total_artifacts: artifacts.length,
      integrity_hash: crypto
        .createHash("sha512")
        .update(artifacts.map(a => a.sha512).join(""))
        .digest("hex"),
      status: "DEPLOY_READY",
    };

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
    console.log("[DeployManifest] generated:", this.manifestPath);
    return manifest;
  }
}
