import fs from "fs";
import path from "path";

export class TrustBridgeDashboardService {
  private static outputDir = path.join(process.cwd(), "output");

  static render() {
    const manifest = JSON.parse(fs.readFileSync(path.join(this.outputDir, "orchestration_manifest.json"), "utf8"));
    const html = `<!DOCTYPE html>
<html lang="en-CA">
<head><meta charset="UTF-8"/><title>AiDuxCare — TrustBridge Dashboard</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;padding:2rem">
<h1>🧭 AiDuxCare TrustBridge Orchestration Dashboard</h1>
<p><strong>Orchestration ID:</strong> ${manifest.orchestration_id}</p>
<p><strong>Generated at:</strong> ${manifest.generated_at}</p>
<p><strong>Total Artifacts:</strong> ${manifest.total_artifacts}</p>
<p><strong>Status:</strong> ${manifest.status}</p>
<h2>Artifacts</h2>
<ul>
${manifest.artifacts.map(a => `<li>${a.file} — ${a.size_kb} KB — ${a.hash.slice(0, 16)}...</li>`).join("")}
</ul>
<p><em>All artifacts cryptographically linked and orchestrated within AiDuxCare TrustBridge.</em></p>
</body></html>`;
    const file = path.join(this.outputDir, "trustbridge_dashboard.html");
    fs.writeFileSync(file, html);
    console.log("[Dashboard] HTML generated:", file);
    return file;
  }
}
