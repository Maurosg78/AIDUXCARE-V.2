/**
 * AiDuxCare — Compliance Integration E2E
 * Market: CA | Language: en-CA
 * WO: WO-2024-002 (Phase 2A validated)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { deIdentifyText } from "../../src/services/DeIdentificationService";
import { supabase } from "../../src/services/ConsentAuditService";

describe("�� PIPEDA/PHIPA Compliance — E2E Integration", () => {
  const user_id = "00000000-0000-0000-0000-000000000001";
  const consent_version = "1.1";

  beforeAll(() => {
    console.log("Starting PHIPA/PIPEDA E2E suite...");
  });

  afterAll(() => {
    console.log("Completed PHIPA/PIPEDA E2E suite ✅");
  });

  it("✅ should confirm stored consent and proceed", async () => {
    const result = await supabase
      .from("consent_logs")
      .insert([
        {
          user_id,
          consent_version,
          withdrawn: false,
          consent_ip: "127.0.0.1",
          consent_agent: "node-test",
        },
      ]);
    expect(result.error).toBeNull();
    expect(result.data[0].withdrawn).toBe(false);
  });

  it("🧾 should log consent withdrawal properly", async () => {
    const result = await supabase
      .from("consent_logs")
      .insert([
        {
          user_id,
          consent_version,
          withdrawn: true,
          consent_ip: "127.0.0.1",
          consent_agent: "node-test",
        },
      ]);
    expect(result.error).toBeNull();
    expect(result.data[0].withdrawn).toBe(true);
  });

  it("🔒 should de-identify clinical text under 50 ms", async () => {
    const sampleText =
      "Patient John Doe visited Toronto clinic on 12/10/2025. Phone 123-456-7890. ID A1B2C3.";
    const start = performance.now();
    const deIdentified = await deIdentifyText(sampleText);
    const elapsed = performance.now() - start;

    expect(deIdentified).not.toContain("John Doe");
    expect(deIdentified).not.toContain("Toronto");
    expect(deIdentified).not.toContain("123-456-7890");
    expect(deIdentified).toMatch(/\[PACIENTE\]/);
    expect(elapsed).toBeLessThan(50);
  });
});
