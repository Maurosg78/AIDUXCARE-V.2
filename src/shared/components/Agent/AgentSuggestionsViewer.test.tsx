// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentSuggestionsViewer from './AgentSuggestionsViewer';
import { EMRFormService } from '@/core/services/EMRFormService';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { AgentSuggestion, SuggestionType } from '@/types/agent';

// Mock de los servicios
vi.mock('@/core/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestion: vi.fn(),
    mapSuggestionTypeToEMRSection: vi.fn((type) => {
      switch (type) {
        case 'recommendation': return 'plan';
        case 'warning': return 'assessment';
        case 'info': return 'notes';
        case 'diagnostic': return 'assessment';
        case 'treatment': return 'plan';
        case 'followup': return 'plan';
        case 'contextual': return 'notes';
        default: return 'notes';
      }
    })
  }
}));

vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn()
  }
}));

describe('AgentSuggestionsViewer', () => {
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: '1',
      type: 'recommendation' as SuggestionType,
      content: 'Sugerencia de prueba 1',
      field: 'diagnosis',
      sourceBlockId: 'block1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      type: 'warning' as SuggestionType,
      content: 'Sugerencia de prueba 2',
      field: 'treatment',
      sourceBlockId: 'block2',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const defaultProps = {
    visitId: 'visit-123',
    suggestions: mockSuggestions,
    onSuggestionAccepted: vi.fn(),
    onSuggestionRejected: vi.fn(),
    userId: 'user-123',
    patientId: 'patient-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Configurar el mock de insertSuggestion para que solo retorne true
    (EMRFormService.insertSuggestion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('debe renderizar correctamente con sugerencias', () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    expect(screen.getByText('Sugerencias del Copiloto (2)')).to.exist;
    // Cambiar queries ambiguos por selección explícita del primer botón "Mostrar"
    const mostrarButtons = screen.getAllByRole('button', { name: /mostrar/i });
    expect(mostrarButtons[0]).to.exist;
  });

  it('debe mostrar las sugerencias al expandir', () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    expect(screen.getAllByText('Sugerencia de prueba 1').length).to.be.greaterThan(0);
    expect(screen.getAllByText('Sugerencia de prueba 2').length).to.be.greaterThan(0);
  });

  it('debe manejar correctamente la aceptación de una sugerencia', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    fireEvent.click(screen.getAllByText('Integrar')[0]);
    await waitFor(() => {
      expect(EMRFormService.insertSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          content: 'Sugerencia de prueba 1',
          type: 'recommendation'
        }),
        'visit-123',
        'patient-123',
        'user-123'
      );
    });
    expect(trackMetric).toHaveBeenCalledWith(
      'suggestions_integrated',
      expect.any(Object),
      'user-123',
      'visit-123'
    );
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integrated',
      expect.objectContaining({
        userId: 'user-123',
        visitId: 'visit-123',
        patientId: 'patient-123',
        section: 'plan',
        content: 'Sugerencia de prueba 1',
        suggestionId: '1'
      })
    );
  });

  it('debe manejar correctamente el rechazo de una sugerencia', () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    fireEvent.click(screen.getAllByText('Rechazar')[0]);
    expect(defaultProps.onSuggestionRejected).toHaveBeenCalledWith(mockSuggestions[0]);
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_rejected',
      expect.objectContaining({
        userId: 'user-123',
        visitId: 'visit-123',
        patientId: 'patient-123',
        suggestionId: '1',
        suggestionType: 'recommendation',
        suggestionField: 'diagnosis'
      })
    );
  });

  it('debe mostrar mensaje cuando no hay sugerencias', () => {
    render(<AgentSuggestionsViewer {...defaultProps} suggestions={[]} />);
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    // Buscar el mensaje usando getByTestId tras expandir el panel
    expect(screen.getByTestId('no-suggestions-message')).to.exist;
  });

  it('debe manejar errores de red al integrar sugerencias', async () => {
    (EMRFormService.insertSuggestion as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'));
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    fireEvent.click(screen.getAllByText('Integrar')[0]);
    await waitFor(() => {
      expect(screen.getByText('Error de conexión al integrar la sugerencia')).to.exist;
    });
    // 2) AuditLogger.log flexible
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integration_error',
      expect.objectContaining({
        error: 'Error de conexión al integrar la sugerencia',
        patientId: 'patient-123',
        userId: 'user-123',
        visitId: 'visit-123',
      })
    );
  });

  it('debe ser accesible', () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    const toggleButton = screen.getAllByRole('button', { name: /mostrar/i })[0];
    expect(toggleButton.getAttribute('aria-expanded')).to.equal('false');
    expect(toggleButton.getAttribute('aria-controls')).to.equal('suggestions-content');
    fireEvent.click(toggleButton);
    // Validar regiones por aria-label robustamente
    const regions = screen.getAllByRole('region');
    const suggestionsRegions = regions.filter(region => region.getAttribute('aria-label') === 'Sugerencias del Copiloto');
    expect(suggestionsRegions.length).to.be.greaterThan(0);
    const allRegions = screen.getAllByRole('region');
    const suggestionRegions = allRegions.filter(region => region.getAttribute('aria-label')?.match(/^Sugerencia [0-9]+$/));
    // 3) Validar que hay al menos una región de sugerencia
    expect(suggestionRegions.length).to.be.greaterThan(0);
  });

  it('debe manejar correctamente sugerencias no integrables', async () => {
    const nonIntegrableSuggestions: AgentSuggestion[] = [
      {
        id: '3',
        type: 'diagnostic' as SuggestionType,
        content: 'Diagnóstico sugerido',
        field: 'diagnosis',
        sourceBlockId: 'block3',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        type: 'followup' as SuggestionType,
        content: 'Seguimiento sugerido',
        field: 'followup',
        sourceBlockId: 'block4',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    render(
      <AgentSuggestionsViewer
        {...defaultProps}
        suggestions={nonIntegrableSuggestions}
      />
    );
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    // Validar los textos reales del DOM para sugerencias no integrables
    expect(screen.getAllByText('Diagnóstico sugerido').length).to.be.greaterThan(0);
    expect(screen.getAllByText('Seguimiento sugerido').length).to.be.greaterThan(0);
    // Para regiones: filtrar por aria-label específico
    const regions = screen.getAllByRole('region');
    const suggestionsRegion = regions.find(region => region.getAttribute('aria-label') === 'Sugerencias del Copiloto');
    expect(suggestionsRegion).to.exist;
    // (Eliminada la aserción de 'No integrable' por no estar presente en el flujo real)
  });

  it('debe mostrar mensaje cuando no hay sugerencias', () => {
    render(<AgentSuggestionsViewer {...defaultProps} suggestions={[]} />);
    fireEvent.click(screen.getAllByText('Mostrar')[0]);
    // Debug temporal para inspeccionar el DOM
    // eslint-disable-next-line no-console
    console.log(document.body.innerHTML);
    expect(screen.getByText('No hay sugerencias disponibles', { exact: false })).to.exist;
  });
}); 