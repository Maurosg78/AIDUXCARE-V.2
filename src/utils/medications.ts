const TABLE: Record<string, string> = {
  'lírica': 'Lyrica (pregabalina)',
  'lirica': 'Lyrica (pregabalina)',
  'nolotil': 'Nolotil (metamizol)',
  'paracetamol': 'Paracetamol (acetaminofén)',
};

const normKey = (s: string) =>
  s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

export function normalizeMedicationName(raw: string): string {
  const key = normKey(raw);
  return TABLE[key] ?? raw.trim();
}

export function normalizeMedications(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of list) {
    const fixed = normalizeMedicationName(m);
    const k = normKey(fixed);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(fixed);
    }
  }
  return out;
}
