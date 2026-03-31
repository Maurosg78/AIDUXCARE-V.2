import { describe, it, expect } from 'vitest';
import { derivePlanFromText } from '../derivePlanFromText';

describe('derivePlanFromText', () => {
  it('splits Spanish Vertex headers into in-clinic vs HEP', () => {
    const planRaw = `TRATAMIENTO EN CLÍNICA:
- Terapia manual lumbar
- Electroterapia

PROGRAMA DE EJERCICIOS EN CASA:
- Puente glúteo 3x10
- Movilizaciones en casa`;
    const derived = derivePlanFromText(planRaw);
    expect(derived.inClinic).toEqual(['Terapia manual lumbar', 'Electroterapia']);
    expect(derived.homeProgram).toEqual(['Puente glúteo 3x10', 'Movilizaciones en casa']);
  });

  it('splits English structured plan headers', () => {
    const planRaw = `IN-CLINIC TREATMENT:
- Manual therapy

HOME EXERCISE PROGRAM (HEP):
- Home stretches`;
    const derived = derivePlanFromText(planRaw);
    expect(derived.inClinic).toContain('Manual therapy');
    expect(derived.homeProgram).toContain('Home stretches');
  });
});
