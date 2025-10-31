import fs from "fs";
import path from "path";

export class ObservatoryDashboardService {
  private static outputDir = path.join(process.cwd(), "output");

  static render() {
    const report = JSON.parse(fs.readFileSync(path.join(this.outputDir, "trustbridge_observatory.json"), "utf8"));
    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare — Observatory</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f4f6f8;padding:2rem">
<h1>🛰️ AiDuxCare TrustBridge Observatory</h1>
<p><strong>Observatory ID:</strong> ${report.observatory_id}</p>
<p><strong>Generated at:</strong> ${report.generated_at}</p>
<p><strong>Total Files:</strong> ${report.total_files}</p>
<p><strong>Total Size:</strong> ${report.total_size_kb} KB</p>
<p><strong>Status:</strong> ${report.status}</p>
<h2>Monitored Artifacts</h2>
<ul>
${report.observations.map(o =>
  `<li>${o.file} — ${o.type} — ${(o.size/1024).toFixed(1)} KB — ${o.hash.slice(0,16)}...</li>`
).join("")}
</ul>
<p><em>Integrity Score: ${report.integrity_score}% | All artifacts validated under TrustBridge Observatory.</em></p>
</body></html>`;
    const file = path.join(this.outputDir, "trustbridge_observatory.html");
    fs.writeFileSync(file, html);
    console.log("[ObservatoryDashboard] HTML generated:", file);
    return file;
  }
}
