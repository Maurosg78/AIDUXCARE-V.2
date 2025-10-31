import fs from "fs";
import path from "path";

export class SelfHealingDashboardService {
  private static outputDir = path.join(process.cwd(), "output");

  static render() {
    const report = JSON.parse(fs.readFileSync(path.join(this.outputDir, "trustbridge_selfheal.json"), "utf8"));
    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare — Self-Healing Report</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f3f4f6;padding:2rem">
<h1>🩺 AiDuxCare TrustBridge — Self-Healing Engine</h1>
<p><strong>SelfHeal ID:</strong> ${report.selfheal_id}</p>
<p><strong>Generated at:</strong> ${report.generated_at}</p>
<p><strong>Total Files:</strong> ${report.total_files}</p>
<p><strong>Healed Files:</strong> ${report.healed_files}</p>
<p><strong>Integrity Score:</strong> ${report.integrity_score}%</p>
<p><strong>Status:</strong> ${report.status}</p>
<h2>File Audit</h2>
<ul>
${report.artifacts.map(a => 
  `<li>${a.file} — ${a.action} — ${a.exists ? "✅" : "♻️"} — ${a.current_hash ? a.current_hash.slice(0,16) : "N/A"}...</li>`
).join("")}
</ul>
<p><em>System integrity automatically monitored and corrected by TrustBridge Self-Healing Layer.</em></p>
</body></html>`;
    const file = path.join(this.outputDir, "trustbridge_selfheal.html");
    fs.writeFileSync(file, html);
    console.log("[SelfHealingDashboard] HTML generated:", file);
    return file;
  }
}
