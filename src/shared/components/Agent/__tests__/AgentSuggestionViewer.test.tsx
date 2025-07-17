// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { EMRFormService } from '@/core/services/EMRFormService';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/core/audit/AuditLogger';

vi.mock('@/core/services/EMRFormService');
vi.mock('@/services/UsageAnalyticsService');
vi.mock('@/core/audit/AuditLogger');

describe('AgentSuggestionViewer', () => {
  const defaultProps = {
    visitId: 'visit-test-123',
    userId: 'user-test-123',
    patientId: 'patient-test-456',
    suggestions: [
      {
        id: '1',
        type: 'recommendation' as const,
        field: 'diagnosis' as const,
        content: 'Sugerencia 1',
        sourceBlockId: 'block-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        type: 'warning' as const,
        field: 'treatment' as const,
        content: 'Sugerencia 2',
        sourceBlockId: 'block-2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    onSuggestionAccepted: vi.fn(),
    onSuggestionRejected: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar correctamente la lista de sugerencias', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    // Expandir la sección principal
    const expandBtn = screen.getAllByTestId('toggle-suggestions').find(btn => btn.getAttribute('aria-expanded') === 'false');
    if (expandBtn) fireEvent.click(expandBtn);
    await screen.findByTestId('accept-suggestion-1');
    expect(document.querySelectorAll('[data-testid^="suggestion-"]').length).toBe(2);
  });

  it('debe manejar la integración de sugerencias correctamente', async () => {
    const mockInsertSuggestion = vi.fn().mockResolvedValue(true);
    vi.mocked(EMRFormService.insertSuggestion).mockImplementation(mockInsertSuggestion);
    render(<AgentSuggestionsViewer {...defaultProps} />);
    const expandBtn = screen.getAllByTestId('toggle-suggestions').find(btn => btn.getAttribute('aria-expanded') === 'false');
    if (expandBtn) fireEvent.click(expandBtn);
    await screen.findByTestId('accept-suggestion-1');
    fireEvent.click(screen.getByTestId('accept-suggestion-1'));
    await waitFor(() => {
      expect(mockInsertSuggestion).toHaveBeenCalledWith(
        {
          id: '1',
          content: 'Sugerencia 1',
          type: 'recommendation',
          sourceBlockId: 'block-1',
          field: 'diagnosis'
        },
        'visit-test-123',
        'patient-test-456',
        'user-test-123'
      );
    });
  });

  it('debe manejar el rechazo de sugerencias correctamente', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    const expandBtn = screen.getAllByTestId('toggle-suggestions').find(btn => btn.getAttribute('aria-expanded') === 'false');
    if (expandBtn) fireEvent.click(expandBtn);
    await screen.findByTestId('reject-suggestion-1');
    fireEvent.click(screen.getByTestId('reject-suggestion-1'));
    expect(defaultProps.onSuggestionRejected).toHaveBeenCalled();
  });

  it('debe manejar errores de integración correctamente', async () => {
    const mockInsertSuggestion = vi.fn().mockRejectedValue(new Error('Error de integración'));
    vi.mocked(EMRFormService.insertSuggestion).mockImplementation(mockInsertSuggestion);
    render(<AgentSuggestionsViewer {...defaultProps} />);
    const expandBtn = screen.getAllByTestId('toggle-suggestions').find(btn => btn.getAttribute('aria-expanded') === 'false');
    if (expandBtn) fireEvent.click(expandBtn);
    await screen.findByTestId('accept-suggestion-1');
    fireEvent.click(screen.getByTestId('accept-suggestion-1'));
    await waitFor(() => {
      expect(mockInsertSuggestion).toHaveBeenCalledWith(
        {
          id: '1',
          content: 'Sugerencia 1',
          type: 'recommendation',
          sourceBlockId: 'block-1',
          field: 'diagnosis'
        },
        'visit-test-123',
        'patient-test-456',
        'user-test-123'
      );
    });
  });

  it('debe manejar lista vacía de sugerencias', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} suggestions={[]} />);
    const expandBtn = screen.getAllByTestId('toggle-suggestions').find(btn => btn.getAttribute('aria-expanded') === 'false');
    if (expandBtn) fireEvent.click(expandBtn);
    // Esperar a que no haya sugerencias
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid^="suggestion-"]').length).toBe(0);
    });
  });

  it('debe mostrar diferentes tipos de sugerencias correctamente', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    const expandBtn = screen.getAllByTestId('toggle-suggestions').find(btn => btn.getAttribute('aria-expanded') === 'false');
    if (expandBtn) fireEvent.click(expandBtn);
    await screen.findByTestId('accept-suggestion-1');
    expect(document.body.textContent).toContain('Sugerencia 1');
    expect(document.body.textContent).toContain('Sugerencia 2');
  });
}); 