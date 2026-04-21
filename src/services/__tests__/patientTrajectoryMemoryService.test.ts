import { beforeEach, describe, expect, it, vi } from 'vitest';

const testMocks = vi.hoisted(() => {
  return {
    mockGetLastNPainSeries: vi.fn(),
    mockExtractPainFromSubjective: vi.fn(),
    mockClassifyTrajectory: vi.fn(),
  };
});

vi.mock('../sessionComparisonService', () => {
  const SessionComparisonService = vi.fn().mockImplementation(() => {
    return {
      getLastNPainSeries: testMocks.mockGetLastNPainSeries,
    };
  });
  return { SessionComparisonService };
});

vi.mock('../../core/longitudinal/extractPainFromSubjective', () => {
  return {
    extractPainFromSubjective: testMocks.mockExtractPainFromSubjective,
  };
});

vi.mock('../../core/longitudinal/trajectoryClassifier', () => {
  return {
    classifyTrajectory: testMocks.mockClassifyTrajectory,
  };
});

import { PatientTrajectoryMemoryService } from '../patientTrajectoryMemoryService';

describe('PatientTrajectoryMemoryService.buildEncounterLongitudinalSnapshot', () => {
  beforeEach(() => {
    testMocks.mockGetLastNPainSeries.mockReset();
    testMocks.mockExtractPainFromSubjective.mockReset();
    testMocks.mockClassifyTrajectory.mockReset();
  });

  it('returns partial snapshot with explicit nulls when pain score is unavailable', async () => {
    const service = new PatientTrajectoryMemoryService();
    const patientId = 'patient-1';
    const subjectiveText = 'Sin dolor cuantificado hoy.';
    const hepAdherenceRate = 0.67;

    testMocks.mockExtractPainFromSubjective.mockReturnValue(null);

    const result = await service.buildEncounterLongitudinalSnapshot(patientId, subjectiveText, {
      hepAdherenceRate,
    });

    expect(result).toEqual({
      painScore: null,
      hepAdherenceRate,
      trajectory: null,
      trajectoryConfidence: null,
      romStatus: null,
      functionStatus: null,
      adherenceLevel: null,
      keyLimitations: undefined,
      alerts: undefined,
    });
    expect(testMocks.mockGetLastNPainSeries).not.toHaveBeenCalled();
    expect(testMocks.mockClassifyTrajectory).not.toHaveBeenCalled();
  });

  it('returns pain, hep adherence, and trajectory when enough pain history exists', async () => {
    const service = new PatientTrajectoryMemoryService();
    const patientId = 'patient-2';
    const subjectiveText = 'Dolor actual 4/10.';
    const hepAdherenceRate = 0.75;
    const previousSeries = [7, 5];
    const classification = {
      label: 'improved',
      confidence: 'high',
    };

    testMocks.mockExtractPainFromSubjective.mockReturnValue(4);
    testMocks.mockGetLastNPainSeries.mockResolvedValue(previousSeries);
    testMocks.mockClassifyTrajectory.mockReturnValue(classification);

    const result = await service.buildEncounterLongitudinalSnapshot(patientId, subjectiveText, {
      hepAdherenceRate,
    });

    expect(testMocks.mockClassifyTrajectory).toHaveBeenCalledWith([7, 5, 4]);
    expect(result).toEqual({
      painScore: 4,
      hepAdherenceRate,
      trajectory: 'improved',
      trajectoryConfidence: 'high',
      romStatus: null,
      functionStatus: null,
      adherenceLevel: null,
      keyLimitations: undefined,
      alerts: undefined,
    });
  });

  it('returns partial snapshot with null trajectory when pain exists but history is insufficient', async () => {
    const service = new PatientTrajectoryMemoryService();
    const patientId = 'patient-3';
    const subjectiveText = 'Dolor actual 5/10.';

    testMocks.mockExtractPainFromSubjective.mockReturnValue(5);
    testMocks.mockGetLastNPainSeries.mockResolvedValue([]);

    const result = await service.buildEncounterLongitudinalSnapshot(patientId, subjectiveText);

    expect(result).toEqual({
      painScore: 5,
      hepAdherenceRate: null,
      trajectory: null,
      trajectoryConfidence: null,
      romStatus: null,
      functionStatus: null,
      adherenceLevel: null,
      keyLimitations: undefined,
      alerts: undefined,
    });
    expect(testMocks.mockClassifyTrajectory).not.toHaveBeenCalled();
  });
});
