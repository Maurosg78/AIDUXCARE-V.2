import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FollowUpClinicalContextService } from '../followUpClinicalContextService';

const mockGetEncountersComparisonState = vi.fn();
const mockCompareSessions = vi.fn();
const mockFormatComparisonForUI = vi.fn();
const mockBuildLongitudinalSummaryForPrompt = vi.fn();
const mockGetLastNPainSeries = vi.fn();
const mockGetPatternInsight = vi.fn();

vi.mock('../sessionComparisonService', () => ({
  SessionComparisonService: vi.fn().mockImplementation(() => ({
    getEncountersComparisonState: mockGetEncountersComparisonState,
    compareSessions: mockCompareSessions,
    formatComparisonForUI: mockFormatComparisonForUI,
    buildLongitudinalSummaryForPrompt: mockBuildLongitudinalSummaryForPrompt,
    getLastNPainSeries: mockGetLastNPainSeries,
  })),
}));

vi.mock('../patientTrajectoryMemoryService', () => ({
  PatientTrajectoryMemoryService: vi.fn().mockImplementation(() => ({
    getPatternInsight: mockGetPatternInsight,
  })),
}));

describe('FollowUpClinicalContextService', () => {
  beforeEach(() => {
    mockGetEncountersComparisonState.mockReset();
    mockCompareSessions.mockReset();
    mockFormatComparisonForUI.mockReset();
    mockBuildLongitudinalSummaryForPrompt.mockReset();
    mockGetLastNPainSeries.mockReset();
    mockGetPatternInsight.mockReset();
  });

  it('derives next session ordinal from longitudinal history instead of empty visit count', async () => {
    mockGetEncountersComparisonState.mockResolvedValue({
      isFirstSession: false,
      currentSessionNumber: 3,
      previousSessionNumber: 2,
      previousSession: { id: 's2' },
      currentSession: { id: 's3' },
    });
    mockCompareSessions.mockReturnValue({});
    mockFormatComparisonForUI.mockReturnValue({
      metrics: {
        painLevel: {
          previous: 5,
          current: 3,
        },
      },
    });
    mockBuildLongitudinalSummaryForPrompt.mockReturnValue('Pain improved since last visit.');
    mockGetLastNPainSeries.mockResolvedValue([5, 4, 3]);
    mockGetPatternInsight.mockResolvedValue({ description: 'Gradual improvement pattern.' });

    const service = new FollowUpClinicalContextService();
    const context = await service.resolve('patient-1', []);

    expect(context.hasPreviousHistory).toBe(true);
    expect(context.nextSessionNumber).toBe(4);
    expect(context.historyStatusLabel).toBe('Historial clínico previo disponible');
  });

  it('includes only attachments explicitly reviewed today in the objective attachment bucket', async () => {
    mockGetEncountersComparisonState.mockResolvedValue({
      isFirstSession: true,
      reason: 'no_previous_session',
      currentSessionNumber: 1,
    });
    mockGetLastNPainSeries.mockResolvedValue([]);
    mockGetPatternInsight.mockResolvedValue(null);

    const service = new FollowUpClinicalContextService();
    const context = await service.resolve('patient-2', [
      {
        id: 'a1',
        name: 'Informe radiológico.pdf',
        size: 100,
        contentType: 'application/pdf',
        storagePath: 'x',
        downloadURL: 'https://example.com/a1',
        uploadedAt: new Date().toISOString(),
        extractedText: 'Fractura consolidada sin desplazamiento secundario.',
        reviewedToday: true,
        processingComplete: true,
      },
      {
        id: 'a2',
        name: 'Foto piel.png',
        size: 100,
        contentType: 'image/png',
        storagePath: 'y',
        downloadURL: 'https://example.com/a2',
        uploadedAt: new Date().toISOString(),
        extractedText: 'Piel íntegra.',
        reviewedToday: false,
        processingComplete: true,
      },
    ]);

    expect(context.reviewedAttachmentsSummary).toContain('Adjunto revisado hoy');
    expect(context.reviewedAttachmentsSummary).toContain('Informe radiológico.pdf');
    expect(context.reviewedAttachmentsSummary).not.toContain('Foto piel.png');
    expect(context.sourceBuckets.objectiveFromReviewedAttachments).toHaveLength(1);
  });

  it('uses non-diagnostic image prefix and ignores attachments still processing', async () => {
    mockGetEncountersComparisonState.mockResolvedValue({
      isFirstSession: true,
      reason: 'no_previous_session',
      currentSessionNumber: 1,
    });
    mockGetLastNPainSeries.mockResolvedValue([]);
    mockGetPatternInsight.mockResolvedValue(null);

    const service = new FollowUpClinicalContextService();
    const context = await service.resolve('patient-3', [
      {
        id: 'a1',
        name: 'RX muñeca.jpg',
        size: 100,
        contentType: 'image/jpeg',
        storagePath: 'x',
        downloadURL: 'https://example.com/a1',
        uploadedAt: new Date().toISOString(),
        extractedText: 'Se aprecia material de osteosíntesis visible.',
        reviewedToday: true,
        processingComplete: true,
      },
      {
        id: 'a2',
        name: 'RX pendiente.jpg',
        size: 100,
        contentType: 'image/jpeg',
        storagePath: 'y',
        downloadURL: 'https://example.com/a2',
        uploadedAt: new Date().toISOString(),
        reviewedToday: true,
        processingComplete: false,
      },
    ]);

    expect(context.reviewedAttachmentsSummary).toContain('Imagen clínica revisada hoy — descripción automática no diagnóstica');
    expect(context.reviewedAttachmentsSummary).toContain('RX muñeca.jpg');
    expect(context.reviewedAttachmentsSummary).not.toContain('RX pendiente.jpg');
  });
});
