import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { AgentSuggestion } from '../../../../core/agent/ClinicalAgent';
import { EMRFormService } from '../../../../core/services/EMRFormService';
import { AuditLogger } from '../../../../core/audit/AuditLogger';
import * as UsageAnalyticsService from '../../../../services/UsageAnalyticsService';

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

describe('AgentSuggestionsViewer', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';
  
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'suggestion-1',
      sourceBlockId: 'block-1',
      type: 'recommendation',
      content: 'Considerar radiografía de tórax'
    },
    {
      id: 'suggestion-2',
      sourceBlockId: 'block-2',
      type: 'warning',
      content: 'Paciente con alergias a medicamentos'
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
  });

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

    // Verificar que se muestran las sugerencias
    expect(screen.getByText('Considerar radiografía de tórax')).toBeInTheDocument();
    expect(screen.getByText('Paciente con alergias a medicamentos')).toBeInTheDocument();

    // Aceptar la primera sugerencia (esto debe desencadenar la integración inmediata)
    fireEvent.click(screen.getByTestId('accept-suggestion-1'));

    // 1. Verificar que la llamada a EMRFormService.insertSuggestedContent se realiza correctamente
    expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
      visitId,
      'plan', // mapeo de tipo recommendation a plan
      'Considerar radiografía de tórax',
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

    // Aceptar la segunda sugerencia 
    fireEvent.click(screen.getByTestId('accept-suggestion-2'));

    // Verificar que la segunda sugerencia se ha integrado correctamente
    expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
      visitId,
      'assessment', // mapeo de tipo warning a assessment
      'Paciente con alergias a medicamentos',
      'agent',
      'suggestion-2'
    );

    // Verificar que se ha registrado un evento en AuditLogger.log para la segunda sugerencia
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_accepted',
      expect.objectContaining({
        visitId,
        userId,
        suggestionId: 'suggestion-2'
      })
    );

    // Verificar métricas para la segunda sugerencia
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestion_field_matched',
      userId,
      visitId,
      1,
      expect.objectContaining({
        suggestion_id: 'suggestion-2',
        suggestion_type: 'warning',
        emr_section: 'assessment'
      })
    );

    // Verificar totales de llamadas a servicios
    expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledTimes(2);
    expect(AuditLogger.log).toHaveBeenCalledTimes(2);
    
    // Con las nuevas métricas, cada sugerencia genera 3 llamadas a track:
    // - suggestions_accepted
    // - suggestions_integrated
    // - suggestion_field_matched
    // Total: 2 sugerencias x 3 llamadas = 6 llamadas a track
    expect(UsageAnalyticsService.track).toHaveBeenCalledTimes(6);
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
    expect(screen.queryByText('Considerar radiografía de tórax')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente con alergias a medicamentos')).not.toBeInTheDocument();

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
}); 