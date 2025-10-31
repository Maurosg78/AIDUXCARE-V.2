import fs from "fs";
import path from "path";

export class FinalPublicIndexService {
  private static outputDir = path.join(process.cwd(), "output");
  private static htmlPath = path.join(this.outputDir, "public_index.html");

  static generate() {
    const chain = JSON.parse(fs.readFileSync(path.join(this.outputDir, "trustbridge_final_chain.json"), "utf8"));
    const proof = JSON.parse(fs.readFileSync(path.join(this.outputDir, "verification_proof.json"), "utf8"));
    const ledger = JSON.parse(fs.readFileSync(path.join(this.outputDir, "public_audit_ledger.json"), "utf8"));

    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare TrustBridge Public Index</title></head>
<body style="font-family:Inter,Arial,sans-serif;margin:2rem;background:#fafafa">
<h1>🇨🇦 AiDuxCare TrustBridge Public Index</h1>
<p><strong>Chain ID:</strong> ${chain.id}</p>
<p><strong>Status:</strong> ${proof.status}</p>
<p><strong>Ledger Entry:</strong> ${ledger.ledger_id}</p>
<p><strong>Verified:</strong> ${ledger.verified}</p>
</body></html>`;
    fs.writeFileSync(this.htmlPath, html);
    console.log("[FinalPublicIndex] index generated:", this.htmlPath);
    return true;
  }
}
