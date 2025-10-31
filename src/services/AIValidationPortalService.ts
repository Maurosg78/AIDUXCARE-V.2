import fs from "fs";
import path from "path";

export class AIValidationPortalService {
  private static outputDir = path.join(process.cwd(), "output");

  static render() {
    const report = JSON.parse(fs.readFileSync(path.join(this.outputDir, "ai_validation_report.json"), "utf8"));
    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare — AI Validation Report</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#fefefe;padding:2rem">
<h1>🤖 AiDuxCare TrustBridge — AI Validation Layer</h1>
<p><strong>Validation ID:</strong> ${report.validation_id}</p>
<p><strong>Executed at:</strong> ${report.executed_at}</p>
<p><strong>AI Score:</strong> ${report.ai_score}%</p>
<p><strong>Integrity Verified:</strong> ${report.integrity_verified}</p>
<p><strong>Status:</strong> ${report.status}</p>
</body></html>`;
    const file = path.join(this.outputDir, "ai_validation_portal.html");
    fs.writeFileSync(file, html);
    console.log("[AIValidationPortal] HTML generated:", file);
    return file;
  }
}
