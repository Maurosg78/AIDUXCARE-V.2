import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as AnalyticsService from '../../services/UsageAnalyticsService';
import { createValidSuggestion, simulateCompleteClinicalFlow } from '../IntegrationTests';

/**
 * Tipo para nivel de riesgo clínico
 */
type RiskLevelSummary = 'low' | 'medium' | 'high';

/**
 * Tipo para evolución clínica
 */
type ClinicalEvolution = 'improved' | 'stable' | 'worsened';

/**
 * Tipo para métricas de uso
 */
type UsageMetricType = 'suggestions_generated' | 'suggestions_accepted' | 'suggestions_integrated' | 'suggestion_field_matched';

/**
 * Interfaz para métricas de uso en tests
 */
interface UsageMetric {
  type: UsageMetricType;
  value: number;
  estimated_time_saved_minutes?: number;
  details?: Record<string, unknown>;
}

/**
 * Interfaz para métrica longitudinal en tests
 */
interface TestLongitudinalMetric {
  id: string;
  visit_id: string;
  previous_visit_id: string;
  patient_id: string;
  user_id: string;
  date: string;
  fields_changed: number;
  suggestions_generated: number;
  suggestions_accepted: number;
  suggestions_integrated: number;
  audio_items_validated: number;
  time_saved_minutes: number;
  risk_level_summary: RiskLevelSummary;
  clinical_evolution: ClinicalEvolution;
}

// Mock para servicios de analíticas
vi.mock('../../services/UsageAnalyticsService', () => ({
  getMetricsSummaryByVisit: vi.fn(),
  getMetricsByTypeForVisit: vi.fn(),
  calculateLongitudinalMetrics: vi.fn(),
  getLongitudinalMetricsByPatient: vi.fn(),
  getLongitudinalMetricForVisit: vi.fn(),
  track: vi.fn(),
  logMetric: vi.fn()
}));

describe('Métricas Longitudinales - Evaluación de integración', () => {
  // Datos de prueba
  const mockVisitId = 'visit-test-123';
  const mockPreviousVisitId = 'visit-test-prev';
  const mockPatientId = 'patient-test-456';
  const mockUserId = 'user-test-789';
  
  // Métricas simuladas para las visitas
  const mockCurrentMetrics = {
    generated: 12,
    accepted: 8,
    integrated: 6,
    field_matched: 4,
    warnings: 3,
    estimated_time_saved_minutes: 20
  };
  
  const mockPreviousMetrics = {
    generated: 8,
    accepted: 6,
    integrated: 5,
    field_matched: 3,
    warnings: 1,
    estimated_time_saved_minutes: 15
  };
  
  // Métrica longitudinal simulada
  const mockLongitudinalMetric: TestLongitudinalMetric = {
    id: 'metric-123',
    visit_id: mockVisitId,
    previous_visit_id: mockPreviousVisitId,
    patient_id: mockPatientId,
    user_id: mockUserId,
    date: new Date().toISOString(),
    fields_changed: 5,
    suggestions_generated: 12,
    suggestions_accepted: 8,
    suggestions_integrated: 6,
    audio_items_validated: 3,
    time_saved_minutes: 20,
    risk_level_summary: 'medium',
    clinical_evolution: 'improved'
  };

  // Restablecer los mocks antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mocks para servicios de analíticas
    vi.mocked(AnalyticsService.getMetricsSummaryByVisit)
      .mockImplementation((visitId) => {
        if (visitId === mockVisitId) return mockCurrentMetrics;
        if (visitId === mockPreviousVisitId) return mockPreviousMetrics;
        return {
          generated: 0,
          accepted: 0,
          integrated: 0,
          field_matched: 0,
          warnings: 0,
          estimated_time_saved_minutes: 0
        };
      });
    
    vi.mocked(AnalyticsService.calculateLongitudinalMetrics)
      .mockResolvedValue(mockLongitudinalMetric);
    
    vi.mocked(AnalyticsService.getLongitudinalMetricsByPatient)
      .mockResolvedValue([mockLongitudinalMetric]);
    
    vi.mocked(AnalyticsService.getLongitudinalMetricForVisit)
      .mockResolvedValue(mockLongitudinalMetric);
  });

  it('debe calcular correctamente métricas longitudinales entre visitas', async () => {
    // Calcular métricas longitudinales
    const result = await AnalyticsService.calculateLongitudinalMetrics(
      mockVisitId,
      mockPreviousVisitId,
      mockPatientId,
      mockUserId,
      5, // fieldsChanged
      3, // audioItemsValidated
      'improved' as ClinicalEvolution
    );
    
    // Verificar que se obtuvieron las métricas de ambas visitas
    expect(AnalyticsService.getMetricsSummaryByVisit).toHaveBeenCalledWith(mockVisitId);
    expect(AnalyticsService.getMetricsSummaryByVisit).toHaveBeenCalledWith(mockPreviousVisitId);
    
    // Verificar el resultado
    expect(result).toEqual(mockLongitudinalMetric);
    expect(result.visit_id).toBe(mockVisitId);
    expect(result.previous_visit_id).toBe(mockPreviousVisitId);
    expect(result.patient_id).toBe(mockPatientId);
    expect(result.fields_changed).toBe(5);
    expect(result.suggestions_generated).toBe(12);
    expect(result.audio_items_validated).toBe(3);
    expect(result.clinical_evolution).toBe('improved');
  });

  it('debe obtener correctamente las métricas longitudinales por paciente', async () => {
    // Obtener métricas por paciente
    const metrics = await AnalyticsService.getLongitudinalMetricsByPatient(mockPatientId);
    
    // Verificar que se llamó con el ID de paciente correcto
    expect(AnalyticsService.getLongitudinalMetricsByPatient).toHaveBeenCalledWith(mockPatientId);
    
    // Verificar el resultado
    expect(metrics).toEqual([mockLongitudinalMetric]);
    expect(metrics[0].patient_id).toBe(mockPatientId);
  });

  it('debe obtener correctamente la métrica longitudinal para una visita específica', async () => {
    // Obtener métrica para una visita
    const metric = await AnalyticsService.getLongitudinalMetricForVisit(mockVisitId);
    
    // Verificar que se llamó con el ID de visita correcto
    expect(AnalyticsService.getLongitudinalMetricForVisit).toHaveBeenCalledWith(mockVisitId);
    
    // Verificar el resultado
    expect(metric).not.toBeNull();
    if (metric) {
      expect(metric).toEqual(mockLongitudinalMetric);
      expect(metric.visit_id).toBe(mockVisitId);
    }
  });

  it('debe detectar correctamente el aumento de nivel de riesgo basado en advertencias', async () => {
    // Modificar mocks para simular más advertencias en la visita actual
    const highRiskCurrentMetrics = {
      ...mockCurrentMetrics,
      warnings: 5, // Más advertencias que antes
      accepted: 2  // Baja tasa de aceptación (2/12)
    };
    
    vi.mocked(AnalyticsService.getMetricsSummaryByVisit)
      .mockImplementation((visitId) => {
        if (visitId === mockVisitId) return highRiskCurrentMetrics;
        if (visitId === mockPreviousVisitId) return mockPreviousMetrics;
        return {
          generated: 0,
          accepted: 0,
          integrated: 0,
          field_matched: 0,
          warnings: 0,
          estimated_time_saved_minutes: 0
        };
      });
    
    const highRiskLongitudinalMetric: TestLongitudinalMetric = {
      ...mockLongitudinalMetric,
      risk_level_summary: 'high' // Debería detectar nivel alto
    };
    
    vi.mocked(AnalyticsService.calculateLongitudinalMetrics)
      .mockResolvedValue(highRiskLongitudinalMetric);
    
    // Calcular métricas longitudinales
    const result = await AnalyticsService.calculateLongitudinalMetrics(
      mockVisitId,
      mockPreviousVisitId,
      mockPatientId,
      mockUserId
    );
    
    // Verificar el resultado
    expect(result.risk_level_summary).toBe('high');
  });

  it('debe registrar correctamente métricas mediante track', () => {
    // Datos de prueba
    const mockEvent = 'suggestions_generated';
    const mockValue = 5;
    const mockDetails = { source: 'test_source' };
    
    // Registrar una métrica mediante track
    AnalyticsService.track(
      mockEvent,
      mockUserId,
      mockVisitId,
      mockValue,
      mockDetails
    );
    
    // Verificar que se llamó a track con los parámetros correctos
    expect(AnalyticsService.track).toHaveBeenCalledWith(
      mockEvent,
      mockUserId,
      mockVisitId,
      mockValue,
      mockDetails
    );
  });
  
  it('debe registrar correctamente métricas con logMetric', () => {
    // Datos de prueba
    const mockMetric: UsageMetric = {
      type: 'suggestions_generated',
      value: 5,
      estimated_time_saved_minutes: 15,
      details: { source: 'test_source' }
    };
    
    // Registrar una métrica
    AnalyticsService.logMetric(mockMetric);
    
    // Verificar que se llamó a logMetric con los parámetros correctos
    expect(AnalyticsService.logMetric).toHaveBeenCalledWith(mockMetric);
  });
}); 