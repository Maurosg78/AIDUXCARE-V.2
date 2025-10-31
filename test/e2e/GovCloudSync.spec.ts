/**
 * AiDuxCare — GovCloudSyncService E2E
 * Phase 13C (GovCloud Sync Prototype)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GovCloudSyncService } from "../../src/services/GovCloudSyncService";

describe("☁️ GovCloudSyncService — Mock GovCloud + Niagara Ledger Sync", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should create manifest, bundle, and ack", () => {
    const ok = GovCloudSyncService.syncAll();
    expect(ok).toBe(true);

    const manifest = path.join(outputDir, "govcloud_sync_manifest.json");
    const bundle = path.join(outputDir, "govcloud_sync_bundle.zip");
    const ack = path.join(outputDir, "govcloud_ack.json");

    expect(fs.existsSync(manifest)).toBe(true);
    expect(fs.existsSync(bundle)).toBe(true);
    expect(fs.existsSync(ack)).toBe(true);

    const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
    expect(data.total_files).toBeGreaterThan(5);
  });
});
