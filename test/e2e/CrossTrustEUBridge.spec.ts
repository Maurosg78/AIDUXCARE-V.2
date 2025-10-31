import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CrossTrustEUBridgeService } from "../../src/services/CrossTrustEUBridgeService";

describe("🤝 CrossTrustEUBridgeService — Bilateral CA↔EU Bridge", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate crosstrust_ack.json", () => {
    const ack = CrossTrustEUBridgeService.finalize();
    expect(ack.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "crosstrust_ack.json"))).toBe(true);
  });
});
