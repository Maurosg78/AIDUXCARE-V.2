/**
 * AiDuxCare — PIPEDA/PHIPA Compliance Integration Test
 * Work Order: WO-2024-002
 * Scope: End-to-End verification of Consent + De-identification + Audit Logging
 * Market: CA | Language: en-CA
 */

import { describe, it, expect, beforeAll } from "vitest";
import { logConsentAction } from "../../src/services/ConsentAuditService";
import { deIdentifyText } from "../../src/services/DeIdentificationService";

// 🔧 Mock localStorage for consent simulation
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  clear() {
    this.store = {};
  },
};

global.localStorage = mockLocalStorage as any;

describe("🧩 PIPEDA/PHIPA Compliance — E2E Integration", () => {
  const sampleText = `
    Patient John Smith attended at 4551 Zimmerman Ave, Niagara Falls on 2025-10-30.
    Phone number 905-555-1234. Physiotherapist: Dr. Mauricio Sobarzo.
  `;

  let deIdentified: string;
  const mockUserId = "00000000-0000-0000-0000-000000000001";

  beforeAll(() => {
    localStorage.clear();
    localStorage.setItem(
      "aidux_patient_consent",
      JSON.stringify({
        accepted: true,
        userId: mockUserId,
        version: "1.1",
        consent_date: new Date().toISOString(),
      })
    );
  });

  it("✅ should confirm stored consent and proceed", async () => {
    const stored = localStorage.getItem("aidux_patient_consent");
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.accepted).toBe(true);
    const result = await logConsentAction({
      userId: mockUserId,
      action: "accept",
      version: "1.1",
    });
    expect(result).toBeDefined();
  });

  it("🔒 should de-identify clinical text under 50 ms", async () => {
    const start = performance.now();
    deIdentified = await deIdentifyText(sampleText);
    const elapsed = performance.now() - start;

    expect(deIdentified).not.toContain("John Smith");
    expect(deIdentified).not.toContain("905-555-1234");
    expect(elapsed).toBeLessThan(50);
  });

  it("🧾 should log consent withdrawal properly", async () => {
    const result = await logConsentAction({
      userId: mockUserId,
      action: "withdraw",
      version: "1.1",
    });
    expect(result).toBeDefined();
  });
});
