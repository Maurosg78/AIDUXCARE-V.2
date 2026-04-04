import { describe, it, expect } from 'vitest';
import { parsePlanToFocusItems } from '../parsePlanToFocus';

describe('parsePlanToFocusItems', () => {
  it('returns only in-clinic items for mixed ES plan (no HEP in checklist)', () => {
    const planRaw = `TRATAMIENTO EN CLÍNICA:
- En consulta A

PROGRAMA DE EJERCICIOS EN CASA:
- En casa B`;
    const items = parsePlanToFocusItems(planRaw);
    expect(items.map((i) => i.label)).toEqual(['En consulta A']);
    expect(items.some((i) => i.label.includes('En casa B'))).toBe(false);
  });

  it('recovers in-clinic items from mixed markdown plan text', () => {
    const planRaw = `**TRATAMIENTO EN CLÍNICA:** - Ejercicios de Strength & Conditioning supervisados para mejorar fuerza y ROM. - Ejercicios assitidos de flexibilización y extensión de muñeca y mano.

**PROGRAMA DE EJERCICIOS EN CASA:** - Educación sobre manejo del dolor y edema.`;

    const items = parsePlanToFocusItems(planRaw);

    expect(items.map((item) => item.label)).toEqual([
      'Ejercicios de fuerza y acondicionamiento supervisados para mejorar fuerza y ROM',
      'Ejercicios asistidos de flexibilización y extensión de muñeca y mano',
    ]);
  });
});
