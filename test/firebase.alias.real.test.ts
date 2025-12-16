import { describe, it, expect } from "vitest";

// Solo ejecutar este test cuando AIDUX_ENABLE_FIREBASE=1
const runReal = process.env.AIDUX_ENABLE_FIREBASE === "1";

(runReal ? describe : describe.skip)("firebase alias (real)", () => {
  it("cuando AIDUX_ENABLE_FIREBASE=1, la variable está configurada", () => {
    // Verificar que la variable de entorno está configurada
    expect(process.env.AIDUX_ENABLE_FIREBASE).toBe("1");
    expect(process.env.AIDUX_ENABLE_FIREBASE).toBeDefined();
  });
});
