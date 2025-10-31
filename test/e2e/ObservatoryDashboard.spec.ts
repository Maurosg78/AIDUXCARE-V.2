import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ObservatoryDashboardService } from "../../src/services/ObservatoryDashboardService";

describe("🌐 ObservatoryDashboardService — Visualization Layer", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate trustbridge_observatory.html", () => {
    const file = ObservatoryDashboardService.render();
    expect(fs.existsSync(path.join(outputDir, "trustbridge_observatory.html"))).toBe(true);
  });
});
