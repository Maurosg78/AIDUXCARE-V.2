const ORPHAN_PRIOR_PLAN_PATTERNS = [
  /\b(?:el\s+)?plan\s+previo\s+se\s+mantiene\b/i,
  /\b(?:el\s+)?plan\s+anterior\s+se\s+mantiene\b/i,
  /\bmantener\s+(?:el\s+)?plan\s+(?:previo|anterior)\b/i,
  /\bcontinuar\s+con\s+(?:el\s+)?plan\s+(?:previo|anterior)\b/i,
  /\bprevious\s+plan\s+(?:is\s+)?(?:maintained|continued)\b/i,
  /\bcontinue\s+(?:the\s+)?previous\s+plan\b/i,
];

function removeMatchingSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .filter((segment) => !ORPHAN_PRIOR_PLAN_PATTERNS.some((pattern) => pattern.test(segment)))
    .join('\n');
}

/**
 * Prevents clinically unauditable follow-up plans such as
 * "the previous plan is maintained" without restating what is actually planned.
 */
export function guardFollowUpPlanContinuity(plan: string): string {
  const cleaned = removeMatchingSentences(plan ?? '').trim();

  if (cleaned.length > 0) {
    return cleaned;
  }

  return [
    'TRATAMIENTO EN CLÍNICA:',
    '- No documentado en la entrada clínica de hoy.',
    'HEP:',
    '- No documentado en la entrada clínica de hoy.',
  ].join('\n');
}

export function hasOrphanPriorPlanReference(plan: string): boolean {
  return ORPHAN_PRIOR_PLAN_PATTERNS.some((pattern) => pattern.test(plan ?? ''));
}
