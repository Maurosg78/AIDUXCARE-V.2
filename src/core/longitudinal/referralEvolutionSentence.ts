/**
 * Referral report: automatic evolution sentence from trajectory + pain series.
 * Descriptive only; no recommendations. Regulatorily safe.
 *
 * Guardrail: only use when painSeries.length >= 2 and confidence !== 'low'
 * (enforced by caller getReferralEvolutionSentence).
 */

import type { TrajectoryConfidence } from './trajectoryClassifier';

const withScale = (s: string) => (s && !s.includes('/10') ? `${s}/10` : s);

/** Pattern label from classifier: improved | regressed | plateau | fluctuating */
export function buildReferralEvolutionSentence(
  label: string,
  painSeriesSummary: string,
  _confidence: TrajectoryConfidence
): string {
  const series = painSeriesSummary.split(/\s*[→\-]\s*/).map((s) => s.trim()).filter(Boolean);
  const first = series[0];
  const last = series[series.length - 1];
  const seriesWithScale = withScale(painSeriesSummary.trim()) || painSeriesSummary;

  switch (label.toLowerCase()) {
    case 'improved':
      return `Over the last ${series.length >= 3 ? 'three' : 'recent'} sessions, reported pain has decreased from ${withScale(first ?? '')} to ${withScale(last ?? '')}, suggesting a positive response to the current rehabilitation program.`;
    case 'regressed':
      return `Pain scores have increased over recent sessions (${seriesWithScale}), indicating a possible regression in symptoms.`;
    case 'plateau':
    case 'stable':
      return `Pain levels have remained relatively stable across the last sessions (${seriesWithScale}), suggesting a plateau in symptom progression.`;
    case 'fluctuating':
      return `Pain levels have fluctuated across sessions (${seriesWithScale}), without a clear trend of improvement.`;
    default:
      return `Over recent sessions, pain evolution: ${seriesWithScale}.`;
  }
}
