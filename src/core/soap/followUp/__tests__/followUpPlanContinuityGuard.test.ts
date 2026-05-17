import { describe, expect, it } from 'vitest';
import { guardFollowUpPlanContinuity, hasOrphanPriorPlanReference } from '../followUpPlanContinuityGuard';

describe('follow-up plan continuity guard', () => {
  it('removes orphan Spanish references to a previous plan while preserving concrete plan items', () => {
    const guarded = guardFollowUpPlanContinuity(
      [
        'El plan previo se mantiene, con énfasis en las limitaciones observadas y la progresión lenta.',
        'TRATAMIENTO EN CLÍNICA:',
        '- Tecarterapia lumbar y progresión McKenzie según tolerancia.',
        'HEP:',
        '- Esfinge con flexión de cadera 3x10 diario.',
      ].join('\n')
    );

    expect(guarded).not.toMatch(/plan previo/i);
    expect(guarded).toContain('TRATAMIENTO EN CLÍNICA:');
    expect(guarded).toContain('Tecarterapia lumbar');
    expect(guarded).toContain('HEP:');
    expect(guarded).toContain('Esfinge');
  });

  it('detects orphan English and Spanish prior-plan references', () => {
    expect(hasOrphanPriorPlanReference('El plan anterior se mantiene.')).toBe(true);
    expect(hasOrphanPriorPlanReference('The previous plan is maintained.')).toBe(true);
    expect(hasOrphanPriorPlanReference('TRATAMIENTO EN CLÍNICA:\n- Tecarterapia lumbar.')).toBe(false);
  });

  it('uses an explicit not-documented fallback when only the orphan reference exists', () => {
    const guarded = guardFollowUpPlanContinuity('El plan previo se mantiene.');

    expect(guarded).toContain('TRATAMIENTO EN CLÍNICA:');
    expect(guarded).toContain('No documentado en la entrada clínica de hoy.');
    expect(guarded).toContain('HEP:');
  });
});
