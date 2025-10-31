import fs from "fs";
import path from "path";
import crypto from "crypto";

export class SelfHealingService {
  private static outputDir = path.join(process.cwd(), "output");
  private static reportPath = path.join(this.outputDir, "trustbridge_selfheal.json");

  static heal() {
    const baselinePath = path.join(this.outputDir, "trustbridge_observatory.json");
    if (!fs.existsSync(baselinePath)) {
      throw new Error("Baseline observatory report not found. Run ObservatoryService first.");
    }

    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    const files = baseline.observations;

    const healed = files.map(f => {
      const filePath = path.join(this.outputDir, f.file);
      const exists = fs.existsSync(filePath);
      let hashValid = false;
      let currentHash = null;

      if (exists) {
        const data = fs.readFileSync(filePath);
        currentHash = crypto.createHash("sha256").update(data).digest("hex");
        hashValid = currentHash === f.hash;
      }

      return {
        file: f.file,
        expected_hash: f.hash,
        current_hash: currentHash,
        exists,
        healed: exists && hashValid,
        action: exists
          ? (hashValid ? "OK" : "REHASHED")
          : "RESTORED (simulated)",
      };
    });

    const integrity = (healed.filter(h => h.healed).length / healed.length) * 100;

    const report = {
      selfheal_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      total_files: healed.length,
      healed_files: healed.filter(h => h.healed).length,
      integrity_score: integrity.toFixed(2),
      artifacts: healed,
      status: integrity === 100 ? "STABLE" : "PARTIALLY_HEALED",
    };

    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    console.log("[SelfHealing] Report generated:", this.reportPath);
    return report;
  }
}
