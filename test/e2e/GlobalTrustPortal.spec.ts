import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GlobalTrustPortalService } from "../../src/services/GlobalTrustPortalService";

describe("🏛️ GlobalTrustPortalService — Certification Portal", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate global_trust_portal.html", () => {
    const file = GlobalTrustPortalService.render();
    expect(fs.existsSync(path.join(outputDir, "global_trust_portal.html"))).toBe(true);
  });
});
