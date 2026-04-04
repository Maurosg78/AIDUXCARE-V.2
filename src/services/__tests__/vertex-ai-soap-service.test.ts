import { describe, it, expect } from 'vitest';
import { normalizeSpanishObjectiveField, parseConsiderationsFromResponse } from '../vertex-ai-soap-service';
import { ensureSpanishClinicalText } from '@/utils/normalizers/es/ensureSpanishClinicalText';

describe('parseConsiderationsFromResponse', () => {
  it('merges wrapped bullet lines before sanitizing', () => {
    const rawResponse = [
      '• Disminución del dolor de 5 a',
      '3/10 observada.',
      '• La trayectoria general muestra una mejora.',
      '• Alta confianza en la tendencia de mejora observada.',
    ].join('\n');

    const parsedConsiderations = parseConsiderationsFromResponse(rawResponse);

    expect(parsedConsiderations).toEqual([
      'Disminución del dolor de 5 a 3/10 observada.',
      'La trayectoria general muestra una mejora.',
      'Alta confianza en la tendencia de mejora observada.',
    ]);
  });

  it('preserves a truncated pain line pattern for downstream repair', () => {
    const rawResponse = [
      '• El puntaje de dolor ha disminuido de 5 a',
      '• La trayectoria general muestra una mejora.',
    ].join('\n');

    const parsedConsiderations = parseConsiderationsFromResponse(rawResponse);

    expect(parsedConsiderations).toEqual([
      'El puntaje de dolor ha disminuido de 5 a',
      'La trayectoria general muestra una mejora.',
    ]);
  });
});

describe('normalizeSpanishObjectiveField', () => {
  it('keeps objective strictly objective when no new measurements were recorded', () => {
    const normalizedObjective = normalizeSpanishObjectiveField(
      'No se registraron nuevas medidas objetivas hoy. Observaciones del médico sobre la radiografía: fractura estable, ligera separación en el hueso estiloides cubital.'
    );

    expect(normalizedObjective).toBe('No se registraron nuevas medidas objetivas hoy.');
  });
});

describe('ensureSpanishClinicalText', () => {
  it('normalizes anatomical and mixed-language terminology for Spain', () => {
    const normalizedSubjective = ensureSpanishClinicalText('Dolor en hueso estiloides cubital.');
    const normalizedPlan = ensureSpanishClinicalText('Strength & Conditioning y home exercise program.');

    expect(normalizedSubjective).toContain('apófisis estiloides del cúbito');
    expect(normalizedPlan).toContain('fuerza y acondicionamiento');
    expect(normalizedPlan).toContain('programa de ejercicios en casa');
  });
});
