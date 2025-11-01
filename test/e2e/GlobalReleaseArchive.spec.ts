import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GlobalReleaseArchiveService } from "../../src/services/GlobalReleaseArchiveService";

describe("🌎 GlobalReleaseArchiveService — Final Delivery v1.0-CA", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should create final global release bundle", () => {
    const result = GlobalReleaseArchiveService.assemble();
    expect(result.status).toBe("RELEASE_READY");
    expect(fs.existsSync(path.join(outputDir, "aiduxcare_north_v1.0_CA_release.zip"))).toBe(true);
  });
});
