import { describe, it, expect } from "vitest";
import { FlexibleTimestamp } from "../../src/validation/timestamps";

describe("FlexibleTimestamp", () => {
  it("acepta Firestore {_seconds,_nanoseconds}", () => {
    const r = FlexibleTimestamp.safeParse({_seconds: 1734200000, _nanoseconds: 0});
    expect(r.success).toBe(true);
  });
  it("acepta {seconds,nanoseconds}", () => {
    const r = FlexibleTimestamp.safeParse({seconds: 1734200000, nanoseconds: 0});
    expect(r.success).toBe(true);
  });
  it("acepta ISO 8601", () => {
    const r = FlexibleTimestamp.safeParse("2025-10-14T10:00:00Z");
    expect(r.success).toBe(true);
  });
  it("acepta epoch ms y s", () => {
    expect(FlexibleTimestamp.safeParse(1734200000000).success).toBe(true); // ms
    expect(FlexibleTimestamp.safeParse(1734200000).success).toBe(true);    // s
  });
  it("rechaza objetos mal formados", () => {
    // falta nanoseconds
    expect(FlexibleTimestamp.safeParse({seconds: 1}).success).toBe(false);
    // tipos inválidos
    expect(FlexibleTimestamp.safeParse({seconds: "x", nanoseconds: 0}).success).toBe(false);
  });
});
