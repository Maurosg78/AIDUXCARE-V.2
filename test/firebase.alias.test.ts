import { describe, it, expect } from "vitest";
import { isFirebaseEnabled } from "../src/lib/firebase";

describe("firebase alias", () => {
  it("está habilitado en producción", () => {
    // Cambiado para reflejar que Firebase está activo
    expect(isFirebaseEnabled).toBe(true);
  });
});
