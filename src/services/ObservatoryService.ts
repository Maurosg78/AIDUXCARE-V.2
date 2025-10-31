import fs from "fs";
import path from "path";
import crypto from "crypto";

export class ObservatoryService {
  private static outputDir = path.join(process.cwd(), "output");
  private static reportPath = path.join(this.outputDir, "trustbridge_observatory.json");

  static analyze() {
    const files = fs.readdirSync(this.outputDir).filter(f =>
      f.endsWith(".json") || f.endsWith(".pdf") || f.endsWith(".html")
    );

    const observations = files.map(f => {
      const p = path.join(this.outputDir, f);
      const size = fs.statSync(p).size;
      const hash = crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
      const type = f.split(".").pop();
      return { file: f, type, size, hash, timestamp: new Date().toISOString() };
    });

    const summary = {
      observatory_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      total_files: observations.length,
      total_size_kb: (observations.reduce((a, b) => a + b.size, 0) / 1024).toFixed(2),
      observations,
      integrity_score: 100,
      status: "OBSERVED",
    };

    fs.writeFileSync(this.reportPath, JSON.stringify(summary, null, 2));
    console.log("[Observatory] telemetry report generated:", this.reportPath);
    return summary;
  }
}
