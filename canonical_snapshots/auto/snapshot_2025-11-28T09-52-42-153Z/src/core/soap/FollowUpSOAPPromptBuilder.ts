/**
 * Optimized Follow-up SOAP Prompt Builder
 * 
 * Streamlined prompt builder for follow-up visits targeting 70% token reduction
 * while maintaining clinical quality standards.
 * 
 * @compliance PHIPA compliant
 * @audit ISO 27001 A.8.2.3 (Handling of assets)
 */

import type { SOAPContext } from './SOAPContextBuilder';
import type { SOAPPromptOptions } from './SOAPPromptFactory';

/**
 * Builds optimized follow-up SOAP prompt (70% token reduction target)
 * 
 * Key optimizations:
 * - Shorter instructions (focus on essentials)
 * - Minimal examples
 * - Reduced context repetition
 * - Focus on changes/progress only
 */
export function buildOptimizedFollowUpPrompt(
  context: SOAPContext,
  options?: SOAPPromptOptions
): string {
  const previousContext = options?.previousVisitContext?.[0]; // Only last visit
  
  const prompt = `Generate FOLLOW-UP SOAP note for Ontario physiotherapist. Focus on CHANGES since last visit.

ROLE: Document changes/progress. Use "Patterns consistent with..." language. Canadian English (en-CA).

FORMAT:
- S: Changes since last visit, treatment response (MAX 150 chars)
- O: Re-assessment findings with numbers showing change (MAX 250 chars)
- A: Progress assessment, treatment effectiveness (MAX 200 chars)
- P: Structured format:
  - Interventions: [modifications]
  - Modalities: [or None]
  - Home Exercises: [or None]
  - Patient Education: [or None]
  - Goals: [updated]
  - Follow-up: [next appointment]
  - Next Session Focus: [focus]
  (MAX 400 chars)

TARGET: Total <800 chars (vs 1200 for initial). Focus on CHANGES and NUMBERS.

${previousContext ? `LAST VISIT: ${previousContext.assessment}\nPlan: ${previousContext.plan}\n` : ''}TRANSCRIPT:
${context.transcript || 'No transcript'}

KEY CHANGES:
${context.analysis.keyFindings.slice(0, 3).join(', ') || 'No changes'}

PHYSICAL EXAM (structured):
${JSON.stringify(context.physicalEvaluation.tests.slice(0, 10), null, 1)}

OUTPUT JSON:
{
  "subjective": "Changes since last visit, treatment response. MAX 150 chars.",
  "objective": "Re-assessment with numbers showing change. MAX 250 chars.",
  "assessment": "Progress assessment, treatment effectiveness. MAX 200 chars.",
  "plan": "Structured format with sections. MAX 400 chars."
}

RULES:
- No repetition between sections
- Use numbers to show change (e.g., "Pain 3/10 vs 6/10 previously")
- Focus on clinical significance only
- Canadian terminology`;

  return prompt;
}

/**
 * Estimates token count for prompt (rough approximation)
 * 
 * @param prompt Prompt text
 * @returns Estimated token count (1 token ≈ 4 characters)
 */
export function estimatePromptTokens(prompt: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(prompt.length / 4);
}

/**
 * Compares token usage between optimized and standard prompts
 * 
 * @param optimizedPrompt Optimized prompt
 * @param standardPrompt Standard prompt
 * @returns Comparison metrics
 */
export function compareTokenUsage(
  optimizedPrompt: string,
  standardPrompt: string
): {
  optimizedTokens: number;
  standardTokens: number;
  reduction: number;
  reductionPercent: number;
} {
  const optimizedTokens = estimatePromptTokens(optimizedPrompt);
  const standardTokens = estimatePromptTokens(standardPrompt);
  const reduction = standardTokens - optimizedTokens;
  const reductionPercent = standardTokens > 0 
    ? Math.round((reduction / standardTokens) * 100) 
    : 0;

  return {
    optimizedTokens,
    standardTokens,
    reduction,
    reductionPercent,
  };
}


