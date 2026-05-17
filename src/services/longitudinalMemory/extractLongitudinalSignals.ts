import { Timestamp } from 'firebase/firestore';

import type { ClinicalAnalysis } from '@/utils/cleanVertexResponse';
import type {
  LongitudinalSignal,
  LongitudinalSignalSource,
  LongitudinalSignalType,
} from '@/types/longitudinal';

const MAX_SIGNAL_VALUE_LENGTH = 220;
const MAX_SIGNALS_PER_TYPE = 2;

const IMAGING_SCOPE_PATTERNS = [
  /hallazgos?\s+radiol[oó]gicos?/i,
  /an[aá]lisis\s+detallado\s+de\s+radiograf/i,
  /densidades?\s+radiopacas?/i,
  /patr[oó]n\s+de\s+gas/i,
  /la\s+radiograf[ií]a\s+muestra/i,
  /radiograf[ií]a\s+(?:lateral|anteroposterior)/i,
  /\b(?:rx|rm|tac|ecograf[ií]a)\b.*(?:muestra|evidencia|confirma|sugiere)/i,
];

const SIGNAL_MATCHERS: Record<LongitudinalSignalType, RegExp[]> = {
  pain_change: [
    /\bdolor\b/i,
    /\beva\b/i,
    /\b\d+\s*\/\s*10\b/i,
    /\b(?:mejor[ií]a|empeora|disminu|aumenta)\b/i,
  ],
  function_change: [
    /\bfunci[oó]n\b/i,
    /\bfuncional\b/i,
    /\bactividad(?:es)?\b/i,
    /\bteclear\b/i,
    /\bmarcha\b/i,
    /\bcarga\b/i,
  ],
  adherence_change: [
    /\badherencia\b/i,
    /\bhep\b/i,
    /\bejercicios?\s+en\s+casa\b/i,
    /\bprograma\s+domiciliario\b/i,
  ],
  medication_change: [
    /\bmedicaci[oó]n\b/i,
    /\baine\b/i,
    /\benantyum\b/i,
    /\bdexketoprofeno\b/i,
    /\bibuprofeno\b/i,
    /\bparacetamol\b/i,
  ],
  objective_measure_change: [
    /\brom\b/i,
    /\brango\s+de\s+movimiento\b/i,
    /\b\d+\s*°\b/i,
    /\bedema\b/i,
    /\bfuerza\b/i,
    /\bextensi[oó]n\b/i,
    /\bsupinaci[oó]n\b/i,
  ],
  patient_concern_repeated: [
    /\bpreocupaci[oó]n\b/i,
    /\bmiedo\b/i,
    /\btemor\b/i,
    /\breca[ií]da\b/i,
    /\bfrustraci[oó]n\b/i,
    /\bconfianza\b/i,
  ],
  treatment_response: [
    /\btoler(?:a|ado|ancia)\b/i,
    /\brespuesta\b/i,
    /\bmejor[ií]a\b/i,
    /\bprogreso\b/i,
    /\bestable\b/i,
    /\bfatiga\b/i,
  ],
  plan_change_reason: [
    /\bajust(?:e|a|ar)\b/i,
    /\bprogres(?:a|i[oó]n)\b/i,
    /\bmodific(?:a|aci[oó]n)\b/i,
    /\bcambiar\b/i,
    /\bpor\s+(?:dolor|tolerancia|adherencia|fatiga)\b/i,
  ],
};

function normalizeSignalValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_SIGNAL_VALUE_LENGTH);
}

function isSafeSignalValue(value: string): boolean {
  const normalizedValue = normalizeSignalValue(value);
  const hasValue = normalizedValue.length > 0;
  const isImagingVisualDerived = IMAGING_SCOPE_PATTERNS.some((pattern) => pattern.test(normalizedValue));

  return hasValue && !isImagingVisualDerived;
}

function collectTextCandidates(analysis: ClinicalAnalysis): string[] {
  return [
    analysis.motivo_consulta,
    ...(analysis.hallazgos_clinicos ?? []),
    ...(analysis.hallazgos_relevantes ?? []),
    ...(analysis.contexto_ocupacional ?? []),
    ...(analysis.contexto_psicosocial ?? []),
    ...(analysis.medicacion_actual ?? []),
    ...(analysis.biopsychosocial_functional_limitations ?? []),
    ...(analysis.biopsychosocial_psychological ?? []),
    ...(analysis.plan_tratamiento_sugerido ?? []),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function inferSource(signalType: LongitudinalSignalType): LongitudinalSignalSource {
  if (signalType === 'patient_concern_repeated') {
    return 'clinician_transcript';
  }

  if (signalType === 'objective_measure_change') {
    return 'objective_test';
  }

  return 'vertex_analysis';
}

function candidateMatchesSignal(candidate: string, signalType: LongitudinalSignalType): boolean {
  const matchers = SIGNAL_MATCHERS[signalType];
  return matchers.some((matcher) => matcher.test(candidate));
}

function pushSignal(
  signals: LongitudinalSignal[],
  signalType: LongitudinalSignalType,
  value: string,
  sessionId: string,
  timestamp: Timestamp
): void {
  const normalizedValue = normalizeSignalValue(value);
  const duplicateExists = signals.some((signal) => {
    return signal.signalType === signalType && signal.value === normalizedValue;
  });
  const typeCount = signals.filter((signal) => signal.signalType === signalType).length;

  if (duplicateExists || typeCount >= MAX_SIGNALS_PER_TYPE || !isSafeSignalValue(normalizedValue)) {
    return;
  }

  signals.push({
    signalType,
    value: normalizedValue,
    source: inferSource(signalType),
    sessionId,
    timestamp,
  });
}

export function extractLongitudinalSignalsFromClinicalAnalysis(
  analysis: ClinicalAnalysis | null | undefined,
  sessionId: string,
  timestamp: Timestamp = Timestamp.now()
): LongitudinalSignal[] {
  if (!analysis || !sessionId) {
    return [];
  }

  const candidates = collectTextCandidates(analysis);
  return extractLongitudinalSignalsFromTextCandidates(candidates, sessionId, timestamp);
}

export function extractLongitudinalSignalsFromTextCandidates(
  candidates: string[],
  sessionId: string,
  timestamp: Timestamp = Timestamp.now()
): LongitudinalSignal[] {
  if (!sessionId) {
    return [];
  }

  const signals: LongitudinalSignal[] = [];
  const signalTypes = Object.keys(SIGNAL_MATCHERS) as LongitudinalSignalType[];

  for (const candidate of candidates) {
    for (const signalType of signalTypes) {
      if (candidateMatchesSignal(candidate, signalType)) {
        pushSignal(signals, signalType, candidate, sessionId, timestamp);
      }
    }
  }

  return signals;
}
