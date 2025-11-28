/**
 * SOAP Objective Validator
 * 
 * Validates that SOAP Objective section only includes findings from tested regions.
 * This ensures clinical accuracy and prevents mentioning non-tested body regions.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Sprint 2: Clinical Tests → SOAP Pipeline Validation
 */

import type { PhysicalExamResult } from '../../types/vertex-ai';

export interface SOAPValidationResult {
  isValid: boolean;
  testedRegions: string[];
  mentionedRegions: string[];
  violations: string[];
  warnings: string[];
}

/**
 * Common body regions and their variations
 */
const BODY_REGIONS: Record<string, string[]> = {
  lumbar: ['lumbar', 'lower back', 'low back', 'lumbosacral', 'l5-s1', 'l4-l5', 'l3-l4'],
  cervical: ['cervical', 'neck', 'c-spine', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
  thoracic: ['thoracic', 'mid back', 't-spine', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'],
  shoulder: ['shoulder', 'glenohumeral', 'acromioclavicular', 'ac joint', 'gh joint'],
  elbow: ['elbow', 'olecranon', 'radial head'],
  wrist: ['wrist', 'carpal', 'carpals', 'carpus'],
  hand: ['hand', 'fingers', 'finger', 'thumb', 'metacarpal'],
  hip: ['hip', 'pelvis', 'pelvic', 'sacroiliac', 'si joint'],
  knee: ['knee', 'patella', 'patellar', 'tibiofemoral'],
  ankle: ['ankle', 'talocrural', 'subtalar'],
  foot: ['foot', 'feet', 'toes', 'toe', 'metatarsal'],
};

/**
 * Extracts tested regions from PhysicalExamResult[]
 */
function extractTestedRegions(tests: PhysicalExamResult[]): string[] {
  const regions = new Set<string>();
  
  tests.forEach(test => {
    if (test.segment) {
      regions.add(test.segment.toLowerCase());
    }
    
    // Also check test name for region indicators
    const testNameLower = test.testName.toLowerCase();
    Object.entries(BODY_REGIONS).forEach(([region, variations]) => {
      if (variations.some(v => testNameLower.includes(v))) {
        regions.add(region);
      }
    });
  });
  
  return Array.from(regions);
}

/**
 * Extracts mentioned regions from SOAP Objective text
 */
function extractMentionedRegions(objectiveText: string): string[] {
  const mentioned = new Set<string>();
  const textLower = objectiveText.toLowerCase();
  
  Object.entries(BODY_REGIONS).forEach(([region, variations]) => {
    if (variations.some(v => textLower.includes(v))) {
      mentioned.add(region);
    }
  });
  
  return Array.from(mentioned);
}

/**
 * Validates that SOAP Objective only mentions tested regions
 */
export function validateSOAPObjective(
  objectiveText: string,
  testedTests: PhysicalExamResult[]
): SOAPValidationResult {
  const testedRegions = extractTestedRegions(testedTests);
  const mentionedRegions = extractMentionedRegions(objectiveText);
  
  // Find violations: regions mentioned but not tested
  const violations: string[] = [];
  const warnings: string[] = [];
  
  mentionedRegions.forEach(mentioned => {
    if (!testedRegions.includes(mentioned)) {
      violations.push(mentioned);
    }
  });
  
  // Check for common violations
  if (violations.length > 0) {
    warnings.push(
      `SOAP Objective mentions ${violations.join(', ')} region(s) that were not tested. ` +
      `Only tested regions should be described: ${testedRegions.join(', ') || 'none identified'}.`
    );
  }
  
  // Check if tested regions are mentioned (good)
  const testedButNotMentioned = testedRegions.filter(r => !mentionedRegions.includes(r));
  if (testedButNotMentioned.length > 0 && testedRegions.length > 0) {
    warnings.push(
      `Tested regions (${testedButNotMentioned.join(', ')}) may not be clearly described in Objective section.`
    );
  }
  
  return {
    isValid: violations.length === 0,
    testedRegions,
    mentionedRegions,
    violations,
    warnings,
  };
}

/**
 * Validates and filters SOAP Objective text to remove non-tested regions
 * Returns cleaned text and validation result
 */
export function cleanSOAPObjective(
  objectiveText: string,
  testedTests: PhysicalExamResult[]
): {
  cleanedText: string;
  validation: SOAPValidationResult;
} {
  const validation = validateSOAPObjective(objectiveText, testedTests);
  
  // If valid, return as-is
  if (validation.isValid) {
    return {
      cleanedText: objectiveText,
      validation,
    };
  }
  
  // If violations found, attempt to clean (conservative approach)
  // For now, just return original with warnings
  // In production, could implement more aggressive cleaning
  return {
    cleanedText: objectiveText, // Keep original, but flag for review
    validation,
  };
}

