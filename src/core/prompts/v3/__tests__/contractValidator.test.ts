/**
 * Tests for Contract Validator
 */

import { describe, it, expect } from "vitest";
import { validateContract } from "../validators/contractValidator";

describe("contractValidator", () => {
    it("passes valid DECIDE bullets", () => {
        const out = [
            "- Reduce run load 30% for 7 days; keep cycling easy if pain ≤3/10.",
            "- Add hip abduction + step-down control; stop sets if lateral pain spikes.",
            "- Reintroduce jog with 2:1 run/walk max 5 cycles if no flare next day.",
            "- Review footwear + cadence; avoid long downhill for 1 week.",
        ].join("\n");

        const res = validateContract("DECIDE", out);
        expect(res.ok).toBe(true);
    });

    it("fails forbidden phrases", () => {
        const out = "- As an AI, I can't diagnose.";
        const res = validateContract("DECIDE", out);
        expect(res.ok).toBe(false);
        expect(res.errors.join(" ")).toMatch(/forbidden/);
    });

    it("fails too many bullets", () => {
        const out = Array.from({ length: 7 }).map((_, i) => `- Bullet ${i}`).join("\n");
        const res = validateContract("DECIDE", out);
        expect(res.ok).toBe(false);
        expect(res.errors.join(" ")).toMatch(/maxBullets/);
    });

    it("fails bullet too long", () => {
        const longBullet = "- " + "x".repeat(121); // 121 chars > 120 max
        const res = validateContract("DECIDE", longBullet);
        expect(res.ok).toBe(false);
        expect(res.errors.join(" ")).toMatch(/too long/);
    });

    it("fails when DECIDE has no bullets", () => {
        const out = "This is plain text without bullets.";
        const res = validateContract("DECIDE", out);
        expect(res.ok).toBe(false);
        expect(res.errors.join(" ")).toMatch(/must contain at least 1 bullet/);
    });

    it("passes valid DOCUMENT output", () => {
        const out = `S: Reports lateral knee pain with prolonged walking; cycling ok.
O: Mild lateral tenderness; step-down reproduces pain.
A: Likely ITB overload; no red flags.
P: Load mod + hip control; follow-up in 1 week.`;

        const res = validateContract("DOCUMENT", out);
        expect(res.ok).toBe(true);
    });

    it("fails DOCUMENT when exceeding max chars", () => {
        const longOut = "x".repeat(901); // 901 chars > 900 max
        const res = validateContract("DOCUMENT", longOut);
        expect(res.ok).toBe(false);
        expect(res.errors.join(" ")).toMatch(/maxTotalChars/);
    });
});
