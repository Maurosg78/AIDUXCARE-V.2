import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AIValidationPortalService } from "../../src/services/AIValidationPortalService";

describe("🌐 AIValidationPortalService — Public Layer", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate ai_validation_portal.html", () => {
    const file = AIValidationPortalService.render();
    expect(fs.existsSync(path.join(outputDir, "ai_validation_portal.html"))).toBe(true);
  });
});
