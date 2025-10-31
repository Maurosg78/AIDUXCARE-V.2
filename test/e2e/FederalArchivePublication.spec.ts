/**
 * AiDuxCare — FederalArchivePublicationService E2E
 * Phase 11A (Canada Federal Archive Publication)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FederalArchivePublicationService } from "../../src/services/FederalArchivePublicationService";

describe("🏛 FederalArchivePublicationService — Federal Archive Publication", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should create manifest, TSA timestamp, PDF receipt, and ack", async () => {
    // Esperar el proceso completo (promesa)
    const ok = await FederalArchivePublicationService.publishAll();
    expect(ok).toBe(true);

    const manifest = path.join(outputDir, "federal_archive_manifest.json");
    const receipt = path.join(outputDir, "federal_archive_receipt.pdf");
    const ack = path.join(outputDir, "federal_archive_ack.json");

    expect(fs.existsSync(manifest)).toBe(true);
    expect(fs.existsSync(receipt)).toBe(true);
    expect(fs.existsSync(ack)).toBe(true);

    const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
    expect(data.total_files).toBeGreaterThan(5);
  });
});
