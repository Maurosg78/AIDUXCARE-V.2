/**
 * Mock para un caso de visita médica con campos críticos faltantes.
 * Este mock contiene datos incompletos para probar el manejo de errores del builder.
 */

import { MCPMemoryBlock } from '../../src/core/mcp/schema';

// Timestamp común para todos los registros
const NOW = new Date().toISOString();

/**
 * Bloques de memoria contextual incompletos (sin visit_id)
 */
export const missingFieldsContextualMemory: MCPMemoryBlock[] = [
  {
    id: 'missing-ctx-001',
    created_at: NOW,
    type: 'contextual',
    content: 'Paciente masculino con dolor abdominal de inicio súbito',
    // visit_id está intencionalmente ausente
    patient_id: 'patient-9876',
    tags: ['dolor', 'abdominal']
  },
  {
    id: 'missing-ctx-002',
    created_at: NOW,
    type: 'contextual',
    content: 'Signos vitales: TA 110/70 mmHg, FC 95 lpm, FR 20 rpm',
    // visit_id está intencionalmente ausente
    patient_id: 'patient-9876'
    // tags intencionalmente ausentes
  }
];

/**
 * Bloques de memoria persistente incompletos (sin patient_id en algunos)
 */
export const missingFieldsPersistentMemory: MCPMemoryBlock[] = [
  {
    id: 'missing-per-001',
    created_at: NOW,
    type: 'persistent',
    content: 'Antecedentes: Apendicectomía a los 15 años',
    // patient_id intencionalmente ausente
    tags: ['antecedentes', 'quirúrgicos']
  },
  {
    id: 'missing-per-002',
    created_at: NOW,
    type: 'persistent',
    content: 'Alergias: No conocidas',
    patient_id: 'patient-9876'
  }
];

/**
 * Bloques de memoria semántica sin issues (para mantener una parte del contexto válida)
 */
export const missingFieldsSemanticMemory: MCPMemoryBlock[] = [
  {
    id: 'missing-sem-001',
    created_at: NOW,
    type: 'semantic',
    content: 'El dolor abdominal agudo puede ser indicativo de patología abdominal que requiere intervención quirúrgica urgente',
    tags: ['conocimiento_médico', 'dolor_abdominal']
  }
];

/**
 * Input con campos críticos faltantes
 */
export const missingFieldsVisitInput = {
  contextualMemory: {
    source: "test-data",
    data: missingFieldsContextualMemory
  },
  persistentMemory: {
    source: "test-data",
    data: missingFieldsPersistentMemory
  },
  semanticMemory: {
    source: "test-data",
    data: missingFieldsSemanticMemory
  }
}; 