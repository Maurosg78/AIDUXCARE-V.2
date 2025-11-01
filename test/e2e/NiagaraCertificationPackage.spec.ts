import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { NiagaraCertificationPackageService } from "../../src/services/NiagaraCertificationPackageService";

describe("🍁 NiagaraCertificationPackageService — v1.0-CA", () => {
  const certDir = path.join(process.cwd(), "niagara_cert_package");

  it("✅ should build cert package with required artifacts", () => {
    const result = NiagaraCertificationPackageService.build();
    expect(result.manifest.status).toBe("CERT_READY");
    expect(fs.existsSync(path.join(certDir, "README_CA.md"))).toBe(true);
  });
});
