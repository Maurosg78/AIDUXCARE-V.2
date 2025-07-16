// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import AgentSuggestionItem from '../AgentSuggestionItem';

// Limpieza tras cada test
afterEach(() => {
  cleanup();
});

describe('AgentSuggestionItem', () => {
  const baseSuggestion = {
    id: '1',
    type: 'recommendation' as const,
    content: 'Sugerencia de prueba',
    sourceBlockId: 'block-1',
    field: 'diagnosis',
  };
  const baseProps = {
    suggestion: baseSuggestion,
    isIntegrated: false,
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onFeedback: vi.fn(),
  };

  it('renderiza el texto de la sugerencia', () => {
    render(<AgentSuggestionItem {...baseProps} />);
    expect(screen.getByText('Sugerencia de prueba')).to.exist;
  });

  it('renderiza los botones de acción cuando no está integrado', () => {
    render(<AgentSuggestionItem {...baseProps} isIntegrated={false} />);
    expect(screen.getByRole('button', { name: /aceptar/i })).to.exist;
    expect(screen.getByRole('button', { name: /rechazar/i })).to.exist;
    expect(screen.getByRole('button', { name: /retroalimentación/i })).to.exist;
  });

  it('no renderiza botones de acción cuando está integrado', () => {
    render(<AgentSuggestionItem {...baseProps} isIntegrated={true} />);
    expect(screen.queryByRole('button', { name: /aceptar/i })).to.be.null;
    expect(screen.queryByRole('button', { name: /rechazar/i })).to.be.null;
    expect(screen.queryByRole('button', { name: /retroalimentación/i })).to.be.null;
    expect(screen.getByText('Integrado')).to.exist;
  });

  it('llama a onAccept al hacer click en aceptar', () => {
    const onAccept = vi.fn();
    render(<AgentSuggestionItem {...baseProps} onAccept={onAccept} />);
    const acceptBtn = screen.getByRole('button', { name: /aceptar/i });
    fireEvent.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledWith(baseSuggestion);
  });

  it('llama a onReject al hacer click en rechazar', () => {
    const onReject = vi.fn();
    render(<AgentSuggestionItem {...baseProps} onReject={onReject} />);
    const rejectBtn = screen.getByRole('button', { name: /rechazar/i });
    fireEvent.click(rejectBtn);
    expect(onReject).toHaveBeenCalledWith(baseSuggestion);
  });

  it('llama a onFeedback al hacer click en retroalimentación', () => {
    const onFeedback = vi.fn();
    render(<AgentSuggestionItem {...baseProps} onFeedback={onFeedback} />);
    const feedbackBtn = screen.getByRole('button', { name: /retroalimentación/i });
    fireEvent.click(feedbackBtn);
    expect(onFeedback).toHaveBeenCalledWith(baseSuggestion);
  });

  it('renderiza el tipo de sugerencia correctamente', () => {
    render(<AgentSuggestionItem {...baseProps} suggestion={{ ...baseSuggestion, type: 'warning' as const }} />);
    expect(screen.getByText('Advertencia')).to.exist;
    render(<AgentSuggestionItem {...baseProps} suggestion={{ ...baseSuggestion, type: 'info' as const }} />);
    expect(screen.getByText('Información')).to.exist;
    render(<AgentSuggestionItem {...baseProps} suggestion={{ ...baseSuggestion, type: 'recommendation' as const }} />);
    expect(screen.getByText('Recomendación')).to.exist;
  });
}); 