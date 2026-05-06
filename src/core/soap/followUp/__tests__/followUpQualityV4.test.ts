import { describe, expect, it } from 'vitest';
import { validateSOAP } from '../../../../utils/soapValidation';
import { buildFollowUpPromptV3 } from '../buildFollowUpPromptV3';

const syntheticShoulderBaselineSOAP = {
  subjective: 'Dolor de hombro derecho asociado a actividad de gimnasio.',
  objective: 'Limitación ROM hombro derecho y desequilibrio escapular.',
  assessment: 'Patrones consistentes con tendinopatía bicipital y supraespinoso derecho.',
  plan: [
    'TRATAMIENTO EN CLÍNICA:',
    '- Terapia manual hombro anterior',
    '- Trabajo rotadores externos/serrato',
    'HEP:',
    '- Fortalecimiento manguito rotador/escápula',
    '- Registro dolor/funcionalidad',
  ].join('\n'),
  encounterId: 'ryan-initial',
  date: new Date('2026-04-20T12:00:00.000Z'),
};

const syntheticSnowAngelsClinicalUpdate = [
  'Paciente en condiciones similares, pero refiere picos de dolor menores.',
  'Llama la atención la gran restricción de movilidad al realizar snow angels, con frustración.',
  'Hoy comenzó trabajo específico para serrato anterior y trapecio inferior.',
  'Inició trabajo con bandas elásticas y lo tolera bien.',
  'El ejercicio snow angels le cuesta mucho y no logra llegar a la mitad del recorrido con espalda contra la muralla.',
].join(' ');

function countSnowAngels(text: string): number {
  const matches = text.match(/snow angels/gi);
  return matches?.length ?? 0;
}

describe('follow-up SOAP quality V4 contract', () => {
  it('adds semantic distribution and deduplication rules to the Ryan fixture prompt', () => {
    const prompt = buildFollowUpPromptV3({
      baselineSOAP: syntheticShoulderBaselineSOAP,
      clinicalUpdate: syntheticSnowAngelsClinicalUpdate,
      inClinicItems: [
        'Trabajo específico serrato anterior y trapecio inferior',
        'Bandas elásticas para rotadores externos',
      ],
      homeProgram: [
        'Fortalecimiento manguito rotador/escápula',
        'Registro dolor/funcionalidad',
      ],
      jurisdiction: 'ES-ES',
    });

    expect(prompt).toContain('today\'s clinical update and confirmed checklist > baseline SOAP context > previous plan continuity');
    expect(prompt).toContain('S (Subjective): Patient\'s reported experience TODAY ONLY.');
    expect(prompt).toContain('O (Objective): Clinician\'s observations TODAY ONLY.');
    expect(prompt).toContain('P (Plan): Next actions ONLY — no evaluation content.');
    expect(prompt).toContain('No repitas el mismo hallazgo clínico en S/O/A/P.');
  });

  it('defines an acceptable Ryan/snow angels SOAP with no more than two mentions', () => {
    const soap = {
      subjective: 'Refiere picos de dolor menores y frustración por limitación funcional al movimiento sobre pared.',
      objective: 'Bandas elásticas bien toleradas. En snow angels no alcanza mitad del recorrido con espalda contra la muralla.',
      assessment: 'Progreso parcial por menor dolor, con limitación funcional persistente de movilidad escapulohumeral.',
      plan: [
        'Continuar progresión según tolerancia y control escapular.',
        'TRATAMIENTO EN CLÍNICA:',
        '- Progresar serrato anterior/trapecio inferior',
        '- Ajustar rotadores externos con banda',
        'HEP:',
        '- Sin cambios documentados hoy',
      ].join('\n'),
    };
    const fullNote = [
      soap.subjective,
      soap.objective,
      soap.assessment,
      soap.plan,
    ].join('\n');
    const snowAngelsCount = countSnowAngels(fullNote);

    expect(snowAngelsCount).toBeLessThanOrEqual(2);
    expect(soap.subjective).not.toMatch(/se inició|bandas|tolerad[ao]|ROM/i);
    expect(soap.objective).not.toMatch(/progreso parcial|valoraci[oó]n|favorable/i);
    expect(soap.plan).not.toMatch(/Fortalecimiento manguito rotador\/escápula|Registro dolor\/funcionalidad/i);
  });

  it('flags redundant snow angels mentions across SOAP sections', () => {
    const redundantSoap = {
      subjective: 'Paciente refiere frustración por snow angels.',
      objective: 'Restricción severa en snow angels durante observación.',
      assessment: 'Limitación significativa persistente en snow angels.',
      plan: 'TRATAMIENTO EN CLÍNICA:\n- Progresar control escapular\nHEP:\n- Sin cambios documentados hoy',
    };
    const validation = validateSOAP(redundantSoap);

    expect(validation.repetitionCheck.hasRepetition).toBe(true);
    expect(validation.repetitionCheck.crossSectionRepeatedTerms).toContain('snow angels');
  });
});
