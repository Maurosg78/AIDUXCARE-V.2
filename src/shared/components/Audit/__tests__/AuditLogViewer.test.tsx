import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuditLogViewer from '../AuditLogViewer';
import { AuditLogger, AuditLogEntry } from '@/core/audit/AuditLogger';

// Mock de AuditLogger
vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    getAuditLogsFromSupabase: vi.fn()
  }
}));

describe('AuditLogViewer', () => {
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
    expect(screen.getByText(/Actualización MCP/i)).toBeInTheDocument();
    expect(screen.getByText(/Integración de Sugerencia/i)).toBeInTheDocument();
    expect(screen.getByText(/Transcripción de Audio/i)).toBeInTheDocument();
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
    expect(screen.getByText(/Tipo de Bloque: Memoria Contextual/i)).toBeInTheDocument();
    expect(screen.getByText(/Contenido de prueba para bloque contextual/i)).toBeInTheDocument();

    // Verificar detalles de sugerencia integrada
    expect(screen.getByText(/Sección: plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Sugerencia integrada en el plan/i)).toBeInTheDocument();

    // Verificar detalles de transcripción
    expect(screen.getByText(/Transcripción de audio completada/i)).toBeInTheDocument();
  });

  it('carga logs desde Supabase cuando fromSupabase es true', async () => {
    const supabaseLogs: AuditLogEntry[] = [
      {
        id: '4',
        event_type: 'visit.loaded',
        timestamp: '2024-03-20T11:00:00Z',
        source: 'manual',
        visit_id: visitId,
        user_id: userId,
        patient_id: patientId,
        action: 'load',
        metadata: {},
        details: {
          description: 'Visita cargada desde Supabase'
        }
      }
    ];

    vi.mocked(AuditLogger.getAuditLogsFromSupabase).mockResolvedValueOnce(supabaseLogs);

    render(
      <AuditLogViewer
        visitId={visitId}
        fromSupabase={true}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Verificar que se muestra el indicador de carga
    expect(screen.getByText(/Cargando logs de auditoría/i)).toBeInTheDocument();

    // Esperar a que se carguen los logs
    await waitFor(() => {
      expect(screen.getByText(/Visita Cargada/i)).toBeInTheDocument();
      expect(screen.getByText(/Visita cargada desde Supabase/i)).toBeInTheDocument();
    });

    // Verificar que se llamó a getAuditLogsFromSupabase
    expect(AuditLogger.getAuditLogsFromSupabase).toHaveBeenCalledWith(visitId);
  });

  it('muestra un mensaje de error cuando falla la carga desde Supabase', async () => {
    vi.mocked(AuditLogger.getAuditLogsFromSupabase).mockRejectedValueOnce(new Error('Error de conexión'));

    render(
      <AuditLogViewer
        visitId={visitId}
        fromSupabase={true}
      />
    );

    // Expandir el componente
    fireEvent.click(screen.getByRole('button', { name: /Mostrar historial/i }));

    // Esperar a que se muestre el error
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar los logs de auditoría desde Supabase/i)).toBeInTheDocument();
    });
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
    expect(screen.getByText(/20\/03\/2024, 10:00:00/i)).toBeInTheDocument();
    expect(screen.getByText(/20\/03\/2024, 10:05:00/i)).toBeInTheDocument();
    expect(screen.getByText(/20\/03\/2024, 10:10:00/i)).toBeInTheDocument();
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
    const iaBadge = screen.getByText('IA');
    const manualBadge = screen.getByText('Manual');
    const audioBadge = screen.getByText('Audio');

    expect(iaBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(manualBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    expect(audioBadge).toHaveClass('bg-purple-100', 'text-purple-800');
  });
});