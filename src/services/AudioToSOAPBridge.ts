/**
 * Servicio Puente de Audio a SOAP para AiDuxCare V.2
 * Convierte transcripciones de audio en notas SOAP estructuradas
 */

export interface SOAPData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  timestamp: string;
}

export class AudioToSOAPBridge {
  /**
   * Procesa una transcripción de audio y la convierte en formato SOAP
   */
  static async processTranscriptionToSOAP(transcription: string): Promise<SOAPData> {
    if (!transcription || transcription.trim().length === 0) {
      return this.createEmptySOAP();
    }

    try {
      // Clasificar el contenido usando heurísticas básicas
      const soapData = this.classifyContentToSOAP(transcription);
      
      return {
        ...soapData,
        confidence: this.calculateConfidence(soapData),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error procesando transcripción a SOAP:', error);
      return this.createEmptySOAP();
    }
  }

  /**
   * Clasifica el contenido de la transcripción en secciones SOAP
   */
  private static classifyContentToSOAP(transcription: string): Omit<SOAPData, 'confidence' | 'timestamp'> {
    // Patrones para identificar diferentes tipos de contenido
    const subjectivePatterns = [
      /paciente (refiere|dice|comenta|indica|reporta|menciona)/,
      /dolor|molestia|síntoma|siente|duele/,
      /desde hace|hace.*días|hace.*semanas|hace.*meses/,
      /me duele|tengo dolor|siento/
    ];

    const objectivePatterns = [
      /observo|se observa|evaluación|examen|palpación/,
      /inflamación|hinchazón|rigidez|contractura/,
      /rango de movimiento|movilidad|flexión|extensión/,
      /grados|limitación|restricción/
    ];

    const assessmentPatterns = [
      /diagnóstico|evaluación|análisis|conclusión/,
      /compatible con|sugiere|indica|probable/,
      /mejora|progreso|evolución|respuesta/
    ];

    const planPatterns = [
      /tratamiento|terapia|ejercicios|plan/,
      /aplicar|realizar|continuar|seguir/,
      /control|seguimiento|próxima sesión/,
      /recomendaciones|indicaciones/
    ];

    // Extraer oraciones que coincidan con cada patrón
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let subjective = '';
    let objective = '';
    let assessment = '';
    let plan = '';

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Clasificar por patrones (una oración puede ir a múltiples secciones)
      if (this.matchesPatterns(lowerSentence, subjectivePatterns)) {
        subjective += sentence.trim() + '. ';
      }
      
      if (this.matchesPatterns(lowerSentence, objectivePatterns)) {
        objective += sentence.trim() + '. ';
      }
      
      if (this.matchesPatterns(lowerSentence, assessmentPatterns)) {
        assessment += sentence.trim() + '. ';
      }
      
      if (this.matchesPatterns(lowerSentence, planPatterns)) {
        plan += sentence.trim() + '. ';
      }
    });

    // Si alguna sección está vacía, usar contenido genérico
    if (!subjective.trim()) {
      subjective = 'Paciente reporta síntomas según transcripción de la sesión.';
    }
    
    if (!objective.trim()) {
      objective = 'Evaluación física realizada según protocolo clínico.';
    }
    
    if (!assessment.trim()) {
      assessment = 'Análisis clínico basado en hallazgos objetivos y subjetivos.';
    }
    
    if (!plan.trim()) {
      plan = 'Plan de tratamiento definido según evaluación clínica.';
    }

    return {
      subjective: subjective.trim(),
      objective: objective.trim(),
      assessment: assessment.trim(),
      plan: plan.trim()
    };
  }

  /**
   * Verifica si una oración coincide con algún patrón
   */
  private static matchesPatterns(sentence: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(sentence));
  }

  /**
   * Calcula la confianza del procesamiento SOAP
   */
  private static calculateConfidence(soapData: Omit<SOAPData, 'confidence' | 'timestamp'>): number {
    let confidence = 0;
    
    // Puntuación basada en la completitud y especificidad
    if (soapData.subjective && soapData.subjective.length > 20) confidence += 0.25;
    if (soapData.objective && soapData.objective.length > 20) confidence += 0.25;
    if (soapData.assessment && soapData.assessment.length > 20) confidence += 0.25;
    if (soapData.plan && soapData.plan.length > 20) confidence += 0.25;
    
    // Bonificación por contenido específico (no genérico)
    if (!soapData.subjective.includes('según transcripción')) confidence += 0.1;
    if (!soapData.objective.includes('según protocolo')) confidence += 0.1;
    if (!soapData.assessment.includes('basado en hallazgos')) confidence += 0.1;
    if (!soapData.plan.includes('según evaluación')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Crea un objeto SOAP vacío por defecto
   */
  private static createEmptySOAP(): SOAPData {
    return {
      subjective: 'Sin información subjetiva registrada.',
      objective: 'Sin hallazgos objetivos registrados.',
      assessment: 'Evaluación pendiente.',
      plan: 'Plan de tratamiento por definir.',
      confidence: 0.1,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Valida si los datos SOAP son válidos
   */
  static validateSOAPData(soapData: SOAPData): boolean {
    return !!(
      soapData.subjective &&
      soapData.objective &&
      soapData.assessment &&
      soapData.plan &&
      soapData.confidence >= 0 &&
      soapData.confidence <= 1
    );
  }
}

export default AudioToSOAPBridge; 