/**
 * AiDuxCare — ComplianceChainVaultService E2E
 * Phase: 9B (Immutable Offsite Backup + Notary Simulation)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ComplianceChainVaultService } from "../../src/services/ComplianceChainVaultService";

describe("🔒 ComplianceChainVaultService — Offsite Backup + Notary", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should build encrypted vault and attestation", async () => {
    await ComplianceChainVaultService.buildVault();

    const encPath = path.join(outputDir, "compliance_vault.zip.enc");
    const attPath = path.join(outputDir, "vault_attestation.json");

    expect(fs.existsSync(encPath)).toBe(true);
    expect(fs.existsSync(attPath)).toBe(true);

    const attestation = JSON.parse(fs.readFileSync(attPath, "utf8"));
    expect(attestation.verified).toBe(true);
    expect(attestation.vault_hash.length).toBe(64);
  });
});
