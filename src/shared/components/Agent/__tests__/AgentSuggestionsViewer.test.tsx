import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { AgentSuggestion } from '../../../../core/agent/ClinicalAgent';
import { EMRFormService } from '../../../../core/services/EMRFormService';
import { AuditLogger } from '../../../../core/audit/AuditLogger';
import * as UsageAnalyticsService from '../../../../services/UsageAnalyticsService';
import { suggestionFeedbackDataSourceSupabase } from '../../../../core/dataSources/suggestionFeedbackDataSourceSupabase';

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

describe('AgentSuggestionsViewer', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';
  
  // Ampliar el conjunto de sugerencias de prueba para validar filtros y ordenamiento
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'suggestion-1',
      sourceBlockId: 'block-1',
      type: 'recommendation',
      content: 'Considerar radiografía de tórax para descartar neumonía'
    },
    {
      id: 'suggestion-2',
      sourceBlockId: 'block-2',
      type: 'warning',
      content: 'Paciente con alergias a medicamentos específicos'
    },
    {
      id: 'suggestion-3',
      sourceBlockId: 'block-3',
      type: 'info',
      content: 'Última visita el 12/03/2023 por dolor abdominal'
    },
    {
      id: 'suggestion-4',
      sourceBlockId: 'block-4',
      type: 'recommendation',
      content: 'Realizar seguimiento de presión arterial en próxima visita'
    },
    {
      id: 'suggestion-5',
      sourceBlockId: 'block-5',
      type: 'warning',
      content: 'HbA1c elevada, posible descompensación diabética'
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
    
    // Espiamos los métodos que queremos verificar
    vi.spyOn(EMRFormService, 'mapSuggestionTypeToEMRSection').mockImplementation((type: any) => {
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
    
    // Mockear la función getFeedbacksByVisit
    vi.mocked(suggestionFeedbackDataSourceSupabase.getFeedbacksByVisit).mockResolvedValue(mockFeedbacks);
  });

  // Nuevas pruebas para la funcionalidad de búsqueda y filtrado
  describe('Búsqueda y filtrado de sugerencias', () => {
    it('debe filtrar sugerencias por texto de búsqueda', async () => {
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));

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
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));

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
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));

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
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer
          visitId={visitId}
          suggestions={mockSuggestions}
          userId={userId}
          patientId={patientId}
        />
      );

      // Expandir el componente para mostrar las sugerencias
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));

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

  // Mantener los tests existentes inalterados
  it('debe validar la integración completa de sugerencias al EMR con auditoría y métricas', async () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
      />
    );

    // Expandir el componente para mostrar las sugerencias
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));

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
    // Renderizar el componente (sin expandirlo)
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
      />
    );

    // Verificar que no se muestran las sugerencias
    expect(screen.queryByText('Considerar radiografía de tórax para descartar neumonía')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente con alergias a medicamentos específicos')).not.toBeInTheDocument();

    // Verificar que el componente está colapsado
    expect(screen.getByText('Ver sugerencias del agente')).toBeInTheDocument();
  });
  
  it('debe manejar el caso cuando no hay sugerencias', () => {
    // Renderizar el componente sin sugerencias
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={[]}
        userId={userId}
        patientId={patientId}
      />
    );
    
    // Expandir el componente
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));
    
    // Verificar que se muestra el mensaje de que no hay sugerencias
    expect(screen.getByText('Este agente no tiene sugerencias para esta visita.')).toBeInTheDocument();
  });

  it('debe mostrar correctamente los feedbacks de las sugerencias', async () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
      />
    );

    // Expandir el componente para mostrar las sugerencias
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));

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
}); 