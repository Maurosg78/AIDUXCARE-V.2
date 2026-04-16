import type { ValueMetricsEvent } from '@/services/analyticsService';
import type { SOAPNote } from '@/types/vertex-ai';

export type WorkflowValueMetricsInput = {
  filteredEvaluationTestsCount: number;
  finalizedAt: Date;
  localSoapNote: SOAPNote | null;
  region?: string;
  sessionId: string;
  sessionStartTime: Date;
  soapGenerationEndTime: Date | null;
  soapGenerationStartTime: Date | null;
  transcriptionEndTime: Date | null;
  transcriptionStartTime: Date | null;
  transcript: string;
  userId: string;
  visitType: ValueMetricsEvent['sessionType'];
  wasClinicalAnalysisGenerated: boolean;
};

export function buildValueMetricsEvent(
  input: WorkflowValueMetricsInput
): Omit<ValueMetricsEvent, 'timestamp'> {
  const transcriptionTime = calculateElapsedMinutes(
    input.transcriptionStartTime,
    input.transcriptionEndTime
  );
  const aiGenerationTime = calculateElapsedMinutes(
    input.soapGenerationStartTime,
    input.soapGenerationEndTime
  );
  const totalDocumentationTime = calculateElapsedMinutes(
    input.sessionStartTime,
    input.finalizedAt
  );
  const manualEditingTime = calculateManualEditingTime(
    totalDocumentationTime,
    transcriptionTime,
    aiGenerationTime
  );
  const featuresUsed = buildFeaturesUsed(
    input.transcript,
    input.filteredEvaluationTestsCount,
    input.wasClinicalAnalysisGenerated,
    input.localSoapNote
  );
  const soapSectionsCompleted = buildSoapSectionsCompleted(input.localSoapNote);
  const quality = {
    soapSectionsCompleted,
    suggestionsOffered: undefined,
    suggestionsAccepted: undefined,
    suggestionsRejected: undefined,
    editsMadeToSOAP: undefined,
  };

  return {
    userId: input.userId,
    sessionId: input.sessionId,
    timestamps: {
      sessionStart: input.sessionStartTime,
      transcriptionStart: input.transcriptionStartTime ?? undefined,
      transcriptionEnd: input.transcriptionEndTime ?? undefined,
      soapGenerationStart: input.soapGenerationStartTime ?? undefined,
      soapFinalized: input.finalizedAt,
    },
    calculatedTimes: {
      totalDocumentationTime,
      transcriptionTime,
      aiGenerationTime,
      manualEditingTime,
    },
    featuresUsed,
    quality,
    sessionType: input.visitType,
    region: input.region,
  };
}

export function buildSoapReviewMetadata(
  reviewerId: string,
  reviewerName: string,
  reviewedAt: Date
): NonNullable<SOAPNote['reviewed']> {
  return {
    reviewedBy: reviewerId,
    reviewedAt,
    reviewerName,
  };
}

function calculateElapsedMinutes(
  startTime: Date | null,
  endTime: Date | null
): number | undefined {
  if (!startTime) {
    return undefined;
  }

  if (!endTime) {
    return undefined;
  }

  const elapsedMilliseconds = endTime.getTime() - startTime.getTime();
  const elapsedMinutes = elapsedMilliseconds / 1000 / 60;
  return elapsedMinutes;
}

function calculateManualEditingTime(
  totalDocumentationTime: number,
  transcriptionTime?: number,
  aiGenerationTime?: number
): number {
  const transcriptionMinutes = transcriptionTime || 0;
  const aiGenerationMinutes = aiGenerationTime || 0;
  const rawManualEditingTime =
    totalDocumentationTime -
    transcriptionMinutes -
    aiGenerationMinutes;

  if (rawManualEditingTime > 0) {
    return rawManualEditingTime;
  }

  return 0;
}

function buildFeaturesUsed(
  transcript: string,
  filteredEvaluationTestsCount: number,
  wasClinicalAnalysisGenerated: boolean,
  localSoapNote: SOAPNote | null
): ValueMetricsEvent['featuresUsed'] {
  const trimmedTranscript = transcript.trim();
  const hasTranscript = trimmedTranscript.length > 0;
  const hasPhysicalTests = filteredEvaluationTestsCount > 0;
  const hasSoap = Boolean(localSoapNote);

  return {
    transcription: hasTranscript,
    physicalTests: hasPhysicalTests,
    aiSuggestions: wasClinicalAnalysisGenerated,
    soapGeneration: hasSoap,
  };
}

function buildSoapSectionsCompleted(
  localSoapNote: SOAPNote | null
): ValueMetricsEvent['quality']['soapSectionsCompleted'] {
  const subjective = localSoapNote?.subjective?.trim() || '';
  const objective = localSoapNote?.objective?.trim() || '';
  const assessment = localSoapNote?.assessment?.trim() || '';
  const plan = localSoapNote?.plan?.trim() || '';

  return {
    subjective: subjective.length > 0,
    objective: objective.length > 0,
    assessment: assessment.length > 0,
    plan: plan.length > 0,
  };
}
