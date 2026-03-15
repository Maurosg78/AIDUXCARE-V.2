/**
 * Patient Clinical Memory — structured trajectory events, not generated text.
 * Enables pattern detection over longer horizons (e.g. "plateau ≥2 times", "improvement after N sessions").
 *
 * Architecture: Session facts → Trajectory engine → Patient Clinical Memory → AI considerations / Referral.
 */

import type { TrajectoryConfidence } from './trajectoryClassifier';

export type TrajectoryLabel = 'improved' | 'regressed' | 'plateau' | 'stable' | 'fluctuating';

export interface PatientTrajectoryEvent {
  patientId: string;
  encounterId: string;
  painScore: number;
  trajectory: TrajectoryLabel;
  trajectoryConfidence: TrajectoryConfidence;
  createdAt: Date;
}

export interface PatientPatternInsight {
  /** Short id for logging */
  patternId: string;
  /** Descriptive sentence for UI (observation only; not diagnosis or recommendation). */
  description: string;
}

/**
 * Detect simple patterns from last N events (oldest first).
 * No AI — logic only. Returns null if no pattern or too few events.
 */
export function detectPatternFromEvents(
  events: PatientTrajectoryEvent[],
  minEvents = 5
): PatientPatternInsight | null {
  if (!events || events.length < minEvents) return null;

  const labels = events.map((e) => (e.trajectory === 'stable' ? 'plateau' : e.trajectory));

  const plateauCount = labels.filter((l) => l === 'plateau').length;
  const improvedCount = labels.filter((l) => l === 'improved').length;
  const regressedCount = labels.filter((l) => l === 'regressed').length;

  // "Fluctuating response" — improved ≥2 and regressed ≥2 (e.g. 6→4→6→4→6); common in persistent pain
  if (improvedCount >= 2 && regressedCount >= 2) {
    return {
      patternId: 'fluctuating_persistent',
      description: 'Symptoms have fluctuated across sessions without a stable trend of improvement.',
    };
  }

  // "Repeated short plateaus before further improvement"
  if (plateauCount >= 2 && improvedCount >= 1) {
    const lastIsImproved = labels[labels.length - 1] === 'improved';
    if (lastIsImproved || improvedCount >= 2) {
      return {
        patternId: 'repeated_plateau_then_improvement',
        description:
          'This patient has shown repeated short plateaus before further improvement across recent sessions.',
      };
    }
  }

  // "Gradual improvement with short plateaus"
  if (plateauCount >= 1 && improvedCount >= 2) {
    return {
      patternId: 'gradual_improvement_with_plateaus',
      description:
        'This patient typically shows gradual improvement with short plateaus before further progress.',
    };
  }

  // "Consistent improvement over sessions"
  const lastThree = labels.slice(-3);
  if (lastThree.length >= 2 && lastThree.every((l) => l === 'improved')) {
    return {
      patternId: 'consistent_improvement',
      description: 'This patient has shown consistent improvement over recent sessions.',
    };
  }

  // "Stable/plateau dominant — no clear improvement yet"
  if (plateauCount >= 2 && improvedCount === 0 && labels.filter((l) => l === 'regressed').length === 0) {
    return {
      patternId: 'repeated_plateau',
      description: 'Pain levels have remained relatively stable across recent sessions with no clear trend yet.',
    };
  }

  return null;
}
