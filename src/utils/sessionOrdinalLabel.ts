/**
 * Session ordinal label: 1st, 2nd, 3rd... independent of visit type (Initial vs Follow-up).
 * Used in Patient context so "First session" / "Second session" is always by chronological order.
 */

const ORDINALS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
] as const;

/**
 * Returns a human label for the current session number (1-based).
 * Session 1 = "First session", Session 2 = "Second session", ... Session 10 = "Tenth session", then "Session N".
 */
export function getSessionOrdinalLabel(sessionNumber: number): string {
  if (sessionNumber < 1 || !Number.isFinite(sessionNumber)) {
    return 'First session';
  }
  const index = sessionNumber - 1;
  if (index < ORDINALS.length) {
    return `${ORDINALS[index]} session`;
  }
  return `Session ${sessionNumber}`;
}
