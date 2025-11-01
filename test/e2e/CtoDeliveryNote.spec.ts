import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CtoDeliveryNoteService } from "../../src/services/CtoDeliveryNoteService";

describe("📦 CtoDeliveryNoteService — Final CTO Delivery Note", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate aiduxcare_cto_delivery_note.pdf with DELIVERED status", () => {
    const result = CtoDeliveryNoteService.generate();
    expect(result.status).toBe("DELIVERED");
    expect(fs.existsSync(path.join(outputDir, "aiduxcare_cto_delivery_note.pdf"))).toBe(true);
  });
});
