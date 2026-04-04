import { generateFollowUpAnalysis } from '../../src/services/vertex-ai-soap-service';
import type { FollowUpPromptV3Input } from '../../src/core/soap/followUp/buildFollowUpPromptV3';

type SyntheticCase = {
  id: string;
  title: string;
  expectedSignals: {
    delta: string[];
    adherence?: string[];
    continuity?: string[];
    objective?: string[];
    redFlags?: string[];
  };
  input: FollowUpPromptV3Input;
};

type CaseEvaluation = {
  caseId: string;
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  considerations: string[];
  alerts: unknown;
  checks: {
    hasDeltaLanguage: boolean;
    hasAdherenceLink: boolean;
    hasContinuityLanguage: boolean;
    objectiveIsHonest: boolean;
    redFlagsHandled: boolean;
  };
};

const baseJurisdiction = 'ES-ES';

const cases: SyntheticCase[] = [
  {
    id: 'lumbar_improvement_partial_hep',
    title: 'Lumbar crónico en mejoría con adherencia parcial al HEP',
    expectedSignals: {
      delta: ['7/10', '4/10', 'mejor'],
      adherence: ['67%', '2/3', 'adherencia'],
      continuity: ['continúa', 'progresa', 'plan previo'],
      objective: ['No se registraron nuevas medidas objetivas'],
    },
    input: {
      baselineSOAP: {
        subjective: 'Paciente con lumbalgia mecánica. Dolor 7/10 en la última sesión. Rigidez matutina y tolerancia limitada a la sedestación.',
        objective: 'ROM lumbar limitado en flexión. SLR negativo. Sin déficit neurológico objetivo.',
        assessment: 'Lumbalgia mecánica en evolución favorable inicial.',
        plan: 'TRATAMIENTO EN CLÍNICA:\n- Terapia manual lumbar\n- Ejercicios supervisados de movilidad\n\nPROGRAMA DE EJERCICIOS EN CASA (HEP):\n- Movilidad lumbar diaria\n- Actividad graduada\n- Control lumbopélvico básico',
      },
      clinicalUpdate: 'Refiere dolor actual 4/10. Tolera mejor la sedestación y presenta menos rigidez por la mañana. Persiste molestia leve al final del día. Se siente más confiado con el movimiento.',
      longitudinalSummary: 'Desde la última sesión: dolor 7/10 -> 4/10. Mejor tolerancia a sedestación. Menor rigidez matutina. Sin empeoramiento neurológico.',
      trajectoryPattern: 'improved',
      trajectoryConfidence: 'high',
      painSeriesSummary: '7 -> 4',
      patternInsightSummary: 'El paciente suele responder con mejoría gradual cuando mantiene movilidad diaria y progresión de carga baja.',
      previousPlansSummary: 'Plan previo: movilidad lumbar diaria, actividad graduada y control lumbopélvico básico.',
      inClinicItems: ['Terapia manual lumbar', 'Ejercicios supervisados de movilidad y control lumbopélvico'],
      homeProgram: ['Movilidad lumbar diaria', 'Actividad graduada', 'Control lumbopélvico básico'],
      currentHepAdherenceSummary: 'Adherencia HEP hoy: 2/3 completados (67%).',
      jurisdiction: baseJurisdiction,
    },
  },
  {
    id: 'wrist_postop_fear_progress',
    title: 'Muñeca postquirúrgica con progreso y aprensión residual',
    expectedSignals: {
      delta: ['más confianza', 'menos rigidez', 'mejor'],
      adherence: ['75%', '3/4', 'adherencia'],
      continuity: ['continúa', 'progresa'],
      objective: ['No se registraron nuevas medidas objetivas'],
    },
    input: {
      baselineSOAP: {
        subjective: 'Paciente postoperatoria de fractura distal de radio izquierdo. Dolor 6/10. Aprensión al movimiento rápido. Rigidez marcada de muñeca y mano.',
        objective: 'ROM de muñeca limitado. Cicatriz quirúrgica sin signos de infección. Edema leve residual.',
        assessment: 'Evolución posquirúrgica esperable con rigidez y miedo al movimiento.',
        plan: 'TRATAMIENTO EN CLÍNICA:\n- Movilización articular y de tejidos blandos de muñeca izquierda\n- Ejercicios asistidos de movilidad de muñeca y mano\n\nPROGRAMA DE EJERCICIOS EN CASA (HEP):\n- ROM activo-asistido de muñeca y dedos\n- Desensibilización de cicatriz\n- Elevación y control de edema',
      },
      clinicalUpdate: 'Refiere dolor 3/10 en reposo. Se siente más confiada para mover la mano, aunque mantiene temor a movimientos bruscos. Nota menos rigidez al inicio del día y mejor tolerancia para actividades básicas ligeras.',
      longitudinalSummary: 'Comparado con la última sesión: dolor 6/10 -> 3/10. Menor rigidez matutina. Menor miedo al movimiento, aunque persiste aprensión con gestos rápidos.',
      trajectoryPattern: 'improved',
      trajectoryConfidence: 'high',
      painSeriesSummary: '6 -> 5 -> 3',
      patternInsightSummary: 'La paciente mejora cuando combina movilidad frecuente con progresión suave de carga y refuerzo de seguridad.',
      previousPlansSummary: 'Plan previo: ROM activo-asistido de muñeca y dedos, desensibilización de cicatriz y control de edema.',
      inClinicItems: ['Movilización articular y de tejidos blandos de muñeca izquierda', 'Ejercicios asistidos de movilidad de muñeca y mano'],
      homeProgram: ['ROM activo-asistido de muñeca y dedos', 'Desensibilización de cicatriz', 'Elevación y control de edema', 'Movimientos activos suaves en rango tolerado'],
      currentHepAdherenceSummary: 'Adherencia HEP hoy: 3/4 completados (75%).',
      jurisdiction: baseJurisdiction,
    },
  },
  {
    id: 'cervical_plateau_low_adherence',
    title: 'Cervicalgia en meseta con baja adherencia',
    expectedSignals: {
      delta: ['sin cambios', 'meseta', 'persist'],
      adherence: ['25%', '1/4', 'adherencia'],
      continuity: ['ajusta', 'mantiene', 'continúa'],
      objective: ['No se registraron nuevas medidas objetivas'],
    },
    input: {
      baselineSOAP: {
        subjective: 'Cervicalgia mecánica con dolor 5/10, rigidez al girar la cabeza y cefalea tensional ocasional.',
        objective: 'Rotación cervical limitada bilateralmente. Sin signos neurológicos. Palpación dolorosa en trapecio superior.',
        assessment: 'Cervicalgia mecánica asociada a restricción de movilidad y sobrecarga muscular.',
        plan: 'TRATAMIENTO EN CLÍNICA:\n- Terapia manual cervical y cintura escapular\n- Ejercicios supervisados de movilidad cervical\n\nPROGRAMA DE EJERCICIOS EN CASA (HEP):\n- Movilidad cervical diaria\n- Pausas posturales\n- Activación escapular\n- Autogestión de carga',
      },
      clinicalUpdate: 'Refiere dolor actual 5/10, sin cambios relevantes desde la última visita. Continúa rigidez al girar la cabeza al conducir. Reconoce que realizó pocos ejercicios en casa por carga laboral.',
      longitudinalSummary: 'Desde la última sesión no se observan cambios clínicos significativos. Persisten dolor 5/10 y limitación funcional para rotación cervical.',
      trajectoryPattern: 'plateau',
      trajectoryConfidence: 'high',
      painSeriesSummary: '5 -> 5 -> 5',
      patternInsightSummary: 'El cuadro tiende a estancarse cuando la adherencia al programa domiciliario disminuye.',
      previousPlansSummary: 'Plan previo: movilidad cervical diaria, pausas posturales, activación escapular y autogestión de carga.',
      inClinicItems: ['Terapia manual cervical y cintura escapular', 'Ejercicios supervisados de movilidad cervical'],
      homeProgram: ['Movilidad cervical diaria', 'Pausas posturales', 'Activación escapular', 'Autogestión de carga'],
      currentHepAdherenceSummary: 'Adherencia HEP hoy: 1/4 completados (25%).',
      jurisdiction: baseJurisdiction,
    },
  },
  {
    id: 'shoulder_flare_after_overload',
    title: 'Hombro con reagudización tras sobrecarga',
    expectedSignals: {
      delta: ['peor', 'aument', 'sobrecarga'],
      adherence: ['100%', '4/4', 'adherencia'],
      continuity: ['ajusta', 'modifica'],
      objective: ['No se registraron nuevas medidas objetivas'],
    },
    input: {
      baselineSOAP: {
        subjective: 'Dolor de hombro derecho 4/10, peor con elevación sostenida y tareas por encima de la cabeza.',
        objective: 'Arco doloroso en elevación. Debilidad leve en supraespinoso. Sin síntomas neurológicos.',
        assessment: 'Disfunción subacromial en mejoría inicial.',
        plan: 'TRATAMIENTO EN CLÍNICA:\n- Terapia manual glenohumeral y escapular\n- Ejercicio supervisado de control escapular y manguito\n\nPROGRAMA DE EJERCICIOS EN CASA (HEP):\n- Control escapular\n- Isométricos de manguito\n- Modificación de carga\n- Movilidad torácica',
      },
      clinicalUpdate: 'Refiere aumento del dolor a 6/10 tras trabajo intenso en altura esta semana. Mantiene el programa en casa, pero nota más dolor con elevación y fatiga del hombro al final del día. Niega parestesias o dolor nocturno severo.',
      longitudinalSummary: 'Desde la última sesión: dolor 4/10 -> 6/10 tras episodio de sobrecarga. Aumentó irritabilidad mecánica, sin datos neurológicos añadidos.',
      trajectoryPattern: 'fluctuating',
      trajectoryConfidence: 'medium',
      painSeriesSummary: '5 -> 4 -> 6',
      patternInsightSummary: 'El paciente suele reagudizarse con picos de carga laboral, aunque recupera cuando se ajusta la dosificación.',
      previousPlansSummary: 'Plan previo: control escapular, isométricos de manguito, modificación de carga y movilidad torácica.',
      inClinicItems: ['Terapia manual glenohumeral y escapular', 'Ejercicio supervisado de control escapular y manguito'],
      homeProgram: ['Control escapular', 'Isométricos de manguito', 'Modificación de carga', 'Movilidad torácica'],
      currentHepAdherenceSummary: 'Adherencia HEP hoy: 4/4 completados (100%).',
      jurisdiction: baseJurisdiction,
    },
  },
  {
    id: 'lumbar_redflag_bladder',
    title: 'Lumbar con red flag neurológica explícita',
    expectedSignals: {
      delta: ['empeor', 'urgente', 'neurol'],
      continuity: ['deriv', 'susp'],
      redFlags: ['bladder', 'bowel', 'saddle', 'red_flags'],
      objective: ['No se registraron nuevas medidas objetivas'],
    },
    input: {
      baselineSOAP: {
        subjective: 'Lumbociatalgia izquierda 6/10 con dolor irradiado a pierna izquierda.',
        objective: 'SLR positivo izquierdo. Sin pérdida de control vesical en evaluación previa.',
        assessment: 'Radiculopatía lumbar izquierda en seguimiento.',
        plan: 'TRATAMIENTO EN CLÍNICA:\n- Educación y control de síntomas\n- Movilidad lumbar suave\n\nPROGRAMA DE EJERCICIOS EN CASA (HEP):\n- Movilidad lumbar suave\n- Descarga en flexión',
      },
      clinicalUpdate: 'Refiere empeoramiento del dolor y episodio nuevo de dificultad para controlar la vejiga desde anoche. También describe sensación de entumecimiento en la zona perineal. Está muy preocupado.',
      longitudinalSummary: 'Comparado con la última sesión: empeoramiento agudo con aparición de síntomas neurológicos de alarma.',
      trajectoryPattern: 'regressed',
      trajectoryConfidence: 'high',
      painSeriesSummary: '6 -> 8',
      patternInsightSummary: 'No relevante por aparición de síntomas de alarma actuales.',
      previousPlansSummary: 'Plan previo conservador con movilidad suave y control de síntomas.',
      inClinicItems: ['Educación y control de síntomas'],
      homeProgram: ['Movilidad lumbar suave', 'Descarga en flexión'],
      jurisdiction: baseJurisdiction,
    },
  },
];

const evaluateTextPresence = (text: string, candidates: string[]): boolean => {
  const normalizedText = text.toLowerCase();
  return candidates.some((candidate) => normalizedText.includes(candidate.toLowerCase()));
};

const evaluateCase = (syntheticCase: SyntheticCase, result: Awaited<ReturnType<typeof generateFollowUpAnalysis>>): CaseEvaluation => {
  const soap = result.documentation;
  const subjective = soap?.subjective ?? '';
  const objective = soap?.objective ?? '';
  const assessment = soap?.assessment ?? '';
  const plan = soap?.plan ?? '';
  const considerations = result.considerations ?? [];
  const alerts = result.alerts ?? null;
  const combinedSoap = `${subjective}\n${objective}\n${assessment}\n${plan}`;
  const hasDeltaLanguage = evaluateTextPresence(combinedSoap, syntheticCase.expectedSignals.delta);
  const adherenceTerms = syntheticCase.expectedSignals.adherence ?? [];
  const hasAdherenceLink = adherenceTerms.length > 0 ? evaluateTextPresence(`${assessment}\n${plan}`, adherenceTerms) : true;
  const continuityTerms = syntheticCase.expectedSignals.continuity ?? [];
  const hasContinuityLanguage = continuityTerms.length > 0 ? evaluateTextPresence(plan, continuityTerms) : true;
  const objectiveTerms = syntheticCase.expectedSignals.objective ?? [];
  const objectiveIsHonest = objectiveTerms.length > 0 ? evaluateTextPresence(objective, objectiveTerms) : objective.length > 0;
  const expectedRedFlags = syntheticCase.expectedSignals.redFlags ?? [];
  const alertString = JSON.stringify(alerts);
  const redFlagsHandled = expectedRedFlags.length > 0 ? evaluateTextPresence(alertString, expectedRedFlags) : !/red_flags\":\[[^\]]+\]/i.test(alertString);

  return {
    caseId: syntheticCase.id,
    title: syntheticCase.title,
    subjective,
    objective,
    assessment,
    plan,
    considerations,
    alerts,
    checks: {
      hasDeltaLanguage,
      hasAdherenceLink,
      hasContinuityLanguage,
      objectiveIsHonest,
      redFlagsHandled,
    },
  };
};

const printCaseEvaluation = (evaluation: CaseEvaluation): void => {
  const checkEntries = Object.entries(evaluation.checks);
  const passedChecks = checkEntries.filter(([, value]) => value).length;
  const totalChecks = checkEntries.length;
  console.log(`\n=== ${evaluation.caseId} :: ${evaluation.title} ===`);
  console.log(`Checks: ${passedChecks}/${totalChecks}`);
  checkEntries.forEach(([label, value]) => {
    console.log(`- ${label}: ${value ? 'PASS' : 'FAIL'}`);
  });
  console.log('\nS:');
  console.log(evaluation.subjective);
  console.log('\nO:');
  console.log(evaluation.objective);
  console.log('\nA:');
  console.log(evaluation.assessment);
  console.log('\nP:');
  console.log(evaluation.plan);
  console.log('\nConsiderations:');
  console.log(JSON.stringify(evaluation.considerations, null, 2));
  console.log('\nAlerts:');
  console.log(JSON.stringify(evaluation.alerts, null, 2));
};

const main = async (): Promise<void> => {
  const evaluations: CaseEvaluation[] = [];

  for (const syntheticCase of cases) {
    const result = await generateFollowUpAnalysis(syntheticCase.input);
    const evaluation = evaluateCase(syntheticCase, result);
    evaluations.push(evaluation);
    printCaseEvaluation(evaluation);
  }

  const totalCases = evaluations.length;
  const fullyPassingCases = evaluations.filter((evaluation) => Object.values(evaluation.checks).every(Boolean)).length;
  console.log('\n=== SUMMARY ===');
  console.log(`Fully passing cases: ${fullyPassingCases}/${totalCases}`);
  evaluations.forEach((evaluation) => {
    const passedChecks = Object.values(evaluation.checks).filter(Boolean).length;
    const totalChecks = Object.values(evaluation.checks).length;
    console.log(`- ${evaluation.caseId}: ${passedChecks}/${totalChecks}`);
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
