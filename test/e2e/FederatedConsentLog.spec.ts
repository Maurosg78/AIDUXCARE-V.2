import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FederatedConsentLogService } from "../../src/services/FederatedConsentLogService";

describe("🌐 FederatedConsentLogService — Cross-Clinic Access Federation", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate federated_consent_log.json", () => {
    const log = FederatedConsentLogService.record();
    expect(log.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "federated_consent_log.json"))).toBe(true);
  });
});
