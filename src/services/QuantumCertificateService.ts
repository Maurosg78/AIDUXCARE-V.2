import fs from "fs";
import path from "path";

export class QuantumCertificateService {
  private static outputDir = path.join(process.cwd(), "output");

  static issue() {
    const sign = JSON.parse(fs.readFileSync(path.join(this.outputDir, "quantum_signatures.json"), "utf8"));
    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare — Quantum Compliance Certificate</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:2rem">
<h1>🧬 AiDuxCare Quantum Compliance Certificate</h1>
<p><strong>Batch ID:</strong> ${sign.batch_id}</p>
<p><strong>Generated at:</strong> ${sign.generated_at}</p>
<p><strong>Algorithm:</strong> ${sign.algorithm}</p>
<p><strong>Signatures:</strong></p>
<ul>
${sign.signatures.map(s => `<li>${s.artifact}: ${s.pq_signature.slice(0, 32)}...</li>`).join("")}
</ul>
<p><em>All artifacts cryptographically sealed under simulated post-quantum scheme.</em></p>
</body></html>`;
    const file = path.join(this.outputDir, "quantum_certificate.html");
    fs.writeFileSync(file, html);
    console.log("[QuantumCertificate] HTML issued:", file);
    return file;
  }
}
