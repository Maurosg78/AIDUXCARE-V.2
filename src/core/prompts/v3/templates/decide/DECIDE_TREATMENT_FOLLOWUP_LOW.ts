/**
 * DECIDE Treatment Follow-up Low Template
 * 
 * Generates a DECIDE prompt for follow-up visits with optimized analysis level.
 */

import type { IntentFlags } from "../../types/intent";

export function DECIDE_TREATMENT_FOLLOWUP_LOW(input: {
  flags: IntentFlags;
  context: {
    chiefComplaint?: string;
    keyFindings?: string[];
    painScale?: string;
  };
}): string {
  const cc = input.context.chiefComplaint ?? "follow-up symptoms";
  const findings = input.context.keyFindings?.slice(0, 3).join("; ") ?? "no key findings provided";

  return [
    `You are writing DECIDE output for a physiotherapist in Canada (en-CA).`,
    `Rules: 4–6 bullets, max 120 chars each, no disclaimers, no AI talk, actions first.`,
    `Case: ${cc}. Findings: ${findings}. Pain: ${input.context.painScale ?? "n/a"}.`,
    `Return ONLY bullet lines starting with "- ".`,
  ].join("\n");
}

