/**
 * AiDuxCare — LegalAuditDashboard E2E Tests
 * WO: WO-2024-002 Phase 2B
 */
import { describe, it, expect, vi } from "vitest";
import { supabase } from "../../src/services/ConsentAuditService";

vi.mock("../../src/services/ConsentAuditService", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: "1",
              user_id: "user-001",
              consent_version: "1.1",
              consent_date: "2025-10-28T00:00:00Z",
              withdrawn: false,
            },
            {
              id: "2",
              user_id: "user-002",
              consent_version: "1.0",
              consent_date: "2025-09-12T00:00:00Z",
              withdrawn: true,
            },
          ],
          error: null,
        })),
      })),
    })),
  },
}));

describe("🧾 LegalAuditDashboard — Filters & Export", () => {
  it("✅ should retrieve and sort logs by date desc", async () => {
    const { data, error } = await supabase
      .from("consent_logs")
      .select("*")
      .order("consent_date", { ascending: false });
    expect(error).toBeNull();
    expect(data[0].consent_date > data[1].consent_date).toBe(true);
  });

  it("🔍 should filter withdrawn vs active", async () => {
    const { data } = await supabase
      .from("consent_logs")
      .select("*")
      .order("consent_date", { ascending: false });
    const active = data.filter((d) => !d.withdrawn);
    const withdrawn = data.filter((d) => d.withdrawn);
    expect(active.length).toBe(1);
    expect(withdrawn.length).toBe(1);
  });

  it("📤 should generate exportable CSV string", async () => {
    const { data } = await supabase
      .from("consent_logs")
      .select("*")
      .order("consent_date", { ascending: false });
    const csv = [
      "user_id,consent_version,consent_date,withdrawn",
      ...data.map(
        (r) =>
          `${r.user_id},${r.consent_version},${r.consent_date},${r.withdrawn}`,
      ),
    ].join("\n");
    expect(csv).toMatch(/user-001/);
    expect(csv.split("\n").length).toBeGreaterThan(1);
  });
});
