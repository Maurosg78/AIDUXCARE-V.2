import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { AgentSuggestion, SuggestionType, SuggestionField } from '../../../../types/agent';
import { EMRFormService } from '../../../../core/services/EMRFormService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import * as UsageAnalyticsService from '@/services/UsageAnalyticsService';
import { suggestionFeedbackDataSourceSupabase } from '@/core/dataSources/suggestionFeedbackDataSourceSupabase';

// Mock del componente AgentSuggestionFeedbackActions
vi.mock('../AgentSuggestionFeedbackActions', () => ({
  __esModule: true,
  default: ({ suggestion, onAccept, onReject, isIntegrated }: {
    suggestion: AgentSuggestion;
    onAccept: () => void;
    onReject: () => void;
    isIntegrated: boolean;
    visitId: string;
    userId?: string;
  }) => {
    return (
      <div data-testid={`feedback-${suggestion.id}`}>
        {isIntegrated ? (
          <span data-testid={`integrated-${suggestion.id}`}>Integrado al EMR</span>
        ) : (
          <>
            <button 
              data-testid={`accept-${suggestion.id}`} 
              onClick={onAccept}
            >
              Aceptar
            </button>
            <button 
              data-testid={`reject-${suggestion.id}`} 
              onClick={onReject}
            >
              Rechazar
            </button>
          </>
        )}
      </div>
    );
  }
}));

// Mock del componente AgentSuggestionExplainer
vi.mock('../AgentSuggestionExplainer', () => ({
  __esModule: true,
  default: ({ suggestion }: { suggestion: AgentSuggestion }) => (
    <div data-testid={`explainer-${suggestion.id}`}>
      Explicación de la sugerencia
    </div>
  )
}));

// Mock de EMRFormService
vi.mock('../../../../core/services/EMRFormService', () => ({
  EMRFormService: {
    mapSuggestionTypeToEMRSection: vi.fn(),
    insertSuggestedContent: vi.fn().mockResolvedValue(true),
    insertSuggestion: vi.fn().mockResolvedValue(true)
  }
}));

// Mock de AuditLogger
vi.mock('../../../../core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn(),
    logSuggestionIntegration: vi.fn()
  }
}));

// Mock de UsageAnalyticsService
vi.mock('../../../../services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
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
  const onSuggestionAccepted = vi.fn();
  const onSuggestionRejected = vi.fn();
  
  // Datos de prueba para las sugerencias
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'suggestion-1',
      sourceBlockId: 'block-1',
      type: 'recommendation',
      field: 'diagnosis',
      content: 'Considerar radiografía de tórax para descartar neumonía',
      createdAt: new Date(),
      updatedAt: new Date()
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
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mocks por defecto
    vi.mocked(EMRFormService.mapSuggestionTypeToEMRSection).mockImplementation((type: SuggestionType) => {
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
    
    vi.mocked(EMRFormService.insertSuggestedContent).mockResolvedValue(true);
    vi.mocked(AuditLogger.log).mockImplementation(() => {});
    vi.mocked(UsageAnalyticsService.trackMetric).mockImplementation(() => {});
    
    vi.mocked(suggestionFeedbackDataSourceSupabase.getFeedbacksByVisit).mockResolvedValue([]);
  });

  it('renderiza correctamente el componente con sugerencias', () => {
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
    
    // Verificar que se muestra el contador de sugerencias
    expect(screen.getByText(/Total de sugerencias: 3/i)).toBeInTheDocument();
    
    // Verificar que el componente está inicialmente colapsado y muestra el botón para expandir
    expect(screen.getByRole('button', { name: /Ver sugerencias/i })).toBeInTheDocument();
  });

  it('expande y muestra las sugerencias agrupadas por tipo', async () => {
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

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Ver sugerencias/i }));
    
    // Verificar que se muestran los encabezados de los grupos
    expect(screen.getByText(/Recomendaciones \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Advertencias \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Información \(1\)/i)).toBeInTheDocument();
    
    // Verificar que se muestra el contenido de las sugerencias
    expect(screen.getByText('Considerar radiografía de tórax para descartar neumonía')).toBeInTheDocument();
    expect(screen.getByText('Paciente con alergias a medicamentos específicos')).toBeInTheDocument();
    expect(screen.getByText('Última visita el 12/03/2023 por dolor abdominal')).toBeInTheDocument();
  });

  it('maneja correctamente la aceptación de una sugerencia', async () => {
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

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Ver sugerencias/i }));
    
    // Aceptar la primera sugerencia
    fireEvent.click(screen.getByTestId('accept-suggestion-1'));
    
    // Verificar que se llamó correctamente a onSuggestionAccepted
    expect(onSuggestionAccepted).toHaveBeenCalledWith(mockSuggestions[0]);
    
    // Verificar que se llamó a EMRFormService para integrar la sugerencia
    expect(EMRFormService.mapSuggestionTypeToEMRSection).toHaveBeenCalledWith('recommendation');
    expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
      visitId,
      'plan',
      mockSuggestions[0].content,
      'agent',
      mockSuggestions[0].id
    );
    
    // Verificar que se registró en el log de auditoría
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_accepted',
      expect.objectContaining({
        visitId,
        userId,
        suggestionId: mockSuggestions[0].id,
        type: mockSuggestions[0].type
      })
    );
    
    // Verificar que se registró la métrica
    expect(UsageAnalyticsService.trackMetric).toHaveBeenCalled();
  });

  it('maneja correctamente el rechazo de una sugerencia', async () => {
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

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Ver sugerencias/i }));
    
    // Rechazar la segunda sugerencia
    fireEvent.click(screen.getByTestId('reject-suggestion-2'));
    
    // Verificar que se llamó correctamente a onSuggestionRejected
    expect(onSuggestionRejected).toHaveBeenCalledWith(mockSuggestions[1]);
    
    // Verificar que se registró en el log de auditoría
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_rejected',
      expect.objectContaining({
        visitId,
        userId,
        suggestionId: mockSuggestions[1].id,
        type: mockSuggestions[1].type
      })
    );
  });

  it('muestra un mensaje cuando no hay sugerencias', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Ver sugerencias/i }));
    
    // Verificar que se muestra el mensaje de que no hay sugerencias
    expect(screen.getByText(/No hay sugerencias disponibles/i)).toBeInTheDocument();
  });

  it('renderiza todas las sugerencias con los tipos correctos', () => {
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
    
    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Ver sugerencias/i }));
    
    // Verificar que se renderizan los componentes de explicación para cada sugerencia
    expect(screen.getByTestId('explainer-suggestion-1')).toBeInTheDocument();
    expect(screen.getByTestId('explainer-suggestion-2')).toBeInTheDocument();
    expect(screen.getByTestId('explainer-suggestion-3')).toBeInTheDocument();
    
    // Verificar que se renderizan los componentes de feedback para cada sugerencia
    expect(screen.getByTestId('feedback-suggestion-1')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-suggestion-2')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-suggestion-3')).toBeInTheDocument();
  });

  it('muestra las sugerencias agrupadas con el formato correcto', () => {
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
    
    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Ver sugerencias/i }));
    
    // Verificar que cada sugerencia muestra su campo correspondiente
    expect(screen.getByText(/Campo: diagnosis/i)).toBeInTheDocument();
    expect(screen.getByText(/Campo: medication/i)).toBeInTheDocument();
    expect(screen.getByText(/Campo: history/i)).toBeInTheDocument();
  });
}); 