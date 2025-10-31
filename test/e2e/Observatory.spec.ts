import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ObservatoryService } from "../../src/services/ObservatoryService";

describe("🛰️ ObservatoryService — System Telemetry", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate trustbridge_observatory.json", () => {
    const result = ObservatoryService.analyze();
    expect(result.status).toBe("OBSERVED");
    expect(fs.existsSync(path.join(outputDir, "trustbridge_observatory.json"))).toBe(true);
  });
});
