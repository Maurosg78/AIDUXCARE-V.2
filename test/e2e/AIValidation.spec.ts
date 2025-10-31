import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AIValidationService } from "../../src/services/AIValidationService";

describe("🤖 AIValidationService — TrustBridge AI Layer", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate ai_validation_report.json", () => {
    const result = AIValidationService.validate();
    expect(result.status).toBe("AI_VALIDATED");
    expect(fs.existsSync(path.join(outputDir, "ai_validation_report.json"))).toBe(true);
  });
});
