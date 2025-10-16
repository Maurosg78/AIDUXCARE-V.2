import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ClinicalNoteSchema } from "../../src/validation/notes.schema";
import { AuditLogSchema } from "../../src/validation/audit-logs.schema";
import { ConsentSchema } from "../../src/validation/consents.schema";

function loadSeed() {
  const p = path.resolve("test-data/seed.json");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

describe("Validation runner (seed samples)", () => {
  const seed = loadSeed();

  it("clinical_notes del seed son válidas", () => {
    const notes = seed.clinical_notes ?? [];
    const results = notes.map((n: unknown) => ClinicalNoteSchema.safeParse(n));
    const invalid = results
      .map((r, i) => ({ idx: i, r }))
      .filter(({ r }) => !r.success);

    if (invalid.length) {
      console.error("❌ Invalid clinical_notes:", invalid.map(v => v.idx));
      invalid.forEach(v => console.error(JSON.stringify(v.r, null, 2)));
    }

    expect(invalid.length).toBe(0);
  });

  it("audit_logs del seed son válidos", () => {
    const logs = seed.audit_logs ?? [];
    const results = logs.map((a: unknown) => AuditLogSchema.safeParse(a));
    const invalid = results
      .map((r, i) => ({ idx: i, r }))
      .filter(({ r }) => !r.success);

    if (invalid.length) {
      console.error("❌ Invalid audit_logs:", invalid.map(v => v.idx));
      invalid.forEach(v => console.error(JSON.stringify(v.r, null, 2)));
    }

    expect(invalid.length).toBe(0);
  });

  it("consents del seed son válidos", () => {
    const consents = seed.consents ?? [];
    const results = consents.map((c: unknown) => ConsentSchema.safeParse(c));
    const invalid = results
      .map((r, i) => ({ idx: i, r }))
      .filter(({ r }) => !r.success);

    if (invalid.length) {
      console.error("❌ Invalid consents:", invalid.map(v => v.idx));
      invalid.forEach(v => console.error(JSON.stringify(v.r, null, 2)));
    }

    expect(invalid.length).toBe(0);
  });
});
