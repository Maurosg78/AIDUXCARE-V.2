import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TrustBridgeDashboardService } from "../../src/services/TrustBridgeDashboardService";

describe("🌐 TrustBridgeDashboardService — Global Dashboard", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate trustbridge_dashboard.html", () => {
    const file = TrustBridgeDashboardService.render();
    expect(fs.existsSync(path.join(outputDir, "trustbridge_dashboard.html"))).toBe(true);
  });
});
