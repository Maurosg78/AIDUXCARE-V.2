/**
 * Contract Runtime Enforcement
 * 
 * Applies contract validation and provides repair prompt if validation fails.
 * Caller is responsible for retry policy (max 1 retry) and fallback logic.
 */

import type { Intent } from "../types/intent";
import { validateContract } from "./contractValidator";
import { repairPromptForContract } from "../builders/repairPromptForContract";

export type RuntimeEnforcementResult =
  | { ok: true; text: string; retries: number }
  | { ok: false; retries: number; errors: string[]; repairPrompt: string };

/**
 * Enforce contract or build repair prompt
 * 
 * @param args.intent - Intent type (DECIDE, DOCUMENT, etc.)
 * @param args.outputText - Output text to validate
 * @param args.retriesSoFar - Number of retries already attempted (0 for first pass)
 * @returns RuntimeEnforcementResult with validation status and repair prompt if needed
 */
export function enforceContractOrBuildRepair(args: {
  intent: Intent;
  outputText: string;
  retriesSoFar: number; // 0 for first pass
}): RuntimeEnforcementResult {
  const res = validateContract(args.intent, args.outputText);

  if (res.ok) {
    return { ok: true, text: args.outputText, retries: args.retriesSoFar };
  }

  // Only one retry allowed (policy enforced by caller; still provide repair prompt)
  const repairPrompt = repairPromptForContract({
    intent: args.intent,
    contractErrors: res.errors,
    previousOutput: args.outputText,
  });

  return { ok: false, retries: args.retriesSoFar, errors: res.errors, repairPrompt };
}

