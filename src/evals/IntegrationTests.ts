import { AgentSuggestion } from '../core/agent/ClinicalAgent';
import { SuggestionType } from '../core/types/suggestions';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utilidades para generar datos de prueba para integración
 */

/**
 * Crea una sugerencia clínica válida para testing
 * 
 * @param type Tipo de sugerencia ('recommendation', 'warning', 'info')
 * @param content Contenido de la sugerencia
 * @param sourceBlockId ID del bloque de origen
 * @returns Una sugerencia clínica válida para tests
 */
export function createValidSuggestion(
  type: SuggestionType = 'recommendation',
  content = 'Administrar analgésicos según protocolo de dolor.',
  sourceBlockId = 'block-123'
): AgentSuggestion {
  return {
    id: uuidv4(),
    sourceBlockId,
    type,
    content,
    context_origin: {
      source_block: sourceBlockId,
      text: content.substring(0, 15) + '...'
    }
  };
}

/**
 * Crea un conjunto de sugerencias clínicas válidas para testing
 * 
 * @param count Número de sugerencias a crear
 * @returns Array de sugerencias clínicas válidas para tests
 */
export function createMultipleSuggestions(count: number = 5): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];
  
  const contentTemplates = {
    recommendation: [
      'Administrar analgésicos según protocolo de dolor.',
      'Considerar radiografía de tórax para descartar neumonía.',
      'Realizar seguimiento de presión arterial en próxima visita.',
      'Evaluar estado de hidratación y balance hídrico del paciente.',
      'Iniciar tratamiento con antibióticos de amplio espectro.'
    ],
    warning: [
      'Paciente con alergias a medicamentos específicos.',
      'HbA1c elevada, posible descompensación diabética.',
      'Monitorizar signos vitales cada 4 horas por inestabilidad.',
      'Verificar interacciones medicamentosas con anticoagulantes.',
      'Riesgo de caídas elevado, implementar medidas preventivas.'
    ],
    info: [
      'Última visita el 12/03/2023 por dolor abdominal.',
      'Paciente con historial familiar de enfermedad cardiovascular.',
      'Vacunación al día según calendario oficial.',
      'Paciente con historial de diabetes tipo 2 diagnosticada hace 5 años.',
      'Última analítica de control realizada hace 3 meses.'
    ]
  };
  
  const contextOriginTemplates = {
    recommendation: [
      'Motivo de consulta',
      'Exploración física',
      'Revisión de sistemas',
      'Historia médica anterior',
      'Medicación actual'
    ],
    warning: [
      'Exámenes de laboratorio',
      'Hallazgos de imagen',
      'Historial de alergias',
      'Medicación habitual',
      'Factores de riesgo'
    ],
    info: [
      'Historial médico',
      'Antecedentes familiares',
      'Vacunación',
      'Antecedentes personales',
      'Pruebas diagnósticas'
    ]
  };
  
  // Crear una distribución equilibrada de tipos
  for (let i = 0; i < count; i++) {
    const typeIndex = i % 3;
    const type: SuggestionType = ['recommendation', 'warning', 'info'][typeIndex] as SuggestionType;
    
    // Seleccionar contenido según el tipo
    const contentOptions = contentTemplates[type];
    const contentIndex = i % contentOptions.length;
    const content = contentOptions[contentIndex];
    
    // Seleccionar origen según el tipo
    const originOptions = contextOriginTemplates[type];
    const originIndex = i % originOptions.length;
    const originText = originOptions[originIndex];
    
    // Crear sugerencia y añadirla al array
    suggestions.push({
      id: uuidv4(),
      sourceBlockId: `block-${i + 1}`,
      type,
      content,
      context_origin: {
        source_block: originText,
        text: content.substring(0, 15) + '...'
      }
    });
  }
  
  return suggestions;
}

/**
 * Crea una sugerencia clínica inválida para testing
 * 
 * @param invalidType Tipo de invalidez a generar
 * @returns Una sugerencia clínica inválida para tests
 */
export function createInvalidSuggestion(
  invalidType: 'empty_content' | 'short_content' | 'no_context_origin' | 'invalid_type' | 'missing_id' | 'missing_sourceBlockId'
): AgentSuggestion {
  // Primero crear una sugerencia base válida
  const baseSuggestion: AgentSuggestion = createValidSuggestion();
  
  // Modificar según el tipo de invalidez
  switch (invalidType) {
    case 'empty_content':
      return {
        ...baseSuggestion,
        content: ''
      };
      
    case 'short_content':
      return {
        ...baseSuggestion,
        content: 'Corto'
      };
      
    case 'no_context_origin':
      // Usar any para evitar error de tipo al eliminar una propiedad obligatoria
      const suggestionWithoutContext = { ...baseSuggestion } as any;
      delete suggestionWithoutContext.context_origin;
      return suggestionWithoutContext as AgentSuggestion;
      
    case 'invalid_type':
      // Usar any para asignar un tipo inválido
      return {
        ...baseSuggestion,
        type: 'invalid-type' as any
      };
      
    case 'missing_id':
      // Usar any para eliminar el id
      const suggestionWithoutId = { ...baseSuggestion } as any;
      delete suggestionWithoutId.id;
      return suggestionWithoutId as AgentSuggestion;
      
    case 'missing_sourceBlockId':
      // Usar any para eliminar el sourceBlockId
      const suggestionWithoutSourceBlockId = { ...baseSuggestion } as any;
      delete suggestionWithoutSourceBlockId.sourceBlockId;
      return suggestionWithoutSourceBlockId as AgentSuggestion;
      
    default:
      return baseSuggestion;
  }
}

/**
 * Simula el flujo completo de generación, evaluación, y feedback de sugerencias
 * 
 * @param visitId ID de la visita para la generación de sugerencias
 * @param patientId ID del paciente para el contexto
 * @param userId ID del usuario para las métricas
 * @returns Objeto con las sugerencias, evaluaciones y feedbacks generados
 */
export function simulateCompleteClinicalFlow(
  visitId: string = 'visit-test-123',
  patientId: string = 'patient-test-123',
  userId: string = 'user-test-123'
) {
  // 1. Generar conjunto de sugerencias
  const suggestions = createMultipleSuggestions(5);
  
  // 2. Crear algunas sugerencias inválidas para probar evaluación
  const invalidSuggestions = [
    createInvalidSuggestion('empty_content'),
    createInvalidSuggestion('no_context_origin'),
    createInvalidSuggestion('invalid_type')
  ];
  
  // 3. Simular feedbacks para algunas sugerencias válidas
  const feedbacks = [
    {
      id: uuidv4(),
      user_id: userId,
      visit_id: visitId,
      suggestion_id: suggestions[0].id,
      feedback_type: 'useful' as const,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      user_id: userId,
      visit_id: visitId,
      suggestion_id: suggestions[1].id,
      feedback_type: 'incorrect' as const,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      user_id: userId,
      visit_id: visitId,
      suggestion_id: suggestions[2].id,
      feedback_type: 'irrelevant' as const,
      created_at: new Date().toISOString()
    }
  ];
  
  return {
    suggestions,
    invalidSuggestions,
    feedbacks,
    visitId,
    patientId,
    userId
  };
} 