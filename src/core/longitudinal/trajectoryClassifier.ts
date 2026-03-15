/**
 * Trajectory pattern classifier for rehabilitation / pain evolution.
 * Backend-only, no LLM. Used to describe evolution in SOAP/referral/Fase C considerations
 * without inferring treatment strategy (documentation support only).
 *
 * Pipeline: Clinical sessions → SessionComparisonService → TrajectoryClassifier → Longitudinal summary → Prompt
 */

export type TrajectoryPattern = 'improved' | 'regressed' | 'stable' | 'fluctuating';

export type TrajectoryConfidence = 'low' | 'medium' | 'high';

export interface TrajectoryClassification {
  pattern: TrajectoryPattern;
  confidence: TrajectoryConfidence;
  /** For prompt/UI: e.g. "improved", "plateau", "fluctuating" */
  label: string;
}

const IMPROVED_DELTA_THRESHOLD = -2;
const REGRESSED_DELTA_THRESHOLD = 2;
const STABLE_VARIANCE_THRESHOLD = 1;
const HIGH_CONFIDENCE_DELTA = 2;
const MEDIUM_CONFIDENCE_DELTA = 1;

function variance(series: number[]): number {
  if (series.length < 2) return 0;
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const sumSq = series.reduce((acc, x) => acc + (x - mean) ** 2, 0);
  return sumSq / series.length;
}

/**
 * Classifies a series of pain values (e.g. 0–10 scale) into a trajectory pattern.
 * Algorithm is deterministic; no ML. Suitable for 2+ points (e.g. previous vs current, or last N visits).
 */
export function classifyTrajectory(series: number[]): TrajectoryClassification {
  const valid = series.filter((n) => typeof n === 'number' && !Number.isNaN(n) && n >= 0 && n <= 10);
  if (valid.length < 2) {
    return { pattern: 'stable', confidence: 'low', label: 'stable' };
  }

  const first = valid[0]!;
  const last = valid[valid.length - 1]!;
  const delta = last - first;
  const absDelta = Math.abs(delta);
  const varVal = variance(valid);

  let pattern: TrajectoryPattern;
  let confidence: TrajectoryConfidence;

  if (delta <= IMPROVED_DELTA_THRESHOLD) {
    pattern = 'improved';
    confidence = absDelta >= HIGH_CONFIDENCE_DELTA ? 'high' : absDelta >= MEDIUM_CONFIDENCE_DELTA ? 'medium' : 'low';
  } else if (delta >= REGRESSED_DELTA_THRESHOLD) {
    pattern = 'regressed';
    confidence = absDelta >= HIGH_CONFIDENCE_DELTA ? 'high' : absDelta >= MEDIUM_CONFIDENCE_DELTA ? 'medium' : 'low';
  } else if (valid.length >= 3 && varVal > STABLE_VARIANCE_THRESHOLD) {
    pattern = 'fluctuating';
    confidence = 'medium';
  } else {
    pattern = 'stable';
    confidence = valid.length >= 3 && varVal < 0.5 ? 'high' : absDelta < 1 ? 'medium' : 'low';
  }

  const label = pattern === 'stable' ? 'plateau' : pattern;
  return { pattern, confidence, label };
}

/**
 * Convenience: classify from previous and current pain (e.g. from SessionComparison).
 * Returns null if either value is missing or invalid.
 */
export function classifyTrajectoryFromTwoPoints(
  previous: number | null | undefined,
  current: number | null | undefined
): TrajectoryClassification | null {
  if (typeof previous !== 'number' || typeof current !== 'number' || Number.isNaN(previous) || Number.isNaN(current)) {
    return null;
  }
  if (previous < 0 || previous > 10 || current < 0 || current > 10) return null;
  return classifyTrajectory([previous, current]);
}
