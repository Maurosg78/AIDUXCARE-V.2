/**
 * Profession "Other" vocabulary v1
 * When user selects "Other" and types their profession, we normalize to a safe label for prompts.
 * Only curated labels are used in prompts; raw is stored for display/observability.
 */

export interface ProfessionOtherEntry {
  code: string;
  label: string; // Safe for prompt (e.g. "Osteopath")
  aliases: string[];
}

export const PROFESSION_OTHER_VOCAB_V1 = {
  version: 1,
  effectiveDate: '2026-02-15',
  professions: [
    { code: 'osteopath', label: 'Osteopath', aliases: ['osteopath', 'osteopathy', 'osteopata', 'osteópata', 'do'] },
    { code: 'naturopath', label: 'Naturopath', aliases: ['naturopath', 'naturopathy', 'naturopata', 'nd'] },
    { code: 'athletic-therapist', label: 'Athletic Therapist', aliases: ['athletic therapist', 'athletic therapy', 'cat(c)'] },
    { code: 'kinesiologist', label: 'Kinesiologist', aliases: ['kinesiologist', 'kinesiology', 'kinesiologo'] },
    { code: 'exercise-physiologist', label: 'Exercise Physiologist', aliases: ['exercise physiologist', 'cep', 'clinical exercise physiologist'] },
  ] as ProfessionOtherEntry[],
} as const;

function normalizeToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

const aliasMap = new Map<string, string>();
for (const p of PROFESSION_OTHER_VOCAB_V1.professions) {
  aliasMap.set(normalizeToken(p.code), p.label);
  aliasMap.set(normalizeToken(p.label), p.label);
  for (const a of p.aliases) {
    aliasMap.set(normalizeToken(a), p.label);
  }
}

export interface NormalizeProfessionOtherResult {
  /** Safe label for prompt (from vocab or 'Other'); never raw user input */
  labelForPrompt: string;
  /** Original input for storage and display */
  raw: string;
  /** Whether we matched a known profession */
  matched: boolean;
}

/**
 * Normalize "other" profession free text. Returns a safe label for prompts (vocab match or 'Other')
 * and the raw input for storage. Never use raw in prompts.
 */
export function normalizeProfessionOther(input: string): NormalizeProfessionOtherResult {
  const raw = (input || '').trim();
  if (!raw) {
    return { labelForPrompt: 'Other', raw: '', matched: false };
  }
  const key = normalizeToken(raw);
  const label = aliasMap.get(key);
  if (label) {
    return { labelForPrompt: label, raw, matched: true };
  }
  return { labelForPrompt: 'Other', raw, matched: false };
}
