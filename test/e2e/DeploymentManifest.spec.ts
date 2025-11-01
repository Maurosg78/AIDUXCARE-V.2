import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DeploymentManifestService } from "../../src/services/DeploymentManifestService";

describe("🚀 DeploymentManifestService — v1.0-CA", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate deployment_manifest.json with DEPLOY_READY status", () => {
    const result = DeploymentManifestService.generate();
    expect(result.status).toBe("DEPLOY_READY");
    expect(fs.existsSync(path.join(outputDir, "deployment_manifest.json"))).toBe(true);
  });
});
