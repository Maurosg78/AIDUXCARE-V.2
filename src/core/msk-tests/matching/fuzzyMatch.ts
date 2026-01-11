import { MSK_TEST_LIBRARY, type PhysicalTest, type MskTestDefinition } from '../library/mskTestLibrary';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const toBigrams = (value: string): string[] => {
  const cleaned = normalize(value);
  if (cleaned.length < 2) return [cleaned];
  const bigrams: string[] = [];
  for (let i = 0; i < cleaned.length - 1; i += 1) {
    bigrams.push(cleaned.slice(i, i + 2));
  }
  return bigrams;
};

const diceCoefficient = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const bigramsA = toBigrams(a);
  const bigramsB = toBigrams(b);
  const counts = new Map<string, number>();

  bigramsA.forEach((gram) => {
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  });

  let shared = 0;
  bigramsB.forEach((gram) => {
    const count = counts.get(gram);
    if (count && count > 0) {
      counts.set(gram, count - 1);
      shared += 1;
    }
  });

  const total = bigramsA.length + bigramsB.length;
  return total === 0 ? 0 : (2 * shared) / total;
};

/**
 * Extract region keywords from input/test name
 * Returns array of region keywords found (lumbar, wrist, shoulder, etc.)
 */
const extractRegionKeywords = (text: string): string[] => {
  const normalized = normalize(text);
  const regions = ['lumbar', 'cervical', 'thoracic', 'shoulder', 'elbow', 'wrist', 'hand', 'hip', 'knee', 'ankle', 'foot', 'spine', 'back', 'neck'];
  const found: string[] = [];
  
  regions.forEach(region => {
    if (normalized.includes(region)) {
      found.push(region);
    }
  });
  
  return found;
};

/**
 * Check if regions are compatible (both have same region keywords, or one has none)
 */
const areRegionsCompatible = (inputRegions: string[], testRegion: string | null | undefined): boolean => {
  // If test has no region specified, allow match (could be general test)
  if (!testRegion) return true;
  
  // If input has no region keywords, allow match (could be general request)
  if (inputRegions.length === 0) return true;
  
  // Check if any input region keyword matches the test's region
  // e.g., input "lumbar range" should match test.region === "lumbar"
  return inputRegions.some(region => {
    // Direct match
    if (region === testRegion) return true;
    
    // Partial match (e.g., "back" includes "lumbar", "spine" includes "lumbar")
    if (region === 'back' && testRegion === 'lumbar') return true;
    if (region === 'spine' && (testRegion === 'lumbar' || testRegion === 'cervical' || testRegion === 'thoracic')) return true;
    if (region === 'neck' && testRegion === 'cervical') return true;
    
    return false;
  });
};

export function matchTestName(input: string, detectedCaseRegion?: string | null): PhysicalTest | MskTestDefinition | null {
  if (!input) return null;
  const normalizedInput = normalize(input);
  const inputRegions = extractRegionKeywords(input);
  
  // ✅ FIX: Filter library tests by detectedCaseRegion if provided
  // This prevents wrist tests from matching when case is lumbar
  let candidateTests = MSK_TEST_LIBRARY;
  if (detectedCaseRegion) {
    candidateTests = MSK_TEST_LIBRARY.filter(test => {
      // Allow tests with no region (general tests) or tests matching detected region
      return !test.region || test.region === detectedCaseRegion;
    });
    
    // If no tests match the detected region, fallback to all tests (backward compatibility)
    if (candidateTests.length === 0) {
      candidateTests = MSK_TEST_LIBRARY;
    }
  }
  
  let bestScore = 0;
  let bestMatch: PhysicalTest | MskTestDefinition | null = null;

  candidateTests.forEach((test) => {
    const score = diceCoefficient(normalizedInput, normalize(test.name));
    
    // ✅ FIX: Require region compatibility for higher threshold matches
    // This prevents "Lumbar Range of Motion" from matching "Wrist Range of Motion"
    const regionCompatible = areRegionsCompatible(inputRegions, test.region);
    
    // ✅ FIX: Also check against detectedCaseRegion if provided
    const matchesDetectedRegion = !detectedCaseRegion || !test.region || test.region === detectedCaseRegion;
    
    // If score is high but regions don't match, significantly penalize the score
    let adjustedScore = score;
    if (score >= 0.75 && (!regionCompatible || !matchesDetectedRegion)) {
      // Penalize by 0.3 points if regions don't match
      adjustedScore = score - 0.3;
    }
    
    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestMatch = test;
    }
  });

  // ✅ FIX: Increased threshold from 0.75 to 0.8 to reduce false positives
  // Also require region compatibility for matches >= 0.75
  if (bestScore >= 0.8) {
    // ✅ FIX: Double-check region compatibility before returning match
    if (detectedCaseRegion && bestMatch && bestMatch.region && bestMatch.region !== detectedCaseRegion) {
      // If detected region is specified and match doesn't match, return null
      return null;
    }
    return bestMatch;
  }
  
  // For scores between 0.75-0.8, only return match if regions are compatible
  if (bestScore >= 0.75 && bestMatch) {
    const regionCompatible = areRegionsCompatible(inputRegions, bestMatch.region);
    const matchesDetectedRegion = !detectedCaseRegion || !bestMatch.region || bestMatch.region === detectedCaseRegion;
    
    if (regionCompatible && matchesDetectedRegion) {
      return bestMatch;
    }
  }
  
  return null;
}
