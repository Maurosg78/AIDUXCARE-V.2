import { describe, it, expect } from "vitest";
import * as validationIndex from "../../src/validation";
import * as errors from "../../src/validation/errors";

describe("exports sanity", () => {
  it("validation barrel exporta algo", () => {
    expect(Object.keys(validationIndex).length).toBeGreaterThan(0);
  });
  it("errors exporta constantes/funciones", () => {
    expect(Object.keys(errors).length).toBeGreaterThan(0);
  });
});
