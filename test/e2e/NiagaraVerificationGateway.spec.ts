import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { NiagaraVerificationGatewayService } from "../../src/services/NiagaraVerificationGatewayService";

describe("🌉 NiagaraVerificationGatewayService — Public Verification", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate verification_proof.json", () => {
    const chain = JSON.parse(fs.readFileSync(path.join(outputDir, "trustbridge_final_chain.json"), "utf8"));
    const proof = NiagaraVerificationGatewayService.verify(chain.id);
    expect(proof.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "verification_proof.json"))).toBe(true);
  });
});
