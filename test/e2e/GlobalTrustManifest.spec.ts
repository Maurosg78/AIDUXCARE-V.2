import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GlobalTrustManifestService } from "../../src/services/GlobalTrustManifestService";

describe("🌐 GlobalTrustManifestService — Unified Manifest Builder", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should build global_trust_manifest.json", () => {
    const manifest = GlobalTrustManifestService.build();
    expect(manifest.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "global_trust_manifest.json"))).toBe(true);
  });
});
