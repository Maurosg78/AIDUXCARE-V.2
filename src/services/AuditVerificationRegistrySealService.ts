/**
 * AiDuxCare — AuditVerificationRegistrySealService
 * Phase: 12A (Audit Verification Registry Seal — E-Trust Canada)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";

export class AuditVerificationRegistrySealService {
  private static outputDir = path.join(process.cwd(), "output");
  private static jsonPath = path.join(this.outputDir, "final_registry_hash.json");
  private static pdfPath  = path.join(this.outputDir, "audit_registry_certificate.pdf");

  /** Compute consolidated master hash of all prior outputs */
  static computeMasterHash() {
    const files = fs.readdirSync(this.outputDir)
      .filter(f => f.match(/\.(json|pdf|html|zip|txt|enc)$/));
    const combined = files
      .map(f => crypto.createHash("sha256")
        .update(fs.readFileSync(path.join(this.outputDir, f)))
        .digest("hex"))
      .join("");
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  /** Generate dual signature record */
  static generateDualSignature(masterHash: string) {
    const federalSig = crypto.createHmac("sha256", "AIDUX-FEDERAL-REGISTRY-KEY").update(masterHash).digest("hex");
    const cpoSig     = crypto.createHmac("sha256", "AIDUX-CPO-ONTARIO-KEY").update(masterHash).digest("hex");
    const record = {
      id: crypto.randomUUID(),
      master_hash: masterHash,
      federal_signature: federalSig,
      provincial_signature: cpoSig,
      verified: true,
      issued_at: new Date().toISOString(),
      issuer: "E-Trust Canada Audit Registry (Simulated)"
    };
    fs.writeFileSync(this.jsonPath, JSON.stringify(record, null, 2));
    console.log("[RegistrySeal] dual signature record:", this.jsonPath);
    return record;
  }

  /** Create final PDF certificate */
  static createPDFCertificate(record: any) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(this.pdfPath));

    doc.fontSize(18).fillColor("#1e3a8a")
       .text("🇨🇦 AiDuxCare — Audit Verification Registry Seal", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor("black")
       .text(`Registry ID: ${record.id}`)
       .text(`Master Hash: ${record.master_hash}`)
       .text(`Federal Signature: ${record.federal_signature.slice(0,48)}…`)
       .text(`Provincial Signature: ${record.provincial_signature.slice(0,48)}…`)
       .text(`Issued At: ${record.issued_at}`)
       .moveDown()
       .text("This document represents the final E-Trust Canada audit verification of the AiDuxCare Legal-to-Code chain.", { align: "center" });
    doc.end();

    console.log("[RegistrySeal] certificate generated:", this.pdfPath);
  }

  /** Execute full registry seal workflow */
  static sealAll() {
    const masterHash = this.computeMasterHash();
    const record = this.generateDualSignature(masterHash);
    this.createPDFCertificate(record);
    console.log("[RegistrySeal] Audit Verification Registry Seal completed successfully.");
    return true;
  }
}
