/**
 * AiDuxCare — RegulatorDeliveryBundleService
 * Phase: 10A (Regulator Delivery & Public Audit Export)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 */

import fs from "fs";
import path from "path";
import archiver from "archiver";
import crypto from "crypto";

export class RegulatorDeliveryBundleService {
  private static outputDir = path.join(process.cwd(), "output");
  private static bundlePath = path.join(this.outputDir, "regulator_delivery_bundle.zip");
  private static exportPath = path.join(this.outputDir, "public_audit_export.json");
  private static receiptPath = path.join(this.outputDir, "delivery_receipt.json");

  /** Build ZIP package of all artifacts */
  static async buildBundle() {
    return new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(this.bundlePath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log("[RegulatorDelivery] bundle created:", this.bundlePath);
        this.generatePublicExport();
        this.generateReceipt();
        resolve();
      });
      archive.on("error", (err) => reject(err));
      archive.pipe(output);

      fs.readdirSync(this.outputDir).forEach((file) => {
        if (file.match(/\.(json|html|md|zip|enc|pdf|txt)$/)) {
          archive.file(path.join(this.outputDir, file), { name: file });
        }
      });
      archive.finalize();
    });
  }

  /** Create public audit summary JSON */
  static generatePublicExport() {
    const files = fs.readdirSync(this.outputDir).filter((f) => f.match(/\.(json|pdf|html|md)$/));
    const records = files.map((f) => {
      const full = path.join(this.outputDir, f);
      const size = fs.statSync(full).size;
      const hash = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
      return { file: f, size, hash };
    });
    fs.writeFileSync(this.exportPath, JSON.stringify({ generated: new Date().toISOString(), records }, null, 2));
    console.log("[RegulatorDelivery] public audit export:", this.exportPath);
  }

  /** Generate signed delivery receipt */
  static generateReceipt() {
    const timestamp = new Date().toISOString();
    const signature = crypto
      .createHmac("sha256", "AIDUX-DELIVERY-CERT")
      .update(timestamp)
      .digest("hex");
    const record = {
      id: crypto.randomUUID(),
      recipient: "CPO Ontario / Health Canada (Simulation)",
      bundle: path.basename(this.bundlePath),
      timestamp,
      signature,
      verified: true,
    };
    fs.writeFileSync(this.receiptPath, JSON.stringify(record, null, 2));
    console.log("[RegulatorDelivery] delivery receipt:", this.receiptPath);
  }

  /** Execute full regulator delivery simulation */
  static async deliverAll() {
    await this.buildBundle();
    console.log("[RegulatorDelivery] delivery process completed.");
    return true;
  }
}
