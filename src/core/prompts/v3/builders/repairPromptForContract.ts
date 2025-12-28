/**
 * Repair Prompt for Contract
 * 
 * Generates a repair prompt when contract validation fails.
 * Instructs the model to rewrite output to comply with contract rules.
 */

import type { Intent } from "../types/intent";

export function repairPromptForContract(args: {
  intent: Intent;
  contractErrors: string[];
  previousOutput: string;
}): string {
  const errors = args.contractErrors.slice(0, 6).join(" | ");
  const prev = (args.previousOutput ?? "").slice(0, 1200);

  return [
    `Rewrite your previous output to strictly comply with the ${args.intent} contract.`,
    `Hard rules:`,
    `- Return ONLY bullet lines starting with "- "`,
    `- 4–6 bullets total`,
    `- Max 120 characters per bullet`,
    `- No disclaimers, no "AI talk", no apologies`,
    `Validation errors to fix: ${errors}`,
    ``,
    `Previous output (do not repeat verbatim unless compliant):`,
    prev,
  ].join("\n");
}

