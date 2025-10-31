/**
 * AiDuxCare — RegulatorExportService
 * Phase: 6C (Regulator Export Bundle)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Create a single exportable ZIP containing all compliance artefacts:
 *     - ProofChain JSON
 *     - Public ledger entry
 *     - Compliance report (JSON + Markdown)
 *     - Audit summary PDF
 *     - SHA-256 manifest
 */

import fs from "fs";
import path from "path";
import archiver from "archiver";
import crypto from "crypto";

export class RegulatorExportService {
  private static outputDir = path.join(process.cwd(), "output");

  /** Compute SHA-256 hash of any file */
  static sha256(filePath: string): string {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /** Generate manifest.json with file checksums */
  static generateManifest(files: string[], noteId: string): string {
    const manifest = files.map((file) => ({
      file: path.basename(file),
      hash: this.sha256(file),
    }));
    const manifestPath = path.join(this.outputDir, `manifest_${noteId}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifestPath;
  }

  /** Bundle all files + manifest into ZIP */
  static async createExportBundle(noteId: string): Promise<string> {
    const files = fs
      .readdirSync(this.outputDir)
      .filter((f) => f.includes(noteId))
      .map((f) => path.join(this.outputDir, f));

    if (files.length === 0) throw new Error("No files found for this noteId.");

    const manifestPath = this.generateManifest(files, noteId);
    const bundlePath = path.join(this.outputDir, `regulator_bundle_${noteId}.zip`);

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(bundlePath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(output);

      [...files, manifestPath].forEach((file) => {
        archive.file(file, { name: path.basename(file) });
      });

      archive.finalize();
      output.on("close", resolve);
      archive.on("error", reject);
    });

    const bundleHash = this.sha256(bundlePath);
    console.log("[RegulatorExport] created:", { bundlePath, bundleHash });
    return bundlePath;
  }
}
