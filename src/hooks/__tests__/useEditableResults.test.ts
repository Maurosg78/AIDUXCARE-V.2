import { describe, expect, it } from 'vitest';
import { applyMedicationSuggestion } from '../useEditableResults';

const makeMedicationEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'med-001',
  type: 'medication',
  text: 'medx 25',
  medication_data: {
    original_text: 'medx 25',
    normalized_name: '',
    confidence: 'low',
    requires_review: true,
    mention_status: 'current',
    suggested_name: 'MedCorrect',
    dose: '25',
    frequency: 'daily',
    duration: '',
    ...overrides,
  },
});

describe('applyMedicationSuggestion — pure helper for handleAcceptMedicationSuggestion', () => {
  it('A: preserves original_text after accepting suggestion', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.original_text).toBe('medx 25');
  });

  it('B: preserves dose after accepting suggestion', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.dose).toBe('25');
  });

  it('C: preserves frequency after accepting suggestion', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.frequency).toBe('daily');
  });

  it('D: sets normalized_name to suggested_name', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.normalized_name).toBe('MedCorrect');
  });

  it('E: sets selected_suggestion to suggested_name', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.selected_suggestion).toBe('MedCorrect');
  });

  it('F: sets suggestion_status to accepted_by_clinician', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.suggestion_status).toBe('accepted_by_clinician');
  });

  it('G: sets requires_review to false', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].medication_data.requires_review).toBe(false);
  });

  it('H: display text includes suggested_name and dose', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].text).toContain('MedCorrect');
    expect(result[0].text).toContain('25');
  });

  it('I: is a no-op when suggested_name is absent', () => {
    const entities = [makeMedicationEntity({ suggested_name: '' })];
    const result = applyMedicationSuggestion(entities, 'med-001');
    // Returns same array reference — no mutation
    expect(result).toBe(entities);
    expect(result[0].medication_data.suggestion_status).toBeUndefined();
  });

  it('does not duplicate dose when dose already present in suggested_name (exact)', () => {
    const entities = [makeMedicationEntity({ suggested_name: 'MedCorrect 25', dose: '25' })];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].text).toBe('MedCorrect 25');
  });

  it('does not duplicate dose when dose is "25mg" and suggested_name has "25"', () => {
    const entities = [makeMedicationEntity({ suggested_name: 'MedCorrect 25', dose: '25mg' })];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].text).toBe('MedCorrect 25');
  });

  it('does not duplicate dose when dose is "25 mg" and suggested_name has "25"', () => {
    const entities = [makeMedicationEntity({ suggested_name: 'MedCorrect 25', dose: '25 mg' })];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].text).toBe('MedCorrect 25');
  });

  it('does not duplicate dose when dose is "25 MG" (uppercase) and suggested_name has "25"', () => {
    const entities = [makeMedicationEntity({ suggested_name: 'MedCorrect 25', dose: '25 MG' })];
    const result = applyMedicationSuggestion(entities, 'med-001');
    expect(result[0].text).toBe('MedCorrect 25');
  });

  it('preserves original_text from entity.text when medication_data.original_text is absent', () => {
    const entity = {
      id: 'med-001',
      type: 'medication',
      text: 'misheard text from entity',
      medication_data: {
        normalized_name: '',
        confidence: 'low',
        requires_review: true,
        mention_status: 'current',
        suggested_name: 'MedCorrect',
        dose: '50',
        frequency: 'daily',
      },
    };
    const result = applyMedicationSuggestion([entity], 'med-001');
    expect(result[0].medication_data.original_text).toBe('misheard text from entity');
  });

  it('is a no-op when entity id does not match', () => {
    const entities = [makeMedicationEntity()];
    const result = applyMedicationSuggestion(entities, 'nonexistent-id');
    expect(result).toBe(entities);
  });
});
