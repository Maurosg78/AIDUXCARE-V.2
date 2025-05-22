import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../../shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion, SuggestionType, SuggestionField } from '../../types/agent';

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
    expect(screen.queryByTestId('recommendation-section')).not.toBeInTheDocument();

    // Expandir el componente
    fireEvent.click(screen.getByTestId('toggle-suggestions'));

    // Verificar que se expandió
    expect(screen.getByTestId('recommendation-section')).toBeInTheDocument();

    // Colapsar el componente
    fireEvent.click(screen.getByTestId('toggle-suggestions'));

    // Verificar que se colapsó
    expect(screen.queryByTestId('recommendation-section')).not.toBeInTheDocument();
  });
}); 