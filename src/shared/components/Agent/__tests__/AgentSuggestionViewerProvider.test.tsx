import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import AgentSuggestionViewerProvider from '../AgentSuggestionViewerProvider';
import { EMRFormService } from '@/services/EMRFormService';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/services/AuditLogger';

// Mocks usando vi.fn()
const mockInsertSuggestion = vi.fn();
const mockTrackMetric = vi.fn();
const mockAuditLog = vi.fn();

vi.mock('@/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestion: (
      a: any,
      b: any,
      c: any,
      d: any
    ) => mockInsertSuggestion(a, b, c, d)
  }
}));

vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: (...args: any[]) => mockTrackMetric(...args)
}));

vi.mock('@/services/AuditLogger', () => ({
  AuditLogger: {
    log: (...args: any[]) => mockAuditLog(...args)
  }
}));

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
    expect(screen.getByText('Test Child')).toBeInTheDocument();
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

    expect(screen.getByTestId('suggestions')).toHaveTextContent('[]');
    expect(screen.getByTestId('integrated')).toHaveTextContent('[]');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('');
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

    // Verificar estado inicial
    expect(screen.getByTestId('integrated')).toHaveTextContent('[]');
    expect(screen.getByTestId('suggestions')).toHaveTextContent(JSON.stringify(mockSuggestions));

    // Simular clic en el botón
    fireEvent.click(screen.getByText('Integrar'));

    // Esperar a que se complete la integración
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Verificar el estado final
    await waitFor(() => {
      expect(screen.getByTestId('integrated')).toHaveTextContent(JSON.stringify([mockSuggestions[0]]));
      expect(screen.getByTestId('suggestions')).toHaveTextContent(JSON.stringify([mockSuggestions[1]]));
    });

    // Verificar que los servicios fueron llamados correctamente
    console.log('mockInsertSuggestion REAL CALLS:', mockInsertSuggestion.mock.calls);
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

    console.log('mockTrackMetric REAL CALLS:', mockTrackMetric.mock.calls);
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

    console.log('mockAuditLog REAL CALLS:', mockAuditLog.mock.calls);
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

    // Verificar estado inicial
    expect(screen.getByTestId('suggestions')).toHaveTextContent(JSON.stringify(mockSuggestions));
    expect(screen.getByTestId('integrated')).toHaveTextContent('[]');

    // Simular clic en el botón
    fireEvent.click(screen.getByText('Rechazar'));

    // Esperar a que se complete el rechazo
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Verificar el estado final
    await waitFor(() => {
      expect(screen.getByTestId('suggestions')).toHaveTextContent(JSON.stringify([mockSuggestions[1]]));
      expect(screen.getByTestId('integrated')).toHaveTextContent('[]');
    });

    // Verificar que los servicios fueron llamados correctamente
    console.log('mockTrackMetric REAL CALLS:', mockTrackMetric.mock.calls);
    expect(mockTrackMetric).toHaveBeenCalledWith(
      'suggestion_rejected',
      expect.objectContaining({
        suggestionId: mockSuggestions[0].id,
        suggestionType: mockSuggestions[0].type,
        suggestionField: mockSuggestions[0].field
      }),
      mockProps.userId,
      mockProps.visitId
    );

    console.log('mockAuditLog REAL CALLS:', mockAuditLog.mock.calls);
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_rejected',
      expect.objectContaining({
        suggestionId: mockSuggestions[0].id,
        visitId: mockProps.visitId,
        userId: mockProps.userId
      })
    );
  });

  it('debe manejar errores de integración correctamente', async () => {
    // Mock del error
    mockInsertSuggestion.mockRejectedValueOnce(new Error('Error de integración'));

    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;

      const handleClick = async () => {
        try {
          await context.handleSuggestionAccepted(mockSuggestions[0]);
        } catch (err) {
          // Error manejado por el componente
        }
      };

      return (
        <div>
          <button onClick={handleClick} data-testid="integrate-button">
            Integrar
          </button>
          {context.error && <div data-testid="error-message">{context.error}</div>}
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

    // Verificar estado inicial
    expect(screen.getByTestId('integrated')).toHaveTextContent('[]');
    expect(screen.getByTestId('suggestions')).toHaveTextContent(JSON.stringify(mockSuggestions));

    // Simular clic en el botón
    fireEvent.click(screen.getByTestId('integrate-button'));

    // Esperar a que se complete la operación
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Error al integrar la sugerencia');
    });

    // Verificar que las sugerencias NO se modificaron debido al error
    expect(screen.getByTestId('integrated')).toHaveTextContent('[]');
    expect(screen.getByTestId('suggestions')).toHaveTextContent(JSON.stringify(mockSuggestions));

    // Verificar que el servicio fue llamado pero falló
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

    // Verificar que NO se llamaron las métricas de éxito debido al error
    expect(mockTrackMetric).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('debe manejar la carga de sugerencias correctamente', async () => {
    const TestComponent = () => {
      const context = React.useContext(AgentSuggestionViewerProvider.Context);
      if (!context) return null;

      return (
        <div>
          <button onClick={() => context.loadSuggestions()}>Cargar</button>
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

    // Verificar estado inicial
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('');

    // Simular clic en el botón
    fireEvent.click(screen.getByText('Cargar'));

    // Esperar a que se complete la carga
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('');
    });
  });
}); 