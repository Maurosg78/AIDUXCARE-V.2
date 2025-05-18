import { SemanticMemoryBlock, SemanticMemoryService } from './SemanticMemoryService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Inicializa datos de muestra para la memoria semántica
 */
export async function initializeSemanticMemoryData(): Promise<void> {
  console.log('Inicializando datos de ejemplo para la memoria semántica...');
  
  const service = new SemanticMemoryService();
  
  // Limpiar datos existentes (solo para desarrollo)
  SemanticMemoryService._resetSemanticBlocksArray();
  
  // Crear bloques semánticos de muestra
  const sampleBlocks: SemanticMemoryBlock[] = [
    {
      id: uuidv4(),
      visit_id: 'visit-001',
      patient_id: 'patient-001',
      user_id: 'professional-001',
      concept: 'El paciente presenta antecedentes de hipertensión arterial con mal control',
      category: 'Diagnóstico',
      importance: 'high',
      relevance_score: 0.92,
      source_text: 'Paciente con hipertensión arterial desde hace 5 años, en tratamiento con Enalapril 10mg c/12h, con mal control en últimos 3 meses.',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-002',
      patient_id: 'patient-001',
      user_id: 'professional-001',
      concept: 'Paciente con diabetes mellitus tipo 2 con adecuado control metabólico',
      category: 'Diagnóstico',
      importance: 'medium',
      relevance_score: 0.78,
      source_text: 'DM2 diagnosticada hace 3 años, en tratamiento con Metformina 850mg c/12h. Última HbA1c: 6.8%.',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-003',
      patient_id: 'patient-001',
      user_id: 'professional-002',
      concept: 'Alergia a penicilina documentada',
      category: 'Alerta',
      importance: 'high',
      relevance_score: 0.95,
      source_text: 'Paciente refiere reacción anafiláctica a penicilina en la infancia.',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-003',
      patient_id: 'patient-001',
      user_id: 'professional-002',
      concept: 'Riesgo cardiovascular elevado según score Framingham',
      category: 'Riesgo',
      importance: 'medium',
      relevance_score: 0.85,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-004',
      patient_id: 'patient-001',
      user_id: 'professional-001',
      concept: 'Adherencia parcial al tratamiento farmacológico',
      category: 'Observación',
      importance: 'medium',
      relevance_score: 0.75,
      source_text: 'Paciente refiere olvidar ocasionalmente la toma de medicamentos por las noches.',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-005',
      patient_id: 'patient-001',
      user_id: 'professional-003',
      concept: 'Paciente ha perdido 3kg en el último mes sin causa clara',
      category: 'Observación',
      importance: 'low',
      relevance_score: 0.65,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-006',
      patient_id: 'patient-001',
      user_id: 'professional-001',
      concept: 'Antecedente de melanoma en familiar de primer grado',
      category: 'Riesgo',
      importance: 'low',
      relevance_score: 0.55,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-006',
      patient_id: 'patient-001',
      user_id: 'professional-001',
      concept: 'Última mamografía hace 3 años (recomendado anual)',
      category: 'Alerta',
      importance: 'medium',
      relevance_score: 0.82,
      created_at: new Date().toISOString()
    }
  ];
  
  // Guardar cada bloque en el servicio
  for (const block of sampleBlocks) {
    await service.saveSemanticBlock(block);
  }
  
  console.log(`${sampleBlocks.length} bloques semánticos de muestra inicializados correctamente.`);
} 