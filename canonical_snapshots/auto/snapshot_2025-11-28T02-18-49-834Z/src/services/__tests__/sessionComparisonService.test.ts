/**
 * Unit Tests: SessionComparisonService
 * 
 * Tests for session comparison logic, regression detection, and UI formatting.
 * 
 * Sprint 1 - Day 1: Service Layer
 * Coverage Target: >80%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  SessionComparisonService,
  type Session,
  type SessionComparison,
  type SessionMetrics,
} from '../sessionComparisonService';
import type { SOAPNote } from '../../types/vertex-ai';
import type { EvaluationTestEntry } from '../../core/soap/PhysicalExamResultBuilder';

// Mock Firestore
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
  };
});

// Helper function to create mock session
function createMockSession(overrides: Partial<Session> = {}): Session {
  const defaultSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    patientId: 'patient-1',
    patientName: 'Test Patient',
    transcript: 'Test transcript',
    soapNote: {
      subjective: 'Patient reports pain level 5 out of 10',
      objective: 'ROM: 80 degrees',
      assessment: 'Assessment text',
      plan: 'Plan text',
    },
    physicalTests: [],
    timestamp: Timestamp.now(),
    status: 'completed',
  };

  return { ...defaultSession, ...overrides };
}

// Helper function to create mock SOAP note
function createMockSOAPNote(overrides: Partial<SOAPNote> = {}): SOAPNote {
  return {
    subjective: 'Patient reports pain level 5 out of 10',
    objective: 'ROM: 80 degrees',
    assessment: 'Assessment text',
    plan: 'Plan text',
    ...overrides,
  };
}

// Helper function to create mock evaluation test
function createMockEvaluationTest(
  name: string,
  result: 'normal' | 'positive' | 'negative' | 'inconclusive' = 'normal'
): EvaluationTestEntry {
  return {
    id: `test-${name}`,
    name,
    region: 'shoulder',
    source: 'manual',
    result,
    notes: `Test notes for ${name}`,
  };
}

describe('SessionComparisonService', () => {
  let service: SessionComparisonService;

  beforeEach(() => {
    // Create a new instance for each test to avoid state pollution
    service = new SessionComparisonService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // TESTS: getPreviousSession
  // ========================================================================

  describe('getPreviousSession', () => {
    it('should return null for new patient (no previous sessions)', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
      } as any);

      const result = await service.getPreviousSession('patient-1', 'current-session-1', 'user-1');

      expect(result).toBeNull();
    });

    it('should return most recent session excluding current session', async () => {
      const { getDocs } = await import('firebase/firestore');
      const previousSession = createMockSession({
        id: 'previous-session-1',
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });
      const currentSession = createMockSession({
        id: 'current-session-1',
        timestamp: Timestamp.fromDate(new Date('2024-01-02')),
      });

      vi.mocked(getDocs).mockResolvedValue({
        empty: false,
        docs: [
          { id: 'current-session-1', data: () => currentSession },
          { id: 'previous-session-1', data: () => previousSession },
        ],
      } as any);

      const result = await service.getPreviousSession('patient-1', 'current-session-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('previous-session-1');
    });

    it('should return null if current session is the only one', async () => {
      const { getDocs } = await import('firebase/firestore');
      const currentSession = createMockSession({
        id: 'current-session-1',
      });

      vi.mocked(getDocs).mockResolvedValue({
        empty: false,
        docs: [{ id: 'current-session-1', data: () => currentSession }],
      } as any);

      const result = await service.getPreviousSession('patient-1', 'current-session-1', 'user-1');

      expect(result).toBeNull();
    });

    it('should only return completed sessions', async () => {
      const { getDocs } = await import('firebase/firestore');
      const draftSession = createMockSession({
        id: 'draft-session-1',
        status: 'draft',
      });
      const completedSession = createMockSession({
        id: 'completed-session-1',
        status: 'completed',
      });

      vi.mocked(getDocs).mockResolvedValue({
        empty: false,
        docs: [
          { id: 'current-session-1', data: () => createMockSession({ id: 'current-session-1' }) },
          { id: 'completed-session-1', data: () => completedSession },
          { id: 'draft-session-1', data: () => draftSession },
        ],
      } as any);

      const result = await service.getPreviousSession('patient-1', 'current-session-1', 'user-1');

      // Should return completed session, not draft
      expect(result?.id).toBe('completed-session-1');
    });

    it('should handle errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Firestore error'));

      await expect(
        service.getPreviousSession('patient-1', 'current-session-1', 'user-1')
      ).rejects.toThrow('Failed to retrieve previous session');
    });
  });

  // ========================================================================
  // TESTS: compareSessions
  // ========================================================================

  describe('compareSessions', () => {
    it('should calculate correct deltas for improved pain level', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 7 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.deltas.painLevel).toBeLessThan(0); // Negative = improvement
      expect(comparison.deltas.overallProgress).toBe('improved');
      expect(comparison.deltas.daysBetweenSessions).toBe(7);
    });

    it('should calculate correct deltas for regressed pain level', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 3 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 7 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.deltas.painLevel).toBeGreaterThan(0); // Positive = worse
      expect(comparison.deltas.overallProgress).toBe('regressed');
    });

    it('should calculate correct deltas for stable pain level', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(Math.abs(comparison.deltas.painLevel)).toBeLessThan(0.2);
      expect(comparison.deltas.overallProgress).toBe('stable');
    });

    it('should extract functional tests correctly', () => {
      const previous = createMockSession({
        id: 'previous-1',
        physicalTests: [
          createMockEvaluationTest('Shoulder Impingement', 'positive'),
          createMockEvaluationTest('Neer Test', 'negative'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        physicalTests: [
          createMockEvaluationTest('Shoulder Impingement', 'negative'),
          createMockEvaluationTest('Neer Test', 'negative'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.previousSession.metrics.testCount).toBe(2);
      expect(comparison.currentSession.metrics.testCount).toBe(2);
      expect(comparison.deltas.testCountChange).toBe(0);
    });

    it('should handle missing pain level in previous session', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'No pain mentioned',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.previousSession.metrics.painLevel).toBeUndefined();
      expect(comparison.currentSession.metrics.painLevel).toBe(5);
      expect(comparison.deltas.painLevel).toBe(0); // No comparison possible
    });

    it('should calculate SOAP completeness correctly', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Subjective',
          objective: 'Objective',
          assessment: '',
          plan: '',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Subjective',
          objective: 'Objective',
          assessment: 'Assessment',
          plan: 'Plan',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.previousSession.metrics.soapCompleteness).toBe(50);
      expect(comparison.currentSession.metrics.soapCompleteness).toBe(100);
    });
  });

  // ========================================================================
  // TESTS: detectRegression
  // ========================================================================

  describe('detectRegression', () => {
    it('should detect regression when pain increases >20%', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 7 out of 10', // 40% increase = moderate
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const alerts = comparison.alerts;

      expect(alerts.length).toBeGreaterThan(0);
      const painAlert = alerts.find(a => a.type === 'pain');
      expect(painAlert).toBeDefined();
      expect(painAlert?.severity).toBe('moderate');
      expect(painAlert?.changePercentage).toBeGreaterThan(20);
    });

    it('should not detect regression when pain increases <20%', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 6 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const alerts = comparison.alerts.filter(a => a.type === 'pain');

      // Should not trigger alert for <20% increase
      expect(alerts.length).toBe(0);
    });

    it('should detect severe regression when pain increases >50%', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 3 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 8 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const alerts = comparison.alerts;
      const painAlert = alerts.find(a => a.type === 'pain');

      expect(painAlert).toBeDefined();
      expect(painAlert?.severity).toBe('severe');
    });

    it('should detect functional test regression', () => {
      const previous = createMockSession({
        id: 'previous-1',
        physicalTests: [
          createMockEvaluationTest('Shoulder Impingement', 'negative'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        physicalTests: [
          createMockEvaluationTest('Shoulder Impingement', 'positive'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const alerts = comparison.alerts.filter(a => a.type === 'functional_test');

      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should generate overall regression alert when overall progress is regressed', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 3 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 7 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const alerts = comparison.alerts;

      // Should have at least one alert (pain or overall)
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // TESTS: formatComparisonForUI
  // ========================================================================

  describe('formatComparisonForUI', () => {
    it('should format comparison data correctly for UI', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 5 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 3 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const formatted = service.formatComparisonForUI(comparison, false);

      expect(formatted.hasComparison).toBe(true);
      expect(formatted.isFirstSession).toBe(false);
      expect(formatted.previousSessionDate).toBeDefined();
      expect(formatted.currentSessionDate).toBeDefined();
      expect(formatted.daysBetween).toBe(7);
      expect(formatted.metrics.painLevel.previous).toBe(5);
      expect(formatted.metrics.painLevel.current).toBe(3);
      expect(formatted.metrics.painLevel.trend).toBe('improved');
      expect(formatted.overallProgress).toBe('improved');
      expect(formatted.summary).toContain('improvement');
    });

    it('should handle first session correctly', () => {
      const formatted = service.formatComparisonForUI(null, true);

      expect(formatted.hasComparison).toBe(false);
      expect(formatted.isFirstSession).toBe(true);
      expect(formatted.previousSessionDate).toBeNull();
      expect(formatted.daysBetween).toBeNull();
      expect(formatted.metrics.painLevel.trend).toBe('no_data');
      expect(formatted.overallProgress).toBe('no_data');
      expect(formatted.summary).toContain('First session');
    });

    it('should format functional tests correctly', () => {
      const previous = createMockSession({
        id: 'previous-1',
        physicalTests: [
          createMockEvaluationTest('Test A', 'positive'),
          createMockEvaluationTest('Test B', 'negative'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        physicalTests: [
          createMockEvaluationTest('Test A', 'negative'),
          createMockEvaluationTest('Test B', 'negative'),
          createMockEvaluationTest('Test C', 'normal'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const formatted = service.formatComparisonForUI(comparison, false);

      expect(formatted.metrics.functionalTests.length).toBeGreaterThan(0);
      const testA = formatted.metrics.functionalTests.find(t => t.testName === 'Test A');
      expect(testA).toBeDefined();
      expect(testA?.changed).toBe(true);
    });

    it('should generate appropriate summary for improved progress', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 7 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 3 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const formatted = service.formatComparisonForUI(comparison, false);

      expect(formatted.summary).toContain('improvement');
    });

    it('should generate appropriate summary for regressed progress', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 3 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: createMockSOAPNote({
          subjective: 'Patient reports pain level 8 out of 10',
        }),
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);
      const formatted = service.formatComparisonForUI(comparison, false);

      expect(formatted.summary).toContain('regression');
      expect(formatted.alerts.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // TESTS: Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle sessions with no SOAP note', () => {
      const previous = createMockSession({
        id: 'previous-1',
        soapNote: null,
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        soapNote: null,
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.previousSession.metrics.painLevel).toBeUndefined();
      expect(comparison.currentSession.metrics.painLevel).toBeUndefined();
      expect(comparison.deltas.overallProgress).toBe('stable');
    });

    it('should handle sessions with no physical tests', () => {
      const previous = createMockSession({
        id: 'previous-1',
        physicalTests: [],
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        physicalTests: [],
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.previousSession.metrics.testCount).toBe(0);
      expect(comparison.currentSession.metrics.testCount).toBe(0);
      expect(comparison.deltas.testCountChange).toBe(0);
    });

    it('should handle sessions with different test sets', () => {
      const previous = createMockSession({
        id: 'previous-1',
        physicalTests: [
          createMockEvaluationTest('Test A', 'positive'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-01')),
      });

      const current = createMockSession({
        id: 'current-1',
        physicalTests: [
          createMockEvaluationTest('Test B', 'negative'),
        ],
        timestamp: Timestamp.fromDate(new Date('2024-01-08')),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.deltas.testCountChange).toBe(0); // Different tests, same count
    });

    it('should handle Date timestamp instead of Timestamp', () => {
      const previous = createMockSession({
        id: 'previous-1',
        timestamp: new Date('2024-01-01'),
      });

      const current = createMockSession({
        id: 'current-1',
        timestamp: new Date('2024-01-08'),
      });

      const comparison = service.compareSessions(previous, current);

      expect(comparison.deltas.daysBetweenSessions).toBe(7);
    });
  });
});

