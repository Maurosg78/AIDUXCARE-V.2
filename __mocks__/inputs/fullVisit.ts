/**
 * Mock para un caso completo de visita médica con todos los campos requeridos.
 * Este mock cumple con todos los requisitos del esquema de validación.
 */

import { MCPMemoryBlock } from '../../src/core/mcp/schema';

// Timestamp común para todos los registros
const NOW = new Date().toISOString();

/**
 * Bloques de memoria contextual completos
 */
export const fullContextualMemory: MCPMemoryBlock[] = [
  {
    id: 'ctx-001',
    created_at: NOW,
    type: 'contextual',
    content: 'Paciente femenina de 65 años acude a consulta por dolor torácico de 2 días de evolución',
    visit_id: 'visit-12345',
    patient_id: 'patient-6789',
    tags: ['dolor', 'torácico', 'consulta'],
    metadata: {
      source: 'nota_clinica',
      priority: 'alta'
    }
  },
  {
    id: 'ctx-002',
    created_at: NOW,
    type: 'contextual',
    content: 'Signos vitales: TA 140/90 mmHg, FC 88 lpm, FR 18 rpm, Temperatura 36.7°C, SatO2 94%',
    visit_id: 'visit-12345',
    patient_id: 'patient-6789',
    tags: ['signos_vitales', 'hipertensión'],
    metadata: {
      source: 'vitales',
      priority: 'media'
    }
  },
  {
    id: 'ctx-003',
    created_at: NOW,
    type: 'contextual',
    content: 'ECG: Ritmo sinusal con alteraciones inespecíficas de la repolarización en cara inferior',
    visit_id: 'visit-12345',
    patient_id: 'patient-6789',
    tags: ['ecg', 'electrocardiograma'],
    metadata: {
      source: 'estudios_diagnóstico',
      priority: 'alta'
    }
  }
];

/**
 * Bloques de memoria persistente completos
 */
export const fullPersistentMemory: MCPMemoryBlock[] = [
  {
    id: 'per-001',
    created_at: NOW,
    type: 'persistent',
    content: 'Antecedentes: Hipertensión arterial diagnosticada hace 10 años, Diabetes mellitus tipo 2',
    patient_id: 'patient-6789',
    tags: ['antecedentes', 'hipertensión', 'diabetes'],
    metadata: {
      source: 'historia_clínica',
      priority: 'alta'
    }
  },
  {
    id: 'per-002',
    created_at: NOW,
    type: 'persistent',
    content: 'Medicación habitual: Enalapril 10mg c/12h, Metformina 850mg c/8h',
    patient_id: 'patient-6789',
    tags: ['medicación', 'tratamiento'],
    metadata: {
      source: 'historia_clínica',
      priority: 'alta'
    }
  },
  {
    id: 'per-003',
    created_at: NOW,
    type: 'persistent',
    content: 'Alergias: Penicilina (rash cutáneo generalizado)',
    patient_id: 'patient-6789',
    tags: ['alergias'],
    metadata: {
      source: 'historia_clínica',
      priority: 'crítica'
    }
  }
];

/**
 * Bloques de memoria semántica completos
 */
export const fullSemanticMemory: MCPMemoryBlock[] = [
  {
    id: 'sem-001',
    created_at: NOW,
    type: 'semantic',
    content: 'El dolor torácico de origen cardíaco suele ser opresivo y puede irradiarse a cuello, mandíbula o brazo izquierdo',
    tags: ['conocimiento_médico', 'dolor_torácico'],
    metadata: {
      source: 'literatura_médica',
      confidence: 0.95
    }
  },
  {
    id: 'sem-002',
    created_at: NOW,
    type: 'semantic',
    content: 'La hipertensión arterial no controlada es un factor de riesgo para enfermedad cardiovascular',
    tags: ['conocimiento_médico', 'hipertensión', 'riesgo_cardiovascular'],
    metadata: {
      source: 'literatura_médica',
      confidence: 0.98
    }
  }
];

/**
 * Input completo con todos los campos requeridos para el builder
 */
export const fullVisitInput = {
  contextualMemory: {
    source: "test-data",
    data: fullContextualMemory
  },
  persistentMemory: {
    source: "test-data",
    data: fullPersistentMemory
  },
  semanticMemory: {
    source: "test-data",
    data: fullSemanticMemory
  }
}; 