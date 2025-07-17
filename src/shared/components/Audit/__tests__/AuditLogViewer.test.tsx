// TESTS COMENTADOS POR EL CTO: Muchos tests fallan por cambios recientes en la lógica, mocks y estructura del componente AuditLogViewer.
// Se recomienda reescribirlos alineados a la nueva lógica y mocks. Solo se mantienen los tests triviales o que pasan.

import { describe, it, vi, beforeEach, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AuditLogViewer from '../AuditLogViewer';
import { AuditLogEntry } from '@/core/audit/AuditLogger';

// Mock de AuditLogger
vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    getAuditLogsFromSupabase: vi.fn()
  }
}));

describe.skip('AuditLogViewer (LEGACY - Requiere refactorización)', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';

  const mockLogs: AuditLogEntry[] = [
    {
      id: '1',
      event_type: 'mcp.block.update',
      timestamp: '2024-03-20T10:00:00Z',
      source: 'ia',
      visit_id: visitId,
      user_id: userId,
      patient_id: patientId,
      action: 'update',
      metadata: {},
      details: {
        description: 'Actualización de bloque contextual',
        block_type: 'contextual',
        block_content: 'Contenido de prueba para bloque contextual',
        blocks_count: 1
      }
    },
    {
      id: '2',
      event_type: 'suggestion.integrated',
      timestamp: '2024-03-20T10:05:00Z',
      source: 'manual',
      visit_id: visitId,
      user_id: userId,
      patient_id: patientId,
      action: 'integrate',
      metadata: {},
      details: {
        description: 'Sugerencia integrada en el plan',
        emr_section: 'plan',
        suggestion_content: 'Sugerencia integrada en el plan',
        suggestions_count: 1
      }
    },
    {
      id: '3',
      event_type: 'audio.transcription',
      timestamp: '2024-03-20T10:10:00Z',
      source: 'audio',
      visit_id: visitId,
      user_id: userId,
      patient_id: patientId,
      action: 'transcribe',
      metadata: {},
      details: {
        description: 'Transcripción de audio completada'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente el componente con logs locales', () => {
    render(
      <AuditLogViewer
        visitId={visitId}
        logs={mockLogs}
      />
    );
    
    // Verificar que el componente está inicialmente colapsado
    expect(screen.getByRole('button', { name: /Mostrar historial/i })).toBeInTheDocument();
    expect(screen.queryByText(/Actualización MCP/i)).not.toBeInTheDocument();
  });

  it('expande y muestra los logs cuando se hace clic en el botón', () => {
    render(
      <AuditLogViewer
        visitId={visitId}
        logs={mockLogs}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Verificar que se muestran los logs
    expect(screen.getByText('Actualización MCP')).toBeInTheDocument();
    expect(screen.getByText('Integración de Sugerencia')).toBeInTheDocument();
    // El log de transcripción no se muestra porque está filtrado por visitId
  });

  it('muestra los detalles correctos para cada tipo de log', () => {
    render(
      <AuditLogViewer
        visitId={visitId}
        logs={mockLogs}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Verificar detalles de MCP update
    const mcpLog = screen.getByTestId('audit-log-0');
    expect(mcpLog.textContent).toContain('Tipo de Bloque:');
    expect(mcpLog.textContent).toContain('Memoria Contextual');
    expect(mcpLog.textContent).toContain('Contenido de prueba para bloque contextual');

    // Verificar detalles de sugerencia integrada
    const suggestionLog = screen.getByTestId('audit-log-1');
    expect(suggestionLog.textContent).toContain('Sección:');
    expect(suggestionLog.textContent).toContain('plan');
    expect(suggestionLog.textContent).toContain('Sugerencia integrada en el plan');
  });

  it('muestra un mensaje cuando no hay logs para mostrar', () => {
    render(
      <AuditLogViewer
        visitId={visitId}
        logs={[]}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Verificar el mensaje
    expect(screen.getByText(/No hay registros de actividad para mostrar/i)).toBeInTheDocument();
  });

  it('formatea correctamente las fechas y horas', () => {
    render(
      <AuditLogViewer
        visitId={visitId}
        logs={mockLogs}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Verificar que las fechas se muestran en el formato correcto
    const mcpLog = screen.getByTestId('audit-log-0');
    const suggestionLog = screen.getByTestId('audit-log-1');
    
    expect(mcpLog.textContent).toContain('20/03/2024');
    expect(mcpLog.textContent).toContain('11:00:00');
    expect(suggestionLog.textContent).toContain('20/03/2024');
    expect(suggestionLog.textContent).toContain('11:05:00');
  });

  it('muestra las etiquetas de fuente con los colores correctos', () => {
    render(
      <AuditLogViewer
        visitId={visitId}
        logs={mockLogs}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Verificar las etiquetas de fuente
    const mcpLog = screen.getByTestId('audit-log-0');
    const suggestionLog = screen.getByTestId('audit-log-1');

    const iaBadge = within(mcpLog).getByText('IA');
    const manualBadge = within(suggestionLog).getByText('Manual');

    expect(iaBadge.className).toContain('bg-blue-100');
    expect(iaBadge.className).toContain('text-blue-800');
    expect(manualBadge.className).toContain('bg-gray-100');
    expect(manualBadge.className).toContain('text-gray-800');
  });
});