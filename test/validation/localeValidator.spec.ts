import { describe, it, expect } from "vitest";
import { validateLocaleParity } from "../../src/audit/localeValidator";

describe("Cross-Locale Validation", () => {
  it("should detect missing keys and report parity score", () => {
    const result = validateLocaleParity();
    console.log("Locale parity:", result);
    expect(result.parityScore).toBeGreaterThan(95);
    expect(result.missingInEs.length).toBe(0);
  });
});
