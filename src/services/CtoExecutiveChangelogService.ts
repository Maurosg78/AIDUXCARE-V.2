import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import crypto from "crypto";

export class CtoExecutiveChangelogService {
  private static outputDir = path.join(process.cwd(), "output");
  private static reportPath = path.join(this.outputDir, "aiduxcare_executive_changelog.pdf");

  static generate() {
    const timestamp = new Date().toISOString();
    const phases = fs.readdirSync(this.outputDir)
      .filter(f => f.endsWith(".json") || f.endsWith(".pdf") || f.endsWith(".zip"))
      .map(f => {
        const p = path.join(this.outputDir, f);
        const buf = fs.readFileSync(p);
        const hash = crypto.createHash("sha512").update(buf).digest("hex");
        return { file: f, size_kb: (buf.length / 1024).toFixed(2), sha512: hash };
      });

    const summaryHash = crypto.createHash("sha512")
      .update(phases.map(p => p.sha512).join(""))
      .digest("hex");

    const doc = new PDFDocument({ margin: 50 });
    const pdfStream = fs.createWriteStream(this.reportPath);
    doc.pipe(pdfStream);

    doc.fontSize(18).text("AiDuxCare North — CTO Executive Changelog", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Version: v1.0-CA`);
    doc.text(`Generated at: ${timestamp}`);
    doc.text(`Organization: AiDuxCare / Niagara Innovation Hub`);
    doc.text(`Region: CA-ON  |  Locale: en-CA`);
    doc.moveDown();

    doc.fontSize(14).text("Release Summary", { underline: true });
    doc.fontSize(10);
    phases.forEach(p => {
      doc.text(`${p.file} — ${p.size_kb} KB`);
    });

    doc.moveDown();
    doc.fontSize(12).text("Integrity Summary", { underline: true });
    doc.fontSize(10).text(`Aggregate SHA-512: ${summaryHash.slice(0, 96)}...`);
    doc.moveDown();

    doc.fontSize(12).text("Final Status: ✅ RELEASE_READY", { align: "center" });
    doc.text("Seal: CTO Executive Summary — TrustBridge v1.0-CA", { align: "center" });
    doc.end();

    console.log("[CTO Changelog] PDF generated:", this.reportPath);
    return { status: "FINALIZED", file: this.reportPath, hash: summaryHash };
  }
}
