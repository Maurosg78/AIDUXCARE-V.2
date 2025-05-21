import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuditLogViewer from '../AuditLogViewer';
import '@testing-library/jest-dom';

// Usamos el tipo real de AuditLogEntry para mantener consistencia
import { AuditLogEntry } from '@/core/audit/AuditLogger';

// Extensión para entradas MCP
interface MCPUpdateAuditEntry extends AuditLogEntry {
  metadata: {
    visit_id: string;
    block_id: string;
    block_type: 'contextual' | 'persistent' | 'semantic';
    operation: 'update';
    old_content: string;
    new_content: string;
  };
}

describe('AuditLogViewer', () => {
  const mockVisitId = 'visit-123';
  
  // Creamos mocks completos incluyendo todas las propiedades requeridas
  const mockLogs: AuditLogEntry[] = [
    {
      id: '1',
      action: 'mcp.block.update',
      user_id: 'admin-test-001',
      patient_id: 'patient-001',
      visit_id: 'visit-123',
      timestamp: '2025-05-20T14:30:00.000Z',
      metadata: {
        visit_id: 'visit-123',
        block_id: 'block-1',
        block_type: 'contextual',
        operation: 'update',
        old_content: 'Contenido original para pruebas',
        new_content: 'Contenido modificado para pruebas'
      }
    } as MCPUpdateAuditEntry,
    {
      id: '2',
      action: 'mcp.block.update',
      user_id: 'admin-test-001',
      patient_id: 'patient-001',
      visit_id: 'visit-123',
      timestamp: '2025-05-20T14:35:00.000Z',
      metadata: {
        visit_id: 'visit-123',
        block_id: 'block-2',
        block_type: 'persistent',
        operation: 'update',
        old_content: 'Otro contenido original',
        new_content: 'Otro contenido modificado'
      }
    } as MCPUpdateAuditEntry,
    {
      id: '3',
      action: 'mcp.block.update',
      user_id: 'admin-test-001',
      patient_id: 'patient-001',
      visit_id: 'visit-456',
      timestamp: '2025-05-20T14:40:00.000Z',
      metadata: {
        visit_id: 'visit-456',
        block_id: 'block-3',
        block_type: 'semantic',
        operation: 'update',
        old_content: 'Contenido que no debería aparecer',
        new_content: 'Contenido modificado que no debería aparecer'
      }
    } as MCPUpdateAuditEntry
  ];

  it('no renderiza nada si no hay logs para la visita', () => {
    render(<AuditLogViewer visitId="visit-789" logs={mockLogs} />);
    // Solo el encabezado
    expect(screen.getByText(/Historial de Actividad Clínica/)).toBeInTheDocument();
    expect(screen.queryByText('Mostrar historial')).not.toBeInTheDocument();
  });

  it('muestra el encabezado y botón para expandir cuando hay logs', () => {
    render(<AuditLogViewer visitId={mockVisitId} logs={mockLogs} />);
    expect(screen.getByText(/Historial de Actividad Clínica/)).toBeInTheDocument();
    expect(screen.getByText('Mostrar historial')).toBeInTheDocument();
  });

  it('muestra la tabla de logs al hacer clic en el botón expandir', () => {
    render(<AuditLogViewer visitId={mockVisitId} logs={mockLogs} />);

    // Tablas inicialmente ocultas
    expect(screen.queryByText('Fecha y Hora')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Mostrar historial'));

    expect(screen.getByText('Fecha y Hora')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Detalles')).toBeInTheDocument();
  });

  it('filtra los logs que no corresponden a la visita actual', () => {
    render(<AuditLogViewer visitId={mockVisitId} logs={mockLogs} />);
    fireEvent.click(screen.getByText('Mostrar historial'));

    expect(screen.getByText(/Contenido original para pruebas/)).toBeInTheDocument();
    expect(screen.getByText(/Otro contenido original/)).toBeInTheDocument();
    expect(screen.queryByText(/Contenido que no debería aparecer/)).not.toBeInTheDocument();
    expect(screen.getByText('Total de registros: 2')).toBeInTheDocument();
  });

  it('muestra los tipos de bloques con nombres amigables', () => {
    render(<AuditLogViewer visitId={mockVisitId} logs={mockLogs} />);
    fireEvent.click(screen.getByText('Mostrar historial'));

    expect(screen.getByText(/Memoria Contextual/)).toBeInTheDocument();
    expect(screen.getByText(/Memoria Persistente/)).toBeInTheDocument();
  });

  it('colapsa la tabla al hacer clic en Ocultar historial', () => {
    render(<AuditLogViewer visitId={mockVisitId} logs={mockLogs} />);
    fireEvent.click(screen.getByText('Mostrar historial'));
    expect(screen.getByText('Fecha y Hora')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ocultar historial'));
    expect(screen.queryByText('Fecha y Hora')).not.toBeInTheDocument();
  });
});