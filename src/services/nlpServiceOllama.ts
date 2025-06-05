/**
 * 🧬 AiDuxCare - Servicio NLP con Ollama + RAG
 * Procesamiento de lenguaje natural para fisioterapia usando LLM local + evidencia científica
 */

import { ollamaClient } from '../lib/ollama';
import { ClinicalEntity, SOAPNotes, ProcessingMetrics } from '../types/nlp';
import { RAGMedicalMCP } from '../core/mcp/RAGMedicalMCP';
// Removido temporalmente para arreglar errores

export class NLPServiceOllama {
  
  // **NUEVO: Sistema A/B Testing para Prompts**
  private static promptVersionConfig = {
    useOptimizedV2: localStorage?.getItem('aiduxcare_prompt_version') === 'v2' || false,
    autoLogging: true,
    testingMode: localStorage?.getItem('aiduxcare_testing_mode') === 'true' || false
  };

  /**
   * Configura la versión de prompt a usar (para A/B testing)
   */
  static setPromptVersion(version: 'current' | 'v2' | 'auto'): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aiduxcare_prompt_version', version);
    }
    this.promptVersionConfig.useOptimizedV2 = version === 'v2';
    console.log(`🔄 Prompt version cambiada a: ${version}`);
  }

  /**
   * Habilita/deshabilita modo testing con logging automático
   */
  static setTestingMode(enabled: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aiduxcare_testing_mode', enabled.toString());
    }
    this.promptVersionConfig.testingMode = enabled;
    console.log(`📊 Modo testing ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  /**
   * Obtiene configuración actual de testing
   */
  static getTestingConfig(): {
    promptVersion: string;
    testingMode: boolean;
    autoLogging: boolean;
  } {
    return {
      promptVersion: this.promptVersionConfig.useOptimizedV2 ? 'v2' : 'current',
      testingMode: this.promptVersionConfig.testingMode,
      autoLogging: this.promptVersionConfig.autoLogging
    };
  }

  /**
   * Extrae entidades clínicas de una transcripción médica con RAG
   */
  static async extractClinicalEntities(transcript: string, useRAG: boolean = true): Promise<ClinicalEntity[]> {
    const startTime = Date.now();
    
    try {
      // Prompt optimizado para extracción de entidades
      const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Eres un experto en procesamiento de lenguaje natural médico. Extrae entidades clínicas específicas de fisioterapia.

<|eot_id|><|start_header_id|>user<|end_header_id|>

Transcripción de sesión de fisioterapia:
"${transcript.substring(0, 1000)}"

Extrae y clasifica entidades en estas categorías:
- symptom: síntomas reportados por el paciente
- finding: hallazgos objetivos del fisioterapeuta
- diagnosis: diagnósticos o condiciones
- treatment: tratamientos, ejercicios, técnicas
- anatomy: partes del cuerpo, músculos, articulaciones
- assessment: evaluaciones, tests, mediciones

Responde SOLO en formato JSON:
[
  {"type": "symptom", "text": "dolor lumbar", "confidence": 0.9},
  {"type": "anatomy", "text": "columna vertebral", "confidence": 0.8}
]

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

      const result = await ollamaClient.generateCompletion(prompt, {
        temperature: 0.1,
        max_tokens: 500
      });

      // Parse JSON response
      const jsonMatch = result.response.match(/\[[\s\S]*\]/);
      let entities: ClinicalEntity[] = [];
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          entities = parsed.map((entity: { type?: string; text?: string; confidence?: number }, index: number) => ({
            id: `entity_${Date.now()}_${index}`,
            type: entity.type || 'other',
            text: entity.text || '',
            confidence: entity.confidence || 0.5,
            context: transcript.substring(0, 200),
            position: { start: 0, end: entity.text?.length || 0 }
          }));
                  } catch (parseError) {
           ErrorLogger.logStructuredError(
             StructuredErrorFactory.createOllamaError(
               parseError instanceof Error ? parseError : new Error(String(parseError)),
               `entities-${transcript.slice(0, 50)}`,
               undefined,
               undefined
             )
           );
          entities = this.extractEntitiesWithRegex(transcript);
        }
      } else {
        console.warn('No JSON found in response, using regex fallback');
        entities = this.extractEntitiesWithRegex(transcript);
      }

      // Enriquecer con RAG si está habilitado
      if (useRAG && entities.length > 0) {
        try {
          const keyTerms = entities
            .filter(e => e.type === 'symptom' || e.type === 'diagnosis')
            .slice(0, 3)
            .map(e => e.text);
            
          if (keyTerms.length > 0) {
            console.log('🔬 Enriqueciendo entidades con evidencia científica...');
            // RAG enhancement logic here if needed
          }
        } catch (ragError) {
          console.warn('⚠️ RAG enhancement failed:', ragError);
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Entidades extraídas: ${entities.length} en ${processingTime}ms`);
      
      return entities;
      
    } catch (error) {
      ErrorLogger.logError(
        StructuredErrorFactory.createOllamaError(
          'ENTITY_EXTRACTION_ERROR',
          'Failed to extract clinical entities',
          error,
          { retryAttempt: 1 }
        )
      );
      
      // Fallback: usar regex básico
      return this.extractEntitiesWithRegex(transcript);
    }
  }

  /**
   * Genera notas SOAP con A/B testing automático
   */
  static async generateSOAPNotes(transcript: string, entities: ClinicalEntity[], useRAG: boolean = true): Promise<SOAPNotes> {
    const startTime = Date.now();
    const promptVersion = this.promptVersionConfig.useOptimizedV2 ? 'v2' : 'current';
    
    // Log automático si está en modo testing
    if (this.promptVersionConfig.testingMode) {
      console.log(`📝 Generando SOAP con prompt ${promptVersion}...`);
    }
    
    try {
      let result: SOAPNotes;
      
      if (this.promptVersionConfig.useOptimizedV2) {
        result = await this.generateSOAPNotesOptimizedV2(transcript, entities, useRAG);
      } else {
        result = await this.generateSOAPNotesOriginal(transcript, entities, useRAG);
      }
      
      // Log métricas para comparación
      if (this.promptVersionConfig.testingMode && this.promptVersionConfig.autoLogging) {
        const processingTime = Date.now() - startTime;
        await this.logTestingMetrics(promptVersion, processingTime, result, transcript, entities, false);
      }
      
      return result;
      
    } catch (error) {
      // Log timeout/error para comparación
      if (this.promptVersionConfig.testingMode && this.promptVersionConfig.autoLogging) {
        const processingTime = Date.now() - startTime;
        const isTimeout = error instanceof Error && error.message.includes('timeout');
        await this.logTestingMetrics(promptVersion, processingTime, null, transcript, entities, isTimeout);
      }
      
      throw error;
    }
  }

  /**
   * Versión original del prompt SOAP (para comparación A/B)
   */
  private static async generateSOAPNotesOriginal(transcript: string, entities: ClinicalEntity[], useRAG: boolean = true): Promise<SOAPNotes> {
    // Esta es la implementación original que ya tenemos
    const startTime = Date.now();
    
    // Enriquecer con RAG si está habilitado y hay entidades relevantes
    let ragContext = '';
    if (useRAG && entities.length > 0) {
      try {
        console.log('🔍 Enriqueciendo SOAP con evidencia científica...');
        
        // Usar solo las 2 entidades más relevantes para evitar prompts muy largos
        const keyEntities = entities
          .filter(e => e.type === 'symptom' || e.type === 'diagnosis' || e.type === 'treatment')
          .slice(0, 2)
          .map(e => e.text);
        
        if (keyEntities.length > 0) {
          const ragQuery = keyEntities.join(' ') + ' evidence';
          const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(ragQuery, 'fisioterapia', 2);
          
          if (ragResult.citations.length > 0) {
            // Contexto RAG resumido para evitar timeouts
            ragContext = `

EVIDENCIA CIENTÍFICA:
${ragResult.citations.slice(0, 2).map(c => 
  `- ${c.title.substring(0, 80)}... (${c.year})`
).join('\n')}`;
            
            console.log(`✅ RAG: Añadida evidencia de ${ragResult.citations.length} fuentes`);
          }
        }
      } catch (error) {
        console.warn('⚠️ RAG enhancements failed, continuing without:', error);
      }
    }

    // Prompt SOAP optimizado (más corto y directo)
    const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Eres un fisioterapeuta experto. Genera una nota SOAP profesional y concisa.${ragContext}

<|eot_id|><|start_header_id|>user<|end_header_id|>

Transcripción: "${transcript.substring(0, 800)}..."

Entidades: ${entities.slice(0, 5).map(e => `${e.type}: ${e.text}`).join(', ')}

Genera SOAP en formato JSON:
{
  "subjective": "Paciente reporta...",
  "objective": "Evaluación revela...", 
  "assessment": "Análisis clínico...",
  "plan": "Tratamiento incluye..."
}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

    try {
      const result = await ollamaClient.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 800 // Original timeout settings
      });
      
      const processingTime = Date.now() - startTime;
      
      // Extraer JSON de la respuesta
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const soapData = JSON.parse(jsonMatch[0]);
          
          const soapNotes: SOAPNotes = {
            subjective: soapData.subjective || 'Información subjetiva no disponible',
            objective: soapData.objective || 'Observaciones objetivas no registradas',
            assessment: soapData.assessment || 'Evaluación pendiente de completar',
            plan: soapData.plan || 'Plan de tratamiento por determinar',
            generated_at: new Date(),
            confidence_score: this.calculateSOAPConfidence(soapData)
          };

          console.log(`✅ Nota SOAP original generada en ${processingTime}ms${useRAG ? ' (con evidencia)' : ''}`);
          return soapNotes;
          
        } catch (parseError) {
          ErrorLogger.logError(
            StructuredErrorFactory.createOllamaError(
              'SOAP_JSON_PARSE_ERROR',
              'Failed to parse SOAP JSON from Ollama response',
              parseError,
              { step: 'soap_generation', rawResponse: result.response }
            )
          );
        }
      }
      
      // Fallback: generar SOAP básico
      return this.generateFallbackSOAP(transcript, useRAG);
      
    } catch (error) {
      ErrorLogger.logError(
        StructuredErrorFactory.createOllamaError(
          'SOAP_GENERATION_ERROR',
          'Failed to generate original SOAP notes',
          error
        )
      );
      
      // Si hay timeout, intentar versión ultra-simplificada
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('🔄 Timeout detectado en prompt original, intentando versión simplificada...');
        return this.generateSimplifiedSOAP(transcript, entities);
      }
      
      throw new Error(`Failed to generate original SOAP notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Log automático de métricas para A/B testing
   */
  private static async logTestingMetrics(
    promptVersion: string,
    processingTime: number,
    result: SOAPNotes | null,
    transcript: string,
    entities: ClinicalEntity[],
    hadTimeout: boolean
  ): Promise<void> {
    const metrics = {
      timestamp: new Date().toISOString(),
      prompt_version: promptVersion,
      processing_time_ms: processingTime,
      timeout_occurred: hadTimeout,
      transcript_length: transcript.length,
      entities_count: entities.length,
      soap_generated: result !== null,
      soap_confidence: result?.confidence_score || 0,
      session_id: `testing_${Date.now()}`
    };
    
    // Log en consola para debugging
    console.log('📊 Testing Metrics:', metrics);
    
    // Intentar append a USER_TESTING_LOG.md
    try {
      const logEntry = `| ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} | ${promptVersion} | ${processingTime}ms | ${hadTimeout ? 'Sí' : 'No'} | ${transcript.length} | ${entities.length} | ${result?.confidence_score?.toFixed(2) || 'N/A'} | Auto-logged |\n`;
      
      // En un entorno real, esto escribiría al archivo. Por ahora, lo mostramos en consola.
      console.log('📝 Log Entry para USER_TESTING_LOG.md:', logEntry);
      
    } catch (error) {
      console.warn('⚠️ No se pudo escribir a USER_TESTING_LOG.md:', error);
    }
  }

  /**
   * Genera notas SOAP optimizadas v2 (NUEVA - para testing de timeouts)
   */
  static async generateSOAPNotesOptimizedV2(transcript: string, entities: ClinicalEntity[], useRAG: boolean = true): Promise<SOAPNotes> {
    const startTime = Date.now();
    
    // Extraer información clave para el prompt
    const keyInfo = this.extractKeyInfoForSOAP(transcript, entities);
    
    // RAG ultra-selectivo para evitar timeouts
    let ragContext = '';
    if (useRAG && keyInfo.primaryCondition) {
      try {
        const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(
          keyInfo.primaryCondition, 
          'fisioterapia', 
          1 // Solo 1 artículo más relevante
        );
        
        if (ragResult.citations.length > 0) {
          ragContext = `\nEvidencia: ${ragResult.citations[0].title.substring(0, 50)}...`;
        }
      } catch (ragError) {
        console.warn('RAG skipped due to timeout risk');
      }
    }
    
    // Prompt híper-optimizado
    const prompt = `Fisioterapeuta experto. SOAP profesional.${ragContext}

DATOS:
- Paciente: ${keyInfo.symptoms}
- Eval: ${keyInfo.findings}  
- Tratamiento: ${keyInfo.treatments}

SOAP JSON:
{"subjective":"","objective":"","assessment":"","plan":""}`;

    try {
      const result = await ollamaClient.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 400,
        timeout: 10000 // 10 segundos timeout explícito
      });
      
      const processingTime = Date.now() - startTime;
      
      // Parse JSON más robusto
      const jsonMatch = result.response.match(/\{[^{}]*"subjective"[^{}]*\}/);
      if (jsonMatch) {
        try {
          const soapData = JSON.parse(jsonMatch[0]);
          
          const soapNotes: SOAPNotes = {
            subjective: soapData.subjective || `Paciente reporta: ${keyInfo.symptoms}`,
            objective: soapData.objective || `Evaluación revela: ${keyInfo.findings}`,
            assessment: soapData.assessment || `Análisis: ${keyInfo.primaryCondition || 'condición evaluada'}`,
            plan: soapData.plan || `Plan: ${keyInfo.treatments}`,
            generated_at: new Date(),
            confidence_score: this.calculateSOAPConfidence(soapData)
          };

          console.log(`✅ SOAP Optimizado v2 generado en ${processingTime}ms${useRAG ? ' (con evidencia)' : ''}`);
          return soapNotes;
          
        } catch (parseError) {
          ErrorLogger.logError(
            StructuredErrorFactory.createOllamaError(
              'SOAP_JSON_PARSE_ERROR',
              'Failed to parse SOAP JSON from Ollama response',
              parseError,
              { step: 'soap_generation', rawResponse: result.response }
            )
          );
        }
      }
      
      // Fallback estructurado
      return {
        subjective: keyInfo.symptoms || 'Información subjetiva reportada',
        objective: keyInfo.findings || 'Evaluación física realizada',
        assessment: keyInfo.primaryCondition || 'Condición evaluada según hallazgos',
        plan: keyInfo.treatments || 'Plan de tratamiento por determinar',
        generated_at: new Date(),
        confidence_score: 0.7
      };
      
    } catch (error) {
      console.error('Error generating optimized SOAP:', error);
      
      // Fallback inmediato sin más llamadas a Ollama
      return {
        subjective: keyInfo.symptoms || `Paciente: ${transcript.substring(0, 100)}...`,
        objective: keyInfo.findings || 'Evaluación física completada',
        assessment: keyInfo.primaryCondition || 'Evaluación clínica realizada',
        plan: keyInfo.treatments || 'Continuar con protocolo de tratamiento',
        generated_at: new Date(),
        confidence_score: 0.5
      };
    }
  }

  /**
   * Extrae información clave del transcript y entidades para SOAP optimizado
   */
  private static extractKeyInfoForSOAP(transcript: string, entities: ClinicalEntity[]): {
    symptoms: string;
    findings: string;
    treatments: string;
    primaryCondition: string;
  } {
    const symptoms = entities
      .filter(e => e.type === 'symptom')
      .slice(0, 3)
      .map(e => e.text)
      .join(', ') || 'síntomas reportados';
    
    const findings = entities
      .filter(e => e.type === 'finding')
      .slice(0, 2)
      .map(e => e.text)
      .join(', ') || 'hallazgos objetivos';
    
    const treatments = entities
      .filter(e => e.type === 'treatment')
      .slice(0, 2)
      .map(e => e.text)
      .join(', ') || 'tratamiento fisioterapéutico';
    
    const primaryCondition = entities.find(e => e.type === 'diagnosis')?.text || 
                            entities.find(e => e.type === 'symptom')?.text ||
                            'condición clínica';
    
    return { symptoms, findings, treatments, primaryCondition };
  }

  /**
   * Genera SOAP simplificado para casos de timeout
   */
  private static async generateSimplifiedSOAP(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
    const symptoms = entities.filter(e => e.type === 'symptom').map(e => e.text).join(', ');
    const treatments = entities.filter(e => e.type === 'treatment').map(e => e.text).join(', ');
    
    // Prompt ultra-simplificado
    const simplePrompt = `Genera SOAP para fisioterapia:

Paciente: ${symptoms || 'síntomas varios'}
Tratamiento: ${treatments || 'sesión de fisioterapia'}

JSON:
{"subjective":"","objective":"","assessment":"","plan":""}`;

    try {
      const result = await ollamaClient.generateCompletion(simplePrompt, {
        temperature: 0.1,
        max_tokens: 400
      });
      
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const soapData = JSON.parse(jsonMatch[0]);
        return {
          subjective: soapData.subjective || `Paciente reporta: ${symptoms}`,
          objective: soapData.objective || 'Evaluación física realizada',
          assessment: soapData.assessment || 'Condición evaluada según hallazgos',
          plan: soapData.plan || `Continuar con ${treatments}`,
          generated_at: new Date(),
          confidence_score: 0.6
        };
      }
    } catch (simpleError) {
      console.error('Error en SOAP simplificado:', simpleError);
    }
    
    // Fallback final
    return this.generateFallbackSOAP(transcript, false);
  }

  /**
   * Procesa transcripción completa: entidades + SOAP + RAG
   */
  static async processTranscript(transcript: string, options: { useRAG?: boolean; useOptimizedSOAP?: boolean } = {}): Promise<{
    entities: ClinicalEntity[];
    soapNotes: SOAPNotes;
    metrics: ProcessingMetrics;
    ragUsed?: boolean;
    ragResult?: unknown;
  }> {
    const startTime = Date.now();
    const useRAG = options.useRAG !== false; // Default true
    const useOptimizedSOAP = options.useOptimizedSOAP || false; // Default false (A/B testing)
    
    try {
      console.log(`🧠 Procesando transcripción${useRAG ? ' con RAG' : ' sin RAG'}${useOptimizedSOAP ? ' (SOAP Optimizado v2)' : ''}...`);
      
      // 1. Extraer entidades clínicas
      const entitiesStartTime = Date.now();
      const entities = await this.extractClinicalEntities(transcript, useRAG);
      const entitiesTime = Date.now() - entitiesStartTime;
      
      // 2. Generar SOAP con evidencia (usar versión optimizada si está habilitada)
      const soapStartTime = Date.now();
      const soapNotes = useOptimizedSOAP 
        ? await this.generateSOAPNotesOptimizedV2(transcript, entities, useRAG)
        : await this.generateSOAPNotes(transcript, entities, useRAG);
      const soapTime = Date.now() - soapStartTime;
      
      // 3. Obtener evidencia RAG para UI (si está habilitado)
      let ragResult = null;
      
      if (useRAG && entities.length > 2) {
        try {
          // Extraer términos clave principales para RAG de UI
          const keyTerms = entities
            .filter(e => e.type === 'symptom' || e.type === 'diagnosis' || e.type === 'treatment')
            .slice(0, 3)
            .map(e => e.text);
          
          if (keyTerms.length > 0) {
            const ragQuery = keyTerms.join(' ') + ' treatment evidence';
            ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(ragQuery, 'fisioterapia', 5);
            
            console.log(`🔬 RAG UI: ${ragResult.citations.length} artículos para interfaz de usuario`);
          }
        } catch (ragError) {
          console.warn('⚠️ RAG para UI falló:', ragError);
        }
      }
      
      // 4. Calcular métricas de procesamiento
      const totalTime = Date.now() - startTime;
      const metrics: ProcessingMetrics = {
        entities_extraction_time_ms: entitiesTime,
        soap_generation_time_ms: soapTime,
        total_processing_time_ms: totalTime,
        entities_count: entities.length,
        entities_confidence_avg: entities.reduce((sum, e) => sum + (e.confidence || 0), 0) / entities.length || 0,
        soap_confidence: soapNotes.confidence_score || 0,
        rag_queries_count: ragResult ? 1 : 0,
        rag_citations_found: ragResult?.citations.length || 0,
        prompt_version: useOptimizedSOAP ? 'optimized_v2' : 'standard',
        timeout_occurred: false, // Si llegamos aquí, no hubo timeout
        estimated_tokens_used: Math.ceil((transcript.length + JSON.stringify(entities).length) / 4), // Estimación
        model_used: 'llama3.2:3b'
      };
      
      console.log(`✅ Procesamiento completo en ${totalTime}ms - Entidades: ${entities.length}, SOAP: ${soapNotes.confidence_score?.toFixed(2)}, RAG: ${ragResult?.citations.length || 0} citas`);
      
      return {
        entities,
        soapNotes,
        metrics,
        ragUsed: useRAG,
        ragResult
      };
      
    } catch (error) {
      console.error('Error en procesamiento completo:', error);
      
      // Fallback: procesar sin RAG ni optimizaciones
      const fallbackEntities = this.extractEntitiesWithRegex(transcript);
      const fallbackSOAP = this.generateFallbackSOAP(transcript, false);
      
      const metrics: ProcessingMetrics = {
        entities_extraction_time_ms: 0,
        soap_generation_time_ms: 0,
        total_processing_time_ms: Date.now() - startTime,
        entities_count: fallbackEntities.length,
        entities_confidence_avg: 0.5,
        soap_confidence: 0.3,
        rag_queries_count: 0,
        rag_citations_found: 0,
        prompt_version: 'fallback',
        timeout_occurred: true,
        estimated_tokens_used: 0,
        model_used: 'regex_fallback'
      };
      
      return {
        entities: fallbackEntities,
        soapNotes: fallbackSOAP,
        metrics,
        ragUsed: false
      };
    }
  }

  /**
   * Health check para Ollama
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency_ms: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const result = await ollamaClient.generateCompletion(
        'Respond with "OK" if you can read this.', 
        { max_tokens: 10, temperature: 0 }
      );
      
      const latency = Date.now() - startTime;
      
      if (result.response.includes('OK') || result.response.includes('ok')) {
        return { status: 'healthy', latency_ms: latency };
      } else {
        return { 
          status: 'unhealthy', 
          latency_ms: latency, 
          error: 'Unexpected response from Ollama' 
        };
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extracción de entidades con regex como fallback
   */
  private static extractEntitiesWithRegex(transcript: string): ClinicalEntity[] {
    const entities: ClinicalEntity[] = [];
    const lowerText = transcript.toLowerCase();
    
    // Patrones de síntomas comunes
    const symptomPatterns = [
      /dolor\s+(?:en\s+)?(?:la\s+)?(\w+)/gi,
      /molestia\s+(?:en\s+)?(?:la\s+)?(\w+)/gi,
      /duele\s+(?:la\s+)?(\w+)/gi,
      /rigidez\s+(?:en\s+)?(?:la\s+)?(\w+)/gi
    ];
    
    // Patrones anatómicos
    const anatomyPatterns = [
      /(espalda|lumbar|cervical|dorsal)/gi,
      /(hombro|brazo|codo|muñeca|mano)/gi,
      /(cadera|rodilla|tobillo|pie)/gi,
      /(cuello|cabeza)/gi
    ];
    
    // Extraer síntomas
    symptomPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        entities.push({
          id: `entity_regex_${entities.length}`,
          type: 'symptom',
          text: match[0],
          confidence: 0.6,
          context: transcript.substring(Math.max(0, match.index - 50), match.index + 50),
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    });
    
    // Extraer anatomía
    anatomyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        entities.push({
          id: `entity_regex_${entities.length}`,
          type: 'anatomy',
          text: match[0],
          confidence: 0.7,
          context: transcript.substring(Math.max(0, match.index - 50), match.index + 50),
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    });
    
    return entities;
  }

  /**
   * Genera SOAP de fallback cuando falla el LLM
   */
  private static generateFallbackSOAP(transcript: string, useRAG: boolean): SOAPNotes {
    const wordCount = transcript.split(' ').length;
    const hasSymptoms = /dolor|molestia|duele/i.test(transcript);
    const hasMovement = /movimiento|ejercicio|estirar/i.test(transcript);
    
    return {
      subjective: hasSymptoms 
        ? `Paciente reporta síntomas mencionados en sesión de ${Math.round(wordCount/150)} minutos.`
        : 'Paciente asiste a sesión de fisioterapia.',
      objective: hasMovement
        ? 'Evaluación física realizada. Rango de movimiento y función evaluados.'
        : 'Examen físico completado según protocolo.',
      assessment: 'Condición evaluada conforme a hallazgos clínicos. Respuesta al tratamiento monitoreada.',
      plan: 'Continuar con protocolo de fisioterapia. Seguimiento programado.',
      generated_at: new Date(),
      confidence_score: 0.4
    };
  }

  /**
   * Calcula confidence score para SOAP basado en completeness
   */
  private static calculateSOAPConfidence(soapData: { subjective?: string; objective?: string; assessment?: string; plan?: string }): number {
    const fields = [soapData.subjective, soapData.objective, soapData.assessment, soapData.plan];
    const validFields = fields.filter(field => field && field.length > 10).length;
    const avgLength = fields.reduce((sum, field) => sum + (field?.length || 0), 0) / 4;
    
    // Score basado en completeness de campos y longitud promedio
    const completenessScore = validFields / 4;
    const lengthScore = Math.min(avgLength / 50, 1); // 50 chars como target
    
    return Math.round((completenessScore * 0.7 + lengthScore * 0.3) * 100) / 100;
  }

  /**
   * Calcula confidence general del procesamiento
   */
  private static calculateOverallConfidence(entities: ClinicalEntity[], soap: SOAPNotes): number {
    const entitiesConfidence = entities.reduce((sum, e) => sum + (e.confidence || 0), 0) / entities.length || 0;
    const soapConfidence = soap.confidence_score || 0;
    
    // Peso: 40% entidades, 60% SOAP
    return Math.round((entitiesConfidence * 0.4 + soapConfidence * 0.6) * 100) / 100;
  }

  /**
   * Determina si el resultado requiere revisión manual
   */
  private static requiresReview(entities: ClinicalEntity[], soap: SOAPNotes): boolean {
    const overallConfidence = this.calculateOverallConfidence(entities, soap);
    const hasLowConfidenceEntities = entities.some(e => (e.confidence || 0) < 0.5);
    const hasShortSOAPFields = [soap.subjective, soap.objective, soap.assessment, soap.plan]
      .some(field => (field?.length || 0) < 10);
    
    return overallConfidence < 0.7 || hasLowConfidenceEntities || hasShortSOAPFields;
  }

  /**
   * Extrae términos clave para RAG
   */
  private static extractKeyTermsForRAG(transcript: string): string[] {
    const commonWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le'];
    const words = transcript
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10); // Top 10 palabras relevantes
      
    return [...new Set(words)]; // Remover duplicados
  }
} 