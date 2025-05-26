import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentSuggestionFeedbackForm from '../AgentSuggestionFeedbackForm';
import { trackMetric } from '@/services/UsageAnalyticsService';

// Mock del servicio de analytics
jest.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: jest.fn()
}));

describe('AgentSuggestionFeedbackForm', () => {
  const mockProps = {
    visitId: 'visit-123',
    userId: 'user-123',
    suggestion: {
      id: 'suggestion-1',
      type: 'recommendation' as const,
      content: 'Test suggestion',
      sourceBlockId: 'block-1',
      field: 'diagnosis'
    },
    onSubmit: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar correctamente el formulario', () => {
    render(<AgentSuggestionFeedbackForm {...mockProps} />);

    expect(screen.getByLabelText(/calidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relevancia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comentarios/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('debe manejar el envío del formulario correctamente', async () => {
    render(<AgentSuggestionFeedbackForm {...mockProps} />);

    // Seleccionar valores en los sliders
    const qualitySlider = screen.getByLabelText(/calidad/i);
    const relevanceSlider = screen.getByLabelText(/relevancia/i);
    const commentsInput = screen.getByLabelText(/comentarios/i);

    fireEvent.change(qualitySlider, { target: { value: '4' } });
    fireEvent.change(relevanceSlider, { target: { value: '5' } });
    fireEvent.change(commentsInput, { target: { value: 'Test comment' } });

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        quality: 4,
        relevance: 5,
        comments: 'Test comment'
      });

      expect(trackMetric).toHaveBeenCalledWith(
        'suggestion_feedback_submitted',
        {
          suggestionId: mockProps.suggestion.id,
          suggestionType: mockProps.suggestion.type,
          quality: 4,
          relevance: 5
        },
        mockProps.userId,
        mockProps.visitId
      );
    });
  });

  it('debe manejar el cancelamiento correctamente', () => {
    render(<AgentSuggestionFeedbackForm {...mockProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('debe validar que los campos requeridos estén completos', async () => {
    render(<AgentSuggestionFeedbackForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/por favor califica la calidad/i)).toBeInTheDocument();
      expect(screen.getByText(/por favor califica la relevancia/i)).toBeInTheDocument();
    });

    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('debe tener atributos ARIA correctos', () => {
    render(<AgentSuggestionFeedbackForm {...mockProps} />);

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Formulario de retroalimentación');

    const qualitySlider = screen.getByLabelText(/calidad/i);
    expect(qualitySlider).toHaveAttribute('aria-valuemin', '1');
    expect(qualitySlider).toHaveAttribute('aria-valuemax', '5');

    const relevanceSlider = screen.getByLabelText(/relevancia/i);
    expect(relevanceSlider).toHaveAttribute('aria-valuemin', '1');
    expect(relevanceSlider).toHaveAttribute('aria-valuemax', '5');
  });
}); 