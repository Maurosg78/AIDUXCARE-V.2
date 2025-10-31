import fs from "fs";
import path from "path";

export class EURegulatorFeedService {
  private static outputDir = path.join(process.cwd(), "output");

  static replay() {
    const manifest = JSON.parse(fs.readFileSync(path.join(this.outputDir, "global_trust_manifest.json"), "utf8"));
    const ack = JSON.parse(fs.readFileSync(path.join(this.outputDir, "crosstrust_ack.json"), "utf8"));

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>EU Regulator Audit Feed</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#fff;padding:2rem">
<h1>🇪🇺 European Data Protection Board — Audit Replay</h1>
<p><strong>Agreement:</strong> ${ack.agreement_id}</p>
<p><strong>Issued at:</strong> ${ack.issued_at}</p>
<p><strong>Cross-jurisdiction Verified:</strong> ${manifest.verified}</p>
<p><strong>Status:</strong> ${ack.status}</p>
</body></html>`;
    const file = path.join(this.outputDir, "regulator_eu_feed.html");
    fs.writeFileSync(file, html);
    console.log("[EUFeed] feed generated:", file);
    return file;
  }
}
