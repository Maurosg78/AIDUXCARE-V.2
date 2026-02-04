/**
 * Practice Areas Vocabulary v1
 * Canonical codes, labels, aliases and prompt hints for professional profile normalization.
 * @see docs/reports/PROPUESTA_PERFIL_PROFESIONAL_CAPTURA_Y_NORMALIZACION.md
 */

export interface PracticeAreaEntry {
  code: string;
  label: string;
  aliases: string[];
  promptHint?: string;
}

export const PRACTICE_AREAS_VOCAB_V1 = {
  version: 1,
  effectiveDate: '2026-02-15',
  areas: [
    {
      code: 'msk',
      label: 'Musculoskeletal (MSK)',
      aliases: [
        'msk', 'musculoskeletal', 'musculoesqueletico', 'musculoesquelético',
        'ortho', 'orthopedic', 'ortopedia', 'sports', 'sport', 'sports rehab',
      ],
    },
    {
      code: 'neuro',
      label: 'Neurological',
      aliases: ['neuro', 'neurological', 'neurologico', 'neurológico', 'neuro rehab'],
    },
    {
      code: 'cardio',
      label: 'Cardiorespiratory',
      aliases: ['cardio', 'cardiorespiratory', 'cardiorespiratorio', 'pulm', 'pulmonary', 'respiratory'],
    },
    {
      code: 'pelvic',
      label: 'Pelvic Health',
      aliases: [
        'pelvic', 'pelvic health', 'pelvic floor', 'piso pelvico', 'piso pélvico',
        'suelo pelvico', 'suelo pélvico', 'pelvic floor health',
      ],
      promptHint: 'Focus on function and goals; avoid detailed intimate anatomy.',
    },
    {
      code: 'geriatrics',
      label: 'Geriatrics',
      aliases: ['geriatrics', 'geriatric', 'geriatrico', 'geriátrico', 'older adults'],
    },
    {
      code: 'paediatrics',
      label: 'Paediatrics',
      aliases: ['paediatrics', 'pediatrics', 'pediatric', 'pediatria', 'pediatría', 'paediatric', 'kids', 'children'],
      promptHint: 'Consider developmental milestones, caregiver context, and age-appropriate language.',
    },
    {
      code: 'oncology',
      label: 'Oncology Rehabilitation',
      aliases: ['oncology', 'oncologia', 'oncología', 'cancer', 'cancer rehab', 'oncology rehab'],
      promptHint: 'Focus on function, fatigue, tolerance; avoid prognostic language.',
    },
    {
      code: 'general',
      label: 'General Practice',
      aliases: ['general', 'general practice', 'generalist', 'mixed', 'varied'],
    },
  ] as PracticeAreaEntry[],
} as const;

export const CURRENT_PRACTICE_AREAS_VOCAB_VERSION = PRACTICE_AREAS_VOCAB_V1.version;
export type PracticeAreaCode = typeof PRACTICE_AREAS_VOCAB_V1.areas[number]['code'];
