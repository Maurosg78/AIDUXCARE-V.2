/**
 * AiDuxCare — FinalPublicIndexService E2E
 * Phase 14D (Public Index Generator)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FinalPublicIndexService } from "../../src/services/FinalPublicIndexService";

describe("🌐 FinalPublicIndexService — Generate Public HTML Index", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate public index HTML", () => {
    const ok = FinalPublicIndexService.generate();
    expect(ok).toBe(true);

    const html = path.join(outputDir, "public_index.html");
    expect(fs.existsSync(html)).toBe(true);

    const content = fs.readFileSync(html, "utf8");
    expect(content).toMatch(/AiDuxCare TrustBridge Public Index/);
  });
});
