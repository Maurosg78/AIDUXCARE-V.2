/**
 * Professional profile normalization: free text → canonical codes + labels.
 * Used at onboarding submit to build practiceAreas and techniques for Firestore.
 * @see docs/reports/PROPUESTA_PERFIL_PROFESIONAL_CAPTURA_Y_NORMALIZACION.md
 */

import {
  PRACTICE_AREAS_VOCAB_V1,
  CURRENT_PRACTICE_AREAS_VOCAB_VERSION,
  type PracticeAreaEntry,
} from '../../config/vocabularies/practiceAreasV1';
import {
  TECHNIQUES_VOCAB_V1,
  CURRENT_TECHNIQUES_VOCAB_VERSION,
  type TechniqueEntry,
} from '../../config/vocabularies/techniquesV1';

export interface NormalizedPracticeArea {
  code: string;
  label: string;
  raw?: string;
}

export interface NormalizedTechnique {
  code: string;
  label: string;
  raw?: string;
}

export interface NormalizePracticeAreasResult {
  matched: NormalizedPracticeArea[];
  unmatched: string[];
}

export interface NormalizeTechniquesResult {
  matched: NormalizedTechnique[];
  unmatched: string[];
}

/** Normalize string for matching: lowercase, no accents, trim, collapse spaces */
function normalizeToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

/** Split input by common delimiters into tokens */
function tokenize(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => tokenize(String(item)));
  }
  const str = String(input).trim();
  if (!str) return [];
  const parts = str.split(/[,/]|\s+and\s+|\s+y\s+/i).map((p) => p.trim()).filter(Boolean);
  const tokens: string[] = [];
  for (const p of parts) {
    tokens.push(...p.split(/\s+and\s+|\s+y\s+/i).map((t) => t.trim()).filter(Boolean));
  }
  return [...new Set(tokens)];
}

function buildAliasMap<T extends { code: string; label: string; aliases: string[] }>(
  entries: readonly T[]
): Map<string, { code: string; label: string }> {
  const map = new Map<string, { code: string; label: string }>();
  for (const entry of entries) {
    const code = entry.code;
    const label = entry.label;
    map.set(normalizeToken(code), { code, label });
    for (const a of entry.aliases) {
      map.set(normalizeToken(a), { code, label });
    }
  }
  return map;
}

const practiceAreasAliasMap = buildAliasMap(PRACTICE_AREAS_VOCAB_V1.areas);
const techniquesAliasMap = buildAliasMap(TECHNIQUES_VOCAB_V1.techniques);

/** Fallback when no vocabulary match: code/label for prompts; raw stored for observability only (never in prompt). */
const FALLBACK_PRACTICE_AREA = { code: 'other', label: 'Other' } as const;
const FALLBACK_TECHNIQUE = { code: 'other', label: 'Other' } as const;

/**
 * Normalize practice areas input (free text or existing codes) to matched + unmatched.
 * Unmatched tokens are added as fallback entries (code: 'other', label: 'Other', raw: token)
 * so the profile and prompts always have a value; raw is never injected into prompts.
 */
export function normalizePracticeAreas(
  input: string | string[]
): NormalizePracticeAreasResult {
  const tokens = tokenize(input);
  const matched: NormalizedPracticeArea[] = [];
  const seen = new Set<string>();
  const unmatched: string[] = [];

  for (const raw of tokens) {
    const key = normalizeToken(raw);
    if (!key) continue;
    const found = practiceAreasAliasMap.get(key);
    if (found && !seen.has(found.code)) {
      seen.add(found.code);
      matched.push({ code: found.code, label: found.label, raw });
    } else if (!found) {
      unmatched.push(raw);
      matched.push({
        code: FALLBACK_PRACTICE_AREA.code,
        label: FALLBACK_PRACTICE_AREA.label,
        raw,
      });
    }
  }

  return { matched, unmatched };
}

/**
 * Normalize techniques input (free text or existing codes) to matched + unmatched.
 * Unmatched tokens are added as fallback (code: 'other', label: 'Other', raw: token).
 */
export function normalizeTechniques(input: string | string[]): NormalizeTechniquesResult {
  const tokens = tokenize(input);
  const matched: NormalizedTechnique[] = [];
  const seen = new Set<string>();
  const unmatched: string[] = [];

  for (const raw of tokens) {
    const key = normalizeToken(raw);
    if (!key) continue;
    const found = techniquesAliasMap.get(key);
    if (found && !seen.has(found.code)) {
      seen.add(found.code);
      matched.push({ code: found.code, label: found.label, raw });
    } else if (!found) {
      unmatched.push(raw);
      matched.push({
        code: FALLBACK_TECHNIQUE.code,
        label: FALLBACK_TECHNIQUE.label,
        raw,
      });
    }
  }

  return { matched, unmatched };
}

/**
 * Get prompt hint for a practice area code (curated text only).
 */
export function getPracticeAreaPromptHint(code: string): string | undefined {
  const entry = (PRACTICE_AREAS_VOCAB_V1.areas as PracticeAreaEntry[]).find(
    (a) => a.code === code
  );
  return entry?.promptHint;
}

export {
  CURRENT_PRACTICE_AREAS_VOCAB_VERSION,
  CURRENT_TECHNIQUES_VOCAB_VERSION,
};
