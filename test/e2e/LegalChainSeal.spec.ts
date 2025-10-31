/**
 * AiDuxCare — LegalChainSealService E2E
 * Phase: 9D (CTO Final Signature & Legal Chain Seal)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { LegalChainSealService } from "../../src/services/LegalChainSealService";

describe("🏁 LegalChainSealService — CTO Final Signature & Legal Chain Seal", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should compute master hash, sign and produce PDF seal", () => {
    const result = LegalChainSealService.sealAll();
    expect(result).toBe(true);

    const cert = path.join(outputDir, "chain_final_signature.json");
    const pdf = path.join(outputDir, "chain_final_seal.pdf");
    const hash = path.join(outputDir, "chain_master_hash.txt");

    expect(fs.existsSync(cert)).toBe(true);
    expect(fs.existsSync(pdf)).toBe(true);
    expect(fs.existsSync(hash)).toBe(true);

    const data = JSON.parse(fs.readFileSync(cert, "utf8"));
    expect(data.verified).toBe(true);
  });
});
