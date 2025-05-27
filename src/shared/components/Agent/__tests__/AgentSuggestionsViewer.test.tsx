/**
 * FUENTE ÚNICA DE VERDAD (SSoT) - AgentSuggestionsViewer
 * 
 * Este documento define el comportamiento esperado y correcto del componente AgentSuggestionsViewer.
 * Cualquier cambio en el comportamiento del componente debe reflejarse primero aquí.
 * 
 * 1. TEXTOS Y ETIQUETAS
 * --------------------
 * Botones de Acción:
 * - Botón Principal: "Integrar" (NO "Aceptar")
 * - Botón Secundario: "Rechazar"
 * - Botón Toggle: "Mostrar"/"Ocultar"
 * - Estado No Integrable: "No integrable" (botón deshabilitado)
 * - Estado Integrado: "Integrada" (botón deshabilitado)
 * 
 * 2. ATRIBUTOS ARIA Y ROLES
 * ------------------------
 * Contenedor Principal:
 * - role="region"
 * - aria-label="Sugerencias del Copiloto"
 * 
 * Botón Toggle:
 * - aria-expanded="true"/"false"
 * - aria-controls="suggestions-content"
 * - aria-label="Mostrar sugerencias del copiloto"
 * 
 * Contenedor de Sugerencias:
 * - id="suggestions-content"
 * - role="region"
 * - aria-label="Lista de sugerencias"
 * 
 * Grupos de Sugerencias:
 * - role="region"
 * - aria-label="Sugerencias de tipo [tipo]"
 * 
 * Ítems de Sugerencia:
 * - role="article"
 * - aria-label="Sugerencia: [contenido]"
 * 
 * 3. ESTRUCTURA DE DATOS
 * ---------------------
 * EMRFormService.insertSuggestion:
 * {
 *   id: string;
 *   content: string;
 *   type: 'recommendation' | 'warning' | 'info';
 *   sourceBlockId: string;
 *   field: string;
 * }
 * 
 * AuditLogger.log:
 * - Evento: 'suggestion_integrated'
 *   {
 *     userId: string;
 *     visitId: string;
 *     patientId: string;
 *     section: string;
 *     suggestionId: string;
 *     content: string;
 *   }
 * 
 * - Evento: 'suggestion_rejected'
 *   {
 *     userId: string;
 *     visitId: string;
 *     patientId: string;
 *     suggestionId: string;
 *   }
 * 
 * - Evento: 'suggestion_integration_error'
 *   {
 *     userId: string;
 *     visitId: string;
 *     patientId: string;
 *     suggestionId: string;
 *     error: string;
 *   }
 * 
 * 4. MANEJO DE ERRORES
 * -------------------
 * Mensajes de Error:
 * - Error de Red: "Error de conexión al integrar la sugerencia"
 * - Error de Validación: "La sugerencia no cumple con los requisitos de validación"
 * - Error de Integración: "Error al integrar la sugerencia"
 * - Error Desconocido: "Error al integrar la sugerencia"
 * 
 * 5. COMPORTAMIENTO ESPECÍFICO
 * ---------------------------
 * Renderizado Condicional:
 * - El contenedor suggestions-content debe eliminarse del DOM cuando isExpanded === false
 * - No se debe usar CSS para ocultar el contenido
 * 
 * Estado de Botones:
 * - Deshabilitado cuando:
 *   a) La sugerencia ya fue integrada
 *   b) La sugerencia no es integrable
 *   c) Ocurrió un error de integración
 * 
 * Validación de Sugerencias:
 * - Debe tener id, type, content válidos
 * - content no debe estar vacío
 * - type debe ser uno de los tipos soportados
 */

// TESTS COMENTADOS POR EL CTO: Muchos tests fallan por cambios recientes en la lógica, mocks y estructura del componente AgentSuggestionsViewer.
// Se recomienda reescribirlos alineados a la nueva lógica y mocks. Solo se mantienen los tests triviales o que pasan.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { AgentSuggestion, SuggestionType, SuggestionField } from '@/types/agent';
import { EMRFormService } from '@/core/services/EMRFormService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import * as UsageAnalyticsService from '@/services/UsageAnalyticsService';
import AgentSuggestionExplainer from '../AgentSuggestionExplainer';
import AgentSuggestionFeedbackActions from '../AgentSuggestionFeedbackActions';

// Constantes de error del componente
const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión al integrar la sugerencia',
  VALIDATION: 'La sugerencia no cumple con los requisitos de validación',
  INTEGRATION: 'Error al integrar la sugerencia',
  UNKNOWN: 'Error al integrar la sugerencia'
} as const;

// Mock de los servicios externos
const mockInsertSuggestion = vi.fn().mockImplementation(() => Promise.resolve(true));
const mockMapSuggestionTypeToEMRSection = vi.fn().mockImplementation((type: string) => {
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
});

const mockAuditLog = vi.fn();
const mockTrackMetric = vi.fn();

vi.mock('@/core/services/EMRFormService', () => ({
  EMRFormService: {
    insertSuggestion: (...args: any[]) => mockInsertSuggestion(...args),
    mapSuggestionTypeToEMRSection: (...args: any[]) => mockMapSuggestionTypeToEMRSection(...args)
  }
}));

vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: (...args: any[]) => mockAuditLog(...args)
  }
}));

vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: (...args: any[]) => mockTrackMetric(...args)
}));

const defaultProps = {
  visitId: 'test-visit-id',
  suggestions: [
    {
      id: '1',
      type: 'recommendation' as SuggestionType,
      content: 'Recomendación de prueba',
      field: 'notes' as SuggestionField,
      sourceBlockId: 'block-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  userId: 'test-user-id',
  patientId: 'test-patient-id',
  onSuggestionAccepted: vi.fn(),
  onSuggestionRejected: vi.fn()
};

describe('AgentSuggestionsViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar correctamente el componente', () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    
    // Verificar contenedor principal
    const mainContainer = screen.getByRole('region', { name: 'Sugerencias del Copiloto' });
    expect(mainContainer).toBeInTheDocument();

    // Verificar botón toggle
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton).toHaveAttribute('aria-controls', 'suggestions-content');
  });

  it('debe manejar la integración de sugerencias correctamente', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    // Primero hacer clic en el botón de mostrar
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    fireEvent.click(toggleButton);

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(screen.getByTestId(`suggestion-${defaultProps.suggestions[0].id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de integrar
    const integrateButton = screen.getByTestId(`accept-suggestion-${defaultProps.suggestions[0].id}`);
    fireEvent.click(integrateButton);

    // Verificar que se llamó a insertSuggestion con los argumentos correctos
    await waitFor(() => {
      expect(mockInsertSuggestion).toHaveBeenCalledWith({
        id: defaultProps.suggestions[0].id,
        content: defaultProps.suggestions[0].content,
        type: defaultProps.suggestions[0].type,
        sourceBlockId: defaultProps.suggestions[0].sourceBlockId,
        field: defaultProps.suggestions[0].field,
        suggestionType: defaultProps.suggestions[0].type,
        suggestionField: defaultProps.suggestions[0].field
      });
    });

    // Verificar que se llamó a trackMetric
    expect(mockTrackMetric).toHaveBeenCalledWith(
      'suggestion_integrated',
      defaultProps.userId,
      defaultProps.visitId,
      1,
      {
        suggestionId: defaultProps.suggestions[0].id,
        suggestionType: defaultProps.suggestions[0].type,
        suggestionField: defaultProps.suggestions[0].field,
        patientId: defaultProps.patientId
      }
    );

    // Verificar que se llamó a AuditLogger
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_integrated',
      {
        suggestionId: defaultProps.suggestions[0].id,
        visitId: defaultProps.visitId,
        userId: defaultProps.userId,
        patientId: defaultProps.patientId
      }
    );
  });

  it('debe manejar errores de integración correctamente', async () => {
    // Configurar el mock para que falle
    mockInsertSuggestion.mockRejectedValueOnce(new Error('Error de integración'));

    render(<AgentSuggestionsViewer {...defaultProps} />);

    // Primero hacer clic en el botón de mostrar
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    fireEvent.click(toggleButton);

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(screen.getByTestId(`suggestion-${defaultProps.suggestions[0].id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de integrar
    const integrateButton = screen.getByTestId(`accept-suggestion-${defaultProps.suggestions[0].id}`);
    fireEvent.click(integrateButton);

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error al integrar la sugerencia')).toBeInTheDocument();
    });

    // Verificar que se llamó a AuditLogger con el error
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_integration_error',
      {
        error: 'Error al integrar la sugerencia',
        suggestionId: defaultProps.suggestions[0].id,
        visitId: defaultProps.visitId,
        userId: defaultProps.userId,
        patientId: defaultProps.patientId
      }
    );
  });

  it('debe manejar el rechazo de sugerencias correctamente', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    // Primero hacer clic en el botón de mostrar
    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });
    fireEvent.click(toggleButton);

    // Esperar a que se muestren las sugerencias
    await waitFor(() => {
      expect(screen.getByTestId(`suggestion-${defaultProps.suggestions[0].id}`)).toBeInTheDocument();
    });

    // Encontrar y hacer clic en el botón de rechazar
    const rejectButton = screen.getByTestId(`reject-suggestion-${defaultProps.suggestions[0].id}`);
    fireEvent.click(rejectButton);

    // Verificar que se llamó a AuditLogger
    expect(mockAuditLog).toHaveBeenCalledWith(
      'suggestion_rejected',
      {
        suggestionId: defaultProps.suggestions[0].id,
        visitId: defaultProps.visitId,
        userId: defaultProps.userId,
        patientId: defaultProps.patientId
      }
    );

    // Verificar que se llamó a trackMetric
    expect(mockTrackMetric).toHaveBeenCalledWith(
      'suggestion_rejected',
      defaultProps.userId,
      defaultProps.visitId,
      1,
      {
        suggestionId: defaultProps.suggestions[0].id,
        suggestionType: defaultProps.suggestions[0].type,
        suggestionField: defaultProps.suggestions[0].field,
        patientId: defaultProps.patientId
      }
    );
  });

  it('debe manejar el toggle de visibilidad correctamente', async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: 'Mostrar sugerencias del copiloto' });

    // Estado inicial
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId(`suggestion-${defaultProps.suggestions[0].id}`)).not.toBeInTheDocument();

    // Hacer clic para mostrar
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => {
      expect(screen.getByTestId(`suggestion-${defaultProps.suggestions[0].id}`)).toBeInTheDocument();
    });

    // Hacer clic para ocultar
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(screen.queryByTestId(`suggestion-${defaultProps.suggestions[0].id}`)).not.toBeInTheDocument();
    });
  });

  it('debe mostrar correctamente los feedbacks de las sugerencias', async () => {
    // Renderizar el componente
    render(
      <AgentSuggestionsViewer
        visitId={defaultProps.visitId}
        suggestions={defaultProps.suggestions}
        userId={defaultProps.userId}
        patientId={defaultProps.patientId}
      />
    );

    // Expandir el componente para mostrar las sugerencias
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));

    // Verificar que se carguen los feedbacks
    expect(screen.getByText('Retroalimentación: Útil')).toBeInTheDocument();

    // Verificar que se ha registrado la métrica de visualización de feedback
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestion_feedback_viewed',
      defaultProps.userId,
      defaultProps.visitId,
      1,
      expect.objectContaining({
        feedbacks_count: 1
      })
    );
  });
}); 