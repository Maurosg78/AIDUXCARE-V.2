import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { SelfHealingService } from "../../src/services/SelfHealingService";

describe("🩺 SelfHealingService — Resilience Engine", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate trustbridge_selfheal.json", () => {
    const result = SelfHealingService.heal();
    expect(result.status).toMatch(/STABLE|PARTIALLY_HEALED/);
    expect(fs.existsSync(path.join(outputDir, "trustbridge_selfheal.json"))).toBe(true);
  });
});
