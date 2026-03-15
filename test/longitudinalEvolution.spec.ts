import { describe, it, expect } from 'vitest';
import type { ClinicalFactSetLike } from '@/core/synthesis/synthesizeClinicalNarrative';
import {
  buildLongitudinalEvolutionFromFacts,
  type LongitudinalEvolutionSummary,
} from '@/core/synthesis/LongitudinalEvolution';

function makeFacts(painText: string): ClinicalFactSetLike {
  return {
    context: {
      patientName: 'Test',
    },
    facts: {
      subjectiveText: `Dolor referido ${painText}`,
      assessmentText: '',
      objectiveText: '',
      planText: '',
      pain: {
        cursoTextoLibre: `Dolor referido de ${painText}`,
      },
      mobility: [],
      tests: [],
      treatments: {},
      plan: {},
    },
  };
}

describe('Longitudinal evolution from ClinicalFactSetLike series', () => {
  it('detecta mejoría clara (7/10 → 4/10 → 2/10)', () => {
    const series: ClinicalFactSetLike[] = [
      makeFacts('7/10'),
      makeFacts('4/10'),
      makeFacts('2/10'),
    ];

    const evo: LongitudinalEvolutionSummary = buildLongitudinalEvolutionFromFacts(series);

    expect(evo.hasSeries).toBe(true);
    expect(evo.direction).toBe('improved');
    expect(evo.painSeries).toEqual([7, 4, 2]);
    expect(evo.baselinePain).toBe(7);
    expect(evo.currentPain).toBe(2);
    expect(evo.changeMagnitude).toBe(-5);
    expect(evo.clinicallyMeaningful).toBe(true);
    expect(evo.trendConfidence).toBe('medium');
    expect(evo.narrativeText).toContain('Disminución progresiva del dolor reportado desde 7/10');
  });

  it('detecta empeoramiento (3/10 → 5/10 → 7/10)', () => {
    const series: ClinicalFactSetLike[] = [
      makeFacts('3/10'),
      makeFacts('5/10'),
      makeFacts('7/10'),
    ];

    const evo = buildLongitudinalEvolutionFromFacts(series);

    expect(evo.direction).toBe('worsened');
    expect(evo.baselinePain).toBe(3);
    expect(evo.currentPain).toBe(7);
    expect(evo.changeMagnitude).toBe(4);
    expect(evo.clinicallyMeaningful).toBe(true);
    expect(evo.trendConfidence).toBe('medium');
    expect(evo.narrativeText).toContain(
      'Aumento progresivo del dolor desde 3/10 en la visita inicial a 7/10 en la última sesión registrada.'
    );
  });

  it('detecta estabilidad global (5/10 → 5/10 → 5/10)', () => {
    const series: ClinicalFactSetLike[] = [
      makeFacts('5/10'),
      makeFacts('5/10'),
      makeFacts('5/10'),
    ];

    const evo = buildLongitudinalEvolutionFromFacts(series);

    expect(evo.direction).toBe('stable');
    expect(evo.baselinePain).toBe(5);
    expect(evo.currentPain).toBe(5);
    expect(evo.changeMagnitude).toBe(0);
    expect(evo.clinicallyMeaningful).toBe(false);
    expect(evo.trendConfidence).toBe('medium');
    expect(evo.narrativeText).toContain('Intensidad de dolor globalmente estable');
  });

  it('detecta patrón mixto (7/10 → 4/10 → 6/10)', () => {
    const series: ClinicalFactSetLike[] = [
      makeFacts('7/10'),
      makeFacts('4/10'),
      makeFacts('6/10'),
    ];

    const evo = buildLongitudinalEvolutionFromFacts(series);

    expect(evo.direction).toBe('mixed');
    expect(evo.baselinePain).toBe(7);
    expect(evo.currentPain).toBe(6);
    expect(evo.changeMagnitude).toBe(-1);
    expect(evo.clinicallyMeaningful).toBe(false);
    expect(evo.trendConfidence).toBe('low');
    expect(evo.narrativeText).toContain(
      'Evolución del dolor con variaciones entre sesiones (7 → 4 → 6/10), sin tendencia clara de mejoría sostenida.'
    );
  });

  it('no genera serie si hay menos de 2 valores válidos', () => {
    const series: ClinicalFactSetLike[] = [makeFacts('7/10'), makeFacts('sin escala numerica')];

    const evo = buildLongitudinalEvolutionFromFacts(series);

    expect(evo.hasSeries).toBe(false);
  });
});

