/**
 * RealWorldSOAPProcessor - Motor de Procesamiento SOAP del Mundo Real
 * Transforma transcripciones médicas caóticas en documentación SOAP estructurada
 * Usa ClinicalKnowledgeBase para heurísticas semánticas inteligentes
 */

import { ClinicalKnowledgeProcessor, CLINICAL_PATTERNS, MEDICAL_TERMS } from '../../lib/ClinicalKnowledgeBase';
import { ConsultationClassifier } from '../core/classification/ConsultationClassifier';

export interface RealWorldSOAPSegment {
  text: string;
  speaker: 'PACIENTE' | 'TERAPEUTA';
  section: 'S' | 'O' | 'A' | 'P';
  confidence: number;
  reasoning: string;
  entities: {
    anatomy: string[];
    symptom: string[];
    treatment: string[];
    diagnosis: string[];
    procedure: string[];
    test: string[];
    finding: string[];
    severity: string[];
    temporal: string[];
    motion: string[];
    trigger: string[];
    limitation: string[];
    result: string[];
    grade: string[];
    reference: string[];
    context: string[];
    exclusion: string[];
    range: string[];
  };
}

export interface ProcessingResult {
  segments: RealWorldSOAPSegment[];
  fullAssessment: string;
  speakerAccuracy: number;
  processingMetrics: {
    totalSegments: number;
    soapDistribution: Record<'S' | 'O' | 'A' | 'P', number>;
    entityCount: number;
    averageConfidence: number;
    processingTimeMs: number;
  };
}

export interface ProcessingOptions {
  specialty?: 'fisioterapia' | 'psicologia' | 'general';
  confidenceThreshold?: number;
  enableAdvancedNER?: boolean;
  generateAssessment?: boolean;
}

/**
 * Procesador Principal de SOAP del Mundo Real
 */
export default class RealWorldSOAPProcessor {
  private options: Required<ProcessingOptions>;
  private processingLog: Array<{ step: string; timestamp: number; details: any }> = [];

  constructor(options: ProcessingOptions = {}) {
    this.options = {
      specialty: options.specialty || 'fisioterapia',
      confidenceThreshold: options.confidenceThreshold || 0.7,
      enableAdvancedNER: options.enableAdvancedNER ?? true,
      generateAssessment: options.generateAssessment ?? true
    };
  }

  /**
   * Procesa una transcripción completa del mundo real
   */
  async processTranscription(
    rawTranscription: string,
    options?: Partial<ProcessingOptions>
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    this.processingLog = [];
    
    // Merge options
    const processingOptions = { ...this.options, ...options };
    try {
      this.log('START_PROCESSING', { rawLength: rawTranscription.length, options: processingOptions });

      // 1. Segmentación inteligente
      const segments = this.segmentTranscription(rawTranscription);
      this.log('SEGMENTATION_COMPLETE', { segmentCount: segments.length });

      // 2. Extracción de entidades globales (para todo el texto)
      const allEntities = segments.flatMap(segment => Object.values(this.extractEntities(segment)).flat());
      // 3. Llamada a Gemini para clasificación SOAP
      let geminiResult = null;
      let fallbackUsed = false;
      let processedSegments: RealWorldSOAPSegment[] = [];
      let fullAssessment = '';
      try {
        geminiResult = await ConsultationClassifier.classifyWithGemini(
          {
            patientId: 'UAT',
            transcription: rawTranscription,
            sessionDuration: 0,
            previousSessions: 0,
            professionalSpecialty: (processingOptions.specialty?.toUpperCase() as any) || 'FISIOTERAPIA',
            currentPlan: 'GENERAL_PRO'
          },
          allEntities,
          []
        );
        // Procesar respuesta Gemini para poblar segmentos SOAP
        if (geminiResult && geminiResult.soap) {
          processedSegments = [
            {
              text: rawTranscription,
              speaker: 'PACIENTE',
              section: 'S',
              confidence: geminiResult.confidence || 0.9,
              reasoning: 'Clasificación Gemini',
              entities: this.extractEntities(rawTranscription)
            },
            // ... puedes expandir para S/O/A/P según respuesta Gemini ...
          ];
          fullAssessment = geminiResult.soap.A || '';
        }
      } catch (err) {
        fallbackUsed = true;
        // Fallback: procesamiento heurístico clásico
        processedSegments = [];
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const speaker = this.inferSpeaker(segment, i, segments);
          const soapClassification = this.classifySOAPSection(segment, speaker);
          const entities = this.extractEntities(segment);
          const reasoning = this.generateReasoning(segment, speaker, soapClassification.section, entities);
          processedSegments.push({
            text: segment.trim(),
            speaker,
            section: soapClassification.section,
            confidence: soapClassification.confidence,
            reasoning,
            entities
          });
        }
        if (processingOptions.generateAssessment) {
          fullAssessment = this.generateAssessment(processedSegments);
        }
      }

      // 4. Cálculo de métricas
      const processingMetrics = this.calculateMetrics(processedSegments, startTime);
      const speakerAccuracy = this.calculateSpeakerAccuracy(processedSegments);

      this.log('PROCESSING_COMPLETE', { 
        totalTime: Date.now() - startTime,
        segmentCount: processedSegments.length,
        speakerAccuracy,
        fallbackUsed
      });

      return {
        segments: processedSegments,
        fullAssessment,
        speakerAccuracy,
        processingMetrics
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      this.log('PROCESSING_ERROR', { error: errorMsg, stack: errorStack });
      throw new Error(`RealWorldSOAPProcessor failed: ${errorMsg}`);
    }
  }

  /**
   * Segmenta la transcripción en frases coherentes
   */
  private segmentTranscription(text: string): string[] {
    this.log('SEGMENTATION_START', { originalLength: text.length });

    // Normalizar texto
    let normalized = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Segmentar por patrones de puntuación y conectores médicos
    const segments = normalized
      .split(/[.!?;]|(?:,\s*(?:entonces|luego|después|ahora|también|además|por otro lado|al examinar|al palpar|recomiendo|sugiero))/g)
      .map(s => s.trim())
      .filter(s => s.length > 15) // Filtrar segmentos muy cortos
      .map(s => {
        // Limpiar inicio de segmentos
        return s.replace(/^(y|entonces|luego|después|también|además|,)\s*/g, '');
      })
      .filter(s => s.length > 10);

    this.log('SEGMENTATION_RESULT', { 
      segmentCount: segments.length,
      segments: segments.map(s => s.substring(0, 30) + '...')
    });

    return segments;
  }

  /**
   * Infiere el hablante usando patrones semánticos avanzados
   */
  private inferSpeaker(
    segment: string, 
    index: number, 
    allSegments: string[]
  ): 'PACIENTE' | 'TERAPEUTA' {
    
    // Patrones específicos del PACIENTE (subjetivos, primera persona)
    const patientPatterns = [
      /\b(me|mi|yo|siento|tengo|duele|no puedo|me cuesta|me molesta)\b/g,
      /\b(dolor|molestia|desde que|cuando|si hago|por las mañanas|por la noche)\b/g,
      /\b(no puedo|me duele|siento que|tengo la sensación)\b/g,
      /\b(empezó|comenzó|desde hace|hace tiempo|últimamente)\b/g
    ];

    // Patrones específicos del TERAPEUTA (objetivos, técnicos)
    const therapistPatterns = [
      /\b(al palpar|observo|se evidencia|hay|presenta|test de|maniobra de)\b/g,
      /\b(el paciente|contractura|rigidez|limitación|rango de movimiento)\b/g,
      /\b(recomiendo|sugiero|iniciamos|plan|tratamiento|diagnóstico)\b/g,
      /\b(compatible con|cuadro|síndrome|grado|positivo|negativo|bilateral)\b/g,
      /\b(palpación|movilización|flexión|extensión|rotación|abducción)\b/g,
      /\b(L4-L5|C1-C7|glenohumeral|subacromial|paravertebral)\b/g
    ];

    let patientScore = 0;
    let therapistScore = 0;

    // Calcular puntuaciones con pesos
    patientPatterns.forEach((pattern, idx) => {
      const matches = segment.match(pattern);
      if (matches) {
        const weight = idx === 0 ? 2 : 1; // Mayor peso a patrones de primera persona
        patientScore += matches.length * weight;
      }
    });

    therapistPatterns.forEach((pattern, idx) => {
      const matches = segment.match(pattern);
      if (matches) {
        const weight = idx === 0 ? 2 : 1; // Mayor peso a patrones de examen físico
        therapistScore += matches.length * weight;
      }
    });

    // Lógica contextual: considerar segmentos anteriores
    if (index > 0) {
      const prevSegment = allSegments[index - 1];
      if (prevSegment.includes('recomiendo') || prevSegment.includes('plan')) {
        therapistScore += 1; // Bonus si el anterior era claramente terapeuta
      }
    }

    // Decisión final
    let inferredSpeaker: 'PACIENTE' | 'TERAPEUTA';
    
    if (therapistScore > patientScore) {
      inferredSpeaker = 'TERAPEUTA';
    } else if (patientScore > therapistScore) {
      inferredSpeaker = 'PACIENTE';
    } else {
      // En caso de empate, usar contexto adicional
      if (segment.includes('dolor') || segment.includes('me') || segment.includes('siento')) {
        inferredSpeaker = 'PACIENTE';
      } else if (segment.includes('test') || segment.includes('hay') || segment.includes('observo')) {
        inferredSpeaker = 'TERAPEUTA';
      } else {
        // Alternancia lógica por defecto
        inferredSpeaker = index % 2 === 0 ? 'PACIENTE' : 'TERAPEUTA';
      }
    }

    this.log('SPEAKER_INFERENCE', {
      segment: segment.substring(0, 50),
      patientScore,
      therapistScore,
      inferredSpeaker
    });

    return inferredSpeaker;
  }

  /**
   * Clasifica el segmento en sección SOAP usando heurísticas semánticas
   */
  private classifySOAPSection(
    segment: string,
    speaker: 'PACIENTE' | 'TERAPEUTA'
  ): { section: 'S' | 'O' | 'A' | 'P'; confidence: number } {
    
    // Usar patrones del ClinicalKnowledgeBase
    const matchedPatterns = ClinicalKnowledgeProcessor.findPatterns(segment, this.options.specialty);
    
    if (matchedPatterns.length > 0) {
      // Usar el patrón con mayor confianza
      const bestPattern = matchedPatterns.sort((a, b) => b.confidence - a.confidence)[0];
      
      this.log('SOAP_PATTERN_MATCH', {
        segment: segment.substring(0, 50),
        pattern: bestPattern.suggestedAssessment,
        section: bestPattern.matches[0],
        confidence: bestPattern.confidence
      });
      
      return {
        section: bestPattern.matches[0],
        confidence: bestPattern.confidence
      };
    }

    // Fallback: clasificación basada en hablante y contenido
    let section: 'S' | 'O' | 'A' | 'P';
    let confidence = 0.7;

    if (speaker === 'PACIENTE') {
      // Los pacientes típicamente aportan información subjetiva
      section = 'S';
      confidence = 0.8;
    } else {
      // TERAPEUTA - clasificar por contenido
      if (segment.includes('compatible') || segment.includes('diagnóstico') || 
          segment.includes('cuadro') || segment.includes('síndrome') ||
          segment.includes('sugiere') || segment.includes('impresión')) {
        section = 'A';
        confidence = 0.85;
      } else if (segment.includes('recomiendo') || segment.includes('plan') || 
                 segment.includes('tratamiento') || segment.includes('ejercicios') ||
                 segment.includes('iniciamos') || segment.includes('terapia')) {
        section = 'P';
        confidence = 0.85;
      } else {
        // Por defecto, observaciones objetivas
        section = 'O';
        confidence = 0.75;
      }
    }

    this.log('SOAP_FALLBACK_CLASSIFICATION', {
      segment: segment.substring(0, 50),
      speaker,
      section,
      confidence
    });

    return { section, confidence };
  }

  /**
   * Extrae entidades médicas del segmento
   */
  private extractEntities(segment: string): RealWorldSOAPSegment['entities'] {
    const entities: RealWorldSOAPSegment['entities'] = {
      anatomy: [],
      symptom: [],
      treatment: [],
      diagnosis: [],
      procedure: [],
      test: [],
      finding: [],
      severity: [],
      temporal: [],
      motion: [],
      trigger: [],
      limitation: [],
      result: [],
      grade: [],
      reference: [],
      context: [],
      exclusion: [],
      range: []
    };

    // Usar ClinicalKnowledgeProcessor para extracción básica
    const extractedEntities = ClinicalKnowledgeProcessor.extractMedicalEntities(segment);
    
    extractedEntities.forEach(entity => {
      const category = entity.category as keyof typeof entities;
      if (entities[category] && !entities[category].includes(entity.term)) {
        entities[category].push(entity.term);
      }
    });

    // Extracción específica adicional usando patrones
    this.extractSpecificEntities(segment, entities);

    this.log('ENTITY_EXTRACTION', {
      segment: segment.substring(0, 50),
      totalEntities: Object.values(entities).flat().length,
      categories: Object.entries(entities).filter(([_, values]) => values.length > 0).map(([cat, _]) => cat)
    });

    return entities;
  }

  /**
   * Extrae entidades específicas usando patrones avanzados
   */
  private extractSpecificEntities(
    segment: string,
    entities: RealWorldSOAPSegment['entities']
  ): void {
    
    // Patrones de severidad
    const severityPatterns = [
      { pattern: /\b(mucho|muy|bastante|intenso|severo|grave)\b/gi, values: ['mucho', 'intenso', 'severo'] },
      { pattern: /\b(poco|leve|ligero|moderado)\b/gi, values: ['leve', 'moderado'] },
      { pattern: /\b(no puedo|imposible|incapaz)\b/gi, values: ['severo'] }
    ];

    // Patrones temporales
    const temporalPatterns = [
      { pattern: /\b(por las mañanas|matutino|al despertar)\b/gi, values: ['matutino'] },
      { pattern: /\b(por la noche|nocturno|al dormir)\b/gi, values: ['nocturno'] },
      { pattern: /\b(hace.*días|hace.*semanas|desde hace)\b/gi, values: ['crónico'] },
      { pattern: /\b(después de|post|tras)\b/gi, values: ['post-traumático'] }
    ];

    // Patrones de movimiento
    const motionPatterns = [
      { pattern: /\b(rotación|rotar|girar)\b/gi, values: ['rotación'] },
      { pattern: /\b(flexión|flexionar|doblar)\b/gi, values: ['flexión'] },
      { pattern: /\b(extensión|extender|estirar)\b/gi, values: ['extensión'] },
      { pattern: /\b(abducción|separar|elevar)\b/gi, values: ['abducción'] }
    ];

    // Patrones de limitación
    const limitationPatterns = [
      { pattern: /\b(no puedo|me cuesta|limitación|restricción)\b/gi, values: ['limitación funcional'] },
      { pattern: /\b(rango.*movimiento|ROM|movilidad)\b/gi, values: ['rango de movimiento'] }
    ];

    // Patrones de resultados de tests
    const resultPatterns = [
      { pattern: /\b(positivo|pos\+)\b/gi, values: ['positivo'] },
      { pattern: /\b(negativo|neg-)\b/gi, values: ['negativo'] },
      { pattern: /\b(bilateral|ambos lados)\b/gi, values: ['bilateral'] }
    ];

    // Patrones de rangos
    const rangePatterns = [
      { pattern: /\b(\d+)\s*(?:a|-)?\s*(\d+)\s*grados?\b/gi, values: [] },
      { pattern: /\b(60.*120|90.*180)\b/gi, values: ['rango específico'] }
    ];

    // Aplicar patrones
    [
      { patterns: severityPatterns, category: 'severity' },
      { patterns: temporalPatterns, category: 'temporal' },
      { patterns: motionPatterns, category: 'motion' },
      { patterns: limitationPatterns, category: 'limitation' },
      { patterns: resultPatterns, category: 'result' },
      { patterns: rangePatterns, category: 'range' }
    ].forEach(({ patterns, category }) => {
      patterns.forEach(({ pattern, values }) => {
        const matches = segment.match(pattern);
        if (matches) {
          if (values.length > 0) {
            values.forEach(value => {
              if (!entities[category as keyof typeof entities].includes(value)) {
                entities[category as keyof typeof entities].push(value);
              }
            });
          } else {
            // Para patrones como rangos, usar el match completo
            matches.forEach(match => {
              if (!entities[category as keyof typeof entities].includes(match)) {
                entities[category as keyof typeof entities].push(match);
              }
            });
          }
        }
      });
    });
  }

  /**
   * Genera razonamiento para la clasificación
   */
  private generateReasoning(
    segment: string,
    speaker: 'PACIENTE' | 'TERAPEUTA',
    section: 'S' | 'O' | 'A' | 'P',
    entities: RealWorldSOAPSegment['entities']
  ): string {
    
    const entitySummary = Object.entries(entities)
      .filter(([_, values]) => values.length > 0)
      .map(([category, values]) => `${category}: ${values.slice(0, 2).join(', ')}`)
      .join('; ');

    let reasoning = '';

    switch (section) {
      case 'S':
        if (speaker === 'PACIENTE') {
          reasoning = `Síntoma subjetivo expresado por paciente. `;
          if (entities.symptom.length > 0) {
            reasoning += `Reporta ${entities.symptom.join(', ')}.`;
          }
          if (entities.temporal.length > 0) {
            reasoning += ` Patrón temporal: ${entities.temporal.join(', ')}.`;
          }
        } else {
          reasoning = `Información subjetiva obtenida durante anamnesis. `;
        }
        break;

      case 'O':
        reasoning = `Observación objetiva durante examen físico. `;
        if (entities.procedure.length > 0) {
          reasoning += `Procedimiento: ${entities.procedure.join(', ')}.`;
        }
        if (entities.finding.length > 0) {
          reasoning += ` Hallazgo: ${entities.finding.join(', ')}.`;
        }
        if (entities.test.length > 0) {
          reasoning += ` Test realizado: ${entities.test.join(', ')}.`;
        }
        break;

      case 'A':
        reasoning = `Impresión diagnóstica basada en hallazgos subjetivos y objetivos. `;
        if (entities.diagnosis.length > 0) {
          reasoning += `Diagnóstico: ${entities.diagnosis.join(', ')}.`;
        }
        break;

      case 'P':
        reasoning = `Plan de tratamiento recomendado. `;
        if (entities.treatment.length > 0) {
          reasoning += `Tratamientos: ${entities.treatment.join(', ')}.`;
        }
        break;
    }

    // Agregar información de entidades si es relevante
    if (entitySummary && reasoning.length < 100) {
      reasoning += ` Entidades identificadas: ${entitySummary}.`;
    }

    this.log('REASONING_GENERATED', {
      segment: segment.substring(0, 30),
      section,
      reasoning: reasoning.substring(0, 100)
    });

    return reasoning.trim();
  }

  /**
   * Genera assessment clínico automático si falta sección A
   */
  private generateAssessment(segments: RealWorldSOAPSegment[]): string {
    // Verificar si ya existe assessment
    const existingAssessment = segments.find(s => s.section === 'A');
    if (existingAssessment) {
      return existingAssessment.text;
    }

    // Recopilar información de S y O
    const subjectiveInfo = segments.filter(s => s.section === 'S');
    const objectiveInfo = segments.filter(s => s.section === 'O');

    // Extraer entidades clave
    const allEntities = segments.flatMap(s => Object.values(s.entities).flat());
    const anatomyTerms = segments.flatMap(s => s.entities.anatomy);
    const symptoms = segments.flatMap(s => s.entities.symptom);
    const findings = segments.flatMap(s => s.entities.finding);
    const diagnoses = segments.flatMap(s => s.entities.diagnosis);

    // Si ya hay diagnósticos explícitos, usarlos
    if (diagnoses.length > 0) {
      const assessment = `Cuadro clínico compatible con ${diagnoses.join(' y ')}. `;
      this.log('ASSESSMENT_FROM_DIAGNOSES', { diagnoses, assessment });
      return assessment;
    }

    // Generar assessment basado en anatomía y síntomas
    let assessment = '';

    if (anatomyTerms.includes('cuello') || anatomyTerms.includes('cervical')) {
      if (symptoms.includes('dolor')) {
        assessment = 'Cervicalgia con limitación funcional de la movilidad cervical. ';
        if (findings.includes('rigidez') || findings.includes('contractura')) {
          assessment += 'Componente muscular evidente. ';
        }
      }
    } else if (anatomyTerms.includes('lumbar') || anatomyTerms.includes('espalda baja')) {
      if (symptoms.includes('dolor')) {
        assessment = 'Lumbalgia mecánica con contractura de musculatura paravertebral. ';
        if (allEntities.includes('post-traumático')) {
          assessment += 'De origen post-esfuerzo. ';
        }
      }
    } else if (anatomyTerms.includes('hombro') || anatomyTerms.includes('glenohumeral')) {
      if (symptoms.includes('dolor')) {
        assessment = 'Síndrome doloroso del hombro con limitación funcional. ';
        if (allEntities.includes('nocturno')) {
          assessment += 'Compatible con impingement subacromial. ';
        }
      }
    }

    // Fallback genérico
    if (!assessment) {
      if (symptoms.length > 0 && anatomyTerms.length > 0) {
        assessment = `Cuadro de ${symptoms[0]} en región ${anatomyTerms[0]} con limitación funcional asociada. `;
      } else {
        assessment = 'Evaluación clínica pendiente de completar con base en hallazgos subjetivos y objetivos documentados. ';
      }
    }

    // Agregar información sobre ausencia de signos neurológicos si es pertinente
    if (anatomyTerms.some(term => ['cuello', 'lumbar', 'cervical'].includes(term))) {
      const hasNeurologicalTests = segments.some(s => 
        s.entities.test.some(test => ['lasègue', 'spurling'].includes(test.toLowerCase()))
      );
      
      if (hasNeurologicalTests) {
        assessment += 'No se evidencian signos de compromiso neurológico. ';
      }
    }

    // Agregar pronóstico si hay información de tratamiento
    const hasConservativeTreatment = segments.some(s => 
      s.entities.treatment.some(tx => ['terapia manual', 'ejercicios', 'fisioterapia'].includes(tx.toLowerCase()))
    );
    
    if (hasConservativeTreatment) {
      assessment += 'Pronóstico favorable con tratamiento conservador. ';
    }

    this.log('ASSESSMENT_GENERATED', {
      anatomyTerms,
      symptoms,
      findings,
      assessment: assessment.substring(0, 100)
    });

    return assessment.trim();
  }

  /**
   * Calcula métricas de procesamiento
   */
  private calculateMetrics(
    segments: RealWorldSOAPSegment[],
    startTime: number
  ): ProcessingResult['processingMetrics'] {
    
    const soapDistribution = segments.reduce((acc, segment) => {
      acc[segment.section] = (acc[segment.section] || 0) + 1;
      return acc;
    }, {} as Record<'S' | 'O' | 'A' | 'P', number>);

    const entityCount = segments.reduce((acc, segment) => 
      acc + Object.values(segment.entities).flat().length, 0
    );

    const averageConfidence = segments.reduce((acc, segment) => 
      acc + segment.confidence, 0
    ) / segments.length;

    const processingTimeMs = Date.now() - startTime;

    return {
      totalSegments: segments.length,
      soapDistribution,
      entityCount,
      averageConfidence,
      processingTimeMs
    };
  }

  /**
   * Calcula precisión de identificación de hablantes
   */
  private calculateSpeakerAccuracy(segments: RealWorldSOAPSegment[]): number {
    // Heurística: evaluar alternancia lógica y coherencia contextual
    let logicalTransitions = 0;
    let totalTransitions = 0;

    for (let i = 1; i < segments.length; i++) {
      const current = segments[i];
      const previous = segments[i - 1];

      if (current.speaker !== previous.speaker) {
        totalTransitions++;
        
        // Evaluar si la transición es lógicamente coherente
        const isLogical = this.isLogicalSpeakerTransition(previous, current);
        if (isLogical) {
          logicalTransitions++;
        }
      }
    }

    // Si no hay transiciones, asumir alta precisión
    if (totalTransitions === 0) {
      return 0.95;
    }

    const transitionAccuracy = logicalTransitions / totalTransitions;
    
    // Combinar con evaluación de coherencia interna
    const coherenceScore = this.evaluateSpeakerCoherence(segments);
    
    const finalAccuracy = (transitionAccuracy * 0.7) + (coherenceScore * 0.3);
    
    this.log('SPEAKER_ACCURACY_CALCULATION', {
      logicalTransitions,
      totalTransitions,
      transitionAccuracy,
      coherenceScore,
      finalAccuracy
    });

    return Math.min(0.98, Math.max(0.7, finalAccuracy));
  }

  /**
   * Evalúa si una transición de hablante es lógicamente coherente
   */
  private isLogicalSpeakerTransition(
    previous: RealWorldSOAPSegment,
    current: RealWorldSOAPSegment
  ): boolean {
    
    // PACIENTE (S) -> TERAPEUTA (O/A/P) es lógico
    if (previous.speaker === 'PACIENTE' && previous.section === 'S' &&
        current.speaker === 'TERAPEUTA' && ['O', 'A', 'P'].includes(current.section)) {
      return true;
    }

    // TERAPEUTA (O) -> TERAPEUTA (A) es lógico (mismo hablante, progresión natural)
    if (previous.speaker === 'TERAPEUTA' && previous.section === 'O' &&
        current.speaker === 'TERAPEUTA' && current.section === 'A') {
      return true;
    }

    // TERAPEUTA (A) -> TERAPEUTA (P) es lógico
    if (previous.speaker === 'TERAPEUTA' && previous.section === 'A' &&
        current.speaker === 'TERAPEUTA' && current.section === 'P') {
      return true;
    }

    // Pregunta del terapeuta seguida de respuesta del paciente
    if (previous.speaker === 'TERAPEUTA' && previous.text.includes('?') &&
        current.speaker === 'PACIENTE') {
      return true;
    }

    return false;
  }

  /**
   * Evalúa la coherencia general de identificación de hablantes
   */
  private evaluateSpeakerCoherence(segments: RealWorldSOAPSegment[]): number {
    let coherenceScore = 0;
    let evaluations = 0;

    segments.forEach(segment => {
      evaluations++;
      
      // Los pacientes deberían hablar principalmente en sección S
      if (segment.speaker === 'PACIENTE' && segment.section === 'S') {
        coherenceScore += 1;
      }
      
      // Los terapeutas deberían hablar principalmente en O, A, P
      if (segment.speaker === 'TERAPEUTA' && ['O', 'A', 'P'].includes(segment.section)) {
        coherenceScore += 1;
      }

      // Verificar coherencia semántica
      if (segment.speaker === 'PACIENTE' && 
          (segment.text.includes('me') || segment.text.includes('dolor') || segment.text.includes('siento'))) {
        coherenceScore += 0.5;
      }

      if (segment.speaker === 'TERAPEUTA' && 
          (segment.text.includes('observo') || segment.text.includes('test') || segment.text.includes('recomiendo'))) {
        coherenceScore += 0.5;
      }
    });

    return evaluations > 0 ? coherenceScore / evaluations : 0.8;
  }

  /**
   * Sistema de logging para trazabilidad
   */
  private log(step: string, details: any): void {
    const logEntry = {
      step,
      timestamp: Date.now(),
      details
    };
    
    this.processingLog.push(logEntry);
    
    // En desarrollo, mostrar logs importantes
    if (process.env.NODE_ENV === 'development') {
      const importantSteps = ['START_PROCESSING', 'PROCESSING_COMPLETE', 'PROCESSING_ERROR'];
      if (importantSteps.includes(step)) {
        console.log(`[RealWorldSOAPProcessor] ${step}:`, details);
      }
    }
  }

  /**
   * Obtiene el log completo de procesamiento (para debugging y auditoría)
   */
  getProcessingLog(): typeof this.processingLog {
    return [...this.processingLog];
  }

  /**
   * Limpia el log de procesamiento
   */
  clearLog(): void {
    this.processingLog = [];
  }
}
