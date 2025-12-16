/**
 * Unit Tests: SOAP Objective Validator
 * 
 * Tests that SOAP Objective validation correctly identifies violations
 * when non-tested regions are mentioned.
 * 
 * Sprint 2: Clinical Tests → SOAP Pipeline Validation
 */

import { describe, it, expect } from 'vitest';
import { validateSOAPObjective, cleanSOAPObjective } from '../SOAPObjectiveValidator';
import type { PhysicalExamResult } from '../../../types/vertex-ai';

describe('SOAPObjectiveValidator', () => {
  describe('validateSOAPObjective', () => {
    it('should validate when only tested regions are mentioned', () => {
      const tests: PhysicalExamResult[] = [
        {
          testName: 'Straight Leg Raise',
          segment: 'lumbar',
          result: 'positive',
          findingsText: 'Right SLR: 60°, sharp pain radiating to posterior calf',
        },
        {
          testName: 'Lumbar Flexion',
          segment: 'lumbar',
          result: 'normal',
          findingsText: 'Full range of motion',
        },
      ];

      const objective = 'Physical examination revealed positive Straight Leg Raise test on the right side (60°), with sharp pain radiating to posterior calf. Lumbar flexion was within normal limits.';

      const result = validateSOAPObjective(objective, tests);

      expect(result.isValid).toBe(true);
      expect(result.testedRegions).toContain('lumbar');
      expect(result.violations).toHaveLength(0);
    });

    it('should detect violations when non-tested regions are mentioned', () => {
      const tests: PhysicalExamResult[] = [
        {
          testName: 'Straight Leg Raise',
          segment: 'lumbar',
          result: 'positive',
          findingsText: 'Right SLR: 60°',
        },
      ];

      // Objective mentions wrist, which was not tested
      const objective = 'Physical examination revealed positive Straight Leg Raise test. Wrist range of motion was normal.';

      const result = validateSOAPObjective(objective, tests);

      expect(result.isValid).toBe(false);
      expect(result.testedRegions).toContain('lumbar');
      expect(result.mentionedRegions).toContain('wrist');
      expect(result.violations).toContain('wrist');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect multiple violations', () => {
      const tests: PhysicalExamResult[] = [
        {
          testName: 'Cervical Flexion',
          segment: 'cervical',
          result: 'normal',
          findingsText: 'Full range',
        },
      ];

      // Objective mentions lumbar and shoulder, which were not tested
      const objective = 'Cervical flexion was normal. Lumbar range of motion was limited. Shoulder strength was decreased.';

      const result = validateSOAPObjective(objective, tests);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('lumbar');
      expect(result.violations).toContain('shoulder');
    });

    it('should handle empty test list', () => {
      const tests: PhysicalExamResult[] = [];
      const objective = 'No physical tests were performed.';

      const result = validateSOAPObjective(objective, tests);

      // Should not have violations if no tests were performed
      expect(result.testedRegions).toHaveLength(0);
    });

    it('should detect region from test name when segment not specified', () => {
      const tests: PhysicalExamResult[] = [
        {
          testName: 'Lumbar Flexion Test',
          result: 'normal',
          findingsText: 'Full range',
        },
      ];

      const objective = 'Lumbar flexion was within normal limits.';

      const result = validateSOAPObjective(objective, tests);

      expect(result.isValid).toBe(true);
      expect(result.testedRegions).toContain('lumbar');
    });
  });

  describe('cleanSOAPObjective', () => {
    it('should return original text when valid', () => {
      const tests: PhysicalExamResult[] = [
        {
          testName: 'Straight Leg Raise',
          segment: 'lumbar',
          result: 'positive',
          findingsText: 'Right SLR: 60°',
        },
      ];

      const objective = 'Positive Straight Leg Raise test on the right side.';

      const { cleanedText, validation } = cleanSOAPObjective(objective, tests);

      expect(cleanedText).toBe(objective);
      expect(validation.isValid).toBe(true);
    });

    it('should flag violations but keep original text for review', () => {
      const tests: PhysicalExamResult[] = [
        {
          testName: 'Straight Leg Raise',
          segment: 'lumbar',
          result: 'positive',
          findingsText: 'Right SLR: 60°',
        },
      ];

      const objective = 'Positive Straight Leg Raise test. Wrist range of motion was normal.';

      const { cleanedText, validation } = cleanSOAPObjective(objective, tests);

      expect(cleanedText).toBe(objective); // Keep original for clinician review
      expect(validation.isValid).toBe(false);
      expect(validation.violations).toContain('wrist');
    });
  });
});

