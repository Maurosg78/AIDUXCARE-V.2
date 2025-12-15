/**
 * Golden DECIDE Follow-up Tests
 * 
 * Validates format and contract compliance for DECIDE outputs.
 * Tests the validator and prompt builder, not clinical content.
 */

import { describe, it, expect } from "vitest";
import { validateContract } from "../validators/contractValidator";
import { buildPromptV3 } from "../builders/buildPromptV3";
import { FOLLOWUP_DECIDE_CASES } from "./fixtures/followup_cases";

describe("Golden DECIDE follow-up (format)", () => {
  it("buildPromptV3 generates instructions that enforce bullet-only output", () => {
    const p = buildPromptV3({
      flags: { intent: "DECIDE", visitType: "follow-up", analysisLevel: "optimized", promptBrainVersion: "v3" },
      context: FOLLOWUP_DECIDE_CASES[0].context,
    });
    expect(p).toMatch(/Return ONLY bullet lines/);
  });

  it("contractValidator rejects common forbidden phrases", () => {
    const out = "- As an AI, I can't diagnose.";
    const res = validateContract("DECIDE", out);
    expect(res.ok).toBe(false);
  });

  it("contractValidator accepts compliant decide output shape", () => {
    const out = [
      "- Reduce aggravating load 30% for 7 days; keep pain ≤3/10 during/after.",
      "- Add hip control work: side steps + step-downs; stop if lateral pain spikes.",
      "- Reintroduce jogging 2:1 run/walk, max 5 cycles, only if next-day stable.",
      "- Avoid long downhill; keep cycling easy cadence for aerobic load.",
    ].join("\n");
    const res = validateContract("DECIDE", out);
    expect(res.ok).toBe(true);
  });

  it("buildPromptV3 includes context from fixtures", () => {
    const case1 = FOLLOWUP_DECIDE_CASES[0];
    const p = buildPromptV3({
      flags: { intent: "DECIDE", visitType: "follow-up", analysisLevel: "optimized", promptBrainVersion: "v3" },
      context: case1.context,
    });
    expect(p).toMatch(/lateral knee pain/);
    expect(p).toMatch(/3\/10/);
  });

  it("contractValidator rejects output with too many bullets", () => {
    const out = Array.from({ length: 7 }, (_, i) => `- Bullet ${i + 1}`).join("\n");
    const res = validateContract("DECIDE", out);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => e.includes("maxBullets"))).toBe(true);
  });

  it("contractValidator rejects bullets exceeding 120 chars", () => {
    const longBullet = "- " + "x".repeat(121);
    const res = validateContract("DECIDE", longBullet);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => e.includes("too long"))).toBe(true);
  });
});

