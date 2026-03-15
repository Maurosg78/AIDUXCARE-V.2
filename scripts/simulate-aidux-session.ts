/**
 * AiDuxCare - Clinical Report Pipeline Simulator (ES)
 *
 * Dev-only CLI script to simulate the end-to-end pipeline:
 *
 * SessionState (with SOAP) →
 *   ClinicalFactSet (extracted) →
 *   ReferralReportData (for ES) →
 *   Sections →
 *   Text report
 *
 * Usage (with ts-node or equivalent):
 *   npx ts-node scripts/simulate-aidux-session.ts [scenario]
 *
 * Scenarios:
 *   stable             - estado estable / sin grandes cambios
 *   improvement        - mejoría clara
 *   worsening          - empeoramiento / aparición de nuevos signos
 *   redflags           - caso de posible síndrome de cauda equina
 *   improvement-series - serie longitudinal con mejoría clara
 *   plateau-series     - serie longitudinal con plateau terapéutico
 *   relapse-series     - serie longitudinal con recaída
 */

import { SessionState } from '@/types/sessionState';
import type { SOAPNote } from '@/types/vertex-ai';
import {
  type ReferralReportData,
  buildReferralReportEsSections,
  renderReferralReportEsText,
} from '@/core/reports/referralReportEs';
import {
  synthesizeClinicalNarrative,
  type ClinicalFactSetLike,
} from '@/core/synthesis/synthesizeClinicalNarrative';
import {
  buildLongitudinalEvolutionFromFacts,
  renderLongitudinalEvolutionParagraph,
  shouldRenderLongitudinal,
} from '@/core/synthesis/LongitudinalEvolution';

type Scenario = 'stable' | 'improvement' | 'worsening' | 'redflags';
type SeriesScenario = 'improvement-series' | 'plateau-series' | 'relapse-series';

interface ClinicalFactSet {
  context: {
    patientName: string;
    patientAge?: number;
    patientId?: string;
    episodeStartDate?: string;
    visitType?: string;
    sessionSubtype?: string;
  };
  facts: {
    chiefComplaint?: string;
    diagnosis?: string;
    relevantHistory?: string;
    subjectiveText?: string;
    objectiveText?: string;
    assessmentText?: string;
    planText?: string;
    pain?: {
      inicial?: number;
      actual?: number;
      contexto?: string;
      localizacion?: string;
      irradiacion?: string;
      cursoTextoLibre?: string;
    };
    mobility?: Array<{
      segmento: string;
      rangoInicial?: string;
      rangoActual?: string;
    }>;
    tests?: Array<{
      nombre: string;
      resultado: string;
    }>;
    evolutionText?: string;
    treatments?: {
      ejercicios?: string[];
      tecnicasManuales?: string[];
      educacion?: string[];
    };
    plan?: {
      frecuenciaSesiones?: string;
      horizonteTiempo?: string;
      objetivoPrincipal?: string;
      recomendacionesRevision?: string;
      textoLibre?: string;
    };
  };
}

function createMockSoapNoteForScenario(s: Scenario): SOAPNote {
  switch (s) {
    case 'improvement':
      return {
        subjective: `Dolor lumbar de 4 semanas de evolución, inicialmente intenso (7/10), actualmente 3/10 en reposo y 5/10 al esfuerzo. Mejor tolerancia a la marcha y a las actividades de la vida diaria.`,
        objective: `Flexión lumbar inicial 60°, actual 80°. Dolor residual a la palpación paravertebral L4-L5. Test de Lasegue y slump negativos.`,
        assessment: `Lumbalgia mecánica subaguda en mejoría clínica, sin signos de radiculopatía ni banderas rojas.`,
        plan: `Mantener programa de ejercicio terapéutico de control lumbopélvico y fortalecimiento de glúteo medio. Progresar carga funcional según tolerancia. Reforzar educación postural.`,
        planInClinic: [
          'Progresión de ejercicio terapéutico lumbopélvico',
          'Trabajo de estabilidad en cadena cerrada',
        ],
        planHomeProgram: [
          'Ejercicios diarios de movilidad lumbar',
          'Fortalecimiento de glúteo medio en casa',
        ],
        followUp: 'Reevaluar en 3-4 semanas o antes si empeora.',
        precautions: '',
        referrals: '',
      };

    case 'worsening':
      return {
        subjective: `Dolor lumbar de 3 semanas de evolución, inicialmente 4/10, actualmente 7/10 con irradiación a miembro inferior derecho. Empeoramiento al estar de pie prolongado y al agacharse.`,
        objective: `Flexión lumbar limitada por dolor. Test de Lasegue positivo a 40° en miembro inferior derecho. Hipertonía paravertebral lumbar.`,
        assessment: `Lumbociatalgia derecha en probable contexto mecánico. Empeoramiento sintomático con aparición de dolor irradiado. Sin signos de síndrome de cauda equina.`,
        plan: `Reducir carga mecánica lumbar, ajustar ejercicio terapéutico a rango tolerado. Derivar a valoración médica si no hay mejoría en 1-2 semanas o si aparecen signos neurológicos adicionales.`,
        planInClinic: [
          'Ejercicio terapéutico en rango sin dolor',
          'Terapia manual suave para control de dolor',
        ],
        planHomeProgram: [
          'Pausas activas frecuentes',
          'Ejercicios suaves de movilidad en decúbito',
        ],
        followUp: 'Reevaluar en 1-2 semanas.',
        precautions: 'Monitorizar aparición de debilidad, anestesia en silla de montar o trastornos esfinterianos.',
        referrals: 'Considerar derivación a medicina / traumatología si empeora.',
      };

    case 'redflags':
      return {
        subjective: `Dolor lumbar de inicio reciente (1 semana) con empeoramiento rápido. Refiere adormecimiento en la zona perineal y dificultad para iniciar la micción desde hace 24 horas.`,
        objective: `Debilidad 3/5 en dorsiflexión de pie derecho. Sensibilidad disminuida en región en silla de montar. Reflejos aquíleos disminuidos bilateralmente.`,
        assessment: `Síntomas compatibles con posible síndrome de cauda equina. Dolor lumbar con déficit neurológico progresivo y alteración esfinteriana incipiente.`,
        plan: `Suspender fisioterapia. Derivar de forma URGENTE a servicio de urgencias hospitalarias para valoración neuroquirúrgica. Documentar hallazgos neurológicos y tiempos de inicio de síntomas.`,
        planInClinic: [
          'No continuar tratamiento fisioterápico en esta sesión',
        ],
        planHomeProgram: [
          'Indicado acudir a urgencias hospitalarias hoy mismo',
        ],
        followUp: 'A la espera de valoración médica urgente.',
        precautions: 'Advertir al paciente de signos de empeoramiento neurológico inmediato.',
        referrals: 'Derivación urgente a urgencias / neurocirugía.',
      };

    case 'stable':
    default:
      return {
        subjective: `Dolor lumbar mecánico de 2 semanas de evolución, peor al permanecer sentada. No irradiado a miembros inferiores. Sin antecedentes de cirugía lumbar.`,
        objective: `Limitación moderada de flexión lumbar. Dolor a la palpación paravertebral L4-L5. Test de Lasegue y slump negativos.`,
        assessment: `Lumbalgia mecánica subaguda sin signos de radiculopatía. Sin banderas rojas actuales.`,
        plan: `Ejercicio terapéutico de control lumbopélvico 3x12. Fortalecimiento de glúteo medio. Movilización lumbar grado III. Educación postural y pautas de autocuidado.`,
        planInClinic: [
          'Ejercicio terapéutico de control lumbopélvico',
          'Movilización lumbar grado III',
        ],
        planHomeProgram: [
          'Fortalecimiento de glúteo medio',
          'Ejercicios de movilidad lumbar en casa',
        ],
        followUp: 'Reevaluar en 3-4 semanas.',
        precautions: '',
        referrals: '',
      };
  }
}

function createMockSessionState(scenario: Scenario): SessionState {
  const soapNote = createMockSoapNoteForScenario(scenario);
  return {
    sessionId: `SIM-${scenario}-001`,
    patientId: 'P-123',
    patientName: 'Marta Ruiz',
    sessionType: 'initial',
    subtype: scenario === 'worsening' || scenario === 'redflags' ? 'acute' : 'acute',
    additionalOutputs: ['soap', 'referral'],
    transcript:
      'Transcripción simulada de sesión clínica con información sobre dolor lumbar, evolución y pruebas realizadas.',
    soapNote,
    isRecording: false,
    startTime: new Date(),
    lastUpdated: new Date(),
    status: 'completed',
  };
}

function createLongitudinalSeries(kind: SeriesScenario): ClinicalFactSetLike[] {
  const baseContext: ClinicalFactSetLike['context'] = {
    patientName: 'Marta Ruiz',
    patientAge: undefined,
    patientId: 'P-123',
    episodeStartDate: undefined,
    visitType: 'followup',
    sessionSubtype: 'acute',
  };

  let series: number[];
  switch (kind) {
    case 'improvement-series':
      series = [7, 4, 2];
      break;
    case 'plateau-series':
      series = [7, 4, 3, 3];
      break;
    case 'relapse-series':
      series = [7, 4, 6];
      break;
    default:
      series = [5, 5, 5];
  }

  return series.map((value, idx) => ({
    context: {
      ...baseContext,
      // In a future version we could add per-visit dates here
      sessionSubtype: idx === 0 ? 'initial' : 'followup',
    },
    facts: {
      chiefComplaint: `Dolor lumbar ${value}/10`,
      diagnosis: 'Lumbalgia mecánica',
      relevantHistory: undefined,
      subjectiveText: `Paciente refiere dolor lumbar de ${value}/10.`,
      objectiveText: '',
      assessmentText: '',
      planText: '',
      pain: {
        cursoTextoLibre: `Dolor referido de ${value}/10`,
      },
      mobility: [],
      tests: [],
      evolutionText: undefined,
      treatments: {},
      plan: {},
    },
  }));
}

async function runLongitudinalScenario(kind: SeriesScenario): Promise<void> {
  const startedAt = Date.now();
  console.log('=== AiDuxCare Longitudinal Evolution Simulation ===');
  console.log(`Series scenario: ${kind}`);

  const seriesFacts = createLongitudinalSeries(kind);
  const evolution = buildLongitudinalEvolutionFromFacts(seriesFacts);

  console.log('\n--- ClinicalFactSet series (snapshot) ---\n');
  console.log(JSON.stringify(seriesFacts, null, 2));

  console.log('\n--- LongitudinalEvolutionSummary ---\n');
  console.log(JSON.stringify(evolution, null, 2));

  if (shouldRenderLongitudinal(evolution)) {
    const paragraph = renderLongitudinalEvolutionParagraph(evolution);
    console.log('\n=== Longitudinal Evolution (rendered) ===\n');
    console.log(paragraph);
  } else {
    console.log('\n(No longitudinal paragraph rendered – series does not meet criteria.)\n');
  }

  const elapsedMs = Date.now() - startedAt;
  console.log('--- Longitudinal Metrics ---');
  console.log(`Visits with numeric pain: ${evolution.painSeries?.length ?? 0}`);
  console.log(`Baseline: ${evolution.baselinePain}`);
  console.log(`Current: ${evolution.currentPain}`);
  console.log(`Change: ${evolution.changeMagnitude}`);
  console.log(`Abs change: ${evolution.absChange}`);
  console.log(`Clinically meaningful: ${evolution.clinicallyMeaningful}`);
  console.log(`Trend confidence: ${evolution.trendConfidence}`);
  console.log(`Elapsed time: ${elapsedMs} ms`);
}

/**
 * Minimal extractor: SessionState + SOAPNote → ClinicalFactSet
 * No inferencia clínica, solo reetiquetado / organización.
 */
function extractClinicalFactsFromSession(session: SessionState): ClinicalFactSet {
  const soap = session.soapNote;

  const facts: ClinicalFactSet = {
    context: {
      patientName: session.patientName ?? 'Paciente sin nombre',
      patientAge: undefined,
      patientId: session.patientId,
      episodeStartDate: undefined,
      visitType: session.sessionType,
      sessionSubtype: session.subtype,
    },
    facts: {
      subjectiveText: soap?.subjective,
      objectiveText: soap?.objective,
      assessmentText: soap?.assessment,
      planText: soap?.plan,
      treatments: {
        ejercicios: soap?.planInClinic ?? [],
        tecnicasManuales: [], // en este mock no distinguimos explícitamente
        educacion: soap?.planHomeProgram ?? [],
      },
      plan: {
        horizonteTiempo: soap?.followUp,
        textoLibre: soap?.followUp,
      },
    },
  };

  // Chief complaint / diagnosis from SOAP text (very light touch, no inference)
  if (soap?.subjective) {
    const firstLine = soap.subjective.split('\n')[0];
    facts.facts.chiefComplaint = firstLine.trim();
  }
  if (soap?.assessment) {
    // Split assessment into main diagnosis (first sentence) + rest (notes/evolution)
    const sentences = soap.assessment
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences[0]) {
      facts.facts.diagnosis = sentences[0];
    }
    if (sentences.length > 1) {
      // Leave additional assessment text available, but do not force it into evolution
      facts.facts.assessmentText = soap.assessment;
    }
  }

  // Very minimal pain + mobility extraction from objective text (safe, descriptive-only)
  if (soap?.objective) {
    const obj = soap.objective.toLowerCase();
    // Extract only sentences that mention pain, not the whole objective block
    if (obj.includes('dolor')) {
      const painSentences = soap.objective
        .split('.')
        .map((s) => s.trim())
        .filter((s) => s && s.toLowerCase().includes('dolor'));
      if (painSentences.length) {
        facts.facts.pain = facts.facts.pain ?? {};
        facts.facts.pain.cursoTextoLibre = painSentences.join('. ');
      }
    }
    if (obj.includes('flexión lumbar') || obj.includes('flexion lumbar')) {
      facts.facts.mobility = facts.facts.mobility ?? [];
      facts.facts.mobility.push({
        segmento: 'columna lumbar',
        rangoInicial: 'ver nota objetiva',
      });
    }
    const tests: ClinicalFactSet['facts']['tests'] = [];
    if (obj.includes('lasegue')) {
      tests.push({ nombre: 'Lasegue', resultado: obj.includes('negativ') ? 'negativo' : 'ver nota objetiva' });
    }
    if (obj.includes('slump')) {
      tests.push({ nombre: 'Slump', resultado: obj.includes('negativ') ? 'negativo' : 'ver nota objetiva' });
    }
    if (tests.length) {
      facts.facts.tests = tests;
    }
  }

  return facts;
}

/**
 * Map ClinicalFactSet → ReferralReportData (ES) for the current simple use case.
 * This is intentionally conservative and can be extended later.
 */
function clinicalFactsToReferralReportData(f: ClinicalFactSet, summary: ReturnType<typeof synthesizeClinicalNarrative>): ReferralReportData {
  const { context, facts } = f;

  const data: ReferralReportData = {
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
    antecedentesRelevantes: facts.relevantHistory,
    evolucionTextoLibre:
      summary.evolution.redFlagText ||
      summary.evolution.painChangeText ||
      summary.evolution.functionChangeText ||
      summary.evolution.evolutionHighlight,
    tratamiento: {
      ejercicios: facts.treatments?.ejercicios,
      tecnicasManuales: facts.treatments?.tecnicasManuales,
      educacion: facts.treatments?.educacion,
    },
    plan: {
      horizonteTiempo: facts.plan?.horizonteTiempo,
      textoLibre: facts.plan?.textoLibre,
    },
  };

  if (facts.pain) {
    data.dolor = {
      inicial: facts.pain.inicial,
      actual: facts.pain.actual,
      contexto: facts.pain.contexto,
      localizacion: facts.pain.localizacion,
      irradiacion: facts.pain.irradiacion,
      cursoTextoLibre: facts.pain.cursoTextoLibre,
    };
  }

  if (facts.mobility) {
    data.movilidad = facts.mobility.map((m) => ({
      segmento: m.segmento,
      rangoInicial: m.rangoInicial,
      rangoActual: m.rangoActual,
    }));
  }

  if (facts.tests) {
    data.tests = facts.tests.map((t) => ({
      nombre: t.nombre,
      resultado: t.resultado,
    }));
  }

  return data;
}

async function run() {
  const scenarioArg = (process.argv[2] as string | undefined) ?? 'stable';
  const scalarScenarios: Scenario[] = ['stable', 'improvement', 'worsening', 'redflags'];
  const seriesScenarios: SeriesScenario[] = [
    'improvement-series',
    'plateau-series',
    'relapse-series',
  ];

  if (seriesScenarios.includes(scenarioArg as SeriesScenario)) {
    await runLongitudinalScenario(scenarioArg as SeriesScenario);
    return;
  }

  const scenario: Scenario = scalarScenarios.includes(scenarioArg as Scenario)
    ? (scenarioArg as Scenario)
    : 'stable';

  const startedAt = Date.now();
  console.log('=== AiDuxCare Clinical Report Simulation ===');
  console.log(`Scenario: ${scenario}`);

  const session = createMockSessionState(scenario);
  const facts = extractClinicalFactsFromSession(session);
  const narrative = synthesizeClinicalNarrative(facts as ClinicalFactSetLike);
  const referralData = clinicalFactsToReferralReportData(facts, narrative);
  const sections = buildReferralReportEsSections(referralData);
  const reportText = renderReferralReportEsText(sections);

  const elapsedMs = Date.now() - startedAt;

  console.log('\n--- ClinicalFactSet (snapshot) ---\n');
  console.log(JSON.stringify(facts, null, 2));

  console.log('\n--- NarrativeSummary (snapshot) ---\n');
  console.log(JSON.stringify(narrative, null, 2));

  console.log('\n--- ReferralReportData (snapshot) ---\n');
  console.log(JSON.stringify(referralData, null, 2));

  console.log('\n--- Informe derivador (ES) ---\n');
  console.log(reportText);

  console.log('\n--- Metrics ---');
  console.log(`Report length: ${reportText.split(/\s+/).filter(Boolean).length} words`);
  console.log(`Elapsed time: ${elapsedMs} ms`);
}

run().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});

