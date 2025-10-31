/**
 * AiDuxCare — RegulatoryReplayVerificationService E2E
 * Phase 10B (CPO Ontario Regulatory Replay)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RegulatoryReplayVerificationService } from "../../src/services/RegulatoryReplayVerificationService";

describe("🧩 RegulatoryReplayVerificationService — CPO Ontario Verification", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should replay verification and generate summary", () => {
    const ok = RegulatoryReplayVerificationService.replayAll();
    expect(ok).toBe(true);

    const log = path.join(outputDir, "regulator_replay_log.json");
    const html = path.join(outputDir, "verification_summary.html");
    expect(fs.existsSync(log)).toBe(true);
    expect(fs.existsSync(html)).toBe(true);

    const data = JSON.parse(fs.readFileSync(log, "utf8"));
    expect(data.results.length).toBeGreaterThan(5);
  });
});
