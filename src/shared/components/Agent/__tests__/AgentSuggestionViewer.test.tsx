import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentSuggestionViewer from '../AgentSuggestionViewer';
import { EMRFormService } from '@/services/EMRFormService';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/services/AuditLogger';

// Mocks
jest.mock('@/services/EMRFormService');
jest.mock('@/services/UsageAnalyticsService');
jest.mock('@/services/AuditLogger');

describe.skip('AgentSuggestionViewer', () => {
  const mockProps = {
    visitId: 'visit-123',
    userId: 'user-123',
    patientId: 'patient-123',
    suggestions: [
      {
        id: 'suggestion-1',
        type: 'recommendation' as const,
        content: 'Test suggestion 1',
        sourceBlockId: 'block-1',
        field: 'diagnosis'
      },
      {
        id: 'suggestion-2',
        type: 'warning' as const,
        content: 'Test suggestion 2',
        sourceBlockId: 'block-2',
        field: 'treatment'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar correctamente la lista de sugerencias', () => {
    render(<AgentSuggestionViewer {...mockProps} />);

    expect(screen.getByText('Test suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Test suggestion 2')).toBeInTheDocument();
  });

  it('debe manejar la integración de sugerencias correctamente', async () => {
    const mockInsertSuggestion = jest.fn().mockResolvedValue(true);
    (EMRFormService.insertSuggestion as jest.Mock).mockImplementation(mockInsertSuggestion);

    render(<AgentSuggestionViewer {...mockProps} />);

    const integrateButtons = screen.getAllByRole('button', { name: /integrar/i });
    fireEvent.click(integrateButtons[0]);

    await waitFor(() => {
      expect(mockInsertSuggestion).toHaveBeenCalledWith(
        mockProps.suggestions[0],
        mockProps.visitId,
        mockProps.userId
      );
      expect(trackMetric).toHaveBeenCalledWith(
        'suggestions_integrated',
        {
          suggestionId: mockProps.suggestions[0].id,
          suggestionType: mockProps.suggestions[0].type,
          suggestionField: mockProps.suggestions[0].field
        },
        mockProps.userId,
        mockProps.visitId
      );
      expect(AuditLogger.log).toHaveBeenCalledWith(
        'suggestion_integrated',
        {
          suggestionId: mockProps.suggestions[0].id,
          visitId: mockProps.visitId,
          userId: mockProps.userId
        }
      );
    });
  });

  it('debe manejar el rechazo de sugerencias correctamente', async () => {
    render(<AgentSuggestionViewer {...mockProps} />);

    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i });
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(trackMetric).toHaveBeenCalledWith(
        'suggestions_rejected',
        {
          suggestionId: mockProps.suggestions[0].id,
          suggestionType: mockProps.suggestions[0].type,
          suggestionField: mockProps.suggestions[0].field
        },
        mockProps.userId,
        mockProps.visitId
      );
      expect(AuditLogger.log).toHaveBeenCalledWith(
        'suggestion_rejected',
        {
          suggestionId: mockProps.suggestions[0].id,
          visitId: mockProps.visitId,
          userId: mockProps.userId
        }
      );
    });
  });

  it('debe manejar errores de integración correctamente', async () => {
    const mockInsertSuggestion = jest.fn().mockRejectedValue(new Error('Error de integración'));
    (EMRFormService.insertSuggestion as jest.Mock).mockImplementation(mockInsertSuggestion);

    render(<AgentSuggestionViewer {...mockProps} />);

    const integrateButtons = screen.getAllByRole('button', { name: /integrar/i });
    fireEvent.click(integrateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Error al integrar la sugerencia')).toBeInTheDocument();
    });
  });

  it('debe tener atributos ARIA correctos', () => {
    render(<AgentSuggestionViewer {...mockProps} />);

    const viewer = screen.getByRole('region');
    expect(viewer).toHaveAttribute('aria-label', 'Visor de sugerencias');

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'Lista de sugerencias');
  });

  it('debe manejar lista vacía de sugerencias', () => {
    render(<AgentSuggestionViewer {...mockProps} suggestions={[]} />);

    expect(screen.getByText('No hay sugerencias disponibles')).toBeInTheDocument();
  });

  it('debe mostrar diferentes tipos de sugerencias correctamente', () => {
    render(<AgentSuggestionViewer {...mockProps} />);

    expect(screen.getByText('Recomendación')).toBeInTheDocument();
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
  });
}); 