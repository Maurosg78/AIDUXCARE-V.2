import { encountersRepo } from '@/repositories/encountersRepo';
import type { LongitudinalSignal } from '@/types/longitudinal';

function isSignalFromDifferentSession(signal: LongitudinalSignal, currentSessionId: string): boolean {
  return signal.sessionId !== currentSessionId;
}

function sortSignalsNewestFirst(signals: LongitudinalSignal[]): LongitudinalSignal[] {
  return [...signals].sort((left, right) => {
    const leftMillis = left.timestamp?.toMillis?.() ?? 0;
    const rightMillis = right.timestamp?.toMillis?.() ?? 0;
    return rightMillis - leftMillis;
  });
}

export async function retrievePreviousLongitudinalContext(
  patientId: string,
  currentSessionId: string
): Promise<LongitudinalSignal[]> {
  if (!patientId) {
    return [];
  }

  const previousEncounters = await encountersRepo.getEncountersByPatient(patientId, 3);
  const previousSignals = previousEncounters.flatMap((encounter) => {
    const signals = encounter.longitudinalSnapshot?.signals ?? [];
    return signals.filter((signal) => isSignalFromDifferentSession(signal, currentSessionId));
  });

  return sortSignalsNewestFirst(previousSignals);
}

export function formatLongitudinalSignalsForPrompt(signals: LongitudinalSignal[]): string | undefined {
  const compactSignals = signals
    .map((signal) => `${signal.signalType}: ${signal.value}`)
    .filter((line) => line.trim().length > 0)
    .slice(0, 8);

  if (compactSignals.length === 0) {
    return undefined;
  }

  return `Previous preserved clinical signals:\n${compactSignals.join('\n')}`;
}
