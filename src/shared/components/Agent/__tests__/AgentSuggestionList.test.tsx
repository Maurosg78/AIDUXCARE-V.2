import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import AgentSuggestionList from '../AgentSuggestionList';

describe('AgentSuggestionList', () => {
  const mockSuggestions = [
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
  ];

  const mockProps = {
    suggestions: mockSuggestions,
    integratedSuggestions: new Set(['suggestion-1']),
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onFeedback: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar correctamente la lista de sugerencias', () => {
    render(<AgentSuggestionList {...mockProps} />);

    expect(screen.getByText('Test suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Test suggestion 2')).toBeInTheDocument();
  });

  it('debe mostrar el estado integrado para las sugerencias integradas', () => {
    render(<AgentSuggestionList {...mockProps} />);

    const integratedSuggestion = screen.getByText('Integrado');
    expect(integratedSuggestion).toBeInTheDocument();
  });

  it('debe llamar a onAccept cuando se acepta una sugerencia', () => {
    render(<AgentSuggestionList {...mockProps} />);

    const acceptButtons = screen.getAllByRole('button', { name: /aceptar/i });
    fireEvent.click(acceptButtons[0]); // Click en la primera sugerencia no integrada

    expect(mockProps.onAccept).toHaveBeenCalledWith(mockSuggestions[1]);
  });

  it('debe llamar a onReject cuando se rechaza una sugerencia', () => {
    render(<AgentSuggestionList {...mockProps} />);

    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i });
    fireEvent.click(rejectButtons[0]); // Click en la primera sugerencia no integrada

    expect(mockProps.onReject).toHaveBeenCalledWith(mockSuggestions[1]);
  });

  it('debe llamar a onFeedback cuando se solicita retroalimentación', () => {
    render(<AgentSuggestionList {...mockProps} />);

    const feedbackButtons = screen.getAllByRole('button', { name: /retroalimentación/i });
    fireEvent.click(feedbackButtons[0]); // Click en la primera sugerencia no integrada

    expect(mockProps.onFeedback).toHaveBeenCalledWith(mockSuggestions[1]);
  });

  it('debe tener atributos ARIA correctos', () => {
    render(<AgentSuggestionList {...mockProps} />);

    const list = screen.getByLabelText('Lista de sugerencias');
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole('article');
    expect(items).toHaveLength(2);
  });

  it('debe manejar lista vacía de sugerencias', () => {
    render(<AgentSuggestionList {...mockProps} suggestions={[]} />);

    expect(screen.getByText('No hay sugerencias disponibles')).toBeInTheDocument();
  });

  it('debe mostrar diferentes tipos de sugerencias correctamente', () => {
    render(<AgentSuggestionList {...mockProps} />);

    expect(screen.getByText('Recomendación')).toBeInTheDocument();
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
  });
}); 