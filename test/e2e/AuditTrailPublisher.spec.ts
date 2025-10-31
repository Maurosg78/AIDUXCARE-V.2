import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { AuditTrailPublisherService } from "../../src/services/AuditTrailPublisherService";

describe("🪶 AuditTrailPublisherService — Public Ledger Entry", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should publish ledger entry JSON", () => {
    const entry = AuditTrailPublisherService.publish();
    expect(entry.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "public_audit_ledger.json"))).toBe(true);
  });
});
