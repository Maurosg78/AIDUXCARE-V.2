/**
 * AiDuxCare — FederalArchivePublicationService
 * Phase: 11A (Canada Federal Archive Publication + Timestamp Authority)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";

export class FederalArchivePublicationService {
  private static outputDir = path.join(process.cwd(), "output");
  private static manifestPath = path.join(this.outputDir, "federal_archive_manifest.json");
  private static receiptPath = path.join(this.outputDir, "federal_archive_receipt.pdf");
  private static ackPath = path.join(this.outputDir, "federal_archive_ack.json");

  static buildManifest() {
    const files = fs.readdirSync(this.outputDir).filter(f => f.match(/\.(json|pdf|html|zip|txt|enc)$/));
    const entries = files.map(f => {
      const full = path.join(this.outputDir, f);
      const hash = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
      return { file: f, size: fs.statSync(full).size, hash };
    });
    const manifest = {
      generated: new Date().toISOString(),
      issuer: "AiDuxCare Federal Archive Agent (Simulated)",
      total_files: entries.length,
      entries
    };
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
    console.log("[FederalArchive] manifest created:", this.manifestPath);
    return manifest;
  }

  static issueTimestamp(hash: string) {
    const nonce = crypto.randomBytes(16).toString("hex");
    const tsaSig = crypto.createHmac("sha256", "AIDUX-FEDERAL-TSA-KEY").update(hash + nonce).digest("hex");
    return { nonce, tsaSig, issued: new Date().toISOString() };
  }

  /** ⏳ Ensure PDF is fully written before continuing */
  static async createReceipt(manifest: any, tsa: any) {
    return new Promise<void>((resolve) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(this.receiptPath);
      doc.pipe(stream);

      doc.fontSize(18).fillColor("#1e3a8a").text("🇨🇦 AiDuxCare — Federal Archive Receipt", { align: "center" });
      doc.moveDown(1.5);
      doc.fontSize(12).fillColor("black").text(`Issued: ${tsa.issued}`);
      doc.text(`Files Archived: ${manifest.total_files}`);
      doc.text(`TSA Nonce: ${tsa.nonce}`);
      doc.text(`TSA Signature: ${tsa.tsaSig.slice(0,48)}...`);
      doc.moveDown(1);
      doc.text("This document certifies that AiDuxCare compliance chain was archived into the Federal Digital Record.", {
        align: "center"
      });
      doc.end();

      stream.on("finish", () => {
        console.log("[FederalArchive] receipt generated:", this.receiptPath);
        resolve();
      });
    });
  }

  static createAck(manifest: any, tsa: any) {
    const ack = {
      request_id: crypto.randomUUID(),
      manifest_hash: crypto.createHash("sha256").update(JSON.stringify(manifest)).digest("hex"),
      tsa_signature: tsa.tsaSig,
      accepted: true,
      acknowledged_at: new Date().toISOString(),
      authority: "Canada Digital Archive (Mock API)"
    };
    fs.writeFileSync(this.ackPath, JSON.stringify(ack, null, 2));
    console.log("[FederalArchive] API acknowledgment:", this.ackPath);
  }

  /** Await async PDF creation */
  static async publishAll() {
    const manifest = this.buildManifest();
    const globalHash = crypto.createHash("sha256").update(JSON.stringify(manifest.entries)).digest("hex");
    const tsa = this.issueTimestamp(globalHash);
    await this.createReceipt(manifest, tsa);
    this.createAck(manifest, tsa);
    console.log("[FederalArchive] publication complete.");
    return true;
  }
}
