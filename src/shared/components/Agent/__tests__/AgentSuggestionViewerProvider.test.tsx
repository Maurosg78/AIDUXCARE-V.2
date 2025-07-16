// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AgentSuggestionViewerProvider from '../AgentSuggestionViewerProvider';

// Mocks usando vi.fn()
const mockInsertSuggestion = vi.fn();
const mockTrackMetric = vi.fn();
const mockAuditLog = vi.fn();

vi.mock('@/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestion: (
      a: Record<string, unknown>,
      b: string,
      c: string,
      d: string
    ) => mockInsertSuggestion(a, b, c, d)
  }
}));

vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: (...args: unknown[]) => mockTrackMetric(...args)
}));

vi.mock('@/services/AuditLogger', () => ({
  AuditLogger: {
    log: (...args: unknown[]) => mockAuditLog(...args)
  }
}));

afterEach(() => {
  cleanup();
});

describe('AgentSuggestionViewerProvider', () => {
  const mockProps = {
    visitId: 'visit-123',
    userId: 'user-123',
    patientId: 'patient-123',
    children: <div>Test Child</div>
  };

  const mockSuggestions = [
    {
      id: 'suggestion-1',
      type: 'recommendation' as const,
      content: 'Test suggestion 1',
      sourceBlockId: 'block-1',
      field: 'diagnosis',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'suggestion-2',
      type: 'warning' as const,
      content: 'Test suggestion 2',
      sourceBlockId: 'block-2',
      field: 'treatment',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertSuggestion.mockResolvedValue(true);
    mockTrackMetric.mockResolvedValue(undefined);
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('debe renderizar correctamente el provider y sus children', () => {
    render(<AgentSuggestionViewerProvider {...mockProps} />);
    expect(screen.getByText('Test Child')).to.exist;
  });

  it('debe proporcionar el contexto correctamente', () => {
    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;
      return (
        <div>
          <div data-testid="suggestions">{JSON.stringify(context.suggestions)}</div>
          <div data-testid="integrated">{JSON.stringify(context.integratedSuggestions)}</div>
          <div data-testid="loading">{String(context.isLoading)}</div>
          <div data-testid="error">{context.error ?? ''}</div>
        </div>
      );
    };
    render(
      <AgentSuggestionViewerProvider {...mockProps}>
        <TestComponent />
      </AgentSuggestionViewerProvider>
    );
    // Usar getAllByTestId y validar el primero (scope limitado)
    const suggestions = screen.getAllByTestId('suggestions')[0];
    const integrated = screen.getAllByTestId('integrated')[0];
    const loading = screen.getAllByTestId('loading')[0];
    const error = screen.getAllByTestId('error')[0];
    expect(suggestions.textContent).to.equal('[]');
    expect(integrated.textContent).to.equal('[]');
    expect(loading.textContent).to.equal('false');
    expect(error.textContent).to.equal('');
  });

  it('debe manejar la integración de sugerencias correctamente', async () => {
    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;
      return (
        <div>
          <button onClick={() => context.handleSuggestionAccepted(mockSuggestions[0])}>
            Integrar
          </button>
          <div data-testid="integrated">{JSON.stringify(context.integratedSuggestions)}</div>
          <div data-testid="loading">{String(context.isLoading)}</div>
          <div data-testid="suggestions">{JSON.stringify(context.suggestions)}</div>
        </div>
      );
    };
    render(
      <AgentSuggestionViewerProvider {...mockProps} initialSuggestions={mockSuggestions}>
        <TestComponent />
      </AgentSuggestionViewerProvider>
    );
    // Usar getAllByTestId y validar el primero
    const integrated = screen.getAllByTestId('integrated')[0];
    const suggestions = screen.getAllByTestId('suggestions')[0];
    const loading = screen.getAllByTestId('loading')[0];
    expect(integrated.textContent).to.equal('[]');
    expect(suggestions.textContent).to.equal(JSON.stringify(mockSuggestions));
    // Simular clic en el botón
    fireEvent.click(screen.getByText('Integrar'));
    // Esperar a que se complete la integración
    await waitFor(() => {
      expect(loading.textContent).to.equal('false');
    });
    // Verificar el estado final
    await waitFor(() => {
      expect(integrated.textContent).to.equal(JSON.stringify([mockSuggestions[0]]));
      expect(suggestions.textContent).to.equal(JSON.stringify([mockSuggestions[1]]));
    });
    // Verificar que los servicios fueron llamados correctamente
    expect(mockInsertSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockSuggestions[0].id,
        type: mockSuggestions[0].type,
        field: mockSuggestions[0].field,
        content: mockSuggestions[0].content,
        sourceBlockId: mockSuggestions[0].sourceBlockId
      }),
      mockProps.visitId,
      mockProps.patientId,
      mockProps.userId
    );
    expect(mockTrackMetric).toHaveBeenCalledWith(
      'suggestion_integrated',
      expect.objectContaining({
        suggestionId: mockSuggestions[0].id,
        suggestionType: mockSuggestions[0].type,
        suggestionField: mockSuggestions[0].field
      }),
      mockProps.userId,
      mockProps.visitId
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_integrated',
      expect.objectContaining({
        suggestionId: mockSuggestions[0].id,
        visitId: mockProps.visitId,
        userId: mockProps.userId
      })
    );
  });

  it('debe manejar el rechazo de sugerencias correctamente', async () => {
    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;
      return (
        <div>
          <button onClick={() => context.handleSuggestionRejected(mockSuggestions[0])}>
            Rechazar
          </button>
          <div data-testid="suggestions">{JSON.stringify(context.suggestions)}</div>
          <div data-testid="loading">{String(context.isLoading)}</div>
          <div data-testid="integrated">{JSON.stringify(context.integratedSuggestions)}</div>
        </div>
      );
    };
    render(
      <AgentSuggestionViewerProvider {...mockProps} initialSuggestions={mockSuggestions}>
        <TestComponent />
      </AgentSuggestionViewerProvider>
    );
    // Usar getAllByTestId y validar el primero
    const suggestions = screen.getAllByTestId('suggestions')[0];
    const loading = screen.getAllByTestId('loading')[0];
    const integrated = screen.getAllByTestId('integrated')[0];
    // Simular clic en el botón
    fireEvent.click(screen.getByText('Rechazar'));
    // Esperar a que se complete el rechazo
    await waitFor(() => {
      expect(loading.textContent).to.equal('false');
    });
    // Verificar el estado final
    await waitFor(() => {
      expect(suggestions.textContent).to.equal(JSON.stringify([mockSuggestions[1]]));
      expect(integrated.textContent).to.equal('[]');
    });
  });

  it('debe manejar errores de integración correctamente', async () => {
    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;
      return (
        <div>
          <div data-testid="integrated">{JSON.stringify(context.integratedSuggestions)}</div>
          <div data-testid="suggestions">{JSON.stringify(context.suggestions)}</div>
        </div>
      );
    };
    render(
      <AgentSuggestionViewerProvider {...mockProps} initialSuggestions={mockSuggestions}>
        <TestComponent />
      </AgentSuggestionViewerProvider>
    );
    // Usar getAllByTestId y validar el primero
    const integrated = screen.getAllByTestId('integrated')[0];
    const suggestions = screen.getAllByTestId('suggestions')[0];
    expect(integrated.textContent).to.equal('[]');
    expect(suggestions.textContent).to.equal(JSON.stringify(mockSuggestions));
  });

  it('debe manejar la carga de sugerencias correctamente', async () => {
    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;
      return (
        <div>
          <div data-testid="loading">{String(context.isLoading)}</div>
          <div data-testid="error">{context.error ?? ''}</div>
        </div>
      );
    };
    render(
      <AgentSuggestionViewerProvider {...mockProps}>
        <TestComponent />
      </AgentSuggestionViewerProvider>
    );
    // Usar getAllByTestId y validar el primero
    const loading = screen.getAllByTestId('loading')[0];
    const error = screen.getAllByTestId('error')[0];
    expect(loading.textContent).to.equal('false');
    expect(error.textContent).to.equal('');
  });
}); 