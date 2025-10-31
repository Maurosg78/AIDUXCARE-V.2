/**
 * AiDuxCare — PublicTransparencyLedgerService E2E
 * Phase 11B (Canada.gov Mirror + Provincial Transparency Sync)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PublicTransparencyLedgerService } from "../../src/services/PublicTransparencyLedgerService";

describe("🌐 PublicTransparencyLedgerService — Federal Mirror + Provincial Sync", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should build ledger, feed, and signed receipt", () => {
    const ok = PublicTransparencyLedgerService.syncAll();
    expect(ok).toBe(true);

    const ledger = path.join(outputDir, "public_ledger_sync.json");
    const feed = path.join(outputDir, "canada_gov_feed.html");
    const receipt = path.join(outputDir, "ledger_sync_receipt.json");

    expect(fs.existsSync(ledger)).toBe(true);
    expect(fs.existsSync(feed)).toBe(true);
    expect(fs.existsSync(receipt)).toBe(true);

    const data = JSON.parse(fs.readFileSync(ledger, "utf8"));
    expect(data.entries.length).toBeGreaterThan(5);
  });
});
