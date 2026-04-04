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
    expect(derived.inClinic).toContain('terapia manual');
    expect(derived.homeProgram).toContain('Home stretches');
  });

  it('normalizes markdown and mixed-language plan text into structured sections', () => {
    const planRaw = `**TRATAMIENTO EN CLÍNICA:** - Ejercicios de Strength & Conditioning supervisados para mejorar fuerza y ROM. - Ejercicios assitidos de flexibilización y extensión de muñeca y mano.

**PROGRAMA DE EJERCICIOS EN CASA (HEP):** - Ejercicios activos asistidos de ROM para muñeca y dedos, 3x/día. - Desensibilización de la cicatriz quirúrgica.`;

    const derived = derivePlanFromText(planRaw);

    expect(derived.inClinic).toContain('Ejercicios de fuerza y acondicionamiento supervisados para mejorar fuerza y ROM');
    expect(derived.inClinic).toContain('Ejercicios asistidos de flexibilización y extensión de muñeca y mano');
    expect(derived.homeProgram).toContain('Ejercicios activos asistidos de ROM para muñeca y dedos, 3x/día');
    expect(derived.homeProgram).toContain('Desensibilización de la cicatriz quirúrgica');
  });
});
