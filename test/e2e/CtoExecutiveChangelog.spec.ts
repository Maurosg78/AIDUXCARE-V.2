import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CtoExecutiveChangelogService } from "../../src/services/CtoExecutiveChangelogService";

describe("📘 CtoExecutiveChangelogService — Final Executive Report", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate aiduxcare_executive_changelog.pdf", () => {
    const result = CtoExecutiveChangelogService.generate();
    expect(result.status).toBe("FINALIZED");
    expect(fs.existsSync(path.join(outputDir, "aiduxcare_executive_changelog.pdf"))).toBe(true);
  });
});
