import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { EURegulatorFeedService } from "../../src/services/EURegulatorFeedService";

describe("🇪🇺 EURegulatorFeedService — Audit Replay", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate regulator_eu_feed.html", () => {
    const file = EURegulatorFeedService.replay();
    expect(fs.existsSync(path.join(outputDir, "regulator_eu_feed.html"))).toBe(true);
  });
});
