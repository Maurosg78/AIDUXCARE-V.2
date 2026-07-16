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

  it('merges five orphaned parenthetical notes into their preceding HEP items', () => {
    const persistedLines = [
      'Hielo local 10 minutos',
      '(Manejo de dolor e inflamación)',
      'Movilidad activa de hombro',
      '(Sin superar el umbral de dolor)',
      'Isométricos de rotación externa',
      '(Tres series de diez repeticiones)',
      'Deslizamientos sobre mesa',
      '(Realizar dos veces al día).',
      'Automasaje periarticular',
      '(Según tolerancia)',
    ];
    const homeProgramText = persistedLines.join('\n');
    const planInput = { homeProgramText };
    const derived = derivePlanFromText(planInput);

    expect(derived.homeProgram).toEqual([
      'Hielo local 10 minutos (Manejo de dolor e inflamación)',
      'Movilidad activa de hombro (Sin superar el umbral de dolor)',
      'Isométricos de rotación externa (Tres series de diez repeticiones)',
      'Deslizamientos sobre mesa (Realizar dos veces al día)',
      'Automasaje periarticular (Según tolerancia)',
    ]);
  });

  it('preserves five HEP items already formatted as one exercise-note line', () => {
    const persistedLines = [
      'Hielo local: manejo de dolor e inflamación',
      'Movilidad activa de hombro: sin superar el umbral de dolor',
      'Isométricos de rotación externa: tres series de diez repeticiones',
      'Deslizamientos sobre mesa: realizar dos veces al día',
      'Automasaje periarticular: según tolerancia',
    ];
    const homeProgramText = persistedLines.join('\n');
    const planInput = { homeProgramText };
    const derived = derivePlanFromText(planInput);

    expect(derived.homeProgram).toEqual(persistedLines);
  });

  it('reconstructs Maria Dolores persisted HEP as five items instead of ten', () => {
    const persistedLines = [
      'Hielo en RI, calor musculatura periarticular',
      '(Manejo dolor/inflamación)',
      'Movilidad activa y autoasistida de RI',
      '(Mantener rango sin dolor)',
      'Isométricos de rotadores',
      '(Progresión según tolerancia)',
      'Ejercicios de control escapular',
      '(Priorizar calidad del movimiento)',
      'Automasaje de musculatura periarticular',
      '(Aplicación domiciliaria)',
    ];
    const homeProgramText = persistedLines.join('\n');
    const planInput = { homeProgramText };
    const derived = derivePlanFromText(planInput);

    expect(derived.homeProgram).toEqual([
      'Hielo en RI, calor musculatura periarticular (Manejo dolor/inflamación)',
      'Movilidad activa y autoasistida de RI (Mantener rango sin dolor)',
      'Isométricos de rotadores (Progresión según tolerancia)',
      'Ejercicios de control escapular (Priorizar calidad del movimiento)',
      'Automasaje de musculatura periarticular (Aplicación domiciliaria)',
    ]);
  });

  it('preserves the Wibbi line format', () => {
    const homeProgramText = 'Wibbi: movilidad guiada según tolerancia';
    const planInput = { homeProgramText };
    const derived = derivePlanFromText(planInput);

    expect(derived.homeProgram).toEqual([homeProgramText]);
  });
});
