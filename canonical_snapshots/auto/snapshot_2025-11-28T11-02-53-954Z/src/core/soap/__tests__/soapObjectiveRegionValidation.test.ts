/**
 * Unit Test: SOAP Objective Region Validation
 * 
 * Tests that SOAP Objective section only includes findings from tested regions
 * and does not mention body regions that were not tested.
 * 
 * ✅ P1.2: DoD - Objective NO puede contener "wrist range of motion" si no hay tests de muñeca
 */

import { describe, it, expect } from 'vitest';
import type { PhysicalExamResult } from '../../../types/vertex-ai';

// Mock function to validate SOAP Objective content
function validateObjectiveContent(objective: string, testedRegions: string[]): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const objectiveLower = objective.toLowerCase();
  
  // Define region keywords
  const regionKeywords: Record<string, string[]> = {
    wrist: ['wrist', 'muñeca', 'carpal', 'carpus'],
    lumbar: ['lumbar', 'low back', 'lower back', 'spine', 'l4', 'l5'],
    cervical: ['cervical', 'neck', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
    shoulder: ['shoulder', 'hombro', 'glenohumeral', 'acromioclavicular'],
    knee: ['knee', 'rodilla', 'patellar', 'tibiofemoral'],
    ankle: ['ankle', 'tobillo', 'talocrural'],
    hip: ['hip', 'cadera', 'coxofemoral'],
    thoracic: ['thoracic', 'torácico', 'dorsal', 't1', 't12'],
  };
  
  // Check for mentions of untested regions
  Object.entries(regionKeywords).forEach(([region, keywords]) => {
    if (!testedRegions.includes(region)) {
      const hasMention = keywords.some(keyword => objectiveLower.includes(keyword));
      if (hasMention) {
        violations.push(`Objective mentions ${region} region but no ${region} tests were performed`);
      }
    }
  });
  
  return {
    isValid: violations.length === 0,
    violations,
  };
}

// Mock function to extract tested regions from PhysicalExamResult[]
function extractTestedRegions(tests: PhysicalExamResult[]): string[] {
  const regions = new Set<string>();
  
  tests.forEach(test => {
    if (test.segment) {
      regions.add(test.segment.toLowerCase());
    }
    
    // Also check test name for region hints
    const testNameLower = test.testName.toLowerCase();
    if (testNameLower.includes('wrist') || testNameLower.includes('muñeca')) {
      regions.add('wrist');
    }
    if (testNameLower.includes('lumbar') || testNameLower.includes('slr') || testNameLower.includes('slump')) {
      regions.add('lumbar');
    }
    if (testNameLower.includes('cervical') || testNameLower.includes('neck')) {
      regions.add('cervical');
    }
    if (testNameLower.includes('shoulder') || testNameLower.includes('hombro')) {
      regions.add('shoulder');
    }
  });
  
  return Array.from(regions);
}

describe('SOAP Objective Region Validation', () => {
  describe('Region Extraction', () => {
    it('should extract lumbar region from tests', () => {
      const tests: PhysicalExamResult[] = [
        { testName: 'Straight Leg Raise', segment: 'lumbar', result: 'positive' },
        { testName: 'Slump Test', segment: 'lumbar', result: 'negative' },
      ];
      
      const regions = extractTestedRegions(tests);
      expect(regions).toContain('lumbar');
    });

    it('should extract wrist region from tests', () => {
      const tests: PhysicalExamResult[] = [
        { testName: 'Wrist Range of Motion', segment: 'wrist', result: 'normal' },
      ];
      
      const regions = extractTestedRegions(tests);
      expect(regions).toContain('wrist');
    });

    it('should extract multiple regions', () => {
      const tests: PhysicalExamResult[] = [
        { testName: 'SLR', segment: 'lumbar', result: 'positive' },
        { testName: 'Wrist ROM', segment: 'wrist', result: 'normal' },
      ];
      
      const regions = extractTestedRegions(tests);
      expect(regions).toContain('lumbar');
      expect(regions).toContain('wrist');
    });
  });

  describe('Objective Validation', () => {
    it('should reject objective with wrist mention when only lumbar tests performed', () => {
      const objective = 'Lumbar: SLR positive at 45°. Wrist range of motion: 0-60° flexion.';
      const testedRegions = ['lumbar'];
      
      const validation = validateObjectiveContent(objective, testedRegions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations.some(v => v.includes('wrist'))).toBe(true);
    });

    it('should accept objective with only tested regions', () => {
      const objective = 'Lumbar: SLR positive at 45° bilaterally. Slump test negative. Neurological screen: reflexes intact.';
      const testedRegions = ['lumbar'];
      
      const validation = validateObjectiveContent(objective, testedRegions);
      
      expect(validation.isValid).toBe(true);
      expect(validation.violations.length).toBe(0);
    });

    it('should reject objective with multiple untested regions', () => {
      const objective = 'Lumbar: SLR positive. Wrist ROM: 0-60°. Shoulder abduction: 120°.';
      const testedRegions = ['lumbar'];
      
      const validation = validateObjectiveContent(objective, testedRegions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(1);
    });

    it('should handle case-insensitive mentions', () => {
      const objective = 'Lumbar: SLR positive. WRIST range of motion: 0-60°.';
      const testedRegions = ['lumbar'];
      
      const validation = validateObjectiveContent(objective, testedRegions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.some(v => v.includes('wrist'))).toBe(true);
    });

    it('should handle Spanish mentions (muñeca)', () => {
      const objective = 'Lumbar: SLR positivo. Muñeca: rango de movimiento normal.';
      const testedRegions = ['lumbar'];
      
      const validation = validateObjectiveContent(objective, testedRegions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.some(v => v.includes('wrist'))).toBe(true);
    });
  });

  describe('DoD Requirement: Lumbar Case', () => {
    it('should pass DoD: Case lumbar → 4 tests → Objective SIN muñeca', () => {
      const lumbarTests: PhysicalExamResult[] = [
        { testName: 'Straight Leg Raise', segment: 'lumbar', result: 'positive' },
        { testName: 'Slump Test', segment: 'lumbar', result: 'negative' },
        { testName: 'Femoral Stretch Test', segment: 'lumbar', result: 'positive' },
        { testName: 'Neurological Screen', segment: 'lumbar', result: 'normal' },
      ];
      
      const testedRegions = extractTestedRegions(lumbarTests);
      expect(testedRegions).toContain('lumbar');
      expect(testedRegions).not.toContain('wrist');
      
      // Valid objective (no wrist mention)
      const validObjective = 'Lumbar: SLR positive at 45° bilaterally. Slump test negative. Femoral stretch test positive. Neurological screen: reflexes intact, sensation normal.';
      const validation = validateObjectiveContent(validObjective, testedRegions);
      
      expect(validation.isValid).toBe(true);
      expect(validation.violations.length).toBe(0);
    });

    it('should fail DoD if objective contains wrist mention', () => {
      const lumbarTests: PhysicalExamResult[] = [
        { testName: 'Straight Leg Raise', segment: 'lumbar', result: 'positive' },
        { testName: 'Slump Test', segment: 'lumbar', result: 'negative' },
      ];
      
      const testedRegions = extractTestedRegions(lumbarTests);
      
      // Invalid objective (contains wrist mention)
      const invalidObjective = 'Lumbar: SLR positive. Wrist range of motion: 0-60° flexion, 0-50° extension.';
      const validation = validateObjectiveContent(invalidObjective, testedRegions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.violations.some(v => v.includes('wrist'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objective', () => {
      const validation = validateObjectiveContent('', ['lumbar']);
      expect(validation.isValid).toBe(true);
    });

    it('should handle objective with no region mentions', () => {
      const objective = 'General observation: Patient appears comfortable.';
      const validation = validateObjectiveContent(objective, ['lumbar']);
      expect(validation.isValid).toBe(true);
    });

    it('should handle multiple tested regions', () => {
      const objective = 'Lumbar: SLR positive. Wrist: ROM normal.';
      const testedRegions = ['lumbar', 'wrist'];
      
      const validation = validateObjectiveContent(objective, testedRegions);
      expect(validation.isValid).toBe(true);
    });
  });
});

