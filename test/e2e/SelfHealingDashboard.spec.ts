import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { SelfHealingDashboardService } from "../../src/services/SelfHealingDashboardService";

describe("🌐 SelfHealingDashboardService — Visualization Layer", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate trustbridge_selfheal.html", () => {
    const file = SelfHealingDashboardService.render();
    expect(fs.existsSync(path.join(outputDir, "trustbridge_selfheal.html"))).toBe(true);
  });
});
