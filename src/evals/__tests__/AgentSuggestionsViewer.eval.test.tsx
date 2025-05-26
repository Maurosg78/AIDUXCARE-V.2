import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../../shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion, SuggestionType, SuggestionField } from '../../types/agent';
import { EMRFormService } from '../../core/services/EMRFormService';
import { AuditLogger } from '../../core/audit/AuditLogger';
import * as UsageAnalyticsService from '../../services/UsageAnalyticsService';

// Mock de los servicios externos
vi.mock('../../core/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestion: vi.fn().mockImplementation(() => Promise.resolve(true)),
    mapSuggestionTypeToEMRSection: vi.fn().mockImplementation((type: string) => {
      switch (type) {
        case 'recommendation': return 'plan';
        case 'warning': return 'assessment';
        case 'info': return 'notes';
        default: return 'notes';
      }
    })
  }
}));

vi.mock('../../core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn().mockImplementation(() => Promise.resolve())
  }
}));

vi.mock('../../services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

describe('AgentSuggestionsViewer - Evaluación', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';
  const onSuggestionAccepted = vi.fn();
  const onSuggestionRejected = vi.fn();

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar correctamente con 5 sugerencias variadas', () => {
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

    expect(screen.getByTestId('toggle-suggestions')).toBeInTheDocument();
  });

  it('debe mostrar los textos esperados según el tipo de sugerencia', () => {
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
    fireEvent.click(screen.getByTestId('toggle-suggestions'));

    // Verificar categorías usando within
    const recommendationSection = screen.getByTestId('recommendation-section');
    const warningSection = screen.getByTestId('warning-section');
    const infoSection = screen.getByTestId('info-section');

    expect(within(recommendationSection).getByText(/radiografía de tórax/i)).toBeInTheDocument();
    expect(within(warningSection).getByText(/alergias a medicamentos/i)).toBeInTheDocument();
    expect(within(infoSection).getByText(/Última visita/i)).toBeInTheDocument();

    // Verificar contenidos usando getByText con opciones avanzadas
    expect(screen.getByText((content) => content.includes('radiografía de tórax'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('alergias a medicamentos'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Última visita'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('seguimiento de presión arterial'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('HbA1c elevada'))).toBeInTheDocument();
  });

  it('debe manejar correctamente el toggle de sugerencias', () => {
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

    // Verificar que inicialmente está colapsado
    expect(screen.queryByTestId('suggestions-content')).not.toBeInTheDocument();

    // Expandir el componente
    const toggleButton = screen.getByTestId('toggle-suggestions');
    fireEvent.click(toggleButton);

    // Verificar que ahora está expandido
    expect(screen.getByTestId('suggestions-content')).toBeInTheDocument();
  });

  it('debe manejar correctamente la integración de sugerencias', async () => {
    const { getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Intentar integrar una sugerencia
    const acceptButton = getByTestId(`accept-suggestion-${mockSuggestions[0].id}`);
    fireEvent.click(acceptButton);

    // Verificar que se llamó al servicio de EMR con los parámetros correctos
    await waitFor(() => {
      expect(EMRFormService.insertSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockSuggestions[0].id,
          content: mockSuggestions[0].content.trim(),
          type: mockSuggestions[0].type,
          sourceBlockId: mockSuggestions[0].sourceBlockId,
          field: mockSuggestions[0].field
        }),
        visitId,
        patientId,
        userId
      );
    });

    // Verificar que se llamó al callback de aceptación
    expect(onSuggestionAccepted).toHaveBeenCalledWith(mockSuggestions[0]);

    // Verificar que se registró en el logger
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integrated',
      expect.objectContaining({
        userId,
        visitId,
        patientId,
        suggestionId: mockSuggestions[0].id,
        content: mockSuggestions[0].content.trim()
      })
    );
  });

  it('debe manejar correctamente el rechazo de sugerencias', async () => {
    const { getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Rechazar una sugerencia
    const rejectButton = getByTestId(`reject-suggestion-${mockSuggestions[0].id}`);
    fireEvent.click(rejectButton);

    // Verificar que se llamó al callback de rechazo
    expect(onSuggestionRejected).toHaveBeenCalledWith(mockSuggestions[0]);

    // Verificar que se registró en el logger
    await waitFor(() => {
      expect(AuditLogger.log).toHaveBeenCalledWith(
        'suggestion_rejected',
        expect.objectContaining({
          userId,
          visitId,
          patientId,
          suggestionId: mockSuggestions[0].id
        })
      );
    });
  });

  it('debe mostrar las sugerencias agrupadas por tipo', async () => {
    const { getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Verificar que se muestran las secciones por tipo
    expect(getByTestId('recommendation-section')).toBeInTheDocument();
    expect(getByTestId('warning-section')).toBeInTheDocument();
    expect(getByTestId('info-section')).toBeInTheDocument();

    // Verificar el contenido de cada sección
    const recommendationSection = getByTestId('recommendation-section');
    const warningSection = getByTestId('warning-section');
    const infoSection = getByTestId('info-section');

    expect(within(recommendationSection).getByText(mockSuggestions[0].content)).toBeInTheDocument();
    expect(within(warningSection).getByText(mockSuggestions[1].content)).toBeInTheDocument();
    expect(within(infoSection).getByText(mockSuggestions[2].content)).toBeInTheDocument();
  });

  it('debe mostrar un mensaje cuando no hay sugerencias', () => {
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

    // Verificar el título con el contador en 0
    expect(screen.getByText('Sugerencias del Copiloto (0)')).toBeInTheDocument();

    // Expandir las sugerencias
    fireEvent.click(screen.getByTestId('toggle-suggestions'));

    // Verificar el mensaje de no hay sugerencias
    expect(screen.getByTestId('no-suggestions-message')).toBeInTheDocument();
  });
}); 