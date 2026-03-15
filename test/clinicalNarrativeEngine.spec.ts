import { describe, it, expect } from 'vitest';
import {
  synthesizeClinicalNarrative,
  type ClinicalFactSetLike,
} from '@/core/synthesis/synthesizeClinicalNarrative';
import {
  buildReferralReportEsSections,
  renderReferralReportEsText,
  type ReferralReportData,
} from '@/core/reports/referralReportEs';

function buildReferralDataFromSummary(
  facts: ClinicalFactSetLike,
  summary: ReturnType<typeof synthesizeClinicalNarrative>
): ReferralReportData {
  const { context, facts: f } = facts;
  return {
    paciente: {
      nombre: context.patientName,
      edad: context.patientAge,
      idHistoria: context.patientId,
    },
    episodio: {
      motivoPrincipal: summary.mainProblem,
      fechaInicio: context.episodeStartDate,
    },
    diagnosticoFuncional: summary.mainProblem,
    evolucionTextoLibre:
      summary.evolution.redFlagText ||
      summary.evolution.painChangeText ||
      summary.evolution.functionChangeText ||
      summary.evolution.evolutionHighlight,
    tratamiento: {
      ejercicios: summary.treatmentSummary.inClinic,
      tecnicasManuales: [],
      educacion: summary.treatmentSummary.homeProgram,
    },
    plan: {
      horizonteTiempo: summary.planSummary.followUpHorizon,
      textoLibre: summary.planSummary.mainPlanText,
    },
  };
}

function extractEpisodeLine(report: string): string {
  const lines = report.split('\n').map((l) => l.trim()).filter(Boolean);
  // We expect something like:
  // Paciente: ...
  // Episodio: ...
  const episodioLine = lines.find((l) => l.startsWith('Episodio:'));
  return episodioLine ?? '';
}

describe('Clinical narrative engine - canonical scenarios', () => {
  it('stable lumbar case produces correct main problem', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Marta Ruiz',
        patientId: 'P-123',
        visitType: 'initial',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor lumbar mecánico de 2 semanas de evolución, peor al permanecer sentada. No irradiado a miembros inferiores. Sin antecedentes de cirugía lumbar.',
        assessmentText:
          'Lumbalgia mecánica subaguda sin signos de radiculopatía. Sin banderas rojas actuales.',
        treatments: {
          ejercicios: ['Ejercicio terapéutico de control lumbopélvico'],
          tecnicasManuales: [],
          educacion: ['Ejercicios de movilidad lumbar en casa'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 3-4 semanas.',
          textoLibre: 'Reevaluar en 3-4 semanas.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);
    const episodio = extractEpisodeLine(report);

    expect(summary.mainProblem).toContain('Lumbalgia mecánica subaguda');
    expect(episodio).toContain('Lumbalgia mecánica subaguda');
  });

  it('improvement case highlights pain decrease in evolution', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Marta Ruiz',
        patientId: 'P-123',
        visitType: 'initial',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor lumbar de 4 semanas de evolución, inicialmente intenso (7/10), actualmente 3/10 en reposo y 5/10 al esfuerzo.',
        assessmentText:
          'Lumbalgia mecánica subaguda en mejoría clínica, sin signos de radiculopatía.',
        treatments: {
          ejercicios: ['Progresión de ejercicio terapéutico lumbopélvico'],
          tecnicasManuales: [],
          educacion: ['Ejercicios diarios de movilidad lumbar'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 3-4 semanas o antes si empeora.',
          textoLibre: 'Reevaluar en 3-4 semanas o antes si empeora.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);

    expect(summary.evolution.direction).toBe('improved');
    expect(report).toContain('Disminución del dolor de');
  });

  it('worsening case highlights pain increase in evolution', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Marta Ruiz',
        patientId: 'P-123',
        visitType: 'initial',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor lumbar de 3 semanas de evolución, inicialmente 4/10, actualmente 7/10 con irradiación a miembro inferior derecho.',
        assessmentText:
          'Lumbociatalgia derecha en probable contexto mecánico. Empeoramiento sintomático.',
        treatments: {
          ejercicios: ['Ejercicio terapéutico en rango sin dolor'],
          tecnicasManuales: [],
          educacion: ['Pausas activas frecuentes'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 1-2 semanas.',
          textoLibre: 'Reevaluar en 1-2 semanas.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);

    expect(summary.evolution.direction).toBe('worsened');
    expect(report).toContain('Aumento del dolor de 4/10 a 7/10');
  });

  it('redflag case produces clinical alert section', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Marta Ruiz',
        patientId: 'P-123',
        visitType: 'initial',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor lumbar de inicio reciente con adormecimiento en zona perineal y dificultad para iniciar la micción.',
        assessmentText:
          'Síntomas compatibles con posible síndrome de cauda equina. Dolor lumbar con déficit neurológico progresivo y alteración esfinteriana incipiente.',
        treatments: {
          ejercicios: ['No continuar tratamiento fisioterápico en esta sesión'],
          tecnicasManuales: [],
          educacion: ['Indicado acudir a urgencias hospitalarias hoy mismo'],
        },
        plan: {
          horizonteTiempo: 'A la espera de valoración médica urgente.',
          textoLibre: 'A la espera de valoración médica urgente.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);

    expect(summary.evolution.direction).toBe('redflag');
    expect(report).toContain('Alerta clínica:');
    expect(report).toContain('compromiso neurológico grave');
  });

  it('cervical mechanical pain stable case sets mainProblem from assessment', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Juan Pérez',
        patientId: 'P-456',
        visitType: 'initial',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor cervical mecánico de 3 semanas de evolución, peor al final de la jornada frente al ordenador.',
        assessmentText:
          'Cervicalgia mecánica sin irradiación a miembros superiores. Sin signos neurológicos asociados.',
        treatments: {
          ejercicios: ['Ejercicios de movilidad cervical y estabilización'],
          tecnicasManuales: [],
          educacion: ['Pausas activas y ergonomía en el puesto de trabajo'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 3-4 semanas.',
          textoLibre: 'Reevaluar en 3-4 semanas.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);
    const episodio = extractEpisodeLine(report);

    expect(summary.mainProblem).toContain('Cervicalgia mecánica');
    expect(episodio).toContain('Cervicalgia mecánica');
  });

  it('post-surgical shoulder case reflects improvement in narrative', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Laura Gómez',
        patientId: 'P-789',
        visitType: 'followup',
        sessionSubtype: 'postsurgical',
      },
      facts: {
        subjectiveText:
          'Dolor de hombro derecho tras reparación de manguito rotador. Inicialmente 6/10, actualmente 3/10 al movimiento. Mejor tolerancia a las AVD como peinarse y vestirse.',
        assessmentText:
          'Evolución favorable tras cirugía de manguito rotador derecho. Sin signos de infección.',
        treatments: {
          ejercicios: [
            'Ejercicios pasivos asistidos en flexión y abducción',
            'Ejercicios activos asistidos en rango tolerado',
          ],
          tecnicasManuales: [],
          educacion: ['Pautas de protección postquirúrgica y progresión de carga'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 2-3 semanas.',
          textoLibre: 'Continuar progresión de movilidad y fuerza en rango tolerado. Reevaluar en 2-3 semanas.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);

    expect(summary.evolution.direction).toBe('improved');
    expect(report).toContain('Disminución del dolor de 6/10 a 3/10');
  });

  it('chronic knee pain (gonalgia) stable case keeps neutral evolution', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Carlos López',
        patientId: 'P-901',
        visitType: 'followup',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor de rodilla derecha de más de 6 meses de evolución, relacionado con artrosis. Dolor 4/10 al caminar largos trayectos, estable respecto a la visita anterior.',
        assessmentText:
          'Gonalgia mecánica crónica por artrosis de rodilla derecha. Síntomas estables sin signos de bloqueo ni inestabilidad.',
        treatments: {
          ejercicios: ['Ejercicios de fortalecimiento de cuádriceps y glúteo'],
          tecnicasManuales: [],
          educacion: ['Educación en manejo de la carga y control de peso'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 6-8 semanas.',
          textoLibre: 'Mantener programa de ejercicio y educación. Reevaluar en 6-8 semanas.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);
    const episodio = extractEpisodeLine(report);

    expect(summary.mainProblem).toContain('Gonalgia mecánica crónica');
    expect(episodio).toContain('Gonalgia mecánica crónica');
    // No deberíamos ver texto de "Disminución" o "Aumento" de dolor en este caso estable
    expect(report).not.toContain('Disminución del dolor');
    expect(report).not.toContain('Aumento del dolor');
  });

  it('biopsychosocial-heavy lumbar case still produces coherent main problem', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Ana Torres',
        patientId: 'P-999',
        visitType: 'followup',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor lumbar persistente de varios meses, sin cambios claros de intensidad (5/10 constante). Alta preocupación por el dolor, miedo a moverse y estrés laboral elevado.',
        assessmentText:
          'Dolor lumbar inespecífico persistente con importante carga biopsicosocial (catastrofización, miedo al movimiento y estrés laboral). Sin signos neurológicos objetivos.',
        treatments: {
          ejercicios: ['Ejercicios suaves de movilidad y exposición gradual al movimiento'],
          tecnicasManuales: [],
          educacion: ['Educación en neurociencia del dolor y estrategias de afrontamiento'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 4 semanas.',
          textoLibre:
            'Foco en abordaje biopsicosocial y exposición gradual. Reevaluar en 4 semanas o antes si aparece cambio neurológico.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);
    const episodio = extractEpisodeLine(report);

    expect(summary.mainProblem).toContain('Dolor lumbar inespecífico persistente');
    expect(episodio).toContain('Dolor lumbar inespecífico persistente');
    // En este caso no esperamos que el motor fuerce mejora o empeoramiento numérico de dolor
    expect(report).not.toContain('Disminución del dolor');
    expect(report).not.toContain('Aumento del dolor');
  });

  it('functional improvement (better tolerance to walking) is detected', () => {
    const facts: ClinicalFactSetLike = {
      context: {
        patientName: 'Luis Sánchez',
        patientId: 'P-777',
        visitType: 'followup',
        sessionSubtype: 'acute',
      },
      facts: {
        subjectiveText:
          'Dolor lumbar similar al previo (5/10), pero refiere mejor tolerancia a la marcha y a las actividades diarias.',
        assessmentText: 'Dolor lumbar inespecífico con ligera mejoría funcional.',
        treatments: {
          ejercicios: ['Ejercicios de fortalecimiento y control motor lumbar'],
          tecnicasManuales: [],
          educacion: ['Estrategias de afrontamiento y actividad graduada'],
        },
        plan: {
          horizonteTiempo: 'Reevaluar en 4 semanas.',
          textoLibre: 'Continuar con progresión gradual de actividad. Reevaluar en 4 semanas.',
        },
      },
    };

    const summary = synthesizeClinicalNarrative(facts);
    const data = buildReferralDataFromSummary(facts, summary);
    const sections = buildReferralReportEsSections(data);
    const report = renderReferralReportEsText(sections);

    expect(summary.evolution.direction).toBe('improved');
    expect(report).toContain('Mejor tolerancia a la marcha');
  });
});

