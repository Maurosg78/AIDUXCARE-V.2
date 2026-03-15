const FORBIDDEN_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'working diagnosis', regex: /working diagnosis/i },
  { label: 'recommended treatment', regex: /recommended treatment/i },
  { label: 'treatment recommendation', regex: /treatment recommendation/i },
  { label: 'indicated therapy', regex: /indicated therapy/i },
  { label: 'clinically significant improvement', regex: /clinically significant improvement/i },
  { label: 'diagnóstico generado', regex: /diagn[oó]stico generado/i },
  { label: 'tratamiento recomendado', regex: /tratamiento recomendado/i },
  { label: 'mejor[ií]a cl[ií]nica significativa', regex: /mejor[ií]a cl[ií]nica significativa/i },
  { label: 'AI recommends', regex: /\bAI recommends\b/i },
  { label: 'system suggests', regex: /\bsystem suggests\b/i },
];

export function hasRegulatoryForbiddenLanguage(value: string | undefined): boolean {
  if (!value) return false;
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.regex.test(value));
}

export function logRegulatoryLanguageWarnings(
  source: string,
  fields: Record<string, string | undefined>
): void {
  const warnings: { field: string; phrase: string }[] = [];

  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(value)) {
        warnings.push({ field, phrase: pattern.label });
      }
    }
  }

  if (warnings.length > 0 && typeof console !== 'undefined' && console.warn) {
    console.warn('[REGULATORY_LANGUAGE_WARNING]', {
      source,
      warnings,
    });
  }
}

