/**
 * Build Prompt v3
 * 
 * Main builder for Prompt Brain v3 prompts.
 * Currently implements DECIDE + follow-up + optimized path.
 */

import type { IntentFlags } from "../types/intent";
import { DECIDE_TREATMENT_FOLLOWUP_LOW } from "../templates/decide/DECIDE_TREATMENT_FOLLOWUP_LOW";

export function buildPromptV3(args: {
  flags: IntentFlags;
  context: {
    chiefComplaint?: string;
    keyFindings?: string[];
    painScale?: string;
  };
}): string {
  // For WO-02 we only implement one concrete path:
  // DECIDE + follow-up + optimized
  return DECIDE_TREATMENT_FOLLOWUP_LOW(args);
}

