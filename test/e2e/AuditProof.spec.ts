/**
 * AiDuxCare — ProofChainService E2E
 * Phase: 4B (Regulatory-to-EMR Proof Chain)
 */
import { describe, it, expect } from "vitest";
import { ProofChainService } from "../../src/services/ProofChainService";

describe("🔏 ProofChainService — Regulatory-to-EMR Proof Chain", () => {
  it("✅ should generate a valid proof record", async () => {
    const proof = await ProofChainService.generateProof(
      "user-001",
      "note-001",
      "abc123hash",
      "1.1"
    );
    expect(proof.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(proof.verified).toBe(true);
  });

  it("🧩 should detect tampered integrity hash", async () => {
    const proof = await ProofChainService.generateProof(
      "user-002",
      "note-002",
      "tamperedhash",
      "1.1"
    );
    proof.integrity_hash = "fake";
    const valid = ProofChainService.verifyProof(proof);
    expect(valid).toBe(false);
  });

  it("🕒 should include timestamp and consent version", async () => {
    const proof = await ProofChainService.generateProof(
      "user-003",
      "note-003",
      "abcdef123456",
      "1.1"
    );
    expect(proof.timestamp).toMatch(/T\d{2}:\d{2}:\d{2}/);
    expect(proof.consent_version).toBe("1.1");
  });
});
