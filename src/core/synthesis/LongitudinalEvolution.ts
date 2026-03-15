import type { ClinicalFactSetLike } from './synthesizeClinicalNarrative';

export type LongitudinalDirection = 'improved' | 'worsened' | 'stable' | 'mixed';

export interface LongitudinalEvolutionSummary {
  hasSeries: boolean;
  direction: LongitudinalDirection;
  painSeries?: number[];
  baselinePain?: number;
  currentPain?: number;
  changeMagnitude?: number;
  absChange?: number;
  clinicallyMeaningful?: boolean;
  trendConfidence?: 'low' | 'medium' | 'high';
  visitsCount: number;
  narrativeText?: string;
}

function extractPainValueFromFacts(f: ClinicalFactSetLike): number | undefined {
  const src =
    f.facts.pain?.cursoTextoLibre ??
    `${f.facts.subjectiveText ?? ''} ${f.facts.assessmentText ?? ''} ${f.facts.objectiveText ?? ''}`;
  if (!src) return undefined;
  const match = src.match(/\b(\d{1,2})\/10\b/);
  if (!match) return undefined;
  const val = Number(match[1]);
  if (Number.isNaN(val) || val < 0 || val > 10) return undefined;
  return val;
}

function classifyDirection(series: number[]): LongitudinalDirection {
  if (series.length < 2) return 'stable';
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const totalDelta = Math.abs(last - first);
  if (totalDelta < 1) {
    return 'stable';
  }

  const deltas = series.slice(1).map((v, i) => v - series[i]!);
  const anyUp = deltas.some((d) => d > 0.5);
  const anyDown = deltas.some((d) => d < -0.5);

  if (anyDown && !anyUp) return 'improved';
  if (anyUp && !anyDown) return 'worsened';
  if (!anyUp && !anyDown) return 'stable';
  return 'mixed';
}

export function buildLongitudinalEvolutionFromFacts(
  series: ClinicalFactSetLike[]
): LongitudinalEvolutionSummary {
  const painSeries: number[] = [];
  for (const f of series) {
    const v = extractPainValueFromFacts(f);
    if (typeof v === 'number') {
      painSeries.push(v);
    } else {
      painSeries.push(NaN);
    }
  }

  const numericPainSeries = painSeries.filter((v) => !Number.isNaN(v));

  if (numericPainSeries.length < 2) {
    return {
      hasSeries: false,
      direction: 'stable',
      visitsCount: series.length,
    };
  }

  const direction = classifyDirection(numericPainSeries);
  const first = numericPainSeries[0]!;
  const last = numericPainSeries[numericPainSeries.length - 1]!;
  const changeMagnitude = last - first;
  const absChange = Math.abs(changeMagnitude);

  let trendConfidence: LongitudinalEvolutionSummary['trendConfidence'];
  if (numericPainSeries.length >= 4) {
    trendConfidence = 'high';
  } else if (numericPainSeries.length === 3) {
    trendConfidence = 'medium';
  } else {
    trendConfidence = 'low';
  }
  if (direction === 'mixed') {
    trendConfidence = 'low';
  }

  const clinicallyMeaningful = absChange >= 2;

  return {
    hasSeries: true,
    direction,
    painSeries: numericPainSeries,
    baselinePain: first,
    currentPain: last,
    changeMagnitude,
    absChange,
    clinicallyMeaningful,
    trendConfidence,
    visitsCount: series.length,
    narrativeText: buildLongitudinalNarrative(
      direction,
      numericPainSeries,
      first,
      last,
      clinicallyMeaningful
    ),
  };
}

export function shouldRenderLongitudinal(summary: LongitudinalEvolutionSummary): boolean {
  return (
    summary.hasSeries &&
    (summary.painSeries?.length ?? 0) >= 3 &&
    summary.trendConfidence !== 'low'
  );
}

export function renderLongitudinalEvolutionParagraph(
  summary: LongitudinalEvolutionSummary
): string | undefined {
  if (!shouldRenderLongitudinal(summary)) return undefined;
  return summary.narrativeText;
}

function buildLongitudinalNarrative(
  direction: LongitudinalDirection,
  series: number[],
  first: number,
  last: number,
  clinicallyMeaningful: boolean
): string {
  if (direction === 'improved') {
    if (clinicallyMeaningful) {
      return `Disminución progresiva del dolor reportado desde ${first}/10 en la visita inicial a ${last}/10 en la última sesión registrada.`;
    }
    return `Disminución progresiva del dolor reportado desde ${first}/10 en la visita inicial a ${last}/10 en la última sesión registrada.`;
  }
  if (direction === 'worsened') {
    return `Aumento progresivo del dolor desde ${first}/10 en la visita inicial a ${last}/10 en la última sesión registrada.`;
  }
  if (direction === 'stable') {
    return `Intensidad de dolor globalmente estable en torno a ${last}/10 a lo largo de las sesiones.`;
  }
  return `Evolución del dolor con variaciones entre sesiones (${series.join(
    ' → '
  )}/10), sin tendencia clara de mejoría sostenida.`;
}

