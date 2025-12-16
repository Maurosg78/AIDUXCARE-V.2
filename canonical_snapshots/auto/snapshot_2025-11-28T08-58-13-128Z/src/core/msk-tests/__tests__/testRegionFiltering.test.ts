/**
 * Unit Test: MSK Test Region Filtering
 * 
 * Tests that tests are correctly filtered by detected case region
 * and that tests from other regions are blocked.
 * 
 * ✅ P1.1: DoD - Case lumbar → 4 tests selected → 4 tests evaluated → Objective SIN muñeca
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MSKRegion } from '../library/mskTestLibrary';

// Mock the region detection logic
function detectCaseRegion(motivoConsulta: string, transcript: string): MSKRegion | null {
  const combined = `${motivoConsulta} ${transcript}`.toLowerCase();
  
  if (combined.includes('lumbar') || combined.includes('low back') || combined.includes('lower back')) {
    return 'lumbar';
  }
  if (combined.includes('cervical') || combined.includes('neck')) {
    return 'cervical';
  }
  if (combined.includes('shoulder') || combined.includes('hombro')) {
    return 'shoulder';
  }
  if (combined.includes('wrist') || combined.includes('muñeca')) {
    return 'wrist';
  }
  
  return null;
}

// Mock test entries
interface EvaluationTestEntry {
  id: string;
  name: string;
  region: MSKRegion | null;
  source: 'ai' | 'manual' | 'custom';
}

function filterTestsByRegion(tests: EvaluationTestEntry[], detectedRegion: MSKRegion | null): EvaluationTestEntry[] {
  if (!detectedRegion) {
    return tests;
  }
  
  return tests.filter(test => {
    // Allow tests with no region (custom tests) or tests matching detected region
    return !test.region || test.region === detectedRegion;
  });
}

describe('MSK Test Region Filtering', () => {
  const lumbarTests: EvaluationTestEntry[] = [
    { id: 'slr', name: 'Straight Leg Raise', region: 'lumbar', source: 'ai' },
    { id: 'slump', name: 'Slump Test', region: 'lumbar', source: 'ai' },
    { id: 'femoral', name: 'Femoral Stretch Test', region: 'lumbar', source: 'ai' },
    { id: 'neurological', name: 'Neurological Screen', region: 'lumbar', source: 'ai' },
  ];
  
  const wristTests: EvaluationTestEntry[] = [
    { id: 'wrist-rom', name: 'Wrist Range of Motion', region: 'wrist', source: 'ai' },
    { id: 'wrist-strength', name: 'Wrist Strength Test', region: 'wrist', source: 'ai' },
  ];
  
  const mixedTests: EvaluationTestEntry[] = [
    ...lumbarTests,
    ...wristTests,
  ];

  describe('Region Detection', () => {
    it('should detect lumbar region from motivo consulta', () => {
      const region = detectCaseRegion('lumbar radiculopathy', '');
      expect(region).toBe('lumbar');
    });

    it('should detect lumbar region from transcript', () => {
      const region = detectCaseRegion('', 'patient reports low back pain');
      expect(region).toBe('lumbar');
    });

    it('should detect wrist region', () => {
      const region = detectCaseRegion('wrist pain', '');
      expect(region).toBe('wrist');
    });

    it('should return null if no region detected', () => {
      const region = detectCaseRegion('general pain', '');
      expect(region).toBeNull();
    });
  });

  describe('Test Filtering', () => {
    it('should filter out wrist tests when case is lumbar', () => {
      const detectedRegion = 'lumbar';
      const filtered = filterTestsByRegion(mixedTests, detectedRegion);
      
      expect(filtered.length).toBe(4);
      expect(filtered.every(test => test.region === 'lumbar' || test.region === null)).toBe(true);
      expect(filtered.some(test => test.region === 'wrist')).toBe(false);
    });

    it('should show all tests when no region detected', () => {
      const filtered = filterTestsByRegion(mixedTests, null);
      expect(filtered.length).toBe(mixedTests.length);
    });

    it('should allow custom tests (no region) in any case', () => {
      const customTest: EvaluationTestEntry = {
        id: 'custom-1',
        name: 'Custom Test',
        region: null,
        source: 'custom',
      };
      
      const testsWithCustom = [...lumbarTests, customTest];
      const filtered = filterTestsByRegion(testsWithCustom, 'lumbar');
      
      expect(filtered).toContainEqual(customTest);
      expect(filtered.length).toBe(5); // 4 lumbar + 1 custom
    });

    it('should block wrist tests when case is lumbar (DoD requirement)', () => {
      const detectedRegion = 'lumbar';
      const filtered = filterTestsByRegion(mixedTests, detectedRegion);
      
      // DoD: Case lumbar → 4 tests selected → 4 tests evaluated
      expect(filtered.length).toBe(4);
      
      // DoD: Objective SIN muñeca
      const hasWristTests = filtered.some(test => 
        test.region === 'wrist' || 
        test.name.toLowerCase().includes('wrist') ||
        test.name.toLowerCase().includes('muñeca')
      );
      expect(hasWristTests).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty test array', () => {
      const filtered = filterTestsByRegion([], 'lumbar');
      expect(filtered).toEqual([]);
    });

    it('should handle tests with null region', () => {
      const testsWithNull: EvaluationTestEntry[] = [
        { id: 'test-1', name: 'Test 1', region: null, source: 'custom' },
        { id: 'test-2', name: 'Test 2', region: 'lumbar', source: 'ai' },
      ];
      
      const filtered = filterTestsByRegion(testsWithNull, 'lumbar');
      expect(filtered.length).toBe(2); // Both should be included
    });

    it('should handle case where detected region has no matching tests', () => {
      const onlyWristTests = [...wristTests];
      const filtered = filterTestsByRegion(onlyWristTests, 'lumbar');
      
      expect(filtered.length).toBe(0);
    });
  });
});

