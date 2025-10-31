import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TrustBridgeOrchestratorService } from "../../src/services/TrustBridgeOrchestratorService";

describe("🧭 TrustBridgeOrchestratorService — Full System", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate orchestration_manifest.json", () => {
    const result = TrustBridgeOrchestratorService.orchestrate();
    expect(result.status).toBe("ORCHESTRATED");
    expect(fs.existsSync(path.join(outputDir, "orchestration_manifest.json"))).toBe(true);
  });
});
