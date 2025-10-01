import type { CpoContext } from "./CpoRules";
import { runCpoRules } from "./CpoRules";

/** Throws on non-compliance. */
export async function assertCpoCompliance(ctx: CpoContext): Promise<void> {
  const result = runCpoRules(ctx);
  if (!result.ok) {
    const err = new Error("CPO compliance failed");
    (err as any).failures = result.failures;
    throw err;
  }
}
