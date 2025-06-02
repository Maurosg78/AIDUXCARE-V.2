/**
 * 🧬 AiDuxCare - Servicio NLP con Ollama + RAG
 * Procesamiento de lenguaje natural para fisioterapia usando LLM local + evidencia científica
 */

import { ollamaClient } from '../lib/ollama';
import { ClinicalEntity, SOAPNotes, ProcessingMetrics } from '../types/nlp';
import { RAGMedicalMCP } from '../core/mcp/RAGMedicalMCP';

export class NLPServiceOllama {
  
  /**
   * Extrae entidades clínicas de una transcripción médica con RAG
   */
  static async extractClinicalEntities(transcript: string, useRAG: boolean = true): Promise<ClinicalEntity[]> {
    const startTime = Date.now();
    
    // Construir prompt base
    let prompt = `
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Eres un asistente especializado en análisis de transcripciones médicas para fisioterapia. Tu tarea es extraer entidades clínicas importantes de manera precisa y estructurada.

TIPOS DE ENTIDADES A IDENTIFICAR:
- symptom: Síntomas reportados por el paciente
- treatment: Tratamientos aplicados durante la sesión
- diagnosis: Diagnósticos mencionados o evaluaciones
- objective: Observaciones objetivas del fisioterapeuta
- plan: Planes de tratamiento futuro
- exercise: Ejercicios específicos mencionados
- progress: Indicadores de progreso del paciente
- medication: Medicamentos mencionados
- contraindication: Contraindicaciones identificadas
- goal: Objetivos terapéuticos`;

    // Enriquecer con RAG si está habilitado
    if (useRAG) {
      try {
        console.log('🔍 Enriqueciendo análisis con evidencia científica...');
        
        // Extraer términos clave para búsqueda RAG
        const keyTerms = this.extractKeyTermsForRAG(transcript);
        
        if (keyTerms.length > 0) {
          const ragQuery = keyTerms.slice(0, 3).join(' ');
          const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(ragQuery, 'fisioterapia', 3);
          
          if (ragResult.citations.length > 0) {
            prompt += `

EVIDENCIA CIENTÍFICA RELEVANTE:
${ragResult.medical_context}

INSTRUCCIÓN: Considera esta evidencia científica al analizar la transcripción para mejorar la precisión de la extracción de entidades clínicas.`;
            
            console.log(`✅ RAG: Añadida evidencia de ${ragResult.citations.length} fuentes científicas`);
          }
        }
      } catch (error) {
        console.warn('⚠️ RAG enhancements failed, continuing with standard analysis:', error);
      }
    }

    prompt += `

INSTRUCCIONES:
1. Analiza cuidadosamente toda la transcripción
2. Identifica entidades relevantes para fisioterapia
3. Asigna un nivel de confianza (0.0 a 1.0)
4. Responde ÚNICAMENTE con un array JSON válido
5. No incluyas texto adicional ni explicaciones

FORMATO DE RESPUESTA:
[
  {"type": "symptom", "text": "dolor en rodilla derecha", "confidence": 0.95},
  {"type": "treatment", "text": "terapia manual", "confidence": 0.90}
]

<|eot_id|><|start_header_id|>user<|end_header_id|>

Analiza esta transcripción de fisioterapia:

"${transcript}"

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

    try {
      const result = await ollamaClient.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 1500
      });
      
      const processingTime = Date.now() - startTime;
      
      // Intentar extraer JSON de la respuesta
      const jsonMatch = result.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const entities: ClinicalEntity[] = JSON.parse(jsonMatch[0]);
          
          // Validar y limpiar entidades
          const validEntities = entities.filter(entity => 
            entity && 
            typeof entity.type === 'string' && 
            typeof entity.text === 'string' &&
            typeof entity.confidence === 'number' &&
            entity.confidence >= 0 && entity.confidence <= 1
          );

          console.log(`✅ Entidades extraídas: ${validEntities.length} en ${processingTime}ms${useRAG ? ' (con RAG)' : ''}`);
          return validEntities;
          
        } catch (parseError) {
          console.error('Error parsing JSON entities:', parseError);
        }
      }
      
      // Fallback: intentar extraer entidades con regex
      return this.extractEntitiesWithRegex(transcript);
      
    } catch (error) {
      console.error('Error extracting entities:', error);
      
      // Fallback básico
      return this.extractEntitiesWithRegex(transcript);
    }
  }

  /**
   * Genera notas SOAP optimizadas (evita timeouts)
   */
  static async generateSOAPNotes(transcript: string, entities: ClinicalEntity[], useRAG: boolean = true): Promise<SOAPNotes> {
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
        max_tokens: 800 // Reducido para evitar timeouts
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

          console.log(`✅ Nota SOAP generada en ${processingTime}ms${useRAG ? ' (con evidencia)' : ''}`);
          return soapNotes;
          
        } catch (parseError) {
          console.error('Error parsing SOAP JSON:', parseError);
        }
      }
      
      // Fallback: generar SOAP básico
      return this.generateFallbackSOAP(transcript, useRAG);
      
    } catch (error) {
      console.error('Error generating SOAP notes:', error);
      
      // Si hay timeout, intentar versión ultra-simplificada
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('🔄 Timeout detectado, intentando versión simplificada...');
        return this.generateSimplifiedSOAP(transcript, entities);
      }
      
      throw new Error(`Failed to generate SOAP notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
  static async processTranscript(transcript: string, options: { useRAG?: boolean } = {}): Promise<{
    entities: ClinicalEntity[];
    soapNotes: SOAPNotes;
    metrics: ProcessingMetrics;
    ragUsed?: boolean;
    ragResult?: any; // Añadir resultado RAG
  }> {
    const startTime = Date.now();
    const useRAG = options.useRAG !== false; // Default true
    
    try {
      console.log(`🧠 Procesando transcripción${useRAG ? ' con RAG' : ' sin RAG'}...`);
      
      // 1. Extraer entidades clínicas
      const entitiesStartTime = Date.now();
      const entities = await this.extractClinicalEntities(transcript, useRAG);
      const entitiesTime = Date.now() - entitiesStartTime;
      
      // 2. Generar SOAP con evidencia
      const soapStartTime = Date.now();
      const soapNotes = await this.generateSOAPNotes(transcript, entities, useRAG);
      const soapTime = Date.now() - soapStartTime;
      
      // 3. Obtener evidencia RAG para UI (si está habilitado)
      let ragResult = null;
      let ragTime = 0;
      
      if (useRAG && entities.length > 2) {
        const ragStartTime = Date.now();
        try {
          // Extraer términos clave principales para RAG de UI
          const keyTerms = entities
            .filter(e => e.type === 'symptom' || e.type === 'diagnosis' || e.type === 'treatment')
            .slice(0, 3)
            .map(e => e.text);
          
          if (keyTerms.length > 0) {
            const ragQuery = keyTerms.join(' ') + ' treatment evidence';
            ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(ragQuery, 'fisioterapia', 5);
            ragTime = Date.now() - ragStartTime;
            
            console.log(`🔬 RAG UI: ${ragResult.citations.length} artículos para interfaz de usuario`);
          }
        } catch (ragError) {
          console.warn('⚠️ RAG para UI falló:', ragError);
          ragTime = Date.now() - ragStartTime;
        }
      }
      
      const totalTime = Date.now() - startTime;
      
      const metrics: ProcessingMetrics = {
        session_id: `session_${Date.now()}`,
        total_processing_time_ms: totalTime,
        stt_duration_ms: 0, // No aplica para este servicio
        stt_confidence: 1.0,
        entity_extraction_time_ms: entitiesTime,
        entities_extracted: entities.length,
        soap_generation_time_ms: soapTime,
        soap_completeness: soapNotes.confidence_score || 0.8,
        total_tokens_used: 0, // Ollama no reporta tokens exactos
        estimated_cost_usd: 0.0, // Gratis!
        overall_confidence: this.calculateOverallConfidence(entities, soapNotes),
        requires_review: this.requiresReview(entities, soapNotes)
      };
      
      console.log(`✅ Procesamiento completo: ${entities.length} entidades, SOAP ${Math.round((soapNotes.confidence_score || 0) * 100)}% confianza${ragResult ? `, RAG ${ragResult.citations.length} artículos` : ''}`);
      
      return {
        entities,
        soapNotes,
        metrics,
        ragUsed: useRAG,
        ragResult // Incluir resultado RAG para UI
      };
      
    } catch (error) {
      console.error('Error en processTranscript:', error);
      throw new Error(`Transcript processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check del servicio NLP
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency_ms: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Test simple de funcionamiento
      const testResult = await this.extractClinicalEntities(
        "El paciente reporta dolor leve en rodilla izquierda."
      );
      
      const latency = Date.now() - startTime;
      
      return {
        status: testResult.length >= 0 ? 'healthy' : 'unhealthy',
        latency_ms: latency
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // === MÉTODOS PRIVADOS DE UTILIDAD ===

  /**
   * Extracción de entidades con regex como fallback
   */
  private static extractEntitiesWithRegex(transcript: string): ClinicalEntity[] {
    const entities: ClinicalEntity[] = [];
    
    // Patrones para síntomas
    const symptomPatterns = [
      /dolor\s+(?:en\s+)?(\w+)/gi,
      /molestia\s+(?:en\s+)?(\w+)/gi,
      /inflamación\s+(?:en\s+)?(\w+)/gi
    ];
    
    // Patrones para tratamientos
    const treatmentPatterns = [
      /(?:aplicar|realizar|hacer)\s+([^.]+)/gi,
      /terapia\s+(\w+)/gi,
      /masaje\s+(\w+)/gi
    ];
    
    // Buscar síntomas
    symptomPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        entities.push({
          type: 'symptom',
          text: match[0],
          confidence: 0.7
        });
      }
    });
    
    // Buscar tratamientos
    treatmentPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        entities.push({
          type: 'treatment',
          text: match[0],
          confidence: 0.6
        });
      }
    });
    
    return entities.slice(0, 10); // Limitar a 10 entidades
  }

  /**
   * Genera SOAP básico como fallback
   */
  private static generateFallbackSOAP(transcript: string, useRAG: boolean): SOAPNotes {
    const words = transcript.split(' ').length;
    
    return {
      subjective: transcript.length > 100 
        ? "Paciente reporta síntomas según transcripción. Requiere revisión manual."
        : transcript,
      objective: "Evaluación física pendiente de documentar.",
      assessment: "Análisis clínico requiere completar información.",
      plan: words > 50 
        ? "Plan de tratamiento basado en evaluación completa pendiente."
        : "Continuar seguimiento según protocolo estándar.",
      generated_at: new Date(),
      confidence_score: useRAG ? 0.5 : 0.3
    };
  }

  /**
   * Calcula confianza de la nota SOAP
   */
  private static calculateSOAPConfidence(soapData: any): number {
    let score = 0;
    
    if (soapData.subjective && soapData.subjective.length > 20) score += 0.25;
    if (soapData.objective && soapData.objective.length > 20) score += 0.25;
    if (soapData.assessment && soapData.assessment.length > 20) score += 0.25;
    if (soapData.plan && soapData.plan.length > 20) score += 0.25;
    
    return Math.round(score * 100) / 100;
  }

  /**
   * Calcula confianza general del procesamiento
   */
  private static calculateOverallConfidence(entities: ClinicalEntity[], soap: SOAPNotes): number {
    const entityConfidence = entities.length > 0 
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
      : 0.5;
    
    const soapConfidence = soap.confidence_score || 0.5;
    
    return Math.round(((entityConfidence + soapConfidence) / 2) * 100) / 100;
  }

  /**
   * Determina si requiere revisión médica
   */
  private static requiresReview(entities: ClinicalEntity[], soap: SOAPNotes): boolean {
    // Requiere revisión si:
    // 1. Pocas entidades extraídas
    // 2. Baja confianza en SOAP
    // 3. Palabras clave de alarma
    
    const lowEntityCount = entities.length < 2;
    const lowSOAPConfidence = (soap.confidence_score || 0) < 0.6;
    
    const alarmKeywords = [
      'dolor severo', 'dolor intenso', 'emergencia', 
      'fractura', 'lesión grave', 'cirugía'
    ];
    
    const fullText = `${soap.subjective} ${soap.objective} ${soap.assessment} ${soap.plan}`.toLowerCase();
    const hasAlarmKeywords = alarmKeywords.some(keyword => fullText.includes(keyword));
    
    return lowEntityCount || lowSOAPConfidence || hasAlarmKeywords;
  }

  /**
   * Extrae términos clave para búsqueda RAG
   */
  private static extractKeyTermsForRAG(transcript: string): string[] {
    const keyTerms: string[] = [];
    
    // Términos anatómicos comunes
    const anatomicalTerms = [
      'cervical', 'lumbar', 'rodilla', 'hombro', 'columna', 'cadera', 
      'tobillo', 'muñeca', 'codo', 'espalda', 'cuello'
    ];
    
    // Términos de condiciones
    const conditionTerms = [
      'dolor', 'contractura', 'esguince', 'tendinitis', 'bursitis',
      'hernia', 'artritis', 'fractura', 'lesión'
    ];
    
    // Términos de tratamiento
    const treatmentTerms = [
      'fisioterapia', 'rehabilitación', 'ejercicio', 'terapia manual',
      'estiramiento', 'fortalecimiento', 'movilización'
    ];
    
    const transcriptLower = transcript.toLowerCase();
    
    // Buscar términos anatómicos
    anatomicalTerms.forEach(term => {
      if (transcriptLower.includes(term)) {
        keyTerms.push(term);
      }
    });
    
    // Buscar términos de condiciones
    conditionTerms.forEach(term => {
      if (transcriptLower.includes(term)) {
        keyTerms.push(term);
      }
    });
    
    // Buscar términos de tratamiento
    treatmentTerms.forEach(term => {
      if (transcriptLower.includes(term)) {
        keyTerms.push(term);
      }
    });
    
    // Remover duplicados y limitar
    return Array.from(new Set(keyTerms)).slice(0, 5);
  }
} 