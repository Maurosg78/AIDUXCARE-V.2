/**
 * Tests for resolvePromptBrainVersion
 */

import { describe, it, expect } from "vitest";
import { resolvePromptBrainVersion } from "../builders/resolvePromptBrainVersion";

describe("resolvePromptBrainVersion", () => {
  it("returns v3 when query param pb=v3", () => {
    const result = resolvePromptBrainVersion({ search: "?pb=v3" });
    expect(result).toBe("v3");
  });

  it("returns v3 when query param has pb=v3 among others", () => {
    const result = resolvePromptBrainVersion({ search: "?foo=bar&pb=v3&baz=qux" });
    expect(result).toBe("v3");
  });

  it("returns v3 when env variable is v3", () => {
    const result = resolvePromptBrainVersion({ envVersion: "v3" });
    expect(result).toBe("v3");
  });

  it("returns v2 by default", () => {
    const result = resolvePromptBrainVersion({});
    expect(result).toBe("v2");
  });

  it("returns v2 when query param is not v3", () => {
    const result = resolvePromptBrainVersion({ search: "?pb=v2" });
    expect(result).toBe("v2");
  });

  it("prioritizes query param over env", () => {
    const result = resolvePromptBrainVersion({ search: "?pb=v3", envVersion: "v2" });
    expect(result).toBe("v3");
  });
});

