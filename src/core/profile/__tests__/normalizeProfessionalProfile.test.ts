/**
 * Unit tests for professional profile normalization.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePracticeAreas,
  normalizeTechniques,
  getPracticeAreaPromptHint,
  CURRENT_PRACTICE_AREAS_VOCAB_VERSION,
  CURRENT_TECHNIQUES_VOCAB_VERSION,
} from '../normalizeProfessionalProfile';

describe('normalizePracticeAreas', () => {
  it('normalizes single area by code', () => {
    const { matched, unmatched } = normalizePracticeAreas('msk');
    expect(matched).toHaveLength(1);
    expect(matched[0]).toEqual({ code: 'msk', label: 'Musculoskeletal (MSK)', raw: 'msk' });
    expect(unmatched).toHaveLength(0);
  });

  it('normalizes by alias (accented)', () => {
    const { matched, unmatched } = normalizePracticeAreas('piso pélvico');
    expect(matched).toHaveLength(1);
    expect(matched[0].code).toBe('pelvic');
    expect(matched[0].label).toBe('Pelvic Health');
    expect(unmatched).toHaveLength(0);
  });

  it('normalizes multiple areas comma-separated', () => {
    const { matched, unmatched } = normalizePracticeAreas('msk, pelvic health, paediatrics');
    expect(matched).toHaveLength(3);
    expect(matched.map((m) => m.code)).toEqual(['msk', 'pelvic', 'paediatrics']);
    expect(unmatched).toHaveLength(0);
  });

  it('normalizes array of codes', () => {
    const { matched } = normalizePracticeAreas(['msk', 'neuro', 'general']);
    expect(matched).toHaveLength(3);
    expect(matched.map((m) => m.code)).toEqual(['msk', 'neuro', 'general']);
  });

  it('deduplicates same area', () => {
    const { matched } = normalizePracticeAreas('msk, musculoskeletal, MSK');
    expect(matched).toHaveLength(1);
    expect(matched[0].code).toBe('msk');
  });

  it('returns unmatched for unknown input and adds fallback entry to matched', () => {
    const { matched, unmatched } = normalizePracticeAreas('vestibular rehab');
    expect(unmatched).toEqual(['vestibular rehab']);
    expect(matched).toHaveLength(1);
    expect(matched[0]).toEqual({
      code: 'other',
      label: 'Other',
      raw: 'vestibular rehab',
    });
  });

  it('handles mixed matched and unmatched: matched includes fallback for unknown', () => {
    const { matched, unmatched } = normalizePracticeAreas('msk, something-unknown, pelvic');
    expect(unmatched).toEqual(['something-unknown']);
    expect(matched).toHaveLength(3);
    expect(matched[0].code).toBe('msk');
    expect(matched[1].code).toBe('other');
    expect(matched[1].label).toBe('Other');
    expect(matched[1].raw).toBe('something-unknown');
    expect(matched[2].code).toBe('pelvic');
  });

  it('handles empty input', () => {
    const { matched, unmatched } = normalizePracticeAreas('');
    expect(matched).toHaveLength(0);
    expect(unmatched).toHaveLength(0);
  });

  it('handles oncology alias', () => {
    const { matched } = normalizePracticeAreas('cancer rehab');
    expect(matched).toHaveLength(1);
    expect(matched[0].code).toBe('oncology');
  });
});

describe('normalizeTechniques', () => {
  it('normalizes by code', () => {
    const { matched, unmatched } = normalizeTechniques('mckenzie');
    expect(matched).toHaveLength(1);
    expect(matched[0].code).toBe('mckenzie');
    expect(matched[0].label).toBe('McKenzie Method');
    expect(unmatched).toHaveLength(0);
  });

  it('normalizes by alias (dry needling / punción seca)', () => {
    const { matched, unmatched } = normalizeTechniques('punción seca');
    expect(matched).toHaveLength(1);
    expect(matched[0].code).toBe('dry-needling');
    expect(unmatched).toHaveLength(0);
  });

  it('normalizes multiple techniques', () => {
    const { matched } = normalizeTechniques('manual therapy, dry needling, pilates');
    expect(matched).toHaveLength(3);
    expect(matched.map((m) => m.code)).toEqual(['manual-therapy', 'dry-needling', 'pilates']);
  });

  it('returns unmatched for unknown technique and adds fallback to matched', () => {
    const { matched, unmatched } = normalizeTechniques('unknown technique xyz');
    expect(unmatched).toContain('unknown technique xyz');
    expect(matched).toHaveLength(1);
    expect(matched[0]).toEqual({ code: 'other', label: 'Other', raw: 'unknown technique xyz' });
  });

  it('handles array input', () => {
    const { matched } = normalizeTechniques(['manual-therapy', 'acupuncture']);
    expect(matched).toHaveLength(2);
  });
});

describe('getPracticeAreaPromptHint', () => {
  it('returns hint for pelvic', () => {
    const hint = getPracticeAreaPromptHint('pelvic');
    expect(hint).toContain('function and goals');
  });

  it('returns hint for paediatrics', () => {
    const hint = getPracticeAreaPromptHint('paediatrics');
    expect(hint).toContain('developmental');
  });

  it('returns undefined for area without hint', () => {
    const hint = getPracticeAreaPromptHint('msk');
    expect(hint).toBeUndefined();
  });

  it('returns undefined for unknown code', () => {
    const hint = getPracticeAreaPromptHint('unknown');
    expect(hint).toBeUndefined();
  });
});

describe('vocabulary version', () => {
  it('exports current practice areas version', () => {
    expect(CURRENT_PRACTICE_AREAS_VOCAB_VERSION).toBe(1);
  });

  it('exports current techniques version', () => {
    expect(CURRENT_TECHNIQUES_VOCAB_VERSION).toBe(1);
  });
});
