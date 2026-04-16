import { describe, expect, it } from 'vitest';

import {
  buildSoapReviewMetadata,
  buildValueMetricsEvent,
} from '../finalizationAnalytics';

describe('finalizationAnalytics', () => {
  it('builds value metrics without inventing unavailable counters', () => {
    const sessionStartTime = new Date('2026-04-14T10:00:00.000Z');
    const transcriptionStartTime = new Date('2026-04-14T10:01:00.000Z');
    const transcriptionEndTime = new Date('2026-04-14T10:06:00.000Z');
    const soapGenerationStartTime = new Date('2026-04-14T10:08:00.000Z');
    const soapGenerationEndTime = new Date('2026-04-14T10:10:00.000Z');
    const finalizedAt = new Date('2026-04-14T10:20:00.000Z');

    const metrics = buildValueMetricsEvent({
      filteredEvaluationTestsCount: 2,
      finalizedAt,
      localSoapNote: {
        subjective: 'Pain improving',
        objective: 'ROM improved',
        assessment: 'Stable progression',
        plan: 'Continue exercise program',
      },
      region: 'Madrid',
      sessionId: 'session-123',
      sessionStartTime,
      soapGenerationEndTime,
      soapGenerationStartTime,
      transcriptionEndTime,
      transcriptionStartTime,
      transcript: 'Patient reports less pain',
      userId: 'user-123',
      visitType: 'initial',
      wasClinicalAnalysisGenerated: true,
    });

    expect(metrics.userId).toBe('user-123');
    expect(metrics.sessionId).toBe('session-123');
    expect(metrics.calculatedTimes.totalDocumentationTime).toBe(20);
    expect(metrics.calculatedTimes.transcriptionTime).toBe(5);
    expect(metrics.calculatedTimes.aiGenerationTime).toBe(2);
    expect(metrics.calculatedTimes.manualEditingTime).toBe(13);
    expect(metrics.featuresUsed).toEqual({
      transcription: true,
      physicalTests: true,
      aiSuggestions: true,
      soapGeneration: true,
    });
    expect(metrics.quality.soapSectionsCompleted).toEqual({
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    });
    expect(metrics.quality.suggestionsOffered).toBeUndefined();
    expect(metrics.quality.suggestionsAccepted).toBeUndefined();
    expect(metrics.region).toBe('Madrid');
  });

  it('builds review metadata with explicit reviewer identity', () => {
    const reviewedAt = new Date('2026-04-14T11:00:00.000Z');
    const reviewed = buildSoapReviewMetadata(
      'clinician-123',
      'Dr. Test',
      reviewedAt
    );

    expect(reviewed).toEqual({
      reviewedBy: 'clinician-123',
      reviewedAt,
      reviewerName: 'Dr. Test',
    });
  });
});
