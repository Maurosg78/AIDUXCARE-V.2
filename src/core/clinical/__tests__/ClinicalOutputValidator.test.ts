import { describe, it, expect } from 'vitest';
import { validateClinicalOutput } from '../ClinicalOutputValidator';
import type { MedicationMention } from '@/core/ai/extractMedicationMentions';

const baseAnalysis = () => ({
  motivo_consulta: 'Dolor lumbar',
  hallazgos_clinicos: ['Dolor'],
  red_flags: [],
  medicacion_actual: [] as any[],
  adverseDrugReactions: [] as any[],
  antecedentes_medicos: [],
});

const preExtracted = (overrides: Partial<MedicationMention>): MedicationMention => ({
  original_text: 'Janumet 50 y 1000',
  canonical_name: 'Janumet',
  dose: '50/1000',
  frequency: '',
  mention_status: 'current',
  normalized_name: '',
  duration: '',
  active_ingredient: '',
  confidence: 'low',
  requires_review: true,
  source: 'pre_extracted',
  ...overrides,
});

describe('checkPreExtractedMedicationsPreserved — FIX 1', () => {
  it('no emite MED_DROPPED cuando original_text coincide exacto', () => {
    const analysis = baseAnalysis();
    analysis.medicacion_actual = [
      { text: 'Janumet 50 y 1000', medication_data: { original_text: 'Janumet 50 y 1000' } },
    ];
    const result = validateClinicalOutput(analysis as any, [preExtracted({})]);
    expect(result.issues.filter(i => i.code === 'MED_DROPPED_BY_MODEL')).toHaveLength(0);
  });

  it('no emite MED_DROPPED cuando canonical_name coincide con medication_data.canonical_name', () => {
    const analysis = baseAnalysis();
    // Niagara extrajo "Janumet" (sin dosis), con canonical_name "Janumet"
    analysis.medicacion_actual = [
      {
        text: 'Janumet',
        medication_data: {
          original_text: 'Janumet',
          canonical_name: 'Janumet',
        },
      },
    ];
    // Pre-extractor extrajo "Janumet 50 y 1000", también con canonical_name "Janumet"
    const result = validateClinicalOutput(analysis as any, [preExtracted({})]);
    expect(result.issues.filter(i => i.code === 'MED_DROPPED_BY_MODEL')).toHaveLength(0);
  });

  it('no emite MED_DROPPED cuando suggested_name coincide', () => {
    const analysis = baseAnalysis();
    analysis.medicacion_actual = [
      { text: 'Janumet', medication_data: { original_text: 'Janumet' } },
    ];
    const result = validateClinicalOutput(
      analysis as any,
      [preExtracted({ suggested_name: 'Janumet' })],
    );
    expect(result.issues.filter(i => i.code === 'MED_DROPPED_BY_MODEL')).toHaveLength(0);
  });

  it('emite MED_DROPPED cuando no hay ninguna coincidencia', () => {
    const analysis = baseAnalysis();
    analysis.medicacion_actual = [
      { text: 'Ibuprofeno', medication_data: { original_text: 'Ibuprofeno', canonical_name: 'Ibuprofeno' } },
    ];
    const result = validateClinicalOutput(analysis as any, [preExtracted({})]);
    expect(result.issues.filter(i => i.code === 'MED_DROPPED_BY_MODEL')).toHaveLength(1);
  });
});
