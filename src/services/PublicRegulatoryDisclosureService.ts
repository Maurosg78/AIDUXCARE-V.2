import fs from "fs";
import path from "path";

export class PublicRegulatoryDisclosureService {
  private static outputDir = path.join(process.cwd(), "output");

  static publish() {
    const manifest = JSON.parse(fs.readFileSync(path.join(this.outputDir, "global_trust_manifest.json"), "utf8"));
    const ca = JSON.parse(fs.readFileSync(path.join(this.outputDir, "public_audit_ledger.json"), "utf8"));
    const eu = JSON.parse(fs.readFileSync(path.join(this.outputDir, "crosstrust_sync_ledger.json"), "utf8"));

    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare — Public Regulatory Portal</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#fafafa;padding:2rem">
<h1>🇨🇦 AiDuxCare Public Audit Portal</h1>
<p><strong>Global Manifest:</strong> ${manifest.manifest_id}</p>
<p><strong>PHIPA/PIPEDA Ledger:</strong> ${ca.ledger_id}</p>
<p><strong>GDPR Sync Ledger:</strong> ${eu.ledger_id}</p>
<p><strong>CrossTrust Verified:</strong> ${manifest.verified}</p>
</body></html>`;
    const file = path.join(this.outputDir, "public_audit_portal.html");
    fs.writeFileSync(file, html);
    console.log("[PublicDisclosure] portal generated:", file);
    return file;
  }
}
