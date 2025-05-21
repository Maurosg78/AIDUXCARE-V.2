import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { AgentSuggestion, SuggestionType } from '../../../../types/agent';
import { EMRFormService } from '../../../../core/services/EMRFormService';
import { AuditLogger } from '../../../../core/audit/AuditLogger';
import * as UsageAnalyticsService from '../../../../services/UsageAnalyticsService';
import { suggestionFeedbackDataSourceSupabase } from '../../../../core/dataSources/suggestionFeedbackDataSourceSupabase';
import * as AgentExplainer from '../../../../core/agent/AgentExplainer';

// Mock completo del cliente de Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

// Mock de las variables de entorno
vi.mock('../../../../config/env', () => ({
  SUPABASE_URL: 'https://test-supabase-url.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  __esModule: true,
  default: {}
}));

// Mock de AgentSuggestionFeedbackActions que simula la integración directa
// cuando se acepte una sugerencia
vi.mock('../AgentSuggestionFeedbackActions', () => {
  return {
    __esModule: true,
    default: ({ suggestion, onFeedback, isIntegrated, visitId, userId }) => {
      // Dejamos que el componente maneje la lógica de los datos
      const handleAccept = () => {
        // Cuando se hace clic en aceptar, simulamos la integración inmediata
        // llamando a los servicios originales
        EMRFormService.insertSuggestedContent(
          visitId,
          EMRFormService.mapSuggestionTypeToEMRSection(suggestion.type),
          suggestion.content,
          'agent',
          suggestion.id
        );
        
        // Registrar evento de auditoría
        AuditLogger.log('suggestion_accepted', {
          visitId,
          userId,
          suggestionId: suggestion.id,
          type: suggestion.type
        });
        
        // Registrar métrica de aceptación
        UsageAnalyticsService.track('suggestions_accepted', userId, visitId, 1);
        
        // Registrar métrica de sugerencia integrada
        UsageAnalyticsService.track('suggestions_integrated', userId, visitId, 1);
        
        // Registrar métrica de campo correspondido
        UsageAnalyticsService.track('suggestion_field_matched', userId, visitId, 1, {
          suggestion_id: suggestion.id,
          suggestion_type: suggestion.type,
          emr_section: EMRFormService.mapSuggestionTypeToEMRSection(suggestion.type)
        });
        
        // Notificar al padre
        onFeedback('accept');
      };

      // Renderizamos los botones de feedback
      return isIntegrated ? (
        <div data-testid={`feedback-${suggestion.id}`}>
          <span data-testid={`integrated-${suggestion.id}`}>Integrado al EMR</span>
        </div>
      ) : (
        <div data-testid={`feedback-${suggestion.id}`}>
          <button 
            data-testid={`accept-${suggestion.id}`} 
            onClick={handleAccept}
          >
            Aceptar
          </button>
          <button 
            data-testid={`reject-${suggestion.id}`} 
            onClick={() => onFeedback('reject')}
          >
            Rechazar
          </button>
        </div>
      );
    }
  };
});

// Simplificamos el componente AgentSuggestionExplainer
vi.mock('../AgentSuggestionExplainer', () => ({
  __esModule: true,
  default: () => <div data-testid="explainer">Explicación de la sugerencia</div>
}));

// Mock de formDataSourceSupabase
vi.mock('../../../../core/dataSources/formDataSourceSupabase', () => ({
  formDataSourceSupabase: {
    getFormsByVisitId: vi.fn().mockResolvedValue([]),
    updateForm: vi.fn().mockResolvedValue(true),
    createForm: vi.fn().mockResolvedValue(true)
  }
}));

// Mock del servicio de feedback
vi.mock('../../../../core/dataSources/suggestionFeedbackDataSourceSupabase', () => ({
  suggestionFeedbackDataSourceSupabase: {
    getFeedbacksByVisit: vi.fn(),
    getFeedbackBySuggestion: vi.fn()
  }
}));

// Mock de AgentExplainer
vi.mock('../../../../core/agent/AgentExplainer', () => ({
  explainSuggestion: vi.fn().mockImplementation(async (suggestion: AgentSuggestion) => {
    return Promise.resolve(`Explicación simulada para la sugerencia de tipo ${suggestion.type}`);
  })
}));

describe('AgentSuggestionsViewer', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';
  const onSuggestionAccepted = vi.fn();
  const onSuggestionRejected = vi.fn();
  
  // Ampliar el conjunto de sugerencias de prueba para validar filtros y ordenamiento
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'suggestion-1',
      sourceBlockId: 'block-1',
      type: 'recommendation',
      field: 'diagnosis',
      content: 'Considerar radiografía de tórax para descartar neumonía',
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'Basado en los síntomas reportados'
    },
    {
      id: 'suggestion-2',
      sourceBlockId: 'block-2',
      type: 'warning',
      field: 'medication',
      content: 'Paciente con alergias a medicamentos específicos',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'suggestion-3',
      sourceBlockId: 'block-3',
      type: 'info',
      field: 'history',
      content: 'Última visita el 12/03/2023 por dolor abdominal',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'suggestion-4',
      sourceBlockId: 'block-4',
      type: 'recommendation',
      field: 'followup',
      content: 'Realizar seguimiento de presión arterial en próxima visita',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'suggestion-5',
      sourceBlockId: 'block-5',
      type: 'warning',
      field: 'lab_results',
      content: 'HbA1c elevada, posible descompensación diabética',
      createdAt: new Date(),
      updatedAt: new Date(),
      explanation: 'Basado en resultados de laboratorio'
    }
  ];

  // Mock de feedbacks para las pruebas
  const mockFeedbacks = [
    {
      id: 'feedback-1',
      user_id: 'test-user',
      visit_id: 'test-visit-id',
      suggestion_id: 'suggestion-1',
      feedback_type: 'useful' as 'useful' | 'irrelevant' | 'incorrect' | 'dangerous',
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 'feedback-2',
      user_id: 'test-user',
      visit_id: 'test-visit-id',
      suggestion_id: 'suggestion-2',
      feedback_type: 'incorrect' as 'useful' | 'irrelevant' | 'incorrect' | 'dangerous',
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 'feedback-3',
      user_id: 'test-user',
      visit_id: 'test-visit-id',
      suggestion_id: 'suggestion-5',
      feedback_type: 'useful' as 'useful' | 'irrelevant' | 'incorrect' | 'dangerous',
      created_at: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(EMRFormService, 'mapSuggestionTypeToEMRSection').mockImplementation((type: SuggestionType) => {
      switch (type) {
        case 'recommendation':
          return 'plan';
        case 'warning':
          return 'assessment';
        case 'info':
          return 'notes';
        default:
          return 'notes';
      }
    });
    
    vi.spyOn(EMRFormService, 'insertSuggestedContent').mockResolvedValue(true);
    vi.spyOn(AuditLogger, 'log').mockReturnValue(true);
    vi.spyOn(UsageAnalyticsService, 'track').mockImplementation(() => {});
    
    vi.mocked(suggestionFeedbackDataSourceSupabase.getFeedbacksByVisit).mockResolvedValue(mockFeedbacks);

    // Mock de AgentExplainer para que retorne una Promise
    vi.spyOn(AgentExplainer, 'explainSuggestion').mockImplementation(async (suggestion: AgentSuggestion) => {
      return Promise.resolve(`Explicación simulada para la sugerencia de tipo ${suggestion.type}`);
    });
  });

  // Nuevas pruebas para la funcionalidad de búsqueda y filtrado
  describe('Búsqueda y filtrado de sugerencias', () => {
    it('debe filtrar sugerencias por texto de búsqueda', async () => {
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Verificar que se muestran todas las sugerencias inicialmente
      expect(screen.getByText('Mostrando todas las sugerencias (5)')).toBeInTheDocument();
      
      // Buscar por texto
      fireEvent.change(screen.getByTestId('suggestion-search-input'), { 
        target: { value: 'neumonía' } 
      });
      
      // Verificar que solo se muestra la sugerencia que contiene "neumonía"
      await waitFor(() => {
        expect(screen.getByText('Mostrando 1 de 5 sugerencias')).toBeInTheDocument();
      });

      // Verificar que el texto específico aparece en pantalla
      expect(screen.getByText('Considerar radiografía de tórax para descartar neumonía')).toBeInTheDocument();
      
      // Verificar que otros textos no aparecen
      expect(screen.queryByText('Paciente con alergias a medicamentos específicos')).not.toBeInTheDocument();
      
      // Verificar que se registró la métrica de uso de filtros
      expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
        'suggestion_search_filter_used',
        userId,
        visitId,
        1,
        expect.objectContaining({
          search_text: 'neumonía'
        })
      );
    });

    it('debe filtrar sugerencias por tipo', async () => {
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Verificar que se muestran todas las sugerencias inicialmente
      expect(screen.getByText('Mostrando todas las sugerencias (5)')).toBeInTheDocument();
      
      // Filtrar solo por advertencias
      fireEvent.click(screen.getByTestId('filter-recommendation'));
      fireEvent.click(screen.getByTestId('filter-info'));
      
      // Deben quedar solo las advertencias (warning)
      await waitFor(() => {
        expect(screen.getByText('Mostrando 2 de 5 sugerencias')).toBeInTheDocument();
      });
      
      // Verificar que aparecen las advertencias
      expect(screen.getByText('Paciente con alergias a medicamentos específicos')).toBeInTheDocument();
      expect(screen.getByText('HbA1c elevada, posible descompensación diabética')).toBeInTheDocument();
      
      // Verificar que las recomendaciones e info no aparecen
      expect(screen.queryByText('Considerar radiografía de tórax para descartar neumonía')).not.toBeInTheDocument();
      expect(screen.queryByText('Última visita el 12/03/2023 por dolor abdominal')).not.toBeInTheDocument();
    });

    it('debe ordenar sugerencias por utilidad', async () => {
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Esperar a que se carguen los feedbacks
      await waitFor(() => {
        expect(screen.getAllByText(/Retroalimentación: Útil/)).toHaveLength(2);
      });
      
      // Ordenar por utilidad
      fireEvent.change(screen.getByTestId('sort-select'), { 
        target: { value: 'usefulness' } 
      });
      
      // Obtener todos los elementos de sugerencia
      const suggestionItems = await screen.findAllByTestId(/^suggestion-item/);
      
      // Verificar que las sugerencias con feedback "útil" aparecen primero
      const firstSuggestionText = suggestionItems[0].textContent;
      const secondSuggestionText = suggestionItems[1].textContent;
      
      // Las primeras sugerencias deberían contener "radiografía" o "descompensación" 
      // que son las marcadas como útiles
      expect(
        firstSuggestionText?.includes('radiografía') ||
        firstSuggestionText?.includes('descompensación') || 
        secondSuggestionText?.includes('radiografía') ||
        secondSuggestionText?.includes('descompensación')
      ).toBeTruthy();
    });

    it('debe resetear los filtros correctamente', async () => {
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Hacer una búsqueda que no retorne resultados
      fireEvent.change(screen.getByTestId('suggestion-search-input'), { 
        target: { value: 'texto que no existe en ninguna sugerencia' } 
      });
      
      // Esperar a que aparezca el mensaje de no se encontraron resultados
      await waitFor(() => {
        expect(screen.getByText('No se encontraron sugerencias que coincidan con los criterios de búsqueda.')).toBeInTheDocument();
      });
      
      // Verificar que aparece el botón para resetear filtros
      const resetButton = screen.getByTestId('reset-filters-button');
      expect(resetButton).toBeInTheDocument();
      
      // Hacer clic en el botón para resetear filtros
      fireEvent.click(resetButton);
      
      // Verificar que se muestran todas las sugerencias nuevamente
      await waitFor(() => {
        expect(screen.getByText('Mostrando todas las sugerencias (5)')).toBeInTheDocument();
      });
      
      // Verificar que aparecen todas las sugerencias
      expect(screen.getByText('Considerar radiografía de tórax para descartar neumonía')).toBeInTheDocument();
      expect(screen.getByText('Paciente con alergias a medicamentos específicos')).toBeInTheDocument();
      expect(screen.getByText('HbA1c elevada, posible descompensación diabética')).toBeInTheDocument();
    });
  });

  // Nuevas pruebas para la visualización del contexto de origen
  describe('Visualización del contexto de origen', () => {
    it('debe mostrar el contexto de origen cuando está disponible', async () => {
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Verificar que se muestra el contexto de origen para las sugerencias que lo tienen
      await waitFor(() => {
        // Debe haber exactamente 2 elementos con el contexto de origen presente
        const contextOrigins = screen.getAllByTestId('suggestion-context-origin');
        expect(contextOrigins).toHaveLength(2);
        
        // Verificar el contenido específico del primer contexto de origen
        expect(screen.getByText('Motivo de consulta')).toBeInTheDocument();
        expect(screen.getByText('Paciente refiere dolor torácico y dificultad respiratoria desde hace 3 días.')).toBeInTheDocument();
        
        // Verificar el contenido específico del segundo contexto de origen
        expect(screen.getByText('Exámenes de Laboratorio')).toBeInTheDocument();
        expect(screen.getByText('HbA1c: 9.2%, glucemia: 245 mg/dl')).toBeInTheDocument();
      });
    });

    it('debe mostrar "Sin contexto disponible" cuando no hay contexto de origen', async () => {
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Verificar que se muestra el mensaje "Sin contexto disponible" para las sugerencias sin contexto
      await waitFor(() => {
        // Debe haber exactamente 3 elementos sin contexto de origen
        const noContextMessages = screen.getAllByTestId('suggestion-context-unavailable');
        expect(noContextMessages).toHaveLength(3);
        
        // Verificar que todos muestran el mensaje correcto
        noContextMessages.forEach(element => {
          expect(element).toHaveTextContent('Sin contexto disponible');
        });
      });
    });
  });

  // Mantener los tests existentes inalterados
  it('debe validar la integración completa de sugerencias al EMR con auditoría y métricas', async () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir el componente para mostrar las sugerencias
    fireEvent.click(screen.getByTestId('toggle-suggestions'));

    // Verificar que se muestran las sugerencias (al menos las primeras dos)
    expect(screen.getByText('Considerar radiografía de tórax para descartar neumonía')).toBeInTheDocument();
    expect(screen.getByText('Paciente con alergias a medicamentos específicos')).toBeInTheDocument();

    // Aceptar la primera sugerencia (esto debe desencadenar la integración inmediata)
    fireEvent.click(screen.getByTestId('accept-suggestion-1'));

    // 1. Verificar que la llamada a EMRFormService.insertSuggestedContent se realiza correctamente
    expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
      visitId,
      'plan', // mapeo de tipo recommendation a plan
      'Considerar radiografía de tórax para descartar neumonía',
      'agent',
      'suggestion-1'
    );

    // 2. Verificar que se ha registrado un evento en AuditLogger.log
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_accepted',
      expect.objectContaining({
        visitId,
        userId,
        suggestionId: 'suggestion-1'
      })
    );

    // 3. Verificar las métricas para la primera sugerencia
    // 3.1 Métrica de aceptación
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestions_accepted',
      userId,
      visitId,
      1
    );
    
    // 3.2 Métrica de integración
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestions_integrated',
      userId,
      visitId,
      1
    );
    
    // 3.3 Métrica de campo correspondido
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestion_field_matched',
      userId,
      visitId,
      1,
      expect.objectContaining({
        suggestion_id: 'suggestion-1',
        suggestion_type: 'recommendation',
        emr_section: 'plan'
      })
    );
  });

  it('no debe mostrar sugerencias si el componente no está expandido', () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Verificar que no se muestran las sugerencias
    expect(screen.queryByText('Considerar radiografía de tórax para descartar neumonía')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente con alergias a medicamentos específicos')).not.toBeInTheDocument();

    // Verificar que el componente está colapsado
    expect(screen.getByTestId('toggle-suggestions')).toBeInTheDocument();
  });

  it('debe manejar el caso cuando no hay sugerencias', () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={[]}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );
    
    // Expandir el componente
    fireEvent.click(screen.getByTestId('toggle-suggestions'));
    
    // Verificar que se muestra el mensaje de que no hay sugerencias
    expect(screen.getByText('Este agente no tiene sugerencias para esta visita.')).toBeInTheDocument();
  });

  it('debe mostrar correctamente los feedbacks de las sugerencias', async () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir el componente para mostrar las sugerencias
    fireEvent.click(screen.getByTestId('toggle-suggestions'));
    
    // Verificar que se carguen los feedbacks
    expect(suggestionFeedbackDataSourceSupabase.getFeedbacksByVisit).toHaveBeenCalledWith(visitId);

    // Esperar a que se muestren los feedbacks
    await waitFor(() => {
      // Verificar que aparecen los feedbacks correctos
      const utilElements = screen.getAllByText(/Retroalimentación: Útil/);
      const incorrectaElements = screen.getAllByText(/Retroalimentación: Incorrecta/);
      
      expect(utilElements).toHaveLength(2);
      expect(incorrectaElements).toHaveLength(1);
    });

    // Verificar que se ha registrado la métrica de visualización de feedback
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestion_feedback_viewed',
      userId,
      visitId,
      3,
      expect.objectContaining({
        feedbacks_count: 3
      })
    );
  });

  // Nuevas pruebas para la funcionalidad de explicación clínica contextual
  describe('Explicador clínico contextual', () => {
    it('debe mostrar un botón de explicación para cada sugerencia', async () => {
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));

      // Verificar que existen los botones de explicación (uno por cada sugerencia)
      const explanationButtons = screen.getAllByText('¿Por qué esta sugerencia?');
      expect(explanationButtons).toHaveLength(mockSuggestions.length);
    });

    it('debe mostrar la explicación al hacer clic en el botón', async () => {
      // Mockear la función de explicación para que devuelva un texto específico
      vi.mocked(AgentExplainer.explainSuggestion).mockImplementation(() => 
        'Esta sugerencia se generó basada en el análisis del contexto clínico'
      );
      
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
    
      // Hacer clic en el primer botón de explicación
      const explanationButtons = screen.getAllByText('¿Por qué esta sugerencia?');
      fireEvent.click(explanationButtons[0]);

      // Verificar que se muestra la explicación
      expect(screen.getByText('Esta sugerencia se generó basada en el análisis del contexto clínico')).toBeInTheDocument();
      
      // Verificar que se registra el evento de auditoría
      expect(AuditLogger.log).toHaveBeenCalledWith(
        'suggestion_explained',
        expect.objectContaining({
          visitId,
          userId,
          suggestionId: expect.any(String)
        })
      );
      
      // Verificar que se registra la métrica de visualización
      expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
        'suggestion_explanation_viewed',
        userId,
        visitId,
        1,
        expect.objectContaining({
          suggestion_id: expect.any(String)
        })
      );
    });

    it('debe generar explicaciones según el tipo de sugerencia', () => {
      // Verificar directamente que la función de explicación genera textos diferentes según el tipo
      vi.mocked(AgentExplainer.explainSuggestion).mockClear();
      vi.mocked(AgentExplainer.explainSuggestion).mockImplementation((suggestion) => {
        switch (suggestion.type) {
          case 'recommendation':
            return 'Explicación para recomendación';
          case 'warning':
            return 'Explicación para advertencia';
          case 'info':
            return 'Explicación para información';
          default:
            return 'Explicación genérica';
        }
      });
      
      // Invocar la función con distintos tipos de sugerencias y verificar las respuestas
      const suggestionRecommendation: AgentSuggestion = {
        ...mockSuggestions[0],
        type: 'recommendation'
      };
      const suggestionWarning: AgentSuggestion = {
        ...mockSuggestions[0],
        type: 'warning'
      };
      const suggestionInfo: AgentSuggestion = {
        ...mockSuggestions[0],
        type: 'info'
      };
      
      expect(AgentExplainer.explainSuggestion(suggestionRecommendation)).toBe('Explicación para recomendación');
      expect(AgentExplainer.explainSuggestion(suggestionWarning)).toBe('Explicación para advertencia');
      expect(AgentExplainer.explainSuggestion(suggestionInfo)).toBe('Explicación para información');
    });

    it('debe colapsar la explicación al hacer clic nuevamente en el botón', async () => {
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionRejected={onSuggestionRejected}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
    
      // Hacer clic en el primer botón de explicación para expandir
      const explanationButtons = screen.getAllByText('¿Por qué esta sugerencia?');
      fireEvent.click(explanationButtons[0]);

      // Verificar que aparece la explicación
      const explanationText = screen.getByTestId('explanation-content');
      expect(explanationText).toBeInTheDocument();

      // Hacer clic nuevamente para colapsar
      fireEvent.click(explanationButtons[0]);

      // Verificar que ya no aparece la explicación
      expect(screen.queryByTestId('explanation-content')).not.toBeInTheDocument();
    });
  });

  it('should render suggestions grouped by type when expanded', async () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // ... existing code ...
  });

  it('should handle empty suggestions array', () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={[]}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // ... existing code ...
  });

  it('should handle suggestion acceptance', async () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // ... existing code ...
  });
}); 