// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import type { SuggestionType, SuggestionField } from '@/types/agent';

// Mock de los servicios externos
const mockInsertSuggestion = vi.fn().mockImplementation(() => Promise.resolve(true));
const mockMapSuggestionTypeToEMRSection = vi.fn().mockImplementation((type: string) => {
  const mapping: Record<string, string> = {
    recommendation: 'recommendations',
    warning: 'warnings',
    info: 'info',
    diagnostic: 'diagnostics',
    treatment: 'treatments',
    followup: 'followups',
    contextual: 'context'
  };
  return mapping[type] || 'other';
});
const mockAuditLog = vi.fn();
const mockTrackMetric = vi.fn();

vi.mock('@/core/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestion: (...args: unknown[]) => mockInsertSuggestion(...args),
    mapSuggestionTypeToEMRSection: (...args: unknown[]) => mockMapSuggestionTypeToEMRSection(...args)
  }
}));

vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: (...args: unknown[]) => mockAuditLog(...args)
  }
}));

vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: (...args: unknown[]) => mockTrackMetric(...args)
}));

describe('AgentSuggestionsViewer', () => {
  const defaultProps = {
    visitId: 'test-visit-id',
    suggestions: [
      {
        id: 'suggestion-1',
        type: 'recommendation' as SuggestionType,
        content: 'Considerar radiografía de tórax',
        field: 'diagnosis' as SuggestionField,
        sourceBlockId: 'block-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'suggestion-2',
        type: 'warning' as SuggestionType,
        content: 'Monitorizar presión arterial',
        field: 'vitals' as SuggestionField,
        sourceBlockId: 'block-2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    userId: 'test-user-id',
    patientId: 'test-patient-id',
    onSuggestionAccepted: vi.fn(),
    onSuggestionRejected: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('debe validar la integración completa de sugerencias al EMR', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    // Primero hacer clic en el botón de mostrar
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    fireEvent.click(toggleButton);

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      const allSuggestions = screen.getAllByTestId(`suggestion-${defaultProps.suggestions[0].id}`);
      expect(allSuggestions.some(el => el.textContent?.includes(defaultProps.suggestions[0].content))).to.be.true;
    });

    // Encontrar y hacer clic en el botón de integrar
    const integrateButton = screen.getByTestId(`accept-suggestion-${defaultProps.suggestions[0].id}`);
    fireEvent.click(integrateButton);

    // Verificar que se llamó a insertSuggestion con los argumentos correctos (CORREGIDO)
    await waitFor(() => {
      expect(mockInsertSuggestion).toHaveBeenCalledWith(
        {
          id: defaultProps.suggestions[0].id,
          content: defaultProps.suggestions[0].content,
          type: defaultProps.suggestions[0].type,
          sourceBlockId: defaultProps.suggestions[0].sourceBlockId,
          field: defaultProps.suggestions[0].field
        },
        defaultProps.visitId,
        defaultProps.patientId,
        defaultProps.userId
      );
    });

    // Verificar que se llamó a trackMetric
    expect(mockTrackMetric).toHaveBeenCalledWith(
      'suggestions_integrated',
      {
        suggestionId: defaultProps.suggestions[0].id,
        suggestionType: defaultProps.suggestions[0].type,
        suggestionField: defaultProps.suggestions[0].field || 'notes'
      },
      defaultProps.userId,
      defaultProps.visitId
    );

    // Verificar que se llamó a AuditLogger
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_integrated',
      {
        userId: defaultProps.userId,
        visitId: defaultProps.visitId,
        patientId: defaultProps.patientId,
        suggestionId: defaultProps.suggestions[0].id,
        suggestionType: defaultProps.suggestions[0].type,
        suggestionField: defaultProps.suggestions[0].field || 'notes',
        content: defaultProps.suggestions[0].content,
        section: expect.any(String)
      }
    );
  });

  it('debe manejar correctamente errores de red al integrar sugerencias', async () => {
    // Configurar el mock para que falle con un error de red (CORREGIDO)
    mockInsertSuggestion.mockRejectedValueOnce(new Error('Error de conexión al integrar la sugerencia'));

    render(<AgentSuggestionsViewer {...defaultProps} />);

    // Primero hacer clic en el botón de mostrar
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    fireEvent.click(toggleButton);

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      const allSuggestions = screen.getAllByTestId(`suggestion-${defaultProps.suggestions[0].id}`);
      expect(allSuggestions.length).to.be.above(0);
    });

    // Encontrar y hacer clic en el botón de integrar
    const integrateButtons = screen.getAllByTestId(`accept-suggestion-${defaultProps.suggestions[0].id}`);
    const enabledIntegrateButton = integrateButtons.find(btn => !(btn as HTMLButtonElement).disabled);
    expect(enabledIntegrateButton).to.exist;
    fireEvent.click(enabledIntegrateButton!);

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error de conexión al integrar la sugerencia')).to.exist;
    });

    // Verificar que se llamó a AuditLogger con el error (CORREGIDO)
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_integration_error',
      expect.objectContaining({
        error: 'Error de conexión al integrar la sugerencia',
        patientId: defaultProps.patientId,
        suggestionId: defaultProps.suggestions[0].id,
        suggestionField: defaultProps.suggestions[0].field,
        suggestionType: defaultProps.suggestions[0].type,
        userId: defaultProps.userId,
        visitId: defaultProps.visitId
      })
    );
  });

  it('debe ser accesible', () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    // Verificar que el contenedor principal tiene el role y aria-label correctos
    const mainContainers = screen.getAllByRole('region', { name: 'Sugerencias del Copiloto' });
    expect(mainContainers.length).to.be.above(0);
    expect(mainContainers[0]).to.exist;

    // Verificar que el botón toggle tiene los atributos ARIA correctos
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    expect(toggleButton.getAttribute('aria-expanded')).to.equal('false');
    expect(toggleButton.getAttribute('aria-controls')).to.equal('suggestions-content');

    // Hacer clic en el botón para expandir
    fireEvent.click(toggleButton);

    // Verificar que el contenedor de sugerencias tiene los atributos ARIA correctos (CORREGIDO)
    const suggestionsContents = screen.getAllByRole('region', { name: /Lista de sugerencias/i });
    expect(suggestionsContents.length).to.be.above(0);
    const suggestionsContent = suggestionsContents[0];
    expect(suggestionsContent).to.exist;

    // Verificar que cada sugerencia tiene un contenedor con role="article" (CORREGIDO)
    const suggestionRegions = screen.getAllByRole('region');
    const individualSuggestions = suggestionRegions.filter(region => region.getAttribute("aria-label")?.startsWith("Sugerencia suggestion-"));
    expect(individualSuggestions.length >= defaultProps.suggestions.length).to.be.true;

    // Verificar que cada sugerencia tiene los atributos ARIA correctos
    defaultProps.suggestions.forEach(suggestion => {
      const match = individualSuggestions.find(region => region.getAttribute('aria-label') === `Sugerencia ${suggestion.id}`);
      expect(match).to.exist;
    });
  });
}); 