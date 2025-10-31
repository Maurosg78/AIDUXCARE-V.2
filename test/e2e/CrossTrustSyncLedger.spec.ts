import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CrossTrustSyncLedgerService } from "../../src/services/CrossTrustSyncLedgerService";

describe("🪙 CrossTrustSyncLedgerService — EU GDPR Ledger Sync", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate crosstrust_sync_ledger.json", () => {
    const record = CrossTrustSyncLedgerService.sync();
    expect(record.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "crosstrust_sync_ledger.json"))).toBe(true);
  });
});
