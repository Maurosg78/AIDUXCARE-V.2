/**
 * Mock para un caso de visita médica con datos mínimos pero válidos.
 * Este mock contiene solo la información esencial requerida por el esquema.
 */

import { MCPMemoryBlock } from '../../src/core/mcp/schema';

// Timestamp común para todos los registros
const NOW = new Date().toISOString();

/**
 * Bloques de memoria contextual mínimos
 */
export const minimalContextualMemory: MCPMemoryBlock[] = [
  {
    id: 'minimal-ctx-001',
    created_at: NOW,
    type: 'contextual',
    content: 'Paciente acude a control de rutina. Sin síntomas activos.',
    visit_id: 'visit-minimal'
    // Sin patient_id, tags ni metadata
  }
];

/**
 * Bloques de memoria persistente mínimos
 */
export const minimalPersistentMemory: MCPMemoryBlock[] = [
  {
    id: 'minimal-per-001',
    created_at: NOW,
    type: 'persistent',
    content: 'Sin antecedentes patológicos de relevancia.',
    patient_id: 'patient-minimal'
    // Sin tags ni metadata
  }
];

/**
 * Bloques de memoria semántica mínimos - array vacío para probar el caso límite
 */
export const minimalSemanticMemory: MCPMemoryBlock[] = [];

/**
 * Input con datos mínimos válidos para el builder
 */
export const minimalVisitInput = {
  contextualMemory: {
    source: "test-data",
    data: minimalContextualMemory
  },
  persistentMemory: {
    source: "test-data",
    data: minimalPersistentMemory
  },
  semanticMemory: {
    source: "test-data",
    data: minimalSemanticMemory
  }
}; 