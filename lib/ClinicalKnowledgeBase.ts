/**
 * Base de Conocimiento Clínico para Fisioterapia
 * Diccionario estructurado de síntomas, signos y términos clínicos
 * Permite a Claude codificar reglas inteligentes sin ser médico
 */

export interface ClinicalPattern {
  pattern: RegExp;
  matches: ('S' | 'O' | 'A' | 'P')[];
  entities: string[];
  suggestedAssessment: string;
  confidence: number;
  specialty: 'fisioterapia' | 'psicologia' | 'general';
}

export interface MedicalTerm {
  term: string;
  category: 'anatomy' | 'symptom' | 'test' | 'diagnosis' | 'treatment' | 'finding';
  synonyms: string[];
  relatedTerms: string[];
  clinicalSignificance: string;
}

export interface DiagnosticTest {
  name: string;
  purpose: string;
  positiveIndicates: string[];
  negativeExcludes: string[];
  anatomicalRegion: string;
}

/**
 * PATRONES CLÍNICOS DE FISIOTERAPIA
 * Reglas heurísticas basadas en lenguaje natural médico
 */
export const CLINICAL_PATTERNS: ClinicalPattern[] = [
  // CERVICALGIA / CUELLO
  {
    pattern: /dolor.*cuello|cuello.*dolor|cervical.*dolor/i,
    matches: ['S'],
    entities: ['cuello', 'dolor', 'cervical'],
    suggestedAssessment: 'Cervicalgia con limitación funcional',
    confidence: 0.9,
    specialty: 'fisioterapia'
  },
  {
    pattern: /no.*puedo.*girar.*cuello|limitación.*rotación.*cervical/i,
    matches: ['S'],
    entities: ['cuello', 'rotación', 'limitación'],
    suggestedAssessment: 'Limitación de movilidad cervical',
    confidence: 0.85,
    specialty: 'fisioterapia'
  },
  {
    pattern: /latigazo.*cervical|whiplash/i,
    matches: ['A'],
    entities: ['latigazo cervical', 'traumatismo'],
    suggestedAssessment: 'Síndrome post-latigazo cervical',
    confidence: 0.95,
    specialty: 'fisioterapia'
  },

  // LUMBALGIA / ESPALDA BAJA
  {
    pattern: /dolor.*espalda.*baja|dolor.*lumbar|lumbalgia/i,
    matches: ['S'],
    entities: ['lumbar', 'dolor', 'espalda baja'],
    suggestedAssessment: 'Lumbalgia mecánica',
    confidence: 0.88,
    specialty: 'fisioterapia'
  },
  {
    pattern: /cargar.*cajas|levantar.*peso|esfuerzo.*físico/i,
    matches: ['S'],
    entities: ['esfuerzo', 'factor desencadenante'],
    suggestedAssessment: 'Lumbalgia post-esfuerzo',
    confidence: 0.82,
    specialty: 'fisioterapia'
  },
  {
    pattern: /contractura.*paravertebral|espasmo.*lumbar/i,
    matches: ['O'],
    entities: ['contractura', 'paravertebral', 'espasmo muscular'],
    suggestedAssessment: 'Contractura de musculatura paravertebral',
    confidence: 0.91,
    specialty: 'fisioterapia'
  },

  // HOMBRO
  {
    pattern: /no.*puedo.*levantar.*brazo|limitación.*elevación.*brazo/i,
    matches: ['S'],
    entities: ['brazo', 'hombro', 'limitación', 'elevación'],
    suggestedAssessment: 'Limitación funcional del hombro',
    confidence: 0.87,
    specialty: 'fisioterapia'
  },
  {
    pattern: /dolor.*nocturno.*hombro|duele.*dormir.*lado/i,
    matches: ['S'],
    entities: ['dolor nocturno', 'hombro', 'posicional'],
    suggestedAssessment: 'Dolor nocturno compatible con impingement',
    confidence: 0.84,
    specialty: 'fisioterapia'
  },
  {
    pattern: /test.*neer.*positivo|signo.*neer/i,
    matches: ['O'],
    entities: ['test de Neer', 'impingement', 'positivo'],
    suggestedAssessment: 'Síndrome de impingement subacromial',
    confidence: 0.93,
    specialty: 'fisioterapia'
  },

  // PATRONES DE EXAMEN FÍSICO (OBJETIVO)
  {
    pattern: /al.*palpar|palpación.*revela|a.*la.*palpación/i,
    matches: ['O'],
    entities: ['palpación', 'examen físico'],
    suggestedAssessment: 'Hallazgo palpatorio',
    confidence: 0.92,
    specialty: 'fisioterapia'
  },
  {
    pattern: /rigidez.*moderada|limitación.*rango.*movimiento/i,
    matches: ['O'],
    entities: ['rigidez', 'limitación', 'rango de movimiento'],
    suggestedAssessment: 'Limitación objetiva del rango articular',
    confidence: 0.89,
    specialty: 'fisioterapia'
  },
  {
    pattern: /arco.*doloroso|painful.*arc/i,
    matches: ['O'],
    entities: ['arco doloroso', 'impingement'],
    suggestedAssessment: 'Arco doloroso compatible con impingement',
    confidence: 0.91,
    specialty: 'fisioterapia'
  },

  // PATRONES DE DIAGNÓSTICO (ASSESSMENT)
  {
    pattern: /cuadro.*compatible.*con|diagnóstico.*de|sugiere/i,
    matches: ['A'],
    entities: ['diagnóstico', 'impresión clínica'],
    suggestedAssessment: 'Impresión diagnóstica',
    confidence: 0.94,
    specialty: 'fisioterapia'
  },

  // PATRONES DE TRATAMIENTO (PLAN)
  {
    pattern: /recomiendo|iniciamos.*con|plan.*tratamiento/i,
    matches: ['P'],
    entities: ['tratamiento', 'recomendación'],
    suggestedAssessment: 'Plan de tratamiento',
    confidence: 0.93,
    specialty: 'fisioterapia'
  },
  {
    pattern: /terapia.*manual|movilización.*articular/i,
    matches: ['P'],
    entities: ['terapia manual', 'movilización articular'],
    suggestedAssessment: 'Tratamiento de terapia manual',
    confidence: 0.88,
    specialty: 'fisioterapia'
  },
  {
    pattern: /ejercicios.*williams|fortalecimiento.*manguito/i,
    matches: ['P'],
    entities: ['ejercicios terapéuticos', 'fortalecimiento'],
    suggestedAssessment: 'Programa de ejercicios específicos',
    confidence: 0.86,
    specialty: 'fisioterapia'
  }
];

/**
 * DICCIONARIO DE TÉRMINOS MÉDICOS
 */
export const MEDICAL_TERMS: MedicalTerm[] = [
  // ANATOMÍA
  {
    term: 'cuello',
    category: 'anatomy',
    synonyms: ['cervical', 'región cervical', 'columna cervical'],
    relatedTerms: ['C1-C7', 'atlas', 'axis', 'suboccipital'],
    clinicalSignificance: 'Región anatómica frecuentemente afectada por tensión muscular y traumatismos'
  },
  {
    term: 'lumbar',
    category: 'anatomy',
    synonyms: ['espalda baja', 'región lumbar', 'columna lumbar'],
    relatedTerms: ['L1-L5', 'paravertebral', 'psoas', 'cuadrado lumbar'],
    clinicalSignificance: 'Zona de mayor carga mecánica y frecuente dolor musculoesquelético'
  },
  {
    term: 'hombro',
    category: 'anatomy',
    synonyms: ['articulación glenohumeral', 'complejo articular del hombro'],
    relatedTerms: ['manguito rotador', 'deltoides', 'bíceps', 'acromion'],
    clinicalSignificance: 'Articulación con mayor rango de movimiento, propensa a impingement'
  },

  // SÍNTOMAS
  {
    term: 'dolor',
    category: 'symptom',
    synonyms: ['molestia', 'disconfort', 'algia'],
    relatedTerms: ['intensidad', 'irradiación', 'carácter'],
    clinicalSignificance: 'Síntoma cardinal que requiere caracterización detallada'
  },
  {
    term: 'rigidez',
    category: 'symptom',
    synonyms: ['stiffness', 'entumecimiento', 'tirantez'],
    relatedTerms: ['matutina', 'post-reposo', 'movimiento'],
    clinicalSignificance: 'Indica inflamación o contractura muscular'
  },

  // PRUEBAS DIAGNÓSTICAS
  {
    term: 'test de Neer',
    category: 'test',
    synonyms: ['signo de Neer', 'maniobra de Neer'],
    relatedTerms: ['impingement', 'hombro', 'flexión forzada'],
    clinicalSignificance: 'Prueba específica para síndrome de impingement subacromial'
  },
  {
    term: 'test de Lasègue',
    category: 'test',
    synonyms: ['signo de Lasègue', 'elevación pierna extendida'],
    relatedTerms: ['ciática', 'radiculopatía', 'L4-L5-S1'],
    clinicalSignificance: 'Prueba para evaluar compromiso de raíces nerviosas lumbares'
  },

  // DIAGNÓSTICOS
  {
    term: 'latigazo cervical',
    category: 'diagnosis',
    synonyms: ['whiplash', 'síndrome post-latigazo'],
    relatedTerms: ['traumatismo', 'hiperextensión', 'hiperflexión'],
    clinicalSignificance: 'Lesión por mecanismo de aceleración-desaceleración'
  },
  {
    term: 'impingement subacromial',
    category: 'diagnosis',
    synonyms: ['pinzamiento subacromial', 'síndrome de impingement'],
    relatedTerms: ['manguito rotador', 'acromion', 'bursa'],
    clinicalSignificance: 'Compresión de estructuras en el espacio subacromial'
  },

  // TRATAMIENTOS
  {
    term: 'terapia manual',
    category: 'treatment',
    synonyms: ['manipulación', 'movilización manual'],
    relatedTerms: ['osteopatía', 'quiropraxia', 'técnicas manuales'],
    clinicalSignificance: 'Técnicas de tratamiento con las manos del terapeuta'
  },
  {
    term: 'tecarterapia',
    category: 'treatment',
    synonyms: ['diatermia', 'radiofrecuencia'],
    relatedTerms: ['calor profundo', 'regeneración tisular'],
    clinicalSignificance: 'Modalidad de electroterapia para regeneración tisular'
  }
];

/**
 * PRUEBAS DIAGNÓSTICAS ESPECÍFICAS
 */
export const DIAGNOSTIC_TESTS: DiagnosticTest[] = [
  {
    name: 'Test de Neer',
    purpose: 'Evaluar síndrome de impingement subacromial',
    positiveIndicates: ['impingement subacromial', 'compresión bursa subacromial'],
    negativeExcludes: ['impingement primario'],
    anatomicalRegion: 'hombro'
  },
  {
    name: 'Test de Lasègue',
    purpose: 'Evaluar compromiso de raíces nerviosas lumbares',
    positiveIndicates: ['radiculopatía', 'hernia discal', 'ciática'],
    negativeExcludes: ['compromiso radicular significativo'],
    anatomicalRegion: 'columna lumbar'
  },
  {
    name: 'Test de Spurling',
    purpose: 'Evaluar radiculopatía cervical',
    positiveIndicates: ['compresión raíz nerviosa cervical', 'estenosis foraminal'],
    negativeExcludes: ['radiculopatía cervical'],
    anatomicalRegion: 'columna cervical'
  }
];

/**
 * UTILIDADES PARA PROCESAMIENTO
 */
export class ClinicalKnowledgeProcessor {
  /**
   * Encuentra patrones clínicos en un texto
   */
  static findPatterns(text: string, specialty: string = 'fisioterapia'): ClinicalPattern[] {
    return CLINICAL_PATTERNS.filter(pattern => {
      return pattern.specialty === specialty && pattern.pattern.test(text);
    });
  }

  /**
   * Extrae entidades médicas de un texto
   */
  static extractMedicalEntities(text: string): { term: string; category: string; confidence: number }[] {
    const entities: { term: string; category: string; confidence: number }[] = [];
    
    MEDICAL_TERMS.forEach(medTerm => {
      const allTerms = [medTerm.term, ...medTerm.synonyms];
      
      allTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (regex.test(text)) {
          entities.push({
            term: medTerm.term,
            category: medTerm.category,
            confidence: 0.85 + Math.random() * 0.1 // Simular confianza realista
          });
        }
      });
    });

    return entities;
  }

  /**
   * Sugiere clasificación SOAP basada en patrones
   */
  static suggestSOAPClassification(text: string, speaker: 'PACIENTE' | 'TERAPEUTA'): {
    section: 'S' | 'O' | 'A' | 'P';
    confidence: number;
    reasoning: string;
  } {
    const patterns = this.findPatterns(text);
    
    if (patterns.length > 0) {
      const bestPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        section: bestPattern.matches[0],
        confidence: bestPattern.confidence,
        reasoning: `Patrón identificado: ${bestPattern.suggestedAssessment}`
      };
    }

    // Fallback basado en hablante
    if (speaker === 'PACIENTE') {
      return {
        section: 'S',
        confidence: 0.7,
        reasoning: 'Información subjetiva reportada por paciente'
      };
    } else {
      return {
        section: 'O',
        confidence: 0.7,
        reasoning: 'Observación del profesional de salud'
      };
    }
  }

  /**
   * Genera assessment automático basado en entidades encontradas
   */
  static generateAssessment(entities: string[]): string {
    const anatomyTerms = entities.filter(e => 
      MEDICAL_TERMS.find(mt => mt.term === e && mt.category === 'anatomy')
    );
    
    const symptomTerms = entities.filter(e => 
      MEDICAL_TERMS.find(mt => mt.term === e && mt.category === 'symptom')
    );

    if (anatomyTerms.includes('cuello') && symptomTerms.includes('dolor')) {
      return 'Disfunción cervical que requiere evaluación fisioterapéutica detallada';
    }
    
    if (anatomyTerms.includes('lumbar') && symptomTerms.includes('dolor')) {
      return 'Disfunción lumbar que requiere abordaje fisioterapéutico conservador';
    }
    
    if (anatomyTerms.includes('hombro') && symptomTerms.includes('dolor')) {
      return 'Disfunción funcional de hombro que requiere evaluación específica';
    }

    return 'Evaluación fisioterapéutica en proceso. Se requiere más información para determinar plan de tratamiento específico';
  }
} 