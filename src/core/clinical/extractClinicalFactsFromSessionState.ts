import type { SessionState } from '@/types/sessionState';
import type { SOAPNote } from '@/types/vertex-ai';
import { normalizeClinicalText } from './textNormalization';
import type { ClinicalFactSetLike } from '@/core/synthesis/synthesizeClinicalNarrative';

/**
 * Extract clinical facts from SessionState + SOAPNote.
 *
 * Supports multiple real-world SOAP patterns:
 * - classic S/O/A/P
 * - information concentrated in Assessment
 * - bullets
 * - narrative text
 */
export function extractClinicalFactsFromSessionState(
  session: SessionState
): ClinicalFactSetLike | null {
  const soap: SOAPNote | undefined = session.soapNote;
  if (!soap) return null;

  const subjective = normalizeClinicalText(soap.subjective);
  const objective = normalizeClinicalText(soap.objective);
  const assessment = normalizeClinicalText(soap.assessment);

  const noisePatterns: RegExp[] = [/patient educated/i, /educado paciente/i];
  const isNoise = (s: string) => noisePatterns.some((re) => re.test(s));
  const removeNoise = (s: string) =>
    s
      .split('.')
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !isNoise(p))
      .join('. ');

  const facts: ClinicalFactSetLike = {
    context: {
      patientName: session.patientName ?? 'Paciente sin nombre',
      patientAge: undefined,
      patientId: session.patientId,
      episodeStartDate: undefined,
      visitType: session.sessionType,
      sessionSubtype: session.subtype,
    },
    facts: {
      subjectiveText: soap.subjective,
      objectiveText: soap.objective,
      assessmentText: soap.assessment,
      planText: soap.plan,
      treatments: {
        ejercicios: soap.planInClinic ?? [],
        tecnicasManuales: [],
        educacion: soap.planHomeProgram ?? [],
      },
      // Plan: separar claramente el contenido documentado en el PLAN de SOAP
      // (intervenciones / educación) del horizonte de seguimiento (followUp).
      plan: {
        horizonteTiempo: soap.followUp,
        textoLibre: soap.plan || soap.followUp,
      },
    },
  };

  // Chief complaint / diagnosis (minimal, non-inferential)
  if (subjective) {
    const firstChunk = subjective
      .split(/[.;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !isNoise(s))[0];
    if (firstChunk) {
      facts.facts.chiefComplaint = firstChunk;
    }
  }
  if (assessment) {
    const sentences = assessment
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);
    const firstNonNoise = sentences.find((s) => !isNoise(s));
    if (firstNonNoise) {
      facts.facts.diagnosis = firstNonNoise;
    }
  }

  // Combine fields as sources for pattern detection
  const objectiveSource = `${removeNoise(objective)} ${removeNoise(assessment)}`.trim();
  const painSource = `${removeNoise(subjective)} ${removeNoise(objective)} ${removeNoise(
    assessment
  )}`.trim();

  // Pain intensity pattern (e.g. "7/10" or "10/10")
  const painMatch = painSource.match(/\b(\d{1,2})\/10\b/);
  if (painMatch) {
    const valNum = Number(painMatch[1]);
    if (!Number.isNaN(valNum) && valNum >= 0 && valNum <= 10) {
      facts.facts.pain = {
        ...(facts.facts.pain ?? {}),
        cursoTextoLibre: `Dolor referido de ${valNum}/10`,
      };
    }
  }

  // Tests (Lasegue / Slump) from objective+assessment
  const tests: { nombre: string; resultado: string }[] = [];
  const lower = objectiveSource.toLowerCase();

  if (/lasegue/.test(lower)) {
    let resultado = 'ver nota objetiva';
    if (/lasegue\s*(\+|＋|positivo)/i.test(objectiveSource)) {
      resultado = 'positivo';
    } else if (/lasegue\s*(\-|−|negativo)/i.test(objectiveSource)) {
      resultado = 'negativo';
    }
    tests.push({ nombre: 'Lasegue', resultado });
  }

  if (/slump/.test(lower)) {
    let resultado = 'ver nota objetiva';
    if (/slump\s*(\+|＋|positivo)/i.test(objectiveSource)) {
      resultado = 'positivo';
    } else if (/slump\s*(\-|−|negativo)/i.test(objectiveSource)) {
      resultado = 'negativo';
    }
    tests.push({ nombre: 'Slump', resultado });
  }

  if (tests.length) {
    facts.facts.tests = tests;
  }

  if (typeof console !== 'undefined' && (console as any).debug) {
    // Lightweight telemetry for pilots; safe no-op in production logs
    (console as any).debug('[CLINICAL_FACTS]', {
      painDetected: !!facts.facts.pain,
      testsDetected: facts.facts.tests?.length ?? 0,
    });
  }

  return facts;
}

