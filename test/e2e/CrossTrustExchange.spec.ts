import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CrossTrustExchangeService } from "../../src/services/CrossTrustExchangeService";

describe("🌍 CrossTrustExchangeService — EU↔CA Exchange Bundle", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate crosstrust_exchange.json", () => {
    const result = CrossTrustExchangeService.generate();
    expect(result.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "crosstrust_exchange.json"))).toBe(true);
  });
});
