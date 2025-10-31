/**
 * AiDuxCare — RegulatorVerificationInterface E2E
 * Phase: 9C (CPO Ontario Verification Dashboard)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RegulatorVerificationInterface } from "../../src/reports/RegulatorVerificationInterface";

describe("🧭 RegulatorVerificationInterface — CPO Ontario Audit Portal", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should build regulator verification portal successfully", () => {
    const portal = RegulatorVerificationInterface.buildPortal();
    expect(fs.existsSync(portal)).toBe(true);
    const html = fs.readFileSync(portal, "utf8");
    expect(html.includes("Regulator Verification Portal")).toBe(true);
    expect(html.includes("Verified")).toBe(true);
  });
});
