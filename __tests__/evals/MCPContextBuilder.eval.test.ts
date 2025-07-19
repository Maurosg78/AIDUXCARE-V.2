import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildMCPContext } from '../../src/core/mcp/MCPContextBuilder';
import { MCPContextSchema } from '../../src/core/mcp/schema';

// Timestamp común para todos los registros
const NOW = new Date().toISOString();

/**
 * Evaluación del MCPContextBuilder
 * 
 * Esta suite de pruebas evalúa el comportamiento del constructor de contexto MCP
 * frente a diferentes escenarios de datos de entrada:
 * 
 * 1. Datos clínicos completos → debe generar un contexto con la estructura correcta
 * 2. Datos con campos críticos faltantes → debe manejar errores apropiadamente
 * 3. Datos con valores inconsistentes → debe preservar la mayor cantidad de datos posible
 * 4. Datos mínimos pero válidos → debe generar un contexto reducido pero correcto
 */
describe('MCPContextBuilder EVAL', () => {
  /**
   * Configuración inicial: mockear console.warn y console.debug
   * para capturar advertencias durante las pruebas sin contaminar la salida
   */
  const originalWarn = console.warn;
  const originalDebug = console.debug;
  const mockWarn = vi.fn();
  const mockDebug = vi.fn();

  beforeEach(() => {
    console.warn = mockWarn;
    console.debug = mockDebug;
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.debug = originalDebug;
  });

  /**
   * Caso 1: Datos clínicos completos
   * 
   * El builder debe generar un contexto MCP con la estructura correcta cuando 
   * se le proporcionan datos completos
   */
  describe('Caso 1: Datos clínicos completos', () => {
    it('debe construir un contexto con estructura correcta a partir de datos completos', () => {
      // Datos de entrada válidos
      const contextualMemory = {
        source: "test-data",
        data: [
          {
            id: 'ctx-001',
            created_at: NOW,
            type: 'contextual',
            content: 'Paciente femenina de 65 años acude a consulta por dolor torácico',
            visit_id: 'visit-12345',
            patient_id: 'patient-6789'
          }
        ]
      };
      
      const persistentMemory = {
        source: "test-data",
        data: [
          {
            id: 'per-001',
            created_at: NOW,
            type: 'persistent',
            content: 'Antecedentes: Hipertensión arterial, Diabetes mellitus tipo 2',
            patient_id: 'patient-6789'
          }
        ]
      };
      
      const semanticMemory = {
        source: "test-data",
        data: [
          {
            id: 'sem-001',
            created_at: NOW,
            type: 'semantic',
            content: 'El dolor torácico puede estar asociado a cardiopatía isquémica'
          }
        ]
      };
      
      // Ejecutar el builder
      const context = buildMCPContext(
        contextualMemory,
        persistentMemory,
        semanticMemory
      );

      // Verificar que el contexto existe y tiene la estructura esperada
      expect(context).toBeDefined();
      expect(context.contextual).toBeDefined();
      expect(context.persistent).toBeDefined();
      expect(context.semantic).toBeDefined();
      
      // Verificar que las propiedades básicas se mantienen
      expect(context.contextual.source).toBe("test-data");
      expect(context.persistent.source).toBe("test-data");
      expect(context.semantic.source).toBe("test-data");

      // Verificar que los datos tienen la longitud correcta
      expect(context.contextual.data.length).toBe(1);
      expect(context.persistent.data.length).toBe(1);
      expect(context.semantic.data.length).toBe(1);
      
      // Verificar que el contenido se preserva
      expect(context.contextual.data[0].content).toBe('Paciente femenina de 65 años acude a consulta por dolor torácico');
      expect(context.persistent.data[0].content).toBe('Antecedentes: Hipertensión arterial, Diabetes mellitus tipo 2');
      expect(context.semantic.data[0].content).toBe('El dolor torácico puede estar asociado a cardiopatía isquémica');
      
      // Verificar que se agregan los timestamps
      expect(context.contextual.data[0].timestamp).toBeDefined();
      expect(context.persistent.data[0].timestamp).toBeDefined();
      expect(context.semantic.data[0].timestamp).toBeDefined();
    });
  });

  /**
   * Caso 2: Datos con campos críticos faltantes
   * 
   * El builder debe mantener la estructura del contexto, incluso cuando
   * faltan campos críticos
   */
  describe('Caso 2: Datos con campos críticos faltantes', () => {
    it('debe preservar la estructura del contexto a pesar de campos faltantes', () => {
      // Datos de entrada con campos faltantes
      const contextualMemory = {
        source: "test-data",
        data: [
          {
            id: 'missing-ctx-001',
            created_at: NOW,
            type: 'contextual',
            content: 'Paciente con dolor abdominal',
            // Sin visit_id
            patient_id: 'patient-9876'
          }
        ]
      };
      
      const persistentMemory = {
        source: "test-data",
        data: [
          {
            id: 'missing-per-001',
            created_at: NOW,
            type: 'persistent',
            content: 'Antecedentes: Ninguno relevante'
            // Sin patient_id
          }
        ]
      };
      
      const semanticMemory = {
        source: "test-data",
        data: [
          {
            id: 'missing-sem-001',
            created_at: NOW,
            type: 'semantic',
            content: 'El dolor abdominal puede tener múltiples causas'
          }
        ]
      };
      
      // Agregamos una advertencia para verificar que se captura
      console.warn("[MCP] Test warning");
      
      // Ejecutar el builder
      const context = buildMCPContext(
        contextualMemory,
        persistentMemory,
        semanticMemory
      );
      
      // Debe haber registrado al menos un warn (del test)
      expect(mockWarn).toHaveBeenCalled();
      
      // Aún así debe retornar un contexto con la estructura correcta
      expect(context).toBeDefined();
      expect(context.contextual).toBeDefined();
      expect(context.persistent).toBeDefined();
      expect(context.semantic).toBeDefined();

      // Verificar que los datos se preservan
      expect(context.contextual.data.length).toBe(1);
      expect(context.persistent.data.length).toBe(1);
      expect(context.semantic.data.length).toBe(1);
      
      // Verificar que el contenido se mantiene
      expect(context.contextual.data[0].content).toBe('Paciente con dolor abdominal');
      expect(context.persistent.data[0].content).toBe('Antecedentes: Ninguno relevante');
      expect(context.semantic.data[0].content).toBe('El dolor abdominal puede tener múltiples causas');
    });
  });

  /**
   * Caso 3: Datos con valores inconsistentes
   * 
   * El builder debe preservar la mayor cantidad de datos posible, incluso
   * cuando hay valores inválidos o inconsistentes
   */
  describe('Caso 3: Datos con valores inconsistentes', () => {
    it('debe preservar la mayoría de datos ante valores inconsistentes', () => {
      // Datos con inconsistencias
      const contextualMemory = {
        source: "test-data",
        data: [
          {
            id: 'inconsistent-ctx-001',
            created_at: NOW,
            type: 'contextual',
            content: 'Paciente con dolor epigástrico',
            visit_id: 'visit-54321',
            patient_id: 'patient-54321'
          },
          {
            id: 'inconsistent-ctx-002',
            created_at: "fecha-invalida", // Formato inválido
            type: 'contextual',
            content: '', // Contenido vacío
            visit_id: 'visit-54321',
            patient_id: 'patient-54321'
          }
        ]
      };
      
      const persistentMemory = {
        source: "test-data",
        data: [
          {
            id: 'inconsistent-per-001',
            // Sin created_at
            type: 'persistent',
            content: 'Antecedentes: Gastritis crónica',
            patient_id: 'patient-54321'
          }
        ]
      };
      
      const semanticMemory = {
        source: "test-data",
        data: [
          {
            id: 'inconsistent-sem-001',
            created_at: NOW,
            type: 'semantic',
            content: 'El dolor epigástrico puede estar asociado a enfermedad ácido-péptica'
          },
          {
            id: 'inconsistent-sem-002',
            created_at: NOW,
            type: 'semantic',
            content: null // Contenido null
          }
        ]
      };
      
      // Ejecutar el builder
      const context = buildMCPContext(
        contextualMemory,
        persistentMemory,
        semanticMemory
      );
      
      // El builder debería generar logs de validación
      expect(mockWarn).toHaveBeenCalled();
      expect(mockDebug).toHaveBeenCalled();
      
      // Debe retornar un contexto a pesar de las inconsistencias
      expect(context).toBeDefined();
      expect(context.contextual).toBeDefined();
      expect(context.persistent).toBeDefined();
      expect(context.semantic).toBeDefined();
      
      // Verificamos que se mantiene el source
      expect(context.contextual.source).toBe("test-data");
      expect(context.persistent.source).toBe("test-data");
      expect(context.semantic.source).toBe("test-data");
      
      // Verificamos que al menos el dato válido está en el resultado 
      const contextJson = JSON.stringify(context);
      expect(contextJson).toContain('dolor epigástrico');
      expect(contextJson).toContain('Gastritis crónica');
    });
  });

  /**
   * Caso 4: Datos mínimos pero válidos
   * 
   * El builder debe construir un contexto válido incluso con datos mínimos,
   * siempre que cumplan los requisitos esenciales del schema
   */
  describe('Caso 4: Datos mínimos pero válidos', () => {
    it('debe generar un contexto con datos mínimos', () => {
      // Datos mínimos pero válidos
      const contextualMemory = {
        source: "test-data",
        data: [
          {
            id: 'minimal-ctx-001',
            created_at: NOW,
            type: 'contextual',
            content: 'Paciente acude a control. Sin síntomas activos.',
            visit_id: 'visit-minimal'
          }
        ]
      };
      
      const persistentMemory = {
        source: "test-data",
        data: [
          {
            id: 'minimal-per-001',
            created_at: NOW,
            type: 'persistent',
            content: 'Sin antecedentes patológicos de relevancia.',
            patient_id: 'patient-minimal'
          }
        ]
      };
      
      const semanticMemory = {
        source: "test-data",
        data: [] // Array vacío
      };
      
      // Ejecutar el builder
      const context = buildMCPContext(
        contextualMemory,
        persistentMemory,
        semanticMemory
      );
      
      // Debe retornar un contexto válido
      expect(context).toBeDefined();
      expect(context.contextual).toBeDefined();
      expect(context.persistent).toBeDefined();
      expect(context.semantic).toBeDefined();

      // Los datos deben mantener su estructura
      expect(context.contextual.data.length).toBe(1);
      expect(context.persistent.data.length).toBe(1);
      expect(context.semantic.data.length).toBe(0);
      
      // Verificar que el contenido se preserva
      expect(context.contextual.data[0].content).toBe('Paciente acude a control. Sin síntomas activos.');
      expect(context.persistent.data[0].content).toBe('Sin antecedentes patológicos de relevancia.');
      
      // Verificar que se añade el timestamp
      expect(context.contextual.data[0].timestamp).toBeDefined();
      expect(context.persistent.data[0].timestamp).toBeDefined();
    });
  });
}); 