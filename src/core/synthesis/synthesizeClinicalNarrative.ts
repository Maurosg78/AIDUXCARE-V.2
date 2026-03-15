/**
 * Clinical Synthesis Engine (v1)
 *
 * Converts a minimal ClinicalFactSet-like structure into a NarrativeSummary.
 * Intentionally light-weight: simple pattern detection and prioritization,
 * no clinical inference beyond what is explicitly documented.
 *
 * NOTE: This file currently defines its own ClinicalFactSet subset
 * matching the simulator. When a canonical ClinicalFactSet is introduced
 * under src/core/clinical, this type should be replaced there.
 */

import type { NarrativeSummary } from './NarrativeSummary';

export interface ClinicalFactSetLike {
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

export function synthesizeClinicalNarrative(facts: ClinicalFactSetLike): NarrativeSummary {
  const { facts: f } = facts;

  // 1. Main problem
  let mainProblem: string;
  if (f.diagnosis && f.diagnosis.trim()) {
    mainProblem = f.diagnosis.trim();
  } else if (f.assessmentText) {
    // Fall back to first sentence of assessment if diagnosis field is not set
    const sentences = f.assessmentText
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);
    mainProblem = sentences[0] || 'Motivo de consulta no especificado';
  } else if (f.chiefComplaint && f.chiefComplaint.trim()) {
    mainProblem = f.chiefComplaint.trim();
  } else {
    mainProblem = 'Motivo de consulta no especificado';
  }

  // 2. Evolution
  const evolution: NarrativeSummary['evolution'] = {
    hasChange: false,
  };

  // Pain change from numeric patterns in subjective text (e.g. "7/10" ... "3/10")
  if (f.subjectiveText) {
    const matches = f.subjectiveText.match(/\b(\d)\/10\b/g) || [];
    const numbers = matches
      .map((m) => {
        const n = parseInt(m.split('/')[0], 10);
        return Number.isNaN(n) ? undefined : n;
      })
      .filter((n): n is number => typeof n === 'number');

    if (numbers.length >= 2) {
      const inicial = numbers[0]!;
      const actual = numbers[numbers.length - 1]!;
      if (actual < inicial) {
        evolution.hasChange = true;
        evolution.direction = 'improved';
        evolution.painChangeText = `Disminución del dolor de ${inicial}/10 a ${actual}/10.`;
      } else if (actual > inicial) {
        evolution.hasChange = true;
        evolution.direction = 'worsened';
        evolution.painChangeText = `Aumento del dolor de ${inicial}/10 a ${actual}/10.`;
      }
    }
  }

  // Detect appearance of irradiation / sciatica terms
  const textAll = `${f.subjectiveText ?? ''} ${f.assessmentText ?? ''}`;
  // Only treat irradiation as worsening when NOT explicitly negated
  const hasNoIrradiation = /no\s+irradiad[oa]/i.test(textAll);
  const hasIrradiation = /irradiad[oa]|ciatalgia/i.test(textAll);
  if (!hasNoIrradiation && hasIrradiation) {
    evolution.hasChange = true;
    evolution.direction = evolution.direction || 'worsened';
    evolution.functionChangeText = 'Aparición de dolor irradiado en miembro inferior.';
  }

  // Red flag detection (neurological / cauda equina pattern)
  const redFlagPatterns = [
    /silla de montar/i,
    /perineal/i,
    /retenci[oó]n urinaria/i,
    /dificultad.*micci/i,
    /síndrome de cauda equina/i,
    /sindrome de cauda equina/i,
  ];
  const hasRedFlags = redFlagPatterns.some((r) => r.test(textAll));
  if (hasRedFlags) {
    evolution.hasChange = true;
    evolution.direction = 'redflag';
    evolution.redFlagText = 'Síntomas compatibles con posible compromiso neurológico grave.';
  }

  // Functional change: better tolerance to walking / ADLs
  const subj = f.subjectiveText ?? '';
  if (/mejor tolerancia a la marcha/i.test(subj) || /mejor tolerancia a las actividades/i.test(subj)) {
    evolution.hasChange = true;
    evolution.direction = evolution.direction || 'improved';
    evolution.functionChangeText =
      evolution.functionChangeText ?? 'Mejor tolerancia a la marcha y actividades diarias.';
  }
  if (/mayor dificultad para la marcha/i.test(subj) || /limitaci[oó]n funcional/i.test(subj)) {
    evolution.hasChange = true;
    evolution.direction = 'worsened';
    if (!evolution.functionChangeText) {
      evolution.functionChangeText = 'Mayor dificultad funcional referida por el paciente.';
    }
  }

  // Fallback: if no explicit change but we have a pain description, use it as highlight
  if (!evolution.hasChange && f.pain?.cursoTextoLibre) {
    evolution.evolutionHighlight = f.pain.cursoTextoLibre;
  }

  // 3. Key findings
  const keyFindings: NarrativeSummary['keyFindings'] = {};

  if (f.pain?.cursoTextoLibre) {
    keyFindings.painFinding = f.pain.cursoTextoLibre;
  } else if (f.chiefComplaint) {
    keyFindings.painFinding = f.chiefComplaint;
  }

  if (f.mobility && f.mobility.length) {
    const m = f.mobility[0];
    keyFindings.mobilityFinding = `${m.segmento}: ${m.rangoInicial || 'ver nota objetiva'}`;
  }

  if (f.tests && f.tests.length) {
    const relevantes = f.tests
      .slice(0, 3)
      .map((t) => `${t.nombre}: ${t.resultado}`)
      .join('; ');
    keyFindings.neuroOrTestFindings = relevantes;
  }

  if (f.assessmentText && /sin banderas rojas/i.test(f.assessmentText)) {
    keyFindings.redFlagStatus = 'Sin banderas rojas documentadas.';
  }

  // 4. Treatment summary
  const treatmentSummary: NarrativeSummary['treatmentSummary'] = {
    inClinic: f.treatments?.ejercicios?.slice(0, 3),
    homeProgram: f.treatments?.educacion?.slice(0, 3),
    education: [],
  };

  // 5. Plan summary
  const planSummary: NarrativeSummary['planSummary'] = {
    mainPlanText:
      (f.plan?.textoLibre && f.plan.textoLibre.trim()) ||
      (f.plan?.horizonteTiempo && f.plan.horizonteTiempo.trim()) ||
      'Plan de tratamiento no especificado.',
    followUpHorizon: f.plan?.horizonteTiempo,
    referralAdvice: f.plan?.textoLibre?.match(/Derivar a .+/i)?.[0],
  };

  return {
    mainProblem,
    secondaryProblems: undefined,
    evolution,
    keyFindings,
    treatmentSummary,
    planSummary,
  };
}

