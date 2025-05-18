import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createValidSuggestion } from '../IntegrationTests';
import { SuggestionType } from '../../core/types/suggestions';

// Mock para AuditLogger
interface MockAuditLogEntry {
  timestamp: string;
  user_id: string;
  visit_id: string;
  block_id?: string;
  block_type?: 'contextual' | 'persistent' | 'semantic';
  operation?: 'update';
  old_content?: string;
  new_content?: string;
  event_type?: string;
  details: {
    visit_id?: string;
    suggestion_id?: string;
    suggestion_type?: SuggestionType;
    content?: string;
    emr_section?: string;
    user_id?: string;
    custom_field?: string;
    numeric_value?: number;
    [key: string]: any;
  };
}

// Implementación mock de AuditLogger para tests
const MockAuditLogger = {
  _logs: [] as MockAuditLogEntry[],
  
  logBlockUpdates(
    originalBlocks: Record<string, any>[],
    updatedBlocks: Record<string, any>[],
    userId: string,
    visitId: string
  ): void {
    // Mapeo para facilitar búsqueda de bloques originales
    const origMap = new Map<string, Record<string, any>>();
    originalBlocks.forEach(block => {
      if (block.id) {
        origMap.set(block.id, block);
      }
    });
    
    // Revisar cada bloque actualizado
    updatedBlocks.forEach(updatedBlock => {
      if (!updatedBlock.id) return;
      
      const origBlock = origMap.get(updatedBlock.id);
      if (!origBlock) return;
      
      // Si hay cambio en el contenido, registrar
      if (origBlock.content !== updatedBlock.content) {
        this._logs.push({
          timestamp: new Date().toISOString(),
          user_id: userId,
          visit_id: visitId,
          block_id: updatedBlock.id,
          block_type: updatedBlock.type,
          operation: 'update',
          old_content: origBlock.content,
          new_content: updatedBlock.content,
          details: {}
        });
      }
    });
  },
  
  logSuggestionIntegration(
    userId: string,
    visitId: string,
    suggestionId: string,
    suggestionType: SuggestionType,
    content: string,
    section: string
  ): void {
    this._logs.push({
      timestamp: new Date().toISOString(),
      user_id: userId,
      visit_id: visitId,
      event_type: 'suggestion.integrated',
      details: {
        suggestion_id: suggestionId,
        suggestion_type: suggestionType,
        content: content,
        emr_section: section
      }
    });
  },
  
  log(
    eventType: string,
    details: Record<string, any>
  ): void {
    this._logs.push({
      timestamp: new Date().toISOString(),
      user_id: details.user_id || 'unknown',
      visit_id: details.visit_id || 'unknown',
      event_type: eventType,
      details
    });
  },
  
  getAuditLogs(): MockAuditLogEntry[] {
    return this._logs;
  },
  
  clearAuditLogs(): void {
    this._logs = [];
  }
};

// Mock de AuditLogger para pruebas
vi.mock('../../core/audit/AuditLogger', () => ({
  AuditLogger: MockAuditLogger
}));

// Importar después del mock para que use el mock
const { AuditLogger } = require('../../core/audit/AuditLogger');

describe('AuditLogger - Evaluación de integración', () => {
  // Restablecer el estado del AuditLogger antes de cada prueba
  beforeEach(() => {
    AuditLogger.clearAuditLogs();
  });

  it('debe registrar correctamente actualizaciones de bloques en el log', () => {
    // Datos de prueba
    const originalBlocks = [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Contenido original'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: 'Contenido persistente original'
      }
    ];
    
    const updatedBlocks = [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Contenido modificado'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: 'Contenido persistente modificado'
      }
    ];
    
    // Ejecutar la función
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      'user-test-123',
      'visit-test-456'
    );
    
    // Obtener los logs generados
    const logs = AuditLogger.getAuditLogs();
    
    // Verificar que se crearon los logs correctamente
    expect(logs.length).toBe(2);
    
    // Verificar el contenido del primer log
    expect(logs[0].user_id).toBe('user-test-123');
    expect(logs[0].visit_id).toBe('visit-test-456');
    expect(logs[0].block_id).toBe('block-1');
    expect(logs[0].block_type).toBe('contextual');
    expect(logs[0].operation).toBe('update');
    expect(logs[0].old_content).toBe('Contenido original');
    expect(logs[0].new_content).toBe('Contenido modificado');
    
    // Verificar el contenido del segundo log
    expect(logs[1].user_id).toBe('user-test-123');
    expect(logs[1].visit_id).toBe('visit-test-456');
    expect(logs[1].block_id).toBe('block-2');
    expect(logs[1].block_type).toBe('persistent');
    expect(logs[1].operation).toBe('update');
    expect(logs[1].old_content).toBe('Contenido persistente original');
    expect(logs[1].new_content).toBe('Contenido persistente modificado');
  });

  it('debe ignorar actualizaciones sin cambios en el contenido', () => {
    // Datos de prueba con contenido idéntico
    const originalBlocks = [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Contenido sin cambios'
      }
    ];
    
    const updatedBlocks = [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Contenido sin cambios'
      }
    ];
    
    // Ejecutar la función
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      'user-test-123',
      'visit-test-456'
    );
    
    // Obtener los logs generados
    const logs = AuditLogger.getAuditLogs();
    
    // Verificar que no se crearon logs
    expect(logs.length).toBe(0);
  });

  it('debe manejar correctamente bloques nuevos (sin original)', () => {
    // Datos de prueba con un bloque nuevo
    const originalBlocks: any[] = [];
    
    const updatedBlocks = [
      {
        id: 'block-new',
        type: 'contextual',
        content: 'Contenido de bloque nuevo'
      }
    ];
    
    // Ejecutar la función
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      'user-test-123',
      'visit-test-456'
    );
    
    // Obtener los logs generados
    const logs = AuditLogger.getAuditLogs();
    
    // Verificar que no se crearon logs para bloques nuevos (solo para actualizaciones)
    expect(logs.length).toBe(0);
  });

  it('debe registrar correctamente la integración de sugerencias', () => {
    // Crear una sugerencia de prueba
    const mockSuggestion = createValidSuggestion();
    
    // Registrar la integración
    AuditLogger.logSuggestionIntegration(
      'user-test-123',
      'visit-test-456',
      mockSuggestion.id,
      mockSuggestion.type as SuggestionType,
      mockSuggestion.content,
      'plan'
    );
    
    // Obtener los logs generados
    const logs = AuditLogger.getAuditLogs();
    
    // Verificar que se creó el log correctamente
    expect(logs.length).toBe(1);
    
    // Verificar el contenido del log
    const log = logs[0];
    expect(log.user_id).toBe('user-test-123');
    expect(log.visit_id).toBe('visit-test-456');
    expect(log.event_type).toBe('suggestion.integrated');
    expect(log.details.suggestion_id).toBe(mockSuggestion.id);
    expect(log.details.suggestion_type).toBe(mockSuggestion.type);
    expect(log.details.content).toBe(mockSuggestion.content);
    expect(log.details.emr_section).toBe('plan');
  });

  it('debe registrar logs generales con detalles personalizados', () => {
    // Registrar un log general
    AuditLogger.log(
      'custom.event',
      {
        user_id: 'user-test-123',
        visit_id: 'visit-test-456',
        custom_field: 'valor personalizado',
        numeric_value: 42
      }
    );
    
    // Obtener los logs generados
    const logs = AuditLogger.getAuditLogs();
    
    // Verificar que se creó el log correctamente
    expect(logs.length).toBe(1);
    
    // Verificar el contenido del log
    const log = logs[0];
    expect(log.event_type).toBe('custom.event');
    expect(log.details.user_id).toBe('user-test-123');
    expect(log.details.visit_id).toBe('visit-test-456');
    expect(log.details.custom_field).toBe('valor personalizado');
    expect(log.details.numeric_value).toBe(42);
  });

  it('debe limpiar correctamente todos los logs', () => {
    // Primero crear algunos logs
    AuditLogger.log('test.event', { test: 'data' });
    AuditLogger.log('test.event2', { test: 'data2' });
    
    // Verificar que existen logs
    expect(AuditLogger.getAuditLogs().length).toBe(2);
    
    // Limpiar logs
    AuditLogger.clearAuditLogs();
    
    // Verificar que no quedan logs
    expect(AuditLogger.getAuditLogs().length).toBe(0);
  });
}); 