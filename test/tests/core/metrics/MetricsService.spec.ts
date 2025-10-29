import { describe, it, expect } from "vitest";
import MetricsService from "@/core/metrics/MetricsService";

describe("MetricsService", () => {
  it("should initialize without errors", () => {
    expect(MetricsService).toBeDefined();
  });
});
