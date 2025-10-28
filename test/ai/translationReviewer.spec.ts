import { describe, it, expect } from "vitest";
import { reviewTranslations } from "../../src/ai/translationReviewer";

describe("AI Feedback Loop — Translation Reviewer", () => {
  it("should detect issues and return a review score", () => {
    const result = reviewTranslations();
    console.log("Review report:", result);
    expect(result.score).toBeGreaterThan(80);
  });
});
