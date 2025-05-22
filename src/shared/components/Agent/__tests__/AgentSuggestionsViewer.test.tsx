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
    mapSuggestionTypeToEMRSection: vi.fn((type: SuggestionType) => {
      switch (type) {
        case 'recommendation': return 'plan';
        case 'warning': return 'assessment';
        case 'info': return 'notes';
        default: return 'notes';
      }
    }),
    insertSuggestedContent: vi.fn().mockResolvedValue(true)
  }
}));

// Mock de AuditLogger
vi.mock('../../../../core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn()
  }
}));

// Mock de UsageAnalyticsService
vi.mock('../../../../services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

// Mock del servicio de feedback
vi.mock('../../../../core/dataSources/suggestionFeedbackDataSourceSupabase', () => ({
  suggestionFeedbackDataSourceSupabase: {
    getFeedbacksByVisit: vi.fn().mockResolvedValue([]),
    getFeedbackBySuggestion: vi.fn()
  }
}));

describe('AgentSuggestionsViewer', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';
  const onSuggestionAccepted = vi.fn();
  const onSuggestionRejected = vi.fn();
  const onIntegrateSuggestions = vi.fn();
  
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
        onIntegrateSuggestions={onIntegrateSuggestions}
      />
    );
    
    // Verificar que se muestra el contador de sugerencias
    expect(screen.getByText(/Total de sugerencias: 3/i)).toBeInTheDocument();
    
    // Verificar que el componente está inicialmente colapsado y muestra el botón para expandir
    expect(screen.getByRole('button', { name: /Mostrar/i })).toBeInTheDocument();
  });

  it('expande y muestra las sugerencias agrupadas por tipo', () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
        onIntegrateSuggestions={onIntegrateSuggestions}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar/i }));

    // Verificar que se muestran los encabezados de los grupos
    expect(screen.getByText(/💡 recommendation \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/⚠️ warning \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ℹ️ info \(1\)/i)).toBeInTheDocument();

    // Verificar que se muestran las sugerencias
    expect(screen.getByText(/Considerar radiografía de tórax para descartar neumonía/)).toBeInTheDocument();
    expect(screen.getByText(/Paciente con alergias a medicamentos específicos/)).toBeInTheDocument();
    expect(screen.getByText(/Última visita el 12\/03\/2023 por dolor abdominal/)).toBeInTheDocument();
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
        onIntegrateSuggestions={onIntegrateSuggestions}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar/i }));

    // Aceptar la primera sugerencia
    const acceptButton = screen.getByTestId('accept-suggestion-1');
    fireEvent.click(acceptButton);

    // Verificar que se llamó a los servicios necesarios
    await waitFor(() => {
      expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
        visitId,
        'plan',
        mockSuggestions[0].content,
        'agent',
        mockSuggestions[0].id
      );
      expect(UsageAnalyticsService.trackMetric).toHaveBeenCalledWith(
        'suggestions_integrated',
        userId,
        visitId,
        1,
        expect.objectContaining({
          suggestion_id: mockSuggestions[0].id
        })
      );
      expect(AuditLogger.log).toHaveBeenCalledWith(
        'suggestion_integrated',
        expect.objectContaining({
          userId,
          visitId,
          patientId,
          section: 'plan',
          content: mockSuggestions[0].content,
          suggestionId: mockSuggestions[0].id
        })
      );
      expect(onSuggestionAccepted).toHaveBeenCalledWith(mockSuggestions[0]);
      expect(onIntegrateSuggestions).toHaveBeenCalledWith(1);
    });

    // Verificar que la sugerencia se marca como integrada
    expect(screen.getByTestId('integrated-suggestion-1')).toBeInTheDocument();
  });

  it('maneja correctamente el rechazo de una sugerencia', () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
        onIntegrateSuggestions={onIntegrateSuggestions}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar/i }));

    // Rechazar la primera sugerencia
    const rejectButton = screen.getByTestId('reject-suggestion-1');
    fireEvent.click(rejectButton);

    // Verificar que se llamó al callback de rechazo
    expect(onSuggestionRejected).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('maneja correctamente los errores al integrar una sugerencia', async () => {
    // Simular un error en la integración
    vi.mocked(EMRFormService.insertSuggestedContent).mockRejectedValueOnce(new Error('Error de integración'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
        onIntegrateSuggestions={onIntegrateSuggestions}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar/i }));

    // Intentar aceptar la sugerencia
    const acceptButton = screen.getByTestId('accept-suggestion-1');
    fireEvent.click(acceptButton);

    // Verificar que se registró el error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error al integrar sugerencia:', expect.any(Error));
    });

    // Verificar que no se llamó al callback de aceptación
    expect(onSuggestionAccepted).not.toHaveBeenCalled();
    expect(onIntegrateSuggestions).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
}); 