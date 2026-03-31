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
});
