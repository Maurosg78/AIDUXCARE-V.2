import { describe, it, expect } from "vitest";
import CryptoService from "@/services/CryptoService";

describe("CryptoService", () => {
  it("should expose encrypt and decrypt", () => {
    expect(typeof CryptoService.encrypt).toBe("function");
    expect(typeof CryptoService.decrypt).toBe("function");
  });
});
