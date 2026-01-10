/**
 * Utility to sort physical tests by clinical importance
 * 
 * Priority order:
 * 1. Evidence level (strong > moderate > emerging)
 * 2. Sensitivity (higher is better)
 * 3. Specificity (higher is better)
 * 4. Has rationale/justification (more info = more important)
 */

type PhysicalTest = {
  name?: string;
  test?: string;
  evidence_level?: string;
  evidencia?: string;
  sensitivity?: number | string; // Can be numeric or qualitative string
  sensibilidad?: number | string;
  specificity?: number | string; // Can be numeric or qualitative string
  especificidad?: number | string;
  sensitivityQualitative?: 'high' | 'moderate' | 'low' | string; // Qualitative value from library
  specificityQualitative?: 'high' | 'moderate' | 'low' | string; // Qualitative value from library
  justification?: string;
  justificacion?: string;
  rationale?: string;
  originalIndex?: number;
  [key: string]: any;
};

const EVIDENCE_LEVEL_WEIGHT: Record<string, number> = {
  'strong': 3,
  'moderate': 2,
  'emerging': 1,
  'high': 3,
  'medium': 2,
  'low': 1,
};

/**
 * Get evidence level weight for sorting
 */
function getEvidenceWeight(test: PhysicalTest): number {
  const level = (test.evidence_level || test.evidencia || '').toLowerCase();
  return EVIDENCE_LEVEL_WEIGHT[level] || 0;
}

/**
 * Convert qualitative sensitivity/specificity to numeric value (0-1 scale)
 * high = 0.8, moderate = 0.6, low = 0.4
 */
function qualitativeToNumeric(value: string | undefined | null): number {
  if (!value) return 0;
  const normalized = String(value).toLowerCase().trim();
  if (normalized === 'high' || normalized === 'hight') return 0.8;
  if (normalized === 'moderate' || normalized === 'medium') return 0.6;
  if (normalized === 'low') return 0.4;
  return 0;
}

/**
 * Get sensitivity value (0-1 scale)
 * Priority: numeric value > qualitative value > 0
 */
function getSensitivity(test: PhysicalTest): number {
  // Try numeric value first
  if (test.sensitivity !== undefined && typeof test.sensitivity === 'number') {
    return Math.max(0, Math.min(1, Number(test.sensitivity)));
  }
  if (test.sensibilidad !== undefined && typeof test.sensibilidad === 'number') {
    return Math.max(0, Math.min(1, Number(test.sensibilidad)));
  }
  
  // Try qualitative value
  if (test.sensitivityQualitative) {
    return qualitativeToNumeric(test.sensitivityQualitative);
  }
  if (test.sensitivity && typeof test.sensitivity === 'string') {
    return qualitativeToNumeric(test.sensitivity);
  }
  if (test.sensibilidad && typeof test.sensibilidad === 'string') {
    return qualitativeToNumeric(test.sensibilidad);
  }
  
  return 0;
}

/**
 * Get specificity value (0-1 scale)
 * Priority: numeric value > qualitative value > 0
 */
function getSpecificity(test: PhysicalTest): number {
  // Try numeric value first
  if (test.specificity !== undefined && typeof test.specificity === 'number') {
    return Math.max(0, Math.min(1, Number(test.specificity)));
  }
  if (test.especificidad !== undefined && typeof test.especificidad === 'number') {
    return Math.max(0, Math.min(1, Number(test.especificidad)));
  }
  
  // Try qualitative value
  if (test.specificityQualitative) {
    return qualitativeToNumeric(test.specificityQualitative);
  }
  if (test.specificity && typeof test.specificity === 'string') {
    return qualitativeToNumeric(test.specificity);
  }
  if (test.especificidad && typeof test.especificidad === 'string') {
    return qualitativeToNumeric(test.especificidad);
  }
  
  return 0;
}

/**
 * Calculate average score: (sensitivity + specificity) / 2
 * This gives a single metric to rank tests by clinical value
 */
function getAverageScore(test: PhysicalTest): number {
  const sensitivity = getSensitivity(test);
  const specificity = getSpecificity(test);
  return (sensitivity + specificity) / 2;
}

/**
 * Check if test has rationale/justification
 */
function hasRationale(test: PhysicalTest): boolean {
  return !!(
    test.justification ||
    test.justificacion ||
    test.rationale ||
    test.objetivo ||
    test.objective
  );
}

/**
 * Sort physical tests by clinical importance
 * 
 * @param tests Array of physical tests (can be strings or objects)
 * @returns Sorted array with most important tests first
 */
/**
 * Sort physical tests by clinical importance using average score
 * 
 * Priority order:
 * 1. Average score (sensitivity + specificity) / 2 - PRIMARY SORTING CRITERION
 * 2. Evidence level (strong > moderate > emerging)
 * 3. Sensitivity (higher is better)
 * 4. Specificity (higher is better)
 * 5. Has rationale/justification
 * 6. Original index (maintain order)
 */
export function sortPhysicalTestsByImportance(tests: (string | PhysicalTest)[]): (string | PhysicalTest)[] {
  return [...tests].sort((a, b) => {
    // Handle string tests (no metadata) - put them at the end
    if (typeof a === 'string' && typeof b === 'string') {
      return 0; // Keep original order for strings
    }
    if (typeof a === 'string') return 1; // Strings go to end
    if (typeof b === 'string') return -1; // Objects go first

    const testA = a as PhysicalTest;
    const testB = b as PhysicalTest;

    // ✅ PRIMARY SORTING: Average score (sensitivity + specificity) / 2
    // ✅ CTO REFINEMENT: Refined logic to handle cases where tests have different score availability
    const avgScoreA = getAverageScore(testA);
    const avgScoreB = getAverageScore(testB);
    const evidenceA = getEvidenceWeight(testA);
    const evidenceB = getEvidenceWeight(testB);
    
    // ✅ CTO REFINEMENT: If NINGUNO tiene scores (average score = 0), evidence level decide
    // Si ambos tienen mismo evidence level, ordenar alfabéticamente para consistencia
    if (avgScoreA === 0 && avgScoreB === 0) {
      const evidenceDiff = evidenceB - evidenceA; // Higher evidence level first
      if (evidenceDiff !== 0) {
        return evidenceDiff;
      }
      // Si mismo evidence level, ordenar alfabéticamente para consistencia
      const nameA = (testA.name || testA.test || '').toLowerCase();
      const nameB = (testB.name || testB.test || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    
    // ✅ CTO REFINEMENT: Si AMBOS tienen scores, score decide
    if (avgScoreA > 0 && avgScoreB > 0) {
      const scoreDiff = avgScoreB - avgScoreA; // Higher average score first
      if (Math.abs(scoreDiff) > 0.01) {
        return scoreDiff;
      }
      // Si scores son iguales, continuar con otros tiebreakers abajo
    }
    
    // ✅ CTO REFINEMENT: Si SOLO UNO tiene scores, depende de evidence level del otro:
    // - Si test sin scores tiene "strong" → priorizar (es más confiable que moderate con scores)
    // - Si test sin scores tiene "moderate" o menos → el con scores gana
    if (avgScoreA === 0 && avgScoreB > 0) {
      // Test A no tiene scores, Test B sí tiene
      const evidenceLevelA = (testA.evidence_level || testA.evidencia || '').toLowerCase();
      if (evidenceLevelA === 'strong') {
        return -1; // Test A (strong evidence, sin scores) gana sobre Test B (con scores)
      }
      return 1; // Test B (con scores) gana sobre Test A (moderate/emerging, sin scores)
    }
    
    if (avgScoreB === 0 && avgScoreA > 0) {
      // Test B no tiene scores, Test A sí tiene
      const evidenceLevelB = (testB.evidence_level || testB.evidencia || '').toLowerCase();
      if (evidenceLevelB === 'strong') {
        return 1; // Test B (strong evidence, sin scores) gana sobre Test A (con scores)
      }
      return -1; // Test A (con scores) gana sobre Test B (moderate/emerging, sin scores)
    }

    // 2. Compare evidence level (strong > moderate > emerging) - as secondary criterion or tiebreaker
    if (evidenceA !== evidenceB) {
      return evidenceB - evidenceA; // Higher weight first
    }

    // 3. Compare sensitivity (higher is better) - tiebreaker
    const sensitivityA = getSensitivity(testA);
    const sensitivityB = getSensitivity(testB);
    if (Math.abs(sensitivityA - sensitivityB) > 0.01) {
      return sensitivityB - sensitivityA; // Higher sensitivity first
    }

    // 4. Compare specificity (higher is better) - tiebreaker
    const specificityA = getSpecificity(testA);
    const specificityB = getSpecificity(testB);
    if (Math.abs(specificityA - specificityB) > 0.01) {
      return specificityB - specificityA; // Higher specificity first
    }

    // 5. Prefer tests with rationale/justification
    const hasRationaleA = hasRationale(testA);
    const hasRationaleB = hasRationale(testB);
    if (hasRationaleA !== hasRationaleB) {
      return hasRationaleB ? 1 : -1; // Tests with rationale first
    }

    // 6. Maintain original order if all else is equal
    const indexA = testA.originalIndex ?? 0;
    const indexB = testB.originalIndex ?? 0;
    return indexA - indexB;
  });
}

/**
 * Get top N most important tests
 * 
 * @param tests Array of physical tests
 * @param limit Number of top tests to return (default: 5)
 * @returns Object with topTests and remainingTests
 */
export function getTopPhysicalTests(
  tests: (string | PhysicalTest)[],
  limit: number = 5
): {
  topTests: (string | PhysicalTest)[];
  remainingTests: (string | PhysicalTest)[];
} {
  const sorted = sortPhysicalTestsByImportance(tests);
  return {
    topTests: sorted.slice(0, limit),
    remainingTests: sorted.slice(limit),
  };
}

