/**
 * AiDuxCare — DigitalConsentLedgerService E2E
 * Phase: 8D (Patient-Facing Proof Mirror)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DigitalConsentLedgerService } from "../../src/services/DigitalConsentLedgerService";
import { RegulatorAuditPortalService } from "../../src/services/RegulatorAuditPortalService";

describe("🩺 DigitalConsentLedgerService — Patient Proof Mirror", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should build patient consent ledger and portal", async () => {
    const records = DigitalConsentLedgerService.buildLedger();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThan(0);

    const portalPath = DigitalConsentLedgerService.buildPortal();
    expect(fs.existsSync(portalPath)).toBe(true);

    const html = fs.readFileSync(portalPath, "utf8");
    expect(html.includes("Patient Consent Ledger")).toBe(true);
    expect(html.includes("Consent")).toBe(true);
  });
});
