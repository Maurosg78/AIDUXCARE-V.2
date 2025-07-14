import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../src/shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion } from '../src/types/agent';
import { EMRFormService } from '../src/core/services/EMRFormService';
import { AuditLogger } from '../src/core/audit/AuditLogger';
import * as UsageAnalyticsService from '../src/services/UsageAnalyticsService';
// TODO: formDataSourceSupabase está reservado para pruebas futuras de integración
// import { formDataSourceSupabase } from '../src/core/dataSources/formDataSourceSupabase';
// TODO: source está reservado para pruebas futuras de campos de sugerencia
// const source = 'test-source';

// Mocks para las dependencias externas
vi.mock('../src/core/services/EMRFormService', () => ({
  EMRFormService: {
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
    }),
    insertSuggestion: vi.fn()
  }
}));

vi.mock('../src/core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn()
  }
}));

vi.mock('../src/services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

vi.mock('../src/core/dataSources/formDataSourceSupabase', () => ({
  formDataSourceSupabase: {
    updateForm: vi.fn().mockResolvedValue({ id: 'form-mock-123' }),
    getFormsByVisitId: vi.fn().mockResolvedValue([{
      id: 'form-mock-123',
      visit_id: 'visit-test-id',
      content: JSON.stringify({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        notes: ''
      })
    }])
  }
}));

// Mock para las funciones de servicio integradas manualmente
const mockInsertSuggestion = vi.fn(async () => {
  return true; // Solo devuelve true, sin efectos secundarios
});

// Configurar el mock de insertSuggestion
(EMRFormService.insertSuggestion as any).mockImplementation(mockInsertSuggestion);

describe('AgentSuggestionsViewer', () => {
  // Datos de prueba
  const visitId = 'test-visit-id';
  const patientId = 'test-patient-id';
  
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'suggestion-1',
      sourceBlockId: 'block-1',
      type: 'recommendation' as const,
      field: 'diagnosis',
      content: 'Considerar radiografía de tórax',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'suggestion-2',
      sourceBlockId: 'block-2',
      type: 'warning' as const,
      field: 'medication',
      content: 'Paciente con alergias a medicamentos',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'suggestion-3',
      sourceBlockId: 'block-3',
      type: 'info' as const,
      field: 'history',
      content: 'Antecedentes familiares relevantes',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const onSuggestionAccepted = vi.fn();
  const onSuggestionRejected = vi.fn();

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    vi.clearAllMocks();
    // Resetear el mock de insertSuggestion a su implementación por defecto
    (EMRFormService.insertSuggestion as any).mockImplementation(mockInsertSuggestion);
  });

  it('debe renderizarse sin errores', async () => {
    const { getByText, getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Verificar que se muestra el título del componente con el contador
    expect(getByText('Sugerencias del Copiloto (3)')).toBeInTheDocument();
    
    // Verificar que se muestra el botón para expandir/ocultar
    const toggleButton = getByTestId('toggle-suggestions');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('Mostrar');

    // Verificar que se muestran las secciones de sugerencias al expandir
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
    expect(getByTestId('recommendation-section')).toBeInTheDocument();
    expect(getByTestId('warning-section')).toBeInTheDocument();
    expect(getByTestId('info-section')).toBeInTheDocument();
    });

    // Verificar que se muestran todas las sugerencias
    mockSuggestions.forEach(suggestion => {
      expect(getByTestId(`suggestion-${suggestion.id}`)).toBeInTheDocument();
    });
  });

  it('debe validar la integración completa de sugerencias al EMR', async () => {
    const suggestion = mockSuggestions[0];
    
    // Simular inserción exitosa
    (EMRFormService.insertSuggestion as any).mockResolvedValueOnce(true);
    
    const { getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );
    
    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));
  
    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(getByTestId(`suggestion-${suggestion.id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de aceptar
    const acceptButton = getByTestId(`accept-suggestion-${suggestion.id}`);
    expect(acceptButton).toBeInTheDocument();
    await fireEvent.click(acceptButton);

    expect(EMRFormService.insertSuggestion).toHaveBeenCalledWith(
      {
        id: suggestion.id,
        content: suggestion.content,
        type: suggestion.type,
        sourceBlockId: suggestion.sourceBlockId,
        field: suggestion.field
      },
      visitId,
      patientId,
      'admin-test-001'
    );
    
    await waitFor(() => {
      expect(AuditLogger.log).toHaveBeenCalledWith(
        "suggestion_integrated",
      expect.objectContaining({
        visitId,
        section: EMRFormService.mapSuggestionTypeToEMRSection(suggestion.type),
        suggestionId: suggestion.id
      })
    );
    });
    
    expect(UsageAnalyticsService.trackMetric).toHaveBeenCalledWith(
      'suggestions_integrated',
      expect.objectContaining({
        suggestionId: suggestion.id,
        suggestionType: suggestion.type,
        suggestionField: suggestion.field
      }),
      'admin-test-001',
      visitId
    );
  });

  it('debe manejar correctamente cuando no hay sugerencias', () => {
    const { getByText, getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={[]}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    expect(getByText('Sugerencias del Copiloto (0)')).toBeInTheDocument();
    
    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));
    
    expect(getByTestId('no-suggestions-message')).toBeInTheDocument();
  });

  it('debe manejar correctamente sugerencias con contenido vacío', () => {
    const emptySuggestions = [{
      id: 'empty-1',
      sourceBlockId: 'block-1',
      type: 'recommendation' as const,
      field: 'diagnosis',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    const { getByTestId, queryByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={emptySuggestions}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Verificar que la sugerencia vacía no se muestra
    expect(queryByTestId('suggestion-empty-1')).not.toBeInTheDocument();
  });

  it('debe manejar correctamente errores de red al integrar sugerencias', async () => {
    const networkError = new Error('Error de red');
    (EMRFormService.insertSuggestion as any).mockRejectedValueOnce(networkError);

    const { getByTestId, findByText } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(getByTestId(`suggestion-${mockSuggestions[0].id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de aceptar
    const acceptButton = getByTestId(`accept-suggestion-${mockSuggestions[0].id}`);
    expect(acceptButton).toBeInTheDocument();
    fireEvent.click(acceptButton);

    // Esperar a que aparezca el mensaje de error
    const errorMessage = await findByText('Error al integrar la sugerencia');
    expect(errorMessage).toBeInTheDocument();

    // Verificar que se registró el error en el logger
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integration_error',
      expect.objectContaining({
        error: 'Error al integrar la sugerencia',
        patientId: 'test-patient-id',
        suggestionField: 'diagnosis',
        suggestionId: 'suggestion-1',
        suggestionType: 'recommendation',
        userId: 'admin-test-001',
        visitId: 'test-visit-id',
      })
    );
  });

  it('debe manejar correctamente la cancelación de integración', async () => {
    const { getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(getByTestId(`suggestion-${mockSuggestions[0].id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de rechazar
    const rejectButton = getByTestId(`reject-suggestion-${mockSuggestions[0].id}`);
    expect(rejectButton).toBeInTheDocument();
    await fireEvent.click(rejectButton);

    expect(onSuggestionRejected).toHaveBeenCalledWith(mockSuggestions[0]);
    expect(EMRFormService.insertSuggestion).not.toHaveBeenCalled();
  });

  it('debe manejar correctamente sugerencias no integrables', async () => {
    const nonIntegrableSuggestion: AgentSuggestion = {
      id: 'non-integrable-1',
      sourceBlockId: 'block-1',
      type: 'diagnostic',
      field: 'diagnosis',
      content: 'Sugerencia no integrable',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={[nonIntegrableSuggestion]}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias
    fireEvent.click(getByTestId('toggle-suggestions'));

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(getByTestId(`suggestion-${nonIntegrableSuggestion.id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de aceptar
    const acceptButton = getByTestId(`accept-suggestion-${nonIntegrableSuggestion.id}`);
    expect(acceptButton).toBeInTheDocument();
    await fireEvent.click(acceptButton);

    expect(EMRFormService.insertSuggestion).not.toHaveBeenCalled();
    expect(AuditLogger.log).not.toHaveBeenCalledWith(
      'suggestion_integrated',
      expect.any(Object)
    );
  });

    it('debe ser accesible', () => {
    const { getByRole, getByTestId } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        patientId={patientId}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionRejected={onSuggestionRejected}
      />
    );

    // Expandir las sugerencias primero
    fireEvent.click(getByTestId("toggle-suggestions"));
    
    // Verificar que existe la región principal de sugerencias
    expect(getByRole("region", { name: /sugerencias del copiloto/i })).toBeInTheDocument();
    
    // Verificar que las sugerencias individuales están presentes
    mockSuggestions.forEach(suggestion => {
      expect(getByTestId(`suggestion-${suggestion.id}`)).toBeInTheDocument();
    });
  });
}); 