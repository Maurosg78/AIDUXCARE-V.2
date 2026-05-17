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

function normalizeDateKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T12:00:00`);
  return Number.isFinite(parsed.getTime()) ? trimmed : null;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKeyFromUnknown(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = normalizeDateKey(value);
    if (normalized) return normalized;
    const parsedTime = Date.parse(value);
    return Number.isFinite(parsedTime) ? localDateKey(new Date(parsedTime)) : null;
  }
  if (value instanceof Date) return localDateKey(value);
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') return localDateKey(toDate.call(value));
  }
  return null;
}

export async function retrievePreviousLongitudinalContext(
  patientId: string,
  currentSessionId: string,
  options: { asOfDateKey?: string } = {}
): Promise<LongitudinalSignal[]> {
  if (!patientId) {
    return [];
  }

  const asOfDateKey = normalizeDateKey(options.asOfDateKey);
  const previousEncounters = await encountersRepo.getEncountersByPatient(patientId, asOfDateKey ? 50 : 3);
  const previousSignals = previousEncounters.filter((encounter) => {
    if (!asOfDateKey) return true;
    const encounterDateKey = dateKeyFromUnknown(encounter.encounterDate);
    return encounterDateKey != null && encounterDateKey <= asOfDateKey;
  }).flatMap((encounter) => {
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
