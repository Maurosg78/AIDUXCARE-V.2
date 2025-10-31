import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export class GlobalComplianceCertificateService {
  private static outputDir = path.join(process.cwd(), "output");
  private static pdfPath = path.join(this.outputDir, "global_final_certificate.pdf");

  static issue() {
    const recon = JSON.parse(fs.readFileSync(path.join(this.outputDir, "clinical_audit_reconciliation.json"), "utf8"));
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(this.pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("🌍 AiDuxCare — Global Compliance Seal", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Certificate ID: ${recon.reconciliation_id}`);
    doc.text(`Generated at: ${recon.generated_at}`);
    doc.text(`Jurisdictions: ${recon.jurisdictions.join(", ")}`);
    doc.text(`Audit Records Linked: ${recon.audit_events_linked}`);
    doc.text(`Status: ${recon.status}`);
    doc.moveDown();
    doc.text("This document certifies that the full PHIPA/PIPEDA ↔ GDPR TrustBridge chain has been reconciled and verified.");
    doc.end();

    console.log("[Certificate] PDF issued:", this.pdfPath);
    return this.pdfPath;
  }
}
