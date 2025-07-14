/**
 * Mock para un caso de visita médica con datos inconsistentes.
 * Este mock contiene datos con tipos incorrectos, formatos inválidos y otras inconsistencias
 * para probar la capacidad de limpieza y validación del builder.
 */

// Timestamp común para todos los registros
const NOW = new Date().toISOString();
// Timestamp con formato inválido
const INVALID_DATE = "2023-13-32T25:65:99Z";

/**
 * Bloques de memoria contextual con inconsistencias
 */
export const inconsistentContextualMemory = [
  {
    id: 'inconsistent-ctx-001',
    created_at: NOW,
    type: 'contextual', // tipo válido
    content: 'Paciente con dolor epigástrico y náuseas de 24 horas de evolución',
    visit_id: 'visit-54321',
    patient_id: 'patient-54321',
    tags: 'dolor,epigastrio,náuseas', // debería ser un array, no un string
    metadata: {
      priority: 123 // debería ser un string, no un número
    }
  },
  {
    id: 'inconsistent-ctx-002',
    created_at: INVALID_DATE, // fecha inválida
    type: 'contextual',
    content: '', // contenido vacío, inválido
    visit_id: 'visit-54321',
    patient_id: 'patient-54321'
  },
  {
    id: 123, // debería ser un string, no un número
    created_at: NOW,
    type: 'otro_tipo', // tipo inválido, no está en el enum
    content: 'Pruebas de laboratorio: Leucocitosis 12,500, PCR 15 mg/dL',
    visit_id: 'visit-54321',
    patient_id: 'patient-54321'
  }
];

/**
 * Bloques de memoria persistente con inconsistencias
 */
export const inconsistentPersistentMemory = [
  {
    id: 'inconsistent-per-001',
    // created_at faltante, pero se puede inferir de timestamp
    timestamp: NOW,
    type: 'persistent',
    content: 'Antecedentes: Gastritis crónica diagnosticada hace 2 años',
    patient_id: 'patient-54321',
    tags: ['antecedentes', 'gastritis']
  },
  {
    // Este objeto está completamente mal formado
    identifier: 'inconsistent-per-002', // debería ser 'id', no 'identifier'
    date: NOW, // debería ser 'created_at', no 'date'
    category: 'persistent', // debería ser 'type', no 'category'
    info: 'Alergias: Sulfas', // debería ser 'content', no 'info'
    pat_id: 'patient-54321' // debería ser 'patient_id', no 'pat_id'
  }
];

/**
 * Bloques de memoria semántica con inconsistencias
 */
export const inconsistentSemanticMemory = [
  {
    id: 'inconsistent-sem-001',
    created_at: NOW,
    type: 'semantic',
    content: 'El dolor epigástrico puede estar asociado a enfermedad ácido-péptica, pancreatitis o patología biliar',
    tags: [] // array vacío, pero válido
  },
  {
    id: 'inconsistent-sem-002',
    created_at: NOW,
    type: 'semantic',
    content: null, // contenido null, inválido
    tags: ['conocimiento_médico', 'dolor_epigástrico']
  }
];

/**
 * Input con datos inconsistentes para el builder
 */
export const inconsistentVisitInput = {
  contextualMemory: {
    source: "test-data",
    data: inconsistentContextualMemory
  },
  persistentMemory: {
    source: "test-data",
    data: inconsistentPersistentMemory
  },
  semanticMemory: {
    source: "test-data",
    data: inconsistentSemanticMemory
  }
}; 