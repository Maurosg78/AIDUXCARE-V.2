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

import {
  extractAdherenceLevel,
  extractFunctionStatus,
  extractRomStatus,
  PatientTrajectoryMemoryService,
} from '../patientTrajectoryMemoryService';

describe('extractRomStatus', () => {
  it('returns improved when text has a clear ROM improvement signal', () => {
    const text = 'Paciente con mejoría clara y mayor rango de movimiento en muñeca.';

    const result = extractRomStatus(text);

    expect(result).toBe('improved');
  });

  it('returns decreased when text has a clear ROM deterioration signal', () => {
    const text = 'Persiste limitación importante con movilidad limitada y reduced range.';

    const result = extractRomStatus(text);

    expect(result).toBe('decreased');
  });

  it('returns null when text has no clear ROM signal', () => {
    const text = 'Paciente motivada y con buena tolerancia general.';

    const result = extractRomStatus(text);

    expect(result).toBeNull();
  });
});

describe('extractFunctionStatus', () => {
  it('returns improved when text has a clear function improvement signal', () => {
    const text = 'Ahora puede realizar actividades básicas y returned to work part-time.';

    const result = extractFunctionStatus(text);

    expect(result).toBe('improved');
  });

  it('returns decreased when text has a clear function deterioration signal', () => {
    const text = 'Refiere dificultad para vestirse y unable to lift objects overhead.';

    const result = extractFunctionStatus(text);

    expect(result).toBe('decreased');
  });

  it('returns null when text has no clear function signal', () => {
    const text = 'Se revisan resultados de imagen y educación del dolor.';

    const result = extractFunctionStatus(text);

    expect(result).toBeNull();
  });
});

describe('extractAdherenceLevel', () => {
  it('returns high when text has a clear high adherence signal', () => {
    const text = 'HEP 100%, completed all exercises and cumplió con el plan.';

    const result = extractAdherenceLevel(text);

    expect(result).toBe('high');
  });

  it('returns low when text has a clear low adherence signal', () => {
    const text = 'No realizó ejercicios en casa, forgot routine and skipped sessions.';

    const result = extractAdherenceLevel(text);

    expect(result).toBe('low');
  });

  it('returns null when text has no clear adherence signal', () => {
    const text = 'Se discuten objetivos terapéuticos de la próxima semana.';

    const result = extractAdherenceLevel(text);

    expect(result).toBeNull();
  });
});

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
    const objectiveText = 'Sin cambios objetivos relevantes.';
    const assessmentText = 'Mantiene actividades habituales.';

    testMocks.mockExtractPainFromSubjective.mockReturnValue(null);

    const result = await service.buildEncounterLongitudinalSnapshot(patientId, subjectiveText, {
      hepAdherenceRate,
      objectiveText,
      assessmentText,
    });

    expect(result).toEqual({
      painScore: null,
      hepAdherenceRate,
      trajectory: null,
      trajectoryConfidence: null,
      romStatus: null,
      functionStatus: 'stable',
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
    const objectiveText = 'Mayor rango de movimiento y better mobility.';
    const assessmentText = 'Ahora puede realizar tareas básicas con menos limitación.';
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
      objectiveText,
      assessmentText,
    });

    expect(testMocks.mockClassifyTrajectory).toHaveBeenCalledWith([7, 5, 4]);
    expect(result).toEqual({
      painScore: 4,
      hepAdherenceRate,
      trajectory: 'improved',
      trajectoryConfidence: 'high',
      romStatus: 'improved',
      functionStatus: 'improved',
      adherenceLevel: null,
      keyLimitations: undefined,
      alerts: undefined,
    });
  });

  it('returns partial snapshot with null trajectory when pain exists but history is insufficient', async () => {
    const service = new PatientTrajectoryMemoryService();
    const patientId = 'patient-3';
    const subjectiveText = 'Dolor actual 5/10.';
    const objectiveText = 'Movilidad limitada y reduced range today.';
    const assessmentText = 'Paciente parcialmente adherente, some exercises completed.';

    testMocks.mockExtractPainFromSubjective.mockReturnValue(5);
    testMocks.mockGetLastNPainSeries.mockResolvedValue([]);

    const result = await service.buildEncounterLongitudinalSnapshot(patientId, subjectiveText, {
      objectiveText,
      assessmentText,
    });

    expect(result).toEqual({
      painScore: 5,
      hepAdherenceRate: null,
      trajectory: null,
      trajectoryConfidence: null,
      romStatus: 'decreased',
      functionStatus: null,
      adherenceLevel: 'medium',
      keyLimitations: undefined,
      alerts: undefined,
    });
    expect(testMocks.mockClassifyTrajectory).not.toHaveBeenCalled();
  });
});
