/**
 * ClinicalOutputValidator
 *
 * §1.6 ENGINEERING.md — Context Engineering, regla 2:
 * "Todo comportamiento crítico requiere guard determinista post-proceso."
 *
 * Este módulo es el guard post-modelo. Verifica que el output del LLM cumple
 * invariantes clínicos antes de llegar al fisioterapeuta.
 *
 * No modifica el output — detecta y registra discrepancias para trazabilidad.
 * El fisioterapeuta siempre tiene la última palabra (§1.2 ENGINEERING.md).
 */

import type { MedicationMention } from '@/core/ai/extractMedicationMentions';

export type ValidationSeverity = 'critical' | 'warning' | 'info';

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  message: string;
  field?: string;
  context?: string;
};

export type ClinicalValidationResult = {
  passed: boolean;
  issues: ValidationIssue[];
  promptVersion?: string;
  modelOutputFieldCount?: number;
};

type NormalizedAnalysis = {
  medicacion_actual?: unknown[];
  adverseDrugReactions?: unknown[];
  antecedentes_medicos?: unknown[];
  motivo_consulta?: unknown;
  red_flags?: unknown[];
  [key: string]: unknown;
};

// §1.6 regla 3: todo output clínico debe llevar atribución de fuente
// This set tracks which fields must be present before SOAP / clinical use
const REQUIRED_FIELDS: ReadonlySet<string> = new Set([
  'motivo_consulta',
  'medicacion_actual',
  'antecedentes_medicos',
]);

/**
 * Checks that medications pre-extracted before the main model call
 * were not silently dropped by the model output.
 *
 * §1.6 ENGINEERING.md: "los prompts no son enforcement de seguridad — son instrucciones"
 * This is the enforcement layer.
 */
const checkPreExtractedMedicationsPreserved = (
  preExtracted: MedicationMention[],
  normalized: NormalizedAnalysis
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (preExtracted.length === 0) return issues;

  const medicacion = normalized.medicacion_actual ?? [];
  const adverse = normalized.adverseDrugReactions ?? [];

  const allMedTexts = new Set<string>();
  const allCanonicals = new Set<string>();

  for (const med of medicacion) {
    if (typeof med === 'string') {
      allMedTexts.add(med.toLowerCase().trim());
    } else if (med && typeof med === 'object') {
      const medRecord = med as Record<string, unknown>;
      const medData = medRecord.medication_data as Record<string, unknown> | undefined;
      const text =
        String(medData?.original_text || medRecord.text || '').toLowerCase().trim();
      if (text) allMedTexts.add(text);
      const canonical = String(medData?.canonical_name || '').toLowerCase().trim();
      if (canonical) allCanonicals.add(canonical);
    }
  }

  for (const adv of adverse) {
    if (typeof adv === 'string') {
      allMedTexts.add(adv.toLowerCase().trim());
    }
  }

  for (const item of preExtracted) {
    // stopped_adverse items go to adverseDrugReactions — already covered above
    const textKey = item.original_text.toLowerCase().trim();
    const foundDirectly = allMedTexts.has(textKey);

    // Also check for suggested_name match (approved correction)
    const suggestedKey = (item.suggested_name ?? '').toLowerCase().trim();
    const foundViaSuggestion = suggestedKey !== '' && allMedTexts.has(suggestedKey);

    // Also check canonical_name — covers merge path where original_text differs
    const itemCanonical = (item.canonical_name ?? '').toLowerCase().trim();
    const foundByCanonical = itemCanonical !== '' && allCanonicals.has(itemCanonical);

    if (!foundDirectly && !foundViaSuggestion && !foundByCanonical) {
      issues.push({
        code: 'MED_DROPPED_BY_MODEL',
        severity: 'warning',
        field: 'medicacion_actual',
        message: `Pre-extracted medication not found in model output: "${item.original_text}"`,
        context: `mention_status: ${item.mention_status}`,
      });
    }
  }

  return issues;
};

/**
 * Checks that required clinical fields are present and non-empty.
 */
const checkRequiredFields = (normalized: NormalizedAnalysis): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = normalized[field];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      issues.push({
        code: 'REQUIRED_FIELD_EMPTY',
        severity: 'info',
        field,
        message: `Required field "${field}" is empty in model output.`,
      });
    }
  }

  return issues;
};

/**
 * Checks that no medication was replaced by a forbidden generic category.
 * §1.6 ENGINEERING.md: prevents "pastillas para la diabetes" replacing "Janumet 50/1000"
 */
const checkNoGenericReplacement = (normalized: NormalizedAnalysis): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const genericPattern = /^(medicamento|medicación|medicacion|pastillas?|comprimidos?)\s+para\b/i;

  const medicacion = normalized.medicacion_actual ?? [];
  for (const med of medicacion) {
    const text =
      typeof med === 'string'
        ? med
        : String(
            (med as Record<string, unknown>)?.text ||
              ((med as Record<string, unknown>)?.medication_data as Record<string, unknown>)?.original_text ||
              ''
          );

    if (genericPattern.test(text.trim())) {
      issues.push({
        code: 'GENERIC_CATEGORY_DETECTED',
        severity: 'warning',
        field: 'medicacion_actual',
        message: `Generic category found instead of specific medication name: "${text}"`,
      });
    }
  }

  return issues;
};

/**
 * Main validator. Call after normalizeVertexResponse and before UI render.
 *
 * @param normalized - output from normalizeClinicalResponse
 * @param preExtractedMedications - from extractMedicationMentions (before main call)
 * @param promptVersion - embedded in logs for traceability (§1.7.2)
 */
export const validateClinicalOutput = (
  normalized: NormalizedAnalysis,
  preExtractedMedications: MedicationMention[],
  promptVersion?: string
): ClinicalValidationResult => {
  const allIssues: ValidationIssue[] = [
    ...checkRequiredFields(normalized),
    ...checkPreExtractedMedicationsPreserved(preExtractedMedications, normalized),
    ...checkNoGenericReplacement(normalized),
  ];

  const hasCritical = allIssues.some((issue) => issue.severity === 'critical');
  const hasWarnings = allIssues.some((issue) => issue.severity === 'warning');

  if (hasWarnings || hasCritical) {
    // §3.5 ENGINEERING.md: log codes only — no PHI in log messages
    const codes = allIssues.map((issue) => issue.code);
    console.warn('[ClinicalOutputValidator] Issues detected:', codes, '| prompt:', promptVersion);
  }

  const modelOutputFieldCount = Object.keys(normalized).length;

  return {
    passed: !hasCritical,
    issues: allIssues,
    promptVersion,
    modelOutputFieldCount,
  };
};
