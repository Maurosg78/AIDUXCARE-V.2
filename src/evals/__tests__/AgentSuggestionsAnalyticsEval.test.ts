import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentSuggestionsAnalytics from '../../shared/components/Agent/AgentSuggestionsAnalytics';
import * as UsageAnalyticsService from '../../services/UsageAnalyticsService';
import { createMultipleSuggestions } from '../IntegrationTests';
import { SuggestionType } from '../../core/types/suggestions';

/**
 * Tipado para feedback de sugerencia
 */
type SuggestionFeedback = 'accept' | 'reject' | 'defer';

// Augmentar el tipado de AgentSuggestion para incluir feedback
declare module '../../core/agent/ClinicalAgent' {
  interface AgentSuggestion {
    feedback?: SuggestionFeedback;
  }
}

// Mock para los servicios de analíticas
vi.mock('../../services/UsageAnalyticsService', () => ({
  getMetricsSummaryByVisit: vi.fn(),
  getMetricsByTypeForVisit: vi.fn()
}));

describe('AgentSuggestionsAnalytics - Evaluación de integración', () => {
  // Datos de prueba
  const mockVisitId = 'visit-test-123';
  const mockSuggestions = createMultipleSuggestions(6); // 2 de cada tipo
  
  // Métricas simuladas
  const mockMetricsSummary = {
    generated: 15,
    accepted: 10,
    integrated: 8,
    field_matched: 6,
    warnings: 3,
    estimated_time_saved_minutes: 30
  };
  
  const mockTypeMetrics = [
    { type: 'recommendation' as SuggestionType, generated: 8, accepted: 6, integrated: 5 },
    { type: 'warning' as SuggestionType, generated: 4, accepted: 3, integrated: 2 },
    { type: 'info' as SuggestionType, generated: 3, accepted: 1, integrated: 1 }
  ];

  // Restablecer todos los mocks antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mocks para servicios de analíticas
    vi.mocked(UsageAnalyticsService.getMetricsSummaryByVisit).mockReturnValue(mockMetricsSummary);
    vi.mocked(UsageAnalyticsService.getMetricsByTypeForVisit).mockReturnValue(mockTypeMetrics);
    
    // Asignar valores de feedback a las sugerencias para probar
    mockSuggestions.forEach((suggestion, index) => {
      if (index < 2) suggestion.feedback = 'accept';
      else if (index < 4) suggestion.feedback = 'reject';
      else suggestion.feedback = 'defer';
    });
  });

  it('debe renderizar correctamente el resumen de sugerencias', () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsAnalytics
        suggestions={mockSuggestions}
        visitId={mockVisitId}
      />
    );
    
    // Verificar que se muestra el título
    const title = screen.getByText(/impacto clínico/i);
    expect(title).toBeInTheDocument();
    
    // Verificar que se muestran las estadísticas básicas
    expect(screen.getByText(/6 sugerencias/i)).toBeInTheDocument();
    
    // Expandir el panel para ver detalles
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);
    
    // Verificar que se muestran detalles adicionales
    expect(screen.getByText(/recomendaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/advertencias/i)).toBeInTheDocument();
    expect(screen.getByText(/informativas/i)).toBeInTheDocument();
  });

  it('debe mostrar correctamente las métricas por tipo de sugerencia', () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsAnalytics
        suggestions={mockSuggestions}
        visitId={mockVisitId}
      />
    );
    
    // Expandir el panel para ver detalles
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);
    
    // Verificar que se muestran las barras del gráfico para cada tipo
    const barElements = screen.getAllByRole('progressbar');
    expect(barElements.length).toBeGreaterThan(0);
    
    // Verificar que se obtuvieron las métricas del servicio
    expect(UsageAnalyticsService.getMetricsSummaryByVisit).toHaveBeenCalledWith(mockVisitId);
    expect(UsageAnalyticsService.getMetricsByTypeForVisit).toHaveBeenCalledWith(mockVisitId);
  });

  it('debe calcular correctamente las tasas de adherencia', () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsAnalytics
        suggestions={mockSuggestions}
        visitId={mockVisitId}
      />
    );
    
    // Expandir el panel para ver detalles
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);
    
    // Verificar que la tasa de adherencia se muestra correctamente
    // Tenemos 2 aceptadas de 6 totales = 33%
    const adherenceText = screen.getByText(/adherencia/i);
    expect(adherenceText.textContent).toContain('33%');
    
    // Verificar que se muestran los conteos de feedback
    const acceptedCount = screen.getByText(/aceptadas/i);
    expect(acceptedCount.textContent).toContain('2 de 6');
    
    const rejectedCount = screen.getByText(/rechazadas/i);
    expect(rejectedCount.textContent).toContain('2 de 6');
    
    const deferredCount = screen.getByText(/pendientes/i);
    expect(deferredCount.textContent).toContain('2 de 6');
  });

  it('no debe renderizar nada si no hay sugerencias', () => {
    // Renderizar el componente sin sugerencias
    const { container } = render(
      <AgentSuggestionsAnalytics
        suggestions={[]}
        visitId={mockVisitId}
      />
    );
    
    // Verificar que no se renderiza contenido
    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar el nivel de riesgo basado en advertencias ignoradas', () => {
    // Configurar sugerencias con advertencias ignoradas
    const warningsSuggestions = createMultipleSuggestions(4).map(s => ({
      ...s,
      type: 'warning' as SuggestionType,
      feedback: 'reject' as SuggestionFeedback
    }));
    
    // Renderizar el componente
    render(
      <AgentSuggestionsAnalytics
        suggestions={warningsSuggestions}
        visitId={mockVisitId}
      />
    );
    
    // Expandir el panel para ver detalles
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);
    
    // Verificar que se muestra un nivel de riesgo alto
    expect(screen.getByText(/riesgo: alto/i)).toBeInTheDocument();
  });
}); 