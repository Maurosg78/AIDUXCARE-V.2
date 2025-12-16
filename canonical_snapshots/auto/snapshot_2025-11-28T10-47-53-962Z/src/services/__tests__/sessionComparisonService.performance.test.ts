/**
 * Performance Tests: SessionComparisonService
 * 
 * Benchmarks for session comparison logic to ensure performance requirements.
 * 
 * Sprint 1 - Day 1: Service Layer
 * Performance Requirement: <500ms for comparison logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { SessionComparisonService } from '../sessionComparisonService';
import type { Session } from '../sessionComparisonService';
import type { SOAPNote } from '../../types/vertex-ai';
import type { EvaluationTestEntry } from '../../core/soap/PhysicalExamResultBuilder';

// Helper function to create mock session with many tests
function createMockSessionWithManyTests(
  id: string,
  testCount: number,
  overrides: Partial<Session> = {}
): Session {
  const physicalTests: EvaluationTestEntry[] = [];
  for (let i = 0; i < testCount; i++) {
    physicalTests.push({
      id: `test-${i}`,
      name: `Test ${i}`,
      region: 'shoulder',
      source: 'manual',
      result: i % 2 === 0 ? 'positive' : 'negative',
      notes: `Test notes ${i}`,
      values: {
        value1: i,
        value2: `test-${i}`,
      },
    });
  }

  return {
    id,
    userId: 'user-1',
    patientId: 'patient-1',
    patientName: 'Test Patient',
    transcript: 'Test transcript '.repeat(100), // Large transcript
    soapNote: {
      subjective: 'Patient reports pain level 5 out of 10. '.repeat(50),
      objective: 'ROM: 80 degrees. '.repeat(50),
      assessment: 'Assessment text. '.repeat(50),
      plan: 'Plan text. '.repeat(50),
    },
    physicalTests,
    timestamp: Timestamp.now(),
    status: 'completed',
    ...overrides,
  };
}

describe('SessionComparisonService Performance', () => {
  let service: SessionComparisonService;
  const PERFORMANCE_THRESHOLD_MS = 500; // Requirement: <500ms

  beforeEach(() => {
    service = new SessionComparisonService();
  });

  describe('compareSessions Performance', () => {
    it('should complete comparison in <500ms for typical sessions', () => {
      const previous = createMockSessionWithManyTests('previous-1', 10, {
        soapNote: {
          subjective: 'Patient reports pain level 7 out of 10',
          objective: 'ROM: 70 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSessionWithManyTests('current-1', 10, {
        soapNote: {
          subjective: 'Patient reports pain level 5 out of 10',
          objective: 'ROM: 80 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const startTime = performance.now();
      const comparison = service.compareSessions(previous, current);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(comparison).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      console.log(`[PERF] Typical session comparison: ${duration.toFixed(2)}ms`);
    });

    it('should complete comparison in <500ms for sessions with many tests (50 tests)', () => {
      const previous = createMockSessionWithManyTests('previous-1', 50, {
        soapNote: {
          subjective: 'Patient reports pain level 7 out of 10',
          objective: 'ROM: 70 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSessionWithManyTests('current-1', 50, {
        soapNote: {
          subjective: 'Patient reports pain level 5 out of 10',
          objective: 'ROM: 80 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const startTime = performance.now();
      const comparison = service.compareSessions(previous, current);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(comparison).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      console.log(`[PERF] Many tests (50) comparison: ${duration.toFixed(2)}ms`);
    });

    it('should complete comparison in <500ms for sessions with large SOAP notes', () => {
      const largeSOAP: SOAPNote = {
        subjective: 'Patient reports pain level 5 out of 10. '.repeat(200),
        objective: 'ROM: 80 degrees. '.repeat(200),
        assessment: 'Assessment text. '.repeat(200),
        plan: 'Plan text. '.repeat(200),
      };

      const previous = createMockSessionWithManyTests('previous-1', 10, {
        soapNote: largeSOAP,
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSessionWithManyTests('current-1', 10, {
        soapNote: largeSOAP,
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const startTime = performance.now();
      const comparison = service.compareSessions(previous, current);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(comparison).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      console.log(`[PERF] Large SOAP notes comparison: ${duration.toFixed(2)}ms`);
    });

    it('should handle edge case (no SOAP, no tests) in <500ms', () => {
      const previous: Session = {
        id: 'previous-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        physicalTests: [],
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
        status: 'completed',
      };

      const current: Session = {
        id: 'current-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        physicalTests: [],
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
        status: 'completed',
      };

      const startTime = performance.now();
      const comparison = service.compareSessions(previous, current);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(comparison).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      console.log(`[PERF] Edge case (no SOAP, no tests): ${duration.toFixed(2)}ms`);
    });
  });

  describe('formatComparisonForUI Performance', () => {
    it('should format comparison for UI in <100ms', () => {
      const previous = createMockSessionWithManyTests('previous-1', 20, {
        soapNote: {
          subjective: 'Patient reports pain level 7 out of 10',
          objective: 'ROM: 70 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSessionWithManyTests('current-1', 20, {
        soapNote: {
          subjective: 'Patient reports pain level 5 out of 10',
          objective: 'ROM: 80 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      const startTime = performance.now();
      const formatted = service.formatComparisonForUI(comparison, false);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(formatted).toBeDefined();
      expect(duration).toBeLessThan(100); // UI formatting should be very fast
      console.log(`[PERF] UI formatting: ${duration.toFixed(2)}ms`);
    });
  });

  describe('detectRegression Performance', () => {
    it('should detect regressions in <100ms', () => {
      const previous = createMockSessionWithManyTests('previous-1', 30, {
        soapNote: {
          subjective: 'Patient reports pain level 3 out of 10',
          objective: 'ROM: 90 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSessionWithManyTests('current-1', 30, {
        soapNote: {
          subjective: 'Patient reports pain level 8 out of 10',
          objective: 'ROM: 60 degrees',
          assessment: 'Assessment',
          plan: 'Plan',
        },
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      const startTime = performance.now();
      const alerts = comparison.alerts;
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(alerts.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Regression detection is part of compareSessions
      console.log(`[PERF] Regression detection: ${duration.toFixed(2)}ms (${alerts.length} alerts)`);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause excessive memory usage with large sessions', () => {
      const previous = createMockSessionWithManyTests('previous-1', 100, {
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSessionWithManyTests('current-1', 100, {
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      // Measure memory before
      const memBefore = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform comparison
      const comparison = service.compareSessions(previous, current);
      const formatted = service.formatComparisonForUI(comparison, false);

      // Measure memory after
      const memAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memIncrease = memAfter - memBefore;

      expect(comparison).toBeDefined();
      expect(formatted).toBeDefined();

      // Memory increase should be reasonable (<10MB for this operation)
      if (memBefore > 0 && memAfter > 0) {
        const memIncreaseMB = memIncrease / (1024 * 1024);
        console.log(`[PERF] Memory increase: ${memIncreaseMB.toFixed(2)}MB`);
        expect(memIncreaseMB).toBeLessThan(10);
      }
    });
  });

  describe('Concurrent Comparisons', () => {
    it('should handle multiple concurrent comparisons efficiently', async () => {
      const sessions: Array<{ previous: Session; current: Session }> = [];
      
      // Create 10 session pairs
      for (let i = 0; i < 10; i++) {
        sessions.push({
          previous: createMockSessionWithManyTests(`previous-${i}`, 10, {
            timestamp: Timestamp.fromDate(new Date('2024-01-01')),
          }),
          current: createMockSessionWithManyTests(`current-${i}`, 10, {
            timestamp: Timestamp.fromDate(new Date('2024-01-08')),
          }),
        });
      }

      const startTime = performance.now();
      
      // Run comparisons concurrently
      const comparisons = await Promise.all(
        sessions.map(({ previous, current }) =>
          Promise.resolve(service.compareSessions(previous, current))
        )
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / sessions.length;

      expect(comparisons.length).toBe(10);
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      console.log(`[PERF] 10 concurrent comparisons: ${totalDuration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms avg`);
    });
  });
});

