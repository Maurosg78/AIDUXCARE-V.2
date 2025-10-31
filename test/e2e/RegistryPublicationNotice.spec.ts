/**
 * AiDuxCare — RegistryPublicationNoticeService E2E
 * Phase 12B (E-Trust Canada Public Disclosure)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RegistryPublicationNoticeService } from "../../src/services/RegistryPublicationNoticeService";

describe("📜 RegistryPublicationNoticeService — E-Trust Canada Public Disclosure", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should create public notice, open data and ack", () => {
    const ok = RegistryPublicationNoticeService.publishAll();
    expect(ok).toBe(true);

    const notice = path.join(outputDir, "audit_public_notice.html");
    const openData = path.join(outputDir, "audit_open_data.json");
    const ack = path.join(outputDir, "registry_publication_ack.json");

    expect(fs.existsSync(notice)).toBe(true);
    expect(fs.existsSync(openData)).toBe(true);
    expect(fs.existsSync(ack)).toBe(true);

    const data = JSON.parse(fs.readFileSync(openData, "utf8"));
    expect(data.verified).toBe(true);
  });
});
