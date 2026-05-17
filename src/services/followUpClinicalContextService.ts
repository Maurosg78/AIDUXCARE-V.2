import { getSessionOrdinalLabel } from '@/utils/sessionOrdinalLabel';
import { ensureSpanishClinicalText } from '@/utils/normalizers/es/ensureSpanishClinicalText';
import { PatientTrajectoryMemoryService } from './patientTrajectoryMemoryService';
import { SessionComparisonService, type EncountersComparisonState } from './sessionComparisonService';
import type { ClinicalAttachment } from './clinicalAttachmentService';
import {
  formatLongitudinalSignalsForPrompt,
  retrievePreviousLongitudinalContext,
} from './longitudinalMemory';

interface TrajectorySummary {
  label: 'improved' | 'regressed' | 'stable';
  confidence: 'low' | 'medium' | 'high';
}

export interface FollowUpSourceBuckets {
  subjectiveFacts: string[];
  objectiveMeasuredToday: string[];
  objectiveFromReviewedAttachments: string[];
  longitudinalFacts: string[];
}

export interface FollowUpClinicalContext {
  comparisonState: EncountersComparisonState;
  hasPreviousHistory: boolean;
  nextSessionNumber: number;
  nextSessionOrdinalLabel: string;
  historyStatusLabel: string;
  longitudinalSummary?: string;
  trajectoryPattern?: string;
  trajectoryConfidence?: string;
  painSeriesSummary?: string;
  patternInsightSummary?: string;
  reviewedAttachmentsSummary?: string;
  sourceBuckets: FollowUpSourceBuckets;
}

function classifyTrajectoryFromTwoPoints(previousPain?: number, currentPain?: number): TrajectorySummary | undefined {
  if (previousPain == null || currentPain == null) {
    return undefined;
  }

  if (currentPain < previousPain) {
    return { label: 'improved', confidence: 'high' };
  }

  if (currentPain > previousPain) {
    return { label: 'regressed', confidence: 'high' };
  }

  return { label: 'stable', confidence: 'medium' };
}

function buildReviewedAttachmentsSummary(attachments: ClinicalAttachment[]): string | undefined {
  const reviewedAttachments = attachments
    .filter((attachment) => attachment.reviewedToday === true)
    .filter((attachment) => attachment.processingComplete === true)
    .filter((attachment) => typeof attachment.extractedText === 'string' && attachment.extractedText.trim().length > 0);

  if (reviewedAttachments.length === 0) {
    return undefined;
  }

  const normalizedSummaries = reviewedAttachments.map((attachment) => {
    const normalizedName = ensureSpanishClinicalText(attachment.name);
    const extractedText = attachment.extractedText ?? '';
    const normalizedText = ensureSpanishClinicalText(extractedText);
    const compactText = normalizedText.replace(/\s+/g, ' ').trim();
    const excerptText = compactText.slice(0, 600);
    const suffixText = compactText.length > 600 ? '…' : '';
    const isImageAttachment = typeof attachment.contentType === 'string' && attachment.contentType.startsWith('image/');
    const summaryPrefix = isImageAttachment
      ? 'Imagen clínica revisada hoy — descripción automática no diagnóstica'
      : 'Adjunto revisado hoy';
    const summaryText = `${summaryPrefix} — ${normalizedName}: ${excerptText}${suffixText}`;
    return summaryText;
  });

  const joinedSummary = normalizedSummaries.join('\n\n');
  return joinedSummary;
}

export class FollowUpClinicalContextService {
  async resolve(patientId: string, attachments: ClinicalAttachment[] = [], currentSessionId = ''): Promise<FollowUpClinicalContext> {
    const comparisonService = new SessionComparisonService();
    const comparisonState = await comparisonService.getEncountersComparisonState(patientId);
    const hasPreviousHistory = comparisonState.isFirstSession === false;

    let longitudinalSummary: string | undefined;
    let trajectoryPattern: string | undefined;
    let trajectoryConfidence: string | undefined;

    const hasComparisonSessions =
      comparisonState.isFirstSession === false &&
      comparisonState.previousSession != null &&
      comparisonState.currentSession != null;

    if (hasComparisonSessions) {
      const previousSession = comparisonState.previousSession;
      const currentSession = comparisonState.currentSession;
      const comparison = comparisonService.compareSessions(previousSession, currentSession);
      const comparisonUiData = comparisonService.formatComparisonForUI(comparison, false);
      const summaryFromComparison = comparisonService.buildLongitudinalSummaryForPrompt(comparisonUiData);
      const previousPainLevel = comparisonUiData.metrics.painLevel.previous;
      const currentPainLevel = comparisonUiData.metrics.painLevel.current;
      const trajectoryFromComparison = classifyTrajectoryFromTwoPoints(previousPainLevel ?? undefined, currentPainLevel ?? undefined);

      longitudinalSummary = summaryFromComparison ?? undefined;
      trajectoryPattern = trajectoryFromComparison?.label ?? undefined;
      trajectoryConfidence = trajectoryFromComparison?.confidence ?? undefined;
    }

    const painSeries = await comparisonService.getLastNPainSeries(patientId, 3);
    const hasPainSeries = painSeries.length >= 2;
    const painSeriesSummary = hasPainSeries ? painSeries.join(' → ') : undefined;

    if (!longitudinalSummary && hasPainSeries) {
      const firstPainPoint = painSeries[0];
      const lastPainPoint = painSeries[painSeries.length - 1];
      const trajectoryFromSeries = classifyTrajectoryFromTwoPoints(firstPainPoint, lastPainPoint);
      const summaryFromSeries = `Pain trend across available history: ${painSeriesSummary}. Overall trend: ${trajectoryFromSeries?.label ?? 'stable'}.`;

      longitudinalSummary = summaryFromSeries;
      trajectoryPattern = trajectoryPattern ?? trajectoryFromSeries?.label ?? undefined;
      trajectoryConfidence = trajectoryConfidence ?? trajectoryFromSeries?.confidence ?? undefined;
    }

    let patternInsightSummary: string | undefined;

    try {
      const memoryService = new PatientTrajectoryMemoryService();
      const patternInsight = await memoryService.getPatternInsight(patientId);
      patternInsightSummary = patternInsight?.description ?? undefined;
    } catch (error) {
      console.warn('[FollowUpClinicalContext] Pattern insight unavailable, continuing without it.', error);
    }

    let preservedSignalsSummary: string | undefined;

    try {
      const preservedSignals = await retrievePreviousLongitudinalContext(patientId, currentSessionId);
      preservedSignalsSummary = formatLongitudinalSignalsForPrompt(preservedSignals);
    } catch (error) {
      console.warn('[FollowUpClinicalContext] Preserved longitudinal signals unavailable, continuing without them.', error);
    }

    if (preservedSignalsSummary) {
      longitudinalSummary = [longitudinalSummary, preservedSignalsSummary]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .join('\n\n');
    }

    const reviewedAttachmentsSummary = buildReviewedAttachmentsSummary(attachments);
    const currentSessionCount = comparisonState.currentSessionNumber ?? 0;
    const nextSessionNumber = hasPreviousHistory ? currentSessionCount + 1 : 1;
    const nextSessionOrdinalLabel = getSessionOrdinalLabel(nextSessionNumber);

    let historyStatusLabel = '';

    if (hasPreviousHistory) {
      historyStatusLabel = 'Historial clínico previo disponible';
    } else {
      historyStatusLabel = nextSessionNumber === 1 ? 'Sesión 1' : nextSessionOrdinalLabel;
    }

    const sourceBuckets: FollowUpSourceBuckets = {
      subjectiveFacts: [],
      objectiveMeasuredToday: [],
      objectiveFromReviewedAttachments: reviewedAttachmentsSummary ? [reviewedAttachmentsSummary] : [],
      longitudinalFacts: [
        longitudinalSummary,
        painSeriesSummary,
        patternInsightSummary,
        preservedSignalsSummary,
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
    };

    return {
      comparisonState,
      hasPreviousHistory,
      nextSessionNumber,
      nextSessionOrdinalLabel,
      historyStatusLabel,
      longitudinalSummary,
      trajectoryPattern,
      trajectoryConfidence,
      painSeriesSummary,
      patternInsightSummary,
      reviewedAttachmentsSummary,
      sourceBuckets,
    };
  }
}
