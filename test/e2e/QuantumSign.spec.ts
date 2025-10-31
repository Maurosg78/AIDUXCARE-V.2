import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { QuantumSignService } from "../../src/services/QuantumSignService";

describe("🔐 QuantumSignService — Post-Quantum Seal", () => {
  const outputDir = path.join(process.cwd(), "output");
  it("✅ should generate quantum_signatures.json", () => {
    const result = QuantumSignService.generate();
    expect(result.verified).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "quantum_signatures.json"))).toBe(true);
  });
});
