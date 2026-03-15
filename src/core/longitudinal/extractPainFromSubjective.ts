/**
 * Extract pain level (0–10) from SOAP subjective text.
 * Used by SessionComparisonService (pain series) and Patient Clinical Memory (trajectory events).
 */
export function extractPainFromSubjective(subjective: string | undefined): number | null {
  if (!subjective?.trim()) return null;
  const patterns = [
    /(?:pain|dolor|EVA|VAS).*?(\d+)\s*(?:out of|de|\/)\s*10/i,
    /(\d+)\s*(?:out of|de|\/)\s*10/i,
    /(?:pain|dolor)\s*(?:level|nivel)?\s*:?\s*(\d+)/i,
  ];
  for (const pattern of patterns) {
    const m = subjective.match(pattern);
    if (m) {
      const value = parseInt(m[1], 10);
      if (!Number.isNaN(value) && value >= 0 && value <= 10) return value;
    }
  }
  return null;
}
