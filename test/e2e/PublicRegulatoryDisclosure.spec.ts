import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PublicRegulatoryDisclosureService } from "../../src/services/PublicRegulatoryDisclosureService";

describe("📢 PublicRegulatoryDisclosureService — CPO Ontario Portal", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate public_audit_portal.html", () => {
    const file = PublicRegulatoryDisclosureService.publish();
    expect(fs.existsSync(path.join(outputDir, "public_audit_portal.html"))).toBe(true);
  });
});
