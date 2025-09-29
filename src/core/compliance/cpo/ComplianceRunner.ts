// Market: CA | Language: en-CA
// Aidux North — Regulatory-to-Code Compliance Runner (CPO)

import type { CpoComplianceInput } from "./CpoRules";
import { CpoRules } from "./CpoRules";

export class ComplianceRunner {
  /**
   * Asserts CPO compliance. Throws Error with detailed messages on failure.
   */
  static assertCpoCompliance(input: CpoComplianceInput): void {
    const result = CpoRules.runCpoRules(input);
    if (!result.success) {
      const msg =
        "CPO Compliance failed:\\n" +
        result.errors.map((e, i) => `${i + 1}. ${e}`).join("\\n");
      throw new Error(msg);
    }
  }
}

export default ComplianceRunner;
