/**
 * AiDuxCare — SupabaseMetricsPublisherService E2E
 * Phase 13D (CI/CD Metrics Publishing to Supabase)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { SupabaseMetricsPublisherService } from "../../src/services/SupabaseMetricsPublisherService";

describe("📊 SupabaseMetricsPublisherService — CI/CD Metrics Mock Publisher", () => {
  const outputDir = path.join(process.cwd(), "output");

  it("✅ should generate payload and ack with valid signatures", () => {
    const ok = SupabaseMetricsPublisherService.publish();
    expect(ok).toBe(true);

    const payload = path.join(outputDir, "supabase_metrics_payload.json");
    const ack = path.join(outputDir, "metrics_publish_ack.json");

    expect(fs.existsSync(payload)).toBe(true);
    expect(fs.existsSync(ack)).toBe(true);

    const data = JSON.parse(fs.readFileSync(payload, "utf8"));
    expect(data.verified).toBe(true);
  });
});
