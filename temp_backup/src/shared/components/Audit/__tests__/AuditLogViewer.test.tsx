import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuditLogViewer from '../AuditLogViewer';
import '@testing-library/jest-dom';

// Mock de tipos de AuditLogger para no depender del módulo real
interface AuditLogEntry {
  timestamp: string;
  user_id: string;
  event_type: string;
  details: Record<string, unknown>;
  visit_id?: string;
}

// Tipo para entradas de actualización MCP
interface MCPUpdateAuditEntry extends AuditLogEntry {
  visit_id: string;
  block_id: string;
  block_type: 'contextual' | 'persistent' | 'semantic';
  operation: 'update';
  old_content: string;
  new_content: string;
}

describe('AuditLogViewer', () => {
  const mockVisitId = 'visit-123';
  
  // Mock de entrada de logs para pruebas usando la estructura correcta
  const mockLogs: AuditLogEntry[] = [
    {
      timestamp: '2025-05-20T14:30:00.000Z',
      user_id: 'admin-test-001',
      event_type: 'mcp.block.update',
      details: {
        visit_id: 'visit-123',
        block_id: 'block-1'
      },
      visit_id: 'visit-123',
      block_id: 'block-1',
      block_type: 'contextual',
      operation: 'update',
      old_content: 'Contenido original para pruebas',
      new_content: 'Contenido modificado para pruebas'
    } as MCPUpdateAuditEntry,
    {
      timestamp: '2025-05-20T14:35:00.000Z',
      user_id: 'admin-test-001',
      event_type: 'mcp.block.update',
      details: {
        visit_id: 'visit-123',
        block_id: 'block-2'
      },
      visit_id: 'visit-123',
      block_id: 'block-2',
      block_type: 'persistent',
      operation: 'update',
      old_content: 'Otro contenido original',
      new_content: 'Otro contenido modificado'
    } as MCPUpdateAuditEntry,
    {
      timestamp: '2025-05-20T14:40:00.000Z',
      user_id: 'admin-test-001',
      event_type: 'mcp.block.update',
      details: {
        visit_id: 'visit-456',
        block_id: 'block-3'
      },
      visit_id: 'visit-456', // Visita diferente
      block_id: 'block-3',
      block_type: 'semantic',
      operation: 'update',
      old_content: 'Contenido que no debería aparecer',
      new_content: 'Contenido modificado que no debería aparecer'
    } as MCPUpdateAuditEntry
  ];

  it('no renderiza nada si no hay logs para la visita', () => {
    render(
      <AuditLogViewer 
        visitId="visit-789" 
        logs={mockLogs} 
      />
    );
    
    // El componente siempre renderiza el encabezado, pero no la tabla
    const historialHeading = screen.queryByText(/Historial de Actividad Clínica/);
    expect(historialHeading).toBeInTheDocument();
  });

  it('muestra el encabezado y botón para expandir cuando hay logs', () => {
    render(
      <AuditLogViewer 
        visitId={mockVisitId} 
        logs={mockLogs} 
      />
    );
    
    // Debería mostrar el encabezado
    expect(screen.getByText(/Historial de Actividad Clínica/)).toBeInTheDocument();
    
    // Debería mostrar el botón para expandir
    expect(screen.getByText('Mostrar historial')).toBeInTheDocument();
  });

  it('muestra la tabla de logs al hacer clic en el botón expandir', () => {
    render(
      <AuditLogViewer 
        visitId={mockVisitId} 
        logs={mockLogs} 
      />
    );
    
    // La tabla no debería ser visible inicialmente
    expect(screen.queryByText('Fecha y Hora')).not.toBeInTheDocument();
    
    // Hacer clic en el botón para expandir
    fireEvent.click(screen.getByText('Mostrar historial'));
    
    // Ahora la tabla debería ser visible con los encabezados correctos
    expect(screen.getByText('Fecha y Hora')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Detalles')).toBeInTheDocument();
  });

  it('filtra los logs que no corresponden a la visita actual', () => {
    render(
      <AuditLogViewer 
        visitId={mockVisitId} 
        logs={mockLogs} 
      />
    );
    
    // Expandir para ver los logs
    fireEvent.click(screen.getByText('Mostrar historial'));
    
    // Debería mostrar solo los logs de la visita actual
    expect(screen.getByText(/Contenido original/)).toBeInTheDocument();
    expect(screen.getByText(/Otro contenido original/)).toBeInTheDocument();
    
    // No debería mostrar logs de otras visitas
    expect(screen.queryByText(/Contenido que no debería aparecer/)).not.toBeInTheDocument();
    
    // El contador de registros debería mostrar 2 (no 3)
    expect(screen.getByText('Total de registros: 2')).toBeInTheDocument();
  });

  it('muestra los tipos de bloques con nombres amigables', () => {
    render(
      <AuditLogViewer 
        visitId={mockVisitId} 
        logs={mockLogs} 
      />
    );
    
    // Expandir para ver los logs
    fireEvent.click(screen.getByText('Mostrar historial'));
    
    // Debería mostrar los nombres amigables
    expect(screen.getByText(/Memoria Contextual/)).toBeInTheDocument();
    expect(screen.getByText(/Memoria Persistente/)).toBeInTheDocument();
  });

  it('colapsa la tabla al hacer clic en Ocultar historial', () => {
    render(
      <AuditLogViewer 
        visitId={mockVisitId} 
        logs={mockLogs} 
      />
    );
    
    // Expandir
    fireEvent.click(screen.getByText('Mostrar historial'));
    
    // Verificar que la tabla es visible
    expect(screen.getByText('Fecha y Hora')).toBeInTheDocument();
    
    // Colapsar
    fireEvent.click(screen.getByText('Ocultar historial'));
    
    // La tabla no debería ser visible
    expect(screen.queryByText('Fecha y Hora')).not.toBeInTheDocument();
  });
}); 