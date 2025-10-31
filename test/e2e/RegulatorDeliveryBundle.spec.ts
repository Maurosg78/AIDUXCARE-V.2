/**
 * AiDuxCare — RegulatorDeliveryBundleService E2E
 * Phase 10A (Regulator Delivery & Public Audit Export)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RegulatorDeliveryBundleService } from "../../src/services/RegulatorDeliveryBundleService";

describe("🇨🇦 RegulatorDeliveryBundleService — Delivery & Public Audit Export", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should build bundle, public export and receipt", async () => {
    const result = await RegulatorDeliveryBundleService.deliverAll();
    expect(result).toBe(true);

    const bundle = path.join(outputDir, "regulator_delivery_bundle.zip");
    const receipt = path.join(outputDir, "delivery_receipt.json");
    const pub = path.join(outputDir, "public_audit_export.json");

    expect(fs.existsSync(bundle)).toBe(true);
    expect(fs.existsSync(receipt)).toBe(true);
    expect(fs.existsSync(pub)).toBe(true);

    const data = JSON.parse(fs.readFileSync(receipt, "utf8"));
    expect(data.verified).toBe(true);
  });
});
