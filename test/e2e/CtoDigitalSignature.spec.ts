import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CtoDigitalSignatureService } from "../../src/services/CtoDigitalSignatureService";

describe("🔏 CtoDigitalSignatureService — Final Delivery", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should create final signed bundle and manifest", () => {
    const result = CtoDigitalSignatureService.sign();
    expect(result.status).toBe("SIGNED");
    expect(fs.existsSync(path.join(outputDir, "aiduxcare_final_delivery.zip"))).toBe(true);
  });
});
