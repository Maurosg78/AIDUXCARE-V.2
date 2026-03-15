/**
 * Session Comparison Service
 * 
 * Core business logic for comparing patient sessions to track progress,
 * detect regressions, and provide clinical insights.
 * WO-SESSION-COMPARISON-HARDENING: Encounter is the only source of truth for sessions.
 *
 * Sprint 1 - Day 1: Service Layer
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { EvaluationTestEntry } from '../core/soap/PhysicalExamResultBuilder';
import type { SOAPNote } from '../types/vertex-ai';
import { encountersRepo, type Encounter } from '../repositories/encountersRepo';
import { classifyTrajectory } from '../core/longitudinal/trajectoryClassifier';
import { buildReferralEvolutionSentence } from '../core/longitudinal/referralEvolutionSentence';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Represents a session stored in Firestore
 */
export interface Session {
  id: string;
  userId: string;
  patientId: string;
  patientName: string;
  transcript: string;
  soapNote: SOAPNote | null;
  physicalTests?: EvaluationTestEntry[];
  timestamp: Timestamp | Date;
  createdAt?: Date; // Bloque 5E: Alias/conveniencia para timestamp (usado en DocumentsFormsModal)
  status: 'draft' | 'completed';
  // ✅ Sprint 2A: Session Type Integration
  sessionType?: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate';
  tokenBudget?: number;
  tokensUsed?: number;
  billingMonth?: string; // 'YYYY-MM' for aggregation
  isBillable?: boolean;
  transcriptionMeta?: {
    lang: string | null;
    languagePreference: string;
    mode: 'live' | 'dictation';
    averageLogProb?: number | null;
    durationSeconds?: number;
    recordedAt: string;
  };
}

/**
 * Metrics extracted from a single session
 */
export interface SessionMetrics {
  painLevel?: number; // 0-10 scale (extracted from SOAP subjective)
  rangeOfMotion?: {
    [region: string]: number; // Percentage or degrees
  };
  functionalTests: {
    [testName: string]: {
      result: 'normal' | 'positive' | 'negative' | 'inconclusive';
      values?: Record<string, number | string | boolean | null>;
    };
  };
  testCount: number;
  completedTests: number;
  sessionDuration?: number; // minutes
  soapCompleteness?: number; // 0-100 percentage
}

/**
 * Delta values comparing two sessions
 */
export interface SessionDeltas {
  painLevel: number; // -2 to +2 scale (negative = improvement, positive = worse)
  rangeOfMotion: {
    [region: string]: number; // Percentage change
  };
  functionalTests: {
    [testName: string]: number; // Percentage change or status change
  };
  overallProgress: 'improved' | 'stable' | 'regressed';
  testCountChange: number;
  daysBetweenSessions: number;
}

/**
 * Alert for detected regression
 */
export interface RegressionAlert {
  type: 'pain' | 'rom' | 'functional_test' | 'overall';
  severity: 'mild' | 'moderate' | 'severe';
  metric: string;
  previousValue: number | string;
  currentValue: number | string;
  changePercentage: number;
  message: string;
}

/**
 * Complete comparison result between two sessions
 */
export interface SessionComparison {
  patientId: string;
  previousSession: {
    id: string;
    date: Date;
    metrics: SessionMetrics;
  };
  currentSession: {
    id: string;
    date: Date;
    metrics: SessionMetrics;
  };
  deltas: SessionDeltas;
  alerts: RegressionAlert[];
}

/**
 * Formatted data ready for UI display
 * T6: Also exported as SessionComparisonView for backward compatibility
 */
export interface ComparisonDisplayData {
  hasComparison: boolean;
  isFirstSession: boolean;
  previousSessionDate: string | null;
  currentSessionDate: string;
  daysBetween: number | null;
  metrics: {
    painLevel: {
      previous: number | null;
      current: number | null;
      delta: number | null;
      trend: 'improved' | 'stable' | 'worsened' | 'no_data';
    };
    rangeOfMotion: Array<{
      region: string;
      previous: number | null;
      current: number | null;
      delta: number | null;
      trend: 'improved' | 'stable' | 'worsened' | 'no_data';
    }>;
    functionalTests: Array<{
      testName: string;
      previous: string | null;
      current: string | null;
      changed: boolean;
    }>;
  };
  overallProgress: 'improved' | 'stable' | 'regressed' | 'no_data';
  alerts: RegressionAlert[];
  summary: string;
  /** WO-SESSION-COMPARISON-HARDENING: explicit reason when no comparison */
  reason?: 'no_previous_session' | 'previous_incomplete';
  currentSessionNumber?: number;
  previousSessionNumber?: number;
}

// T6: Export alias for backward compatibility
export type SessionComparisonView = ComparisonDisplayData;

/** WO-SESSION-COMPARISON-HARDENING: result of encounter-based comparison state */
export interface EncountersComparisonState {
  isFirstSession: boolean;
  reason?: 'no_previous_session' | 'previous_incomplete';
  previousSession?: Session;
  currentSession?: Session;
  currentSessionNumber?: number;
  previousSessionNumber?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Service for comparing patient sessions
 */
export class SessionComparisonService {
  private readonly COLLECTION_NAME = 'sessions';
  private readonly REGRESSION_THRESHOLD = 0.20; // 20% threshold for regression alerts

  /**
   * WO-SESSION-COMPARISON-HARDENING: Convert Encounter to Session for comparison pipeline.
   * Encounter is source of truth; Session type is used for existing compareSessions/formatComparisonForUI.
   */
  private encounterToSession(enc: Encounter): Session {
    const date = enc.encounterDate instanceof Timestamp
      ? enc.encounterDate.toDate()
      : (enc.encounterDate as unknown as { toDate?: () => Date }).toDate?.() ?? new Date(enc.encounterDate as unknown as number);
    return {
      id: enc.id,
      userId: enc.authorUid,
      patientId: enc.patientId,
      patientName: '',
      transcript: '',
      soapNote: enc.soap ? {
        subjective: enc.soap.subjective ?? '',
        objective: enc.soap.objective ?? '',
        assessment: enc.soap.assessment ?? '',
        plan: enc.soap.plan ?? '',
      } : null,
      physicalTests: [],
      timestamp: date,
      status: enc.status === 'signed' ? 'completed' : (enc.status === 'draft' || enc.status === 'completed' ? enc.status : 'draft'),
    };
  }

  /**
   * WO-SESSION-COMPARISON-HARDENING: Get comparison state from encounters (single source of truth).
   * Orders by encounterDate ascending; only compares when ≥2 encounters, both completed|signed.
   */
  async getEncountersComparisonState(patientId: string): Promise<EncountersComparisonState> {
    try {
      const encounters = await encountersRepo.getEncountersByPatient(patientId, 100);
      const completed = encounters.filter(
        (e) => e.status === 'completed' || e.status === 'signed'
      );
      const byDateAsc = [...completed].sort((a, b) => {
        const ta = a.encounterDate instanceof Timestamp ? a.encounterDate.toMillis() : (a.encounterDate as unknown as { toMillis?: () => number }).toMillis?.() ?? new Date(a.encounterDate as unknown as number).getTime();
        const tb = b.encounterDate instanceof Timestamp ? b.encounterDate.toMillis() : (b.encounterDate as unknown as { toMillis?: () => number }).toMillis?.() ?? new Date(b.encounterDate as unknown as number).getTime();
        return ta - tb;
      });

      if (byDateAsc.length === 0) {
        return { isFirstSession: true, reason: 'no_previous_session' };
      }
      if (byDateAsc.length === 1) {
        return {
          isFirstSession: true,
          reason: 'no_previous_session',
          currentSession: this.encounterToSession(byDateAsc[0]),
          currentSessionNumber: 1,
        };
      }

      const previousEnc = byDateAsc[byDateAsc.length - 2];
      const currentEnc = byDateAsc[byDateAsc.length - 1];
      const prevValid = previousEnc.status === 'completed' || previousEnc.status === 'signed';
      const currValid = currentEnc.status === 'completed' || currentEnc.status === 'signed';

      if (!prevValid) {
        return {
          isFirstSession: true,
          reason: 'previous_incomplete',
          currentSession: this.encounterToSession(currentEnc),
          currentSessionNumber: byDateAsc.length,
        };
      }
      if (!currValid) {
        return {
          isFirstSession: true,
          reason: 'previous_incomplete',
          currentSession: this.encounterToSession(currentEnc),
          currentSessionNumber: byDateAsc.length,
        };
      }

      return {
        isFirstSession: false,
        previousSession: this.encounterToSession(previousEnc),
        currentSession: this.encounterToSession(currentEnc),
        currentSessionNumber: byDateAsc.length,
        previousSessionNumber: byDateAsc.length - 1,
      };
    } catch (err) {
      console.error('[SessionComparison] getEncountersComparisonState failed:', err);
      return { isFirstSession: true, reason: 'no_previous_session' };
    }
  }

  /**
   * Last N pain values from completed encounters (oldest → newest). Keeps prompt compact.
   * Use maxPoints = 3 for "Pain series: 6 → 5 → 4".
   */
  async getLastNPainSeries(patientId: string, maxPoints: number): Promise<number[]> {
    if (maxPoints < 1) return [];
    try {
      const encounters = await encountersRepo.getEncountersByPatient(patientId, 100);
      const completed = encounters.filter(
        (e) => e.status === 'completed' || e.status === 'signed'
      );
      const byDateAsc = [...completed].sort((a, b) => {
        const ta = a.encounterDate instanceof Timestamp ? a.encounterDate.toMillis() : (a.encounterDate as unknown as { toMillis?: () => number }).toMillis?.() ?? new Date(a.encounterDate as unknown as number).getTime();
        const tb = b.encounterDate instanceof Timestamp ? b.encounterDate.toMillis() : (b.encounterDate as unknown as { toMillis?: () => number }).toMillis?.() ?? new Date(b.encounterDate as unknown as number).getTime();
        return ta - tb;
      });
      const lastN = byDateAsc.slice(-maxPoints);
      const series: number[] = [];
      for (const enc of lastN) {
        const pain = this.extractPainFromSubjective(enc.soap?.subjective);
        if (pain !== null) series.push(pain);
      }
      return series;
    } catch (err) {
      console.warn('[SessionComparison] getLastNPainSeries failed:', err);
      return [];
    }
  }

  /**
   * Referral report: evolution sentence from trajectory + pain series (descriptive only).
   * Returns null if painSeries.length < 2 or confidence === 'low'.
   */
  async getReferralEvolutionSentence(patientId: string): Promise<string | null> {
    const series = await this.getLastNPainSeries(patientId, 3);
    if (series.length < 2) return null;
    const classification = classifyTrajectory(series);
    if (classification.confidence === 'low') return null;
    const painSeriesSummary = series.join(' → ');
    return buildReferralEvolutionSentence(
      classification.label,
      painSeriesSummary,
      classification.confidence
    );
  }

  /**
   * Get the most recent previous session for a patient
   * 
   * @param patientId - Patient ID
   * @param currentSessionId - Current session ID to exclude
   * @param userId - Optional user ID to filter by practitioner
   * @returns Previous session or null if none found
   */
  async getPreviousSession(
    patientId: string,
    currentSessionId: string,
    userId?: string
  ): Promise<Session | null> {
    try {
      const sessionsRef = collection(db, this.COLLECTION_NAME);
      
      // Build query based on whether userId is provided
      let q;
      if (userId) {
        q = query(
          sessionsRef,
          where('patientId', '==', patientId),
          where('userId', '==', userId),
          where('status', '==', 'completed'), // Only compare completed sessions
          orderBy('timestamp', 'desc'),
          limit(10) // Get last 10 to find most recent excluding current
        );
      } else {
        q = query(
          sessionsRef,
          where('patientId', '==', patientId),
          where('status', '==', 'completed'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      // Find first session that is not the current one
      for (const doc of snapshot.docs) {
        if (doc.id !== currentSessionId) {
          // T6: Tipar data para evitar unknown spread
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as Session;
        }
      }

      // If current session is the only one, return null
      return null;
    } catch (error: any) {
      // Check if error is due to missing Firestore index
      const isIndexError = error?.code === 'failed-precondition' || 
                          error?.message?.includes('index') ||
                          error?.message?.includes('requires an index');
      
      if (isIndexError) {
        console.warn('[SessionComparison] Firestore index missing. Please create composite index:', {
          collection: this.COLLECTION_NAME,
          fields: ['patientId', 'status', 'timestamp'],
          error: error.message
        });
        
        // Return null gracefully instead of throwing to prevent infinite loops
        // The UI will show "first session" message instead of error
        return null;
      }
      
      console.error('[SessionComparison] Error getting previous session:', error);
      // For other errors, still throw but with more context
      throw new Error(`Failed to retrieve previous session: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Compare two sessions and calculate deltas
   * 
   * @param previous - Previous session
   * @param current - Current session
   * @returns Comparison result with deltas and alerts
   */
  compareSessions(previous: Session, current: Session): SessionComparison {
    // Extract metrics from both sessions
    const previousMetrics = this.extractMetrics(previous);
    const currentMetrics = this.extractMetrics(current);

    // Calculate deltas
    const deltas = this.calculateDeltas(previousMetrics, currentMetrics, previous, current);

    // Detect regressions
    const alerts = this.detectRegression(deltas, previousMetrics, currentMetrics);

    return {
      patientId: current.patientId,
      previousSession: {
        id: previous.id,
        date: previous.timestamp instanceof Date 
          ? previous.timestamp 
          : (previous.timestamp as Timestamp).toDate(),
        metrics: previousMetrics,
      },
      currentSession: {
        id: current.id,
        date: current.timestamp instanceof Date 
          ? current.timestamp 
          : (current.timestamp as Timestamp).toDate(),
        metrics: currentMetrics,
      },
      deltas,
      alerts,
    };
  }

  /**
   * Extract pain level (0-10) from SOAP subjective text. Shared for metrics and pain series.
   */
  private extractPainFromSubjective(subjective: string | undefined): number | null {
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

  /**
   * Extract metrics from a session
   * 
   * @param session - Session to extract metrics from
   * @returns Extracted metrics
   */
  private extractMetrics(session: Session): SessionMetrics {
    const metrics: SessionMetrics = {
      functionalTests: {},
      testCount: 0,
      completedTests: 0,
    };

    const pain = this.extractPainFromSubjective(session.soapNote?.subjective);
    if (pain !== null) metrics.painLevel = pain;

    // Extract range of motion from SOAP objective
    if (session.soapNote?.objective) {
      const romMatches = session.soapNote.objective.matchAll(/(?:ROM|range of motion|rango de movimiento)[\s:]*(\d+)\s*(?:degrees|°|%)/gi);
      // This is a simplified extraction - in production would need more sophisticated parsing
      // For now, we'll extract basic ROM mentions
    }

    // Extract functional tests from physicalTests array
    if (session.physicalTests && session.physicalTests.length > 0) {
      metrics.testCount = session.physicalTests.length;
      metrics.completedTests = session.physicalTests.filter(t => t.result !== 'inconclusive').length;

      session.physicalTests.forEach(test => {
        metrics.functionalTests[test.name] = {
          result: test.result,
          values: test.values,
        };
      });
    }

    // Calculate SOAP completeness (simplified)
    if (session.soapNote) {
      const sections = [
        session.soapNote.subjective,
        session.soapNote.objective,
        session.soapNote.assessment,
        session.soapNote.plan,
      ];
      const completedSections = sections.filter(s => s && s.trim().length > 0).length;
      metrics.soapCompleteness = (completedSections / 4) * 100;
    }

    // Calculate session duration if transcriptionMeta available
    if (session.transcriptionMeta?.durationSeconds) {
      metrics.sessionDuration = session.transcriptionMeta.durationSeconds / 60; // Convert to minutes
    }

    return metrics;
  }

  /**
   * Calculate deltas between two sessions
   * 
   * @param previousMetrics - Metrics from previous session
   * @param currentMetrics - Metrics from current session
   * @param previous - Previous session
   * @param current - Current session
   * @returns Calculated deltas
   */
  private calculateDeltas(
    previousMetrics: SessionMetrics,
    currentMetrics: SessionMetrics,
    previous: Session,
    current: Session
  ): SessionDeltas {
    const previousDate = previous.timestamp instanceof Date 
      ? previous.timestamp 
      : (previous.timestamp as Timestamp).toDate();
    const currentDate = current.timestamp instanceof Date 
      ? current.timestamp 
      : (current.timestamp as Timestamp).toDate();
    
    const daysBetween = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate pain level delta (-2 to +2 scale)
    let painLevelDelta = 0;
    if (previousMetrics.painLevel !== undefined && currentMetrics.painLevel !== undefined) {
      const painDiff = currentMetrics.painLevel - previousMetrics.painLevel;
      // Normalize to -2 to +2 scale (each point = 0.2 on scale)
      painLevelDelta = Math.max(-2, Math.min(2, painDiff * 0.2));
    }

    // Calculate ROM deltas
    const romDeltas: { [region: string]: number } = {};
    // Simplified - would need more sophisticated matching in production
    if (previousMetrics.rangeOfMotion && currentMetrics.rangeOfMotion) {
      Object.keys(currentMetrics.rangeOfMotion).forEach(region => {
        const prev = previousMetrics.rangeOfMotion![region];
        const curr = currentMetrics.rangeOfMotion![region];
        if (prev !== undefined && curr !== undefined) {
          romDeltas[region] = ((curr - prev) / prev) * 100; // Percentage change
        }
      });
    }

    // Calculate functional test deltas
    const functionalTestDeltas: { [testName: string]: number } = {};
    const allTestNames = new Set([
      ...Object.keys(previousMetrics.functionalTests),
      ...Object.keys(currentMetrics.functionalTests),
    ]);

    allTestNames.forEach(testName => {
      const prev = previousMetrics.functionalTests[testName];
      const curr = currentMetrics.functionalTests[testName];
      
      if (prev && curr) {
        // Compare results: positive = worse, negative = better
        const resultValues = {
          'normal': 0,
          'negative': 1,
          'inconclusive': 2,
          'positive': 3,
        };
        const prevValue = resultValues[prev.result] || 0;
        const currValue = resultValues[curr.result] || 0;
        functionalTestDeltas[testName] = currValue - prevValue;
      }
    });

    // Determine overall progress
    let overallProgress: 'improved' | 'stable' | 'regressed' = 'stable';
    
    // If pain increased significantly, mark as regressed
    if (painLevelDelta > 0.3) {
      overallProgress = 'regressed';
    } else if (painLevelDelta < -0.3) {
      overallProgress = 'improved';
    } else {
      // Check functional tests
      const testImprovements = Object.values(functionalTestDeltas).filter(d => d < 0).length;
      const testRegressions = Object.values(functionalTestDeltas).filter(d => d > 0).length;
      
      if (testRegressions > testImprovements) {
        overallProgress = 'regressed';
      } else if (testImprovements > testRegressions) {
        overallProgress = 'improved';
      }
    }

    return {
      painLevel: painLevelDelta,
      rangeOfMotion: romDeltas,
      functionalTests: functionalTestDeltas,
      overallProgress,
      testCountChange: currentMetrics.testCount - previousMetrics.testCount,
      daysBetweenSessions: daysBetween,
    };
  }

  /**
   * Detect regressions based on deltas and thresholds
   * 
   * @param deltas - Calculated deltas
   * @param previousMetrics - Previous session metrics
   * @param currentMetrics - Current session metrics
   * @returns Array of regression alerts
   */
  detectRegression(
    deltas: SessionDeltas,
    previousMetrics: SessionMetrics,
    currentMetrics: SessionMetrics
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];

    // Check pain level regression
    if (deltas.painLevel > 0.3 && previousMetrics.painLevel !== undefined && currentMetrics.painLevel !== undefined) {
      const changePercentage = ((currentMetrics.painLevel - previousMetrics.painLevel) / previousMetrics.painLevel) * 100;
      
      if (changePercentage > this.REGRESSION_THRESHOLD * 100) {
        alerts.push({
          type: 'pain',
          severity: changePercentage > 50 ? 'severe' : changePercentage > 30 ? 'moderate' : 'mild',
          metric: 'Pain Level',
          previousValue: previousMetrics.painLevel,
          currentValue: currentMetrics.painLevel,
          changePercentage,
          message: `Pain level increased from ${previousMetrics.painLevel}/10 to ${currentMetrics.painLevel}/10 (${changePercentage.toFixed(1)}% increase)`,
        });
      }
    }

    // Check ROM regressions
    Object.entries(deltas.rangeOfMotion).forEach(([region, delta]) => {
      if (delta < -this.REGRESSION_THRESHOLD * 100) {
        const prev = previousMetrics.rangeOfMotion?.[region];
        const curr = currentMetrics.rangeOfMotion?.[region];
        
        if (prev !== undefined && curr !== undefined) {
          alerts.push({
            type: 'rom',
            severity: Math.abs(delta) > 50 ? 'severe' : Math.abs(delta) > 30 ? 'moderate' : 'mild',
            metric: `Range of Motion - ${region}`,
            previousValue: prev,
            currentValue: curr,
            changePercentage: Math.abs(delta),
            message: `ROM decreased in ${region} from ${prev}% to ${curr}% (${Math.abs(delta).toFixed(1)}% decrease)`,
          });
        }
      }
    });

    // Check functional test regressions
    Object.entries(deltas.functionalTests).forEach(([testName, delta]) => {
      if (delta > 0) {
        const prev = previousMetrics.functionalTests[testName];
        const curr = currentMetrics.functionalTests[testName];
        
        if (prev && curr) {
          alerts.push({
            type: 'functional_test',
            severity: delta >= 2 ? 'severe' : 'moderate',
            metric: `Functional Test - ${testName}`,
            previousValue: prev.result,
            currentValue: curr.result,
            changePercentage: delta * 25, // Approximate percentage
            message: `${testName} changed from ${prev.result} to ${curr.result}`,
          });
        }
      }
    });

    // Overall regression alert
    if (deltas.overallProgress === 'regressed' && alerts.length === 0) {
      alerts.push({
        type: 'overall',
        severity: 'moderate',
        metric: 'Overall Progress',
        previousValue: 'stable/improved',
        currentValue: 'regressed',
        changePercentage: 0,
        message: 'Overall progress shows regression compared to previous session',
      });
    }

    return alerts;
  }

  /**
   * Format comparison data for UI display
   * WO-SESSION-COMPARISON-HARDENING: optional reason when isFirstSession for explicit UI.
   *
   * @param comparison - Comparison result
   * @param isFirstSession - Whether this is the first session
   * @param reason - Explicit reason when no comparison (no_previous_session | previous_incomplete)
   * @returns Formatted data ready for React component
   */
  formatComparisonForUI(
    comparison: SessionComparison | null,
    isFirstSession: boolean,
    reason?: 'no_previous_session' | 'previous_incomplete'
  ): ComparisonDisplayData {
    if (!comparison || isFirstSession) {
      return {
        hasComparison: false,
        isFirstSession: true,
        reason: reason ?? 'no_previous_session',
        previousSessionDate: null,
        currentSessionDate: new Date().toLocaleDateString('en-CA'),
        daysBetween: null,
        metrics: {
          painLevel: {
            previous: null,
            current: null,
            delta: null,
            trend: 'no_data',
          },
          rangeOfMotion: [],
          functionalTests: [],
        },
        overallProgress: 'no_data',
        alerts: [],
        summary: reason === 'previous_incomplete' ? 'No previous session to compare' : 'First clinical session',
      };
    }

    const { previousSession, currentSession, deltas, alerts } = comparison;

    // Format pain level data
    const painTrend = deltas.painLevel < -0.2 
      ? 'improved' 
      : deltas.painLevel > 0.2 
        ? 'worsened' 
        : 'stable';

    // Format ROM data
    // T6: Asegurar que trend sea union type específico
    const romData: Array<{
      region: string;
      previous: number | null;
      current: number | null;
      delta: number;
      trend: 'improved' | 'stable' | 'worsened' | 'no_data';
    }> = Object.entries(deltas.rangeOfMotion).map(([region, delta]) => {
      const prev = previousSession.metrics.rangeOfMotion?.[region] || null;
      const curr = currentSession.metrics.rangeOfMotion?.[region] || null;
      const trend: 'improved' | 'stable' | 'worsened' | 'no_data' = 
        delta < -5 ? 'improved' : delta > 5 ? 'worsened' : 'stable';
      
      return {
        region,
        previous: prev,
        current: curr,
        delta,
        trend,
      };
    });

    // Format functional tests data
    const functionalTestsData = Object.keys({
      ...previousSession.metrics.functionalTests,
      ...currentSession.metrics.functionalTests,
    }).map(testName => {
      const prev = previousSession.metrics.functionalTests[testName];
      const curr = currentSession.metrics.functionalTests[testName];
      
      return {
        testName,
        previous: prev?.result || null,
        current: curr?.result || null,
        changed: prev?.result !== curr?.result,
      };
    });

    // Generate summary
    const summary = this.generateSummary(comparison);

    return {
      hasComparison: true,
      isFirstSession: false,
      previousSessionDate: previousSession.date.toLocaleDateString('en-CA'),
      currentSessionDate: currentSession.date.toLocaleDateString('en-CA'),
      daysBetween: deltas.daysBetweenSessions,
      metrics: {
        painLevel: {
          previous: previousSession.metrics.painLevel || null,
          current: currentSession.metrics.painLevel || null,
          delta: deltas.painLevel,
          trend: painTrend,
        },
        rangeOfMotion: romData,
        functionalTests: functionalTestsData,
      },
      overallProgress: deltas.overallProgress,
      alerts,
      summary,
    };
  }

  /**
   * Generate human-readable summary of comparison
   * 
   * @param comparison - Comparison result
   * @returns Summary string
   */
  private generateSummary(comparison: SessionComparison): string {
    const { deltas, alerts } = comparison;
    
    if (deltas.overallProgress === 'improved') {
      return `Patient shows improvement since last session (${deltas.daysBetweenSessions} days ago).`;
    } else if (deltas.overallProgress === 'regressed') {
      return `⚠️ Patient shows regression since last session (${deltas.daysBetweenSessions} days ago). ${alerts.length} alert(s) detected.`;
    } else {
      return `Patient status is stable since last session (${deltas.daysBetweenSessions} days ago).`;
    }
  }

  /**
   * Build a concise longitudinal summary suitable for AI prompts (follow-up SOAP).
   * Uses ComparisonDisplayData so callers don't need to know internal deltas structure.
   */
  buildLongitudinalSummaryForPrompt(display: ComparisonDisplayData | null): string | null {
    if (!display || !display.hasComparison || display.overallProgress === 'no_data') {
      return null;
    }

    const parts: string[] = [];

    const days =
      typeof display.daysBetween === 'number' && display.daysBetween >= 0
        ? `${display.daysBetween} day(s)`
        : 'unknown interval';

    const painPrev = display.metrics.painLevel.previous;
    const painCurr = display.metrics.painLevel.current;
    if (typeof painPrev === 'number' && typeof painCurr === 'number') {
      parts.push(`Pain: ${painPrev}/10 → ${painCurr}/10 over ${days}.`);
    }

    if (display.overallProgress === 'improved') {
      parts.push('Overall clinical progress: improved since last visit.');
    } else if (display.overallProgress === 'regressed') {
      parts.push('Overall clinical progress: regressed since last visit.');
    } else if (display.overallProgress === 'stable') {
      parts.push('Overall clinical progress: stable compared to last visit.');
    }

    const alertMessages =
      display.alerts && display.alerts.length > 0
        ? display.alerts.map((a) => a.message).filter((m) => m && m.trim().length > 0)
        : [];
    if (alertMessages.length > 0) {
      parts.push(
        `Regression alerts: ${alertMessages
          .slice(0, 3)
          .join(' ')}`
      );
    }

    if (parts.length === 0 && display.summary) {
      return display.summary;
    }

    return parts.join(' ');
  }
}

// Export singleton instance
export default new SessionComparisonService();

