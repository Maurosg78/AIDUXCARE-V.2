/**
 * AiDuxCare — PublicVerifierService E2E
 * Phase: 5B (Public Ledger Proof)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PublicVerifierService } from "../../src/services/PublicVerifierService";
import { LegalProofBundleService } from "../../src/services/LegalProofBundleService";
import { ProofChainService } from "../../src/services/ProofChainService";

describe("🔗 PublicVerifierService — Public Ledger Proof", () => {
  const outputDir = path.join(process.cwd(), "output");
  const bundlePath = path.join(outputDir, "proof_bundle_note-002.zip");

  it("✅ should publish bundle hash to ledger", async () => {
    const proof = await ProofChainService.generateProof("user-010", "note-002", "hash002", "1.1");
    const audit = [{ event: "SYNC" }];
    const bundle = await LegalProofBundleService.createBundle(proof, audit);
    const entry = PublicVerifierService.publishToLedger(bundle);
    expect(entry.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(fs.existsSync(PublicVerifierService["ledgerPath"])).toBe(true);
  });

  it("🧾 should verify bundle authenticity via ledger", async () => {
    const valid = PublicVerifierService.verifyBundle(bundlePath);
    expect(valid).toBe(true);
  });
});
