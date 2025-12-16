/**
 * Tests for buildPromptV3
 */

import { describe, it, expect } from "vitest";
import { buildPromptV3 } from "../builders/buildPromptV3";

describe("buildPromptV3", () => {
  it("returns a DECIDE prompt string", () => {
    const p = buildPromptV3({
      flags: { intent: "DECIDE", visitType: "follow-up", analysisLevel: "optimized", promptBrainVersion: "v3" },
      context: { chiefComplaint: "lateral knee pain", keyFindings: ["walking aggravates", "cycling ok"], painScale: "3/10" },
    });
    expect(typeof p).toBe("string");
    expect(p).toMatch(/Return ONLY bullet lines/);
  });

  it("includes context in prompt", () => {
    const p = buildPromptV3({
      flags: { intent: "DECIDE", visitType: "follow-up", analysisLevel: "optimized", promptBrainVersion: "v3" },
      context: { chiefComplaint: "lateral knee pain", keyFindings: ["walking aggravates"], painScale: "3/10" },
    });
    expect(p).toMatch(/lateral knee pain/);
    expect(p).toMatch(/3\/10/);
  });
});

