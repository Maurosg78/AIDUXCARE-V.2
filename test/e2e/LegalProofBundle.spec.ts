/**
 * AiDuxCare — LegalProofBundleService E2E
 * Phase: 5A (Regulatory Export & Evidence Packaging)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { ProofChainService } from "../../src/services/ProofChainService";

describe("📦 LegalProofBundleService — Regulatory Export & Evidence Packaging", () => {
  it("✅ should create a proof bundle zip file", async () => {
    const proof = await ProofChainService.generateProof("user-001", "note-001", "hash001", "1.1");
    const audit = [
      { event: "CREATE", timestamp: new Date().toISOString() },
      { event: "SYNC", system: "JaneApp" },
    ];
    const bundle = await LegalProofBundleService.createBundle(proof, audit);
    expect(bundle).toContain("proof_bundle_note-001.zip");
    expect(fs.existsSync(bundle)).toBe(true);
  });

  it("🧩 should include JSON and PDF artifacts", async () => {
    const exists = LegalProofBundleService.verifyBundleExists("note-001");
    expect(exists).toBe(true);
  });
});
