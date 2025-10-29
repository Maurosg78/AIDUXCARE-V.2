// tests/core/metrics/MetricsService.spec.ts
import { describe, it, expect, vi } from "vitest";

import { MetricsService, SupabasePort, LangfusePort } from "@/services/MetricsService";

describe("MetricsService", () => {
  it("persists and tracks suggestion events", async () => {
    const insert = vi.fn().mockResolvedValue(undefined);
    const track = vi.fn();
    const svc = new MetricsService(
      { insert } as unknown as SupabasePort,
      { track } as unknown as LangfusePort
    );

    await svc.recordSuggestionEvent({
      suggestionId: "s1",
      visitId: "v1",
      type: "accepted",
      atISO: new Date().toISOString(),
    });

    expect(insert).toHaveBeenCalledWith(
      "suggestion_events",
      expect.objectContaining({
        suggestion_id: "s1",
        visit_id: "v1",
        event_type: "accepted",
      })
    );
    expect(track).toHaveBeenCalledWith("suggestion_event", expect.any(Object));
  });
});
