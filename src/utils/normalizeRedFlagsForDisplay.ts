/**
 * WO-UI-REDFLAGS-EMPTY: Vertex / JSON may send red_flags as a JSON string (e.g. "[]").
 * UI must always see a real array and treat empty / "[]" as no flags to render.
 */

export function normalizeRedFlagsForDisplay(raw: unknown): unknown[] {
  const emptyList: unknown[] = [];

  if (raw == null) {
    return emptyList;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '[]') {
      return emptyList;
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) {
        return emptyList;
      }
      const fromJson = parsed;
      return fromJson;
    } catch {
      const asSingle = [trimmed];
      return asSingle;
    }
  }

  if (Array.isArray(raw)) {
    const copy = [...raw];
    return copy;
  }

  return emptyList;
}

export function filterTrivialRedFlagEntries(flags: unknown[]): unknown[] {
  const input = flags;
  const result: unknown[] = [];
  for (const item of input) {
    if (item == null) continue;
    if (typeof item === 'string') {
      const s = item.trim();
      if (s === '' || s === '[]') continue;
    }
    result.push(item);
  }
  return result;
}
