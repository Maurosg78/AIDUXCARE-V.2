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

export function matchTestName(input: string): PhysicalTest | MskTestDefinition | null {
  if (!input) return null;
  const normalizedInput = normalize(input);
  let bestScore = 0;
  let bestMatch: PhysicalTest | MskTestDefinition | null = null;

  MSK_TEST_LIBRARY.forEach((test) => {
    const score = diceCoefficient(normalizedInput, normalize(test.name));
    if (score > bestScore) {
      bestScore = score;
      bestMatch = test;
    }
  });

  return bestScore >= 0.75 ? bestMatch : null;
}
