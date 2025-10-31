import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ConsentAnalyticsService } from "../../src/services/ConsentAnalyticsService";

describe("📊 ConsentAnalyticsService — Legal Observability", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate consent_analytics.json", () => {
    const analytics = ConsentAnalyticsService.generate();
    expect(analytics.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "consent_analytics.json"))).toBe(true);
  });
});
