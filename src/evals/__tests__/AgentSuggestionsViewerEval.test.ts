import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentSuggestionsViewer from '../../shared/components/Agent/AgentSuggestionsViewer';
import { EMRFormService } from '../../core/services/EMRFormService';
import { AuditLogger } from '../../core/audit/AuditLogger';
import * as UsageAnalyticsService from '../../services/UsageAnalyticsService';
import * as suggestionFeedbackDataSource from '../../core/dataSources/suggestionFeedbackDataSourceSupabase';
import { createValidSuggestion, createMultipleSuggestions } from '../IntegrationTests';
import { SuggestionType } from '../../core/types/suggestions';

// Mocks para servicios externos
vi.mock('../../core/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestedContent: vi.fn().mockResolvedValue(true),
    mapSuggestionTypeToEMRSection: vi.fn().mockReturnValue('plan')
  }
}));

vi.mock('../../core/audit/AuditLogger', () => ({
  AuditLogger: {
    logSuggestionIntegration: vi.fn()
  }
}));

vi.mock('../../services/UsageAnalyticsService', () => ({
  track: vi.fn(),
  logMetric: vi.fn()
}));

vi.mock('../../core/dataSources/suggestionFeedbackDataSourceSupabase', () => ({
  suggestionFeedbackDataSourceSupabase: {
    getFeedbacksByVisit: vi.fn().mockResolvedValue([]),
    createFeedback: vi.fn().mockResolvedValue({
      id: 'feedback-123',
      user_id: 'user-test-789',
      visit_id: 'visit-test-123',
      suggestion_id: 'suggestion-123',
      feedback_type: 'useful',
      created_at: new Date().toISOString()
    })
  }
}));

describe('AgentSuggestionsViewer - Evaluación de integración', () => {
  // Datos de prueba
  const mockVisitId = 'visit-test-123';
  const mockPatientId = 'patient-test-456';
  const mockUserId = 'user-test-789';
  const mockSuggestions = createMultipleSuggestions(5);
  const mockOnIntegrateSuggestions = vi.fn();

  // Restablecer todos los mocks antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock para getFeedbacksByVisit
    vi.mocked(suggestionFeedbackDataSource.suggestionFeedbackDataSourceSupabase.getFeedbacksByVisit).mockResolvedValue([]);
    
    // Mock para createFeedback
    vi.mocked(suggestionFeedbackDataSource.suggestionFeedbackDataSourceSupabase.createFeedback).mockResolvedValue({
      id: 'feedback-123',
      user_id: mockUserId,
      visit_id: mockVisitId,
      suggestion_id: mockSuggestions[0].id,
      feedback_type: 'useful',
      created_at: new Date().toISOString()
    });
  });

  it('debe renderizar correctamente las sugerencias proporcionadas', async () => {
    // Renderizar el componente con las sugerencias de prueba
    render(
      <AgentSuggestionsViewer
        visitId={mockVisitId}
        suggestions={mockSuggestions}
        onIntegrateSuggestions={mockOnIntegrateSuggestions}
        userId={mockUserId}
        patientId={mockPatientId}
      />
    );
    
    // Verificar que se muestra el botón para expandir las sugerencias
    const toggleButton = screen.getByRole('button', { name: /sugerencias/i });
    expect(toggleButton).toBeInTheDocument();
    
    // Verificar que se muestra el conteo correcto de sugerencias
    expect(toggleButton.textContent).toContain('5');
    
    // Expandir las sugerencias
    fireEvent.click(toggleButton);
    
    // Verificar que se muestran todas las sugerencias
    for (const suggestion of mockSuggestions) {
      const suggestionElement = await screen.findByText(suggestion.content);
      expect(suggestionElement).toBeInTheDocument();
    }
  });

  it('debe registrar feedback útil para una sugerencia', async () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsViewer
        visitId={mockVisitId}
        suggestions={mockSuggestions}
        onIntegrateSuggestions={mockOnIntegrateSuggestions}
        userId={mockUserId}
        patientId={mockPatientId}
      />
    );
    
    // Expandir las sugerencias
    const toggleButton = screen.getByRole('button', { name: /sugerencias/i });
    fireEvent.click(toggleButton);
    
    // Buscar el primer botón de feedback útil y hacer clic
    const usefulButtons = await screen.findAllByText(/útil/i);
    fireEvent.click(usefulButtons[0]);
    
    // Verificar que se llamó a createFeedback con los parámetros correctos
    await waitFor(() => {
      expect(suggestionFeedbackDataSource.suggestionFeedbackDataSourceSupabase.createFeedback).toHaveBeenCalledWith({
        user_id: mockUserId,
        visit_id: mockVisitId,
        suggestion_id: expect.any(String),
        feedback_type: 'useful'
      });
    });
    
    // Verificar que se actualizó la interfaz visualmente
    const acceptedBadge = await screen.findByText(/aceptada/i);
    expect(acceptedBadge).toBeInTheDocument();
  });

  it('debe integrar sugerencias aceptadas al EMR', async () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsViewer
        visitId={mockVisitId}
        suggestions={mockSuggestions}
        onIntegrateSuggestions={mockOnIntegrateSuggestions}
        userId={mockUserId}
        patientId={mockPatientId}
      />
    );
    
    // Expandir las sugerencias
    const toggleButton = screen.getByRole('button', { name: /sugerencias/i });
    fireEvent.click(toggleButton);
    
    // Aceptar la primera sugerencia
    const usefulButtons = await screen.findAllByText(/útil/i);
    fireEvent.click(usefulButtons[0]);
    
    // Buscar el botón para integrar al EMR y hacer clic
    const integrateButton = await screen.findByText(/integrar al emr/i);
    fireEvent.click(integrateButton);
    
    // Verificar que se llamó a insertSuggestedContent con los parámetros correctos
    await waitFor(() => {
      expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
        mockVisitId,
        expect.any(String),
        mockSuggestions[0].content,
        'agent',
        mockSuggestions[0].id
      );
    });
    
    // Verificar que se llamó a AuditLogger
    expect(AuditLogger.logSuggestionIntegration).toHaveBeenCalled();
    
    // Verificar que se registraron métricas
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestions_integrated',
      mockUserId,
      mockVisitId,
      1,
      expect.any(Object)
    );
    
    // Verificar que se llamó al callback onIntegrateSuggestions
    expect(mockOnIntegrateSuggestions).toHaveBeenCalledWith(1);
  });

  it('debe filtrar sugerencias por tipo', async () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsViewer
        visitId={mockVisitId}
        suggestions={mockSuggestions}
        onIntegrateSuggestions={mockOnIntegrateSuggestions}
        userId={mockUserId}
        patientId={mockPatientId}
      />
    );
    
    // Expandir las sugerencias
    const toggleButton = screen.getByRole('button', { name: /sugerencias/i });
    fireEvent.click(toggleButton);
    
    // Buscar botones de filtro de tipo y hacer clic en el de advertencias
    const filterButtons = await screen.findAllByRole('button', { name: /filtro/i });
    const warningFilter = filterButtons.find(button => button.textContent?.includes('warning'));
    
    if (warningFilter) {
      fireEvent.click(warningFilter);
      
      // Verificar que solo se muestran las sugerencias de tipo warning
      await waitFor(() => {
        const visibleSuggestions = screen.getAllByText(/.*/, { selector: '[data-suggestion-type]' });
        visibleSuggestions.forEach(suggestion => {
          expect(suggestion.getAttribute('data-suggestion-type')).toBe('warning');
        });
      });
    }
  });
}); 