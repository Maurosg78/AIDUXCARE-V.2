/**
 * Techniques Vocabulary v1
 * Canonical codes and labels for techniques (used in professional profile).
 * @see docs/reports/PROPUESTA_PERFIL_PROFESIONAL_CAPTURA_Y_NORMALIZACION.md
 */

export interface TechniqueEntry {
  code: string;
  label: string;
  aliases: string[];
}

export const TECHNIQUES_VOCAB_V1 = {
  version: 1,
  effectiveDate: '2026-02-15',
  techniques: [
    { code: 'manual-therapy', label: 'Manual Therapy', aliases: ['manual therapy', 'manual', 'manipulation', 'manipulacion'] },
    { code: 'dry-needling', label: 'Dry Needling / IMS', aliases: ['dry needling', 'dry-needling', 'ims', 'puncion seca', 'punción seca', 'functional dry needling'] },
    { code: 'k-tape', label: 'Kinesiotaping', aliases: ['k-tape', 'kinesiotaping', 'k tape', 'taping'] },
    { code: 'motor-control', label: 'Motor Control Training', aliases: ['motor control', 'motor control training'] },
    { code: 'mckenzie', label: 'McKenzie Method', aliases: ['mckenzie', 'mckenzie method', 'mckenzie md', 'mdt'] },
    { code: 'mckenzie-md', label: 'McKenzie MDT', aliases: ['mckenzie mdt', 'mckenzie-md', 'mdt'] },
    { code: 'acupuncture', label: 'Acupuncture', aliases: ['acupuncture', 'acupuntura'] },
    { code: 'mulligan', label: 'Mulligan Concept', aliases: ['mulligan', 'mulligan concept'] },
    { code: 'pilates', label: 'Clinical Pilates', aliases: ['pilates', 'clinical pilates', 'pilates clinico'] },
    { code: 'yoga-therapy', label: 'Yoga Therapy', aliases: ['yoga', 'yoga therapy', 'therapeutic yoga'] },
    { code: 'strength-conditioning', label: 'Strength & Conditioning', aliases: ['strength', 'conditioning', 'strength and conditioning', 'strength & conditioning'] },
    { code: 'sports-rehab', label: 'Sports Rehabilitation', aliases: ['sports rehab', 'sports rehabilitation', 'return to sport'] },
    { code: 'concussion', label: 'Concussion Management', aliases: ['concussion', 'concussion management'] },
    { code: 'vestibular', label: 'Vestibular Rehabilitation', aliases: ['vestibular', 'vestibular rehab', 'vestibular rehabilitation'] },
    { code: 'chronic-pain', label: 'Chronic Pain Management', aliases: ['chronic pain', 'chronic pain management', 'pain management'] },
  ] as TechniqueEntry[],
} as const;

export const CURRENT_TECHNIQUES_VOCAB_VERSION = TECHNIQUES_VOCAB_V1.version;
