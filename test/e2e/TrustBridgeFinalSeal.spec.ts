/**
 * AiDuxCare — TrustBridgeFinalSealService E2E
 * Phase 14A (Final Compliance Chain Seal — TrustBridge Canada)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TrustBridgeFinalSealService } from "../../src/services/TrustBridgeFinalSealService";

describe("🏛 TrustBridgeFinalSealService — Final Compliance Chain Seal", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should create final chain JSON, PDF, and acknowledgment", async () => {
    // Esperamos correctamente la Promise
    const ok = await TrustBridgeFinalSealService.sealAll();
    expect(ok).toBe(true);

    const chain = path.join(outputDir, "trustbridge_final_chain.json");
    const pdf = path.join(outputDir, "trustbridge_final_certificate.pdf");
    const ack = path.join(outputDir, "trustbridge_ack.json");

    // Espera mínima para asegurar que el I/O terminó
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(fs.existsSync(chain)).toBe(true);
    expect(fs.existsSync(pdf)).toBe(true);
    expect(fs.existsSync(ack)).toBe(true);

    const data = JSON.parse(fs.readFileSync(chain, "utf8"));
    expect(data.verified).toBe(true);
  });
});
