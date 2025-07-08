const winston = require('winston');
const VertexAIClient = require('./VertexAIClient');
const KnowledgeBase = require('./KnowledgeBase');

/**
 * ClinicalInsightService - Arquitectura de Cascada V2
 * 
 * Implementa un pipeline de análisis clínico en 3 estaciones:
 * 1. Triaje de Banderas Rojas (Gemini-Flash, <5s)
 * 2. Extracción de Hechos Clínicos (Gemini-Flash, estructurado)
 * 3. Análisis Final y SOAP (Gemini-Pro, contextualizado)
 * 
 * @author Mauricio Sobarzo
 * @version 2.0 - Cascade Architecture
 */
class ClinicalInsightService {
  constructor() {
    this.vertexClient = new VertexAIClient();
    this.knowledgeBase = new KnowledgeBase();
    
    // Configurar logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
    
    this.logger.info('🏗️ ClinicalInsightService inicializado con arquitectura de cascada');
  }

  /**
   * ESTACIÓN 1: TRIAJE DE BANDERAS ROJAS
   * 
   * Usa Gemini-Flash para identificación rápida (<5s) de banderas rojas críticas
   * Objetivo: Alert inmediato al clínico si hay emergencias
   * 
   * @param {string} transcription - Transcripción original de la consulta
   * @returns {Promise<string[]>} Array de banderas rojas detectadas
   */
  async triageRedFlags(transcription) {
    const startTime = Date.now();
    
    this.logger.info('🚩 ESTACIÓN 1: Iniciando triaje de banderas rojas', {
      transcriptionLength: transcription.length,
      model: 'gemini-flash'
    });

    try {
      // Obtener banderas rojas críticas desde knowledge base
      const criticalRedFlags = this.knowledgeBase.getCriticalRedFlags();
      
      // Construir prompt específico y corto para Gemini-Flash
      const triagePrompt = this._buildTriagePrompt(transcription, criticalRedFlags);
      
      // Llamada optimizada a Gemini-Flash
      const result = await this.vertexClient.processWithModel(
        transcription,
        triagePrompt,
        'gemini-flash', // Modelo rápido y barato
        {
          maxTokens: 500, // Respuesta corta
          temperature: 0.1 // Precisión alta, creatividad baja
        }
      );

      // Parsear resultado a array de strings
      const redFlags = this._parseRedFlagsResponse(result.text);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      this.logger.info('✅ ESTACIÓN 1: Triaje completado', {
        redFlagsDetected: redFlags.length,
        redFlags: redFlags,
        processingTime: processingTime,
        model: result.modelUsed,
        cost: result.costOptimization?.estimatedCost || 'N/A'
      });

      return redFlags;
      
    } catch (error) {
      this.logger.error('❌ ESTACIÓN 1: Error en triaje de banderas rojas', {
        error: error.message,
        stack: error.stack,
        processingTime: (Date.now() - startTime) / 1000
      });
      
      // Retornar array vacío en caso de error para no bloquear el pipeline
      return [];
    }
  }

  /**
   * ESTACIÓN 2: EXTRACCIÓN DE HECHOS CLÍNICOS
   * 
   * Usa Gemini-Flash para extraer entidades clínicas estructuradas
   * Objetivo: Base de datos limpia de hechos para análisis final
   * 
   * @param {string} transcription - Transcripción original de la consulta  
   * @returns {Promise<Object>} Objeto JSON con hechos clínicos estructurados
   */
  async extractClinicalFacts(transcription) {
    const startTime = Date.now();
    
    this.logger.info('📋 ESTACIÓN 2: Iniciando extracción de hechos clínicos', {
      transcriptionLength: transcription.length,
      model: 'gemini-flash'
    });

    try {
      // Construir prompt para extracción estructurada
      const extractionPrompt = this._buildExtractionPrompt(transcription);
      
      // Llamada optimizada a Gemini-Flash
      const result = await this.vertexClient.processWithModel(
        transcription,
        extractionPrompt,
        'gemini-flash', // Modelo rápido y barato
        {
          maxTokens: 1000, // Respuesta estructurada mediana
          temperature: 0.2 // Precisión alta con algo de flexibilidad
        }
      );

      // Parsear resultado a objeto JSON estructurado
      const clinicalFacts = this._parseClinicalFactsResponse(result.text);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      this.logger.info('✅ ESTACIÓN 2: Extracción completada', {
        factsExtracted: Object.keys(clinicalFacts).length,
        hasSymptoms: !!clinicalFacts.symptoms,
        hasMedications: !!clinicalFacts.medications,
        hasHistory: !!clinicalFacts.history,
        processingTime: processingTime,
        model: result.modelUsed,
        cost: result.costOptimization?.estimatedCost || 'N/A'
      });

      return clinicalFacts;
      
    } catch (error) {
      this.logger.error('❌ ESTACIÓN 2: Error en extracción de hechos', {
        error: error.message,
        stack: error.stack,
        processingTime: (Date.now() - startTime) / 1000
      });
      
      // Retornar objeto vacío en caso de error para no bloquear el pipeline
      return {};
    }
  }

  /**
   * ESTACIÓN 3: ANÁLISIS FINAL Y GENERACIÓN SOAP
   * 
   * Usa Gemini-Pro para análisis profundo y generación SOAP completa
   * Objetivo: Análisis de máxima calidad usando información pre-procesada
   * 
   * @param {string} transcription - Transcripción original
   * @param {string[]} redFlags - Banderas rojas detectadas en Estación 1
   * @param {Object} clinicalFacts - Hechos clínicos extraídos en Estación 2
   * @returns {Promise<Object>} Análisis clínico completo con SOAP
   */
  async generateFinalAnalysis(transcription, redFlags, clinicalFacts) {
    const startTime = Date.now();
    
    this.logger.info('🎯 ESTACIÓN 3: Iniciando análisis final y SOAP', {
      transcriptionLength: transcription.length,
      redFlagsCount: redFlags.length,
      clinicalFactsKeys: Object.keys(clinicalFacts).length,
      model: 'gemini-pro'
    });

    try {
      // Construir super-prompt contextualizado con información pre-procesada
      const finalPrompt = this._buildFinalAnalysisPrompt(
        transcription, 
        redFlags, 
        clinicalFacts
      );
      
      // Llamada a Gemini-Pro para análisis profundo
      const result = await this.vertexClient.processWithModel(
        transcription,
        finalPrompt,
        'gemini-pro', // Modelo potente y preciso
        {
          maxTokens: 3000, // Respuesta completa y detallada
          temperature: 0.3 // Balance entre precisión y calidad narrativa
        }
      );

      // Parsear resultado a objeto de análisis clínico completo
      const finalAnalysis = this._parseFinalAnalysisResponse(result.text);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      this.logger.info('✅ ESTACIÓN 3: Análisis final completado', {
        hasWarnings: !!finalAnalysis.warnings,
        hasSuggestions: !!finalAnalysis.suggestions,
        hasSOAP: !!finalAnalysis.soap_analysis,
        processingTime: processingTime,
        model: result.modelUsed,
        cost: result.costOptimization?.estimatedCost || 'N/A'
      });

      return finalAnalysis;
      
    } catch (error) {
      this.logger.error('❌ ESTACIÓN 3: Error en análisis final', {
        error: error.message,
        stack: error.stack,
        processingTime: (Date.now() - startTime) / 1000
      });
      
      throw error; // Re-throw para manejar en nivel superior
    }
  }

  /**
   * MÉTODO PRINCIPAL: EJECUTA CASCADA COMPLETA
   * 
   * Ejecuta las 3 estaciones secuencialmente y retorna análisis completo
   * 
   * @param {string} transcription - Transcripción de la consulta
   * @param {Object} options - Opciones adicionales (specialty, sessionType, etc.)
   * @returns {Promise<Object>} Resultado completo del análisis con metadata
   */
  async processTranscription(transcription, options = {}) {
    const cascadeStartTime = Date.now();
    
    this.logger.info('🚀 INICIANDO CASCADA DE ANÁLISIS CLÍNICO', {
      transcriptionLength: transcription.length,
      specialty: options.specialty || 'fisioterapia',
      sessionType: options.sessionType || 'initial',
      cascadeId: this._generateCascadeId()
    });

    try {
      // ESTACIÓN 1: Triaje de Banderas Rojas (Gemini-Flash, <5s)
      const redFlags = await this.triageRedFlags(transcription);
      
      // ESTACIÓN 2: Extracción de Hechos (Gemini-Flash, estructurado)
      const clinicalFacts = await this.extractClinicalFacts(transcription);
      
      // ESTACIÓN 3: Análisis Final (Gemini-Pro, contextualizado)
      const finalAnalysis = await this.generateFinalAnalysis(
        transcription, 
        redFlags, 
        clinicalFacts
      );

      const totalCascadeTime = (Date.now() - cascadeStartTime) / 1000;

      // Ensamblar resultado final con metadata de cascada
      const cascadeResult = {
        ...finalAnalysis,
        cascade_metadata: {
          pipeline_version: '2.0-cascade',
          total_processing_time: totalCascadeTime,
          stations_completed: 3,
          station_results: {
            station1_red_flags: {
              count: redFlags.length,
              flags: redFlags
            },
            station2_clinical_facts: {
              keys_extracted: Object.keys(clinicalFacts).length,
              categories: Object.keys(clinicalFacts)
            },
            station3_final_analysis: {
              sections_generated: [
                finalAnalysis.warnings ? 'warnings' : null,
                finalAnalysis.suggestions ? 'suggestions' : null,
                finalAnalysis.soap_analysis ? 'soap_analysis' : null
              ].filter(Boolean)
            }
          },
          cost_optimization: {
            models_used: ['gemini-flash', 'gemini-flash', 'gemini-pro'],
            strategy: 'cascade-optimization',
            estimated_savings: '60-70% vs single Pro call'
          },
          timestamp: new Date().toISOString()
        }
      };

      this.logger.info('🎉 CASCADA DE ANÁLISIS COMPLETADA EXITOSAMENTE', {
        totalTime: totalCascadeTime,
        redFlagsDetected: redFlags.length,
        clinicalFactsExtracted: Object.keys(clinicalFacts).length,
        finalAnalysisSections: Object.keys(finalAnalysis).length,
        estimatedSavings: '60-70%'
      });

      return cascadeResult;

    } catch (error) {
      const totalTime = (Date.now() - cascadeStartTime) / 1000;
      
      this.logger.error('💥 ERROR EN CASCADA DE ANÁLISIS', {
        error: error.message,
        stack: error.stack,
        totalTime: totalTime,
        transcriptionLength: transcription.length
      });

      throw new Error(`Cascada de análisis falló: ${error.message}`);
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS PARA CONSTRUCCIÓN DE PROMPTS
  // ========================================

  /**
   * Construye prompt específico para triaje rápido de banderas rojas
   */
  _buildTriagePrompt(transcription, criticalRedFlags) {
    return `Actúa como un fisioterapeuta experto realizando triaje rápido de emergencias.

TRANSCRIPCIÓN:
${transcription}

BANDERAS ROJAS CRÍTICAS A BUSCAR:
${criticalRedFlags.map(flag => `- ${flag}`).join('\n')}

INSTRUCCIONES:
1. Lee la transcripción en busca de las banderas rojas críticas listadas
2. Identifica SOLO las banderas rojas que están claramente presentes
3. Responde ÚNICAMENTE con una lista simple de banderas rojas detectadas
4. Si no hay banderas rojas, responde "NINGUNA"
5. Se específico y conciso - esta es evaluación de emergencia (<5 segundos)

FORMATO DE RESPUESTA:
Solo lista las banderas rojas detectadas, una por línea, sin explicaciones adicionales.

EJEMPLO:
Dolor nocturno severo
Pérdida de peso inexplicada
Fiebre persistente

RESPUESTA:`;
  }

  /**
   * Construye prompt para extracción estructurada de hechos clínicos
   */
  _buildExtractionPrompt(transcription) {
    return `Actúa como un asistente clínico experto en extracción de datos estructurados.

TRANSCRIPCIÓN:
${transcription}

INSTRUCCIONES:
Extrae y estructura TODOS los hechos clínicos relevantes de la transcripción en formato JSON.
Incluye solo información que esté explícitamente mencionada.

FORMATO DE RESPUESTA - JSON ESTRUCTURADO:
{
  "symptoms": {
    "primary_complaint": "string",
    "pain_location": "string",
    "pain_intensity": "number/10",
    "duration": "string",
    "aggravating_factors": ["array"],
    "relieving_factors": ["array"]
  },
  "history": {
    "onset": "string",
    "previous_episodes": "boolean",
    "previous_treatments": ["array"],
    "trauma_history": "string"
  },
  "medications": {
    "current_medications": ["array"],
    "allergies": ["array"],
    "recent_medications": ["array"]
  },
  "functional_status": {
    "activities_affected": ["array"],
    "work_impact": "string",
    "sleep_impact": "string"
  },
  "physical_examination": {
    "observations": ["array"],
    "range_of_motion": "string",
    "strength": "string",
    "special_tests": ["array"]
  },
  "patient_demographics": {
    "age_mentioned": "string",
    "occupation": "string",
    "activity_level": "string"
  }
}

REGLAS:
- Solo incluir campos con información real de la transcripción
- Usar "null" para campos sin información
- Mantener exactitud a lo mencionado
- No inferir información no explícita

RESPUESTA JSON:`;
  }

  /**
   * Construye super-prompt final contextualizado para análisis profundo
   */
  _buildFinalAnalysisPrompt(transcription, redFlags, clinicalFacts) {
    return `Actúa como un fisioterapeuta clínico experto realizando análisis completo y generación de nota SOAP.

INFORMACIÓN PRE-PROCESADA:

TRANSCRIPCIÓN ORIGINAL:
${transcription}

BANDERAS ROJAS DETECTADAS:
${redFlags.length > 0 ? redFlags.map(flag => `- ${flag}`).join('\n') : 'Ninguna bandera roja crítica detectada'}

HECHOS CLÍNICOS ESTRUCTURADOS:
${JSON.stringify(clinicalFacts, null, 2)}

INSTRUCCIONES PARA ANÁLISIS COMPLETO:
Usando toda la información pre-procesada, genera un análisis clínico completo que incluya:

1. WARNINGS: Alertas clínicas basadas en banderas rojas y patrones de riesgo
2. SUGGESTIONS: Recomendaciones de tratamiento y seguimiento específicas de fisioterapia
3. SOAP_ANALYSIS: Nota SOAP profesional completa

FORMATO DE RESPUESTA - JSON ESTRUCTURADO:
{
  "warnings": [
    {
      "id": "string",
      "severity": "HIGH|MEDIUM|LOW",
      "category": "string",
      "title": "string",
      "description": "string",
      "recommendation": "string",
      "evidence": "string"
    }
  ],
  "suggestions": [
    {
      "id": "string", 
      "type": "treatment|assessment|referral|education",
      "title": "string",
      "description": "string",
      "rationale": "string",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "soap_analysis": {
    "subjective": {
      "chief_complaint": "string",
      "history_present_illness": "string", 
      "relevant_history": "string",
      "functional_goals": "string"
    },
    "objective": {
      "observation": "string",
      "palpation": "string",
      "range_of_motion": "string",
      "strength_testing": "string",
      "special_tests": "string",
      "functional_assessment": "string"
    },
    "assessment": {
      "clinical_impression": "string",
      "differential_diagnosis": ["array"],
      "prognosis": "string",
      "risk_stratification": "LOW|MEDIUM|HIGH"
    },
    "plan": {
      "immediate_actions": ["array"],
      "treatment_plan": "string", 
      "referrals_needed": ["array"],
      "follow_up_schedule": "string",
      "patient_education": "string"
    }
  },
  "clinical_summary": {
    "key_findings": "string",
    "treatment_priority": "string",
    "expected_outcomes": "string",
    "safety_considerations": "string"
  }
}

CONSIDERACIONES ESPECIALES:
- Integra las banderas rojas en warnings con alta prioridad
- Usa los hechos clínicos estructurados para completar la nota SOAP
- Mantén enfoque específico de fisioterapia
- Proporciona recomendaciones accionables y específicas
- Considera la información pre-procesada como datos ya validados

RESPUESTA JSON:`;
  }

  // ========================================
  // MÉTODOS PRIVADOS PARA PARSING DE RESPUESTAS
  // ========================================

  /**
   * Parsea respuesta de triaje a array de banderas rojas
   */
  _parseRedFlagsResponse(response) {
    try {
      if (!response || response.trim().toLowerCase() === 'ninguna') {
        return [];
      }
      
      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.toLowerCase().includes('ninguna'))
        .slice(0, 10); // Máximo 10 banderas rojas
        
    } catch (error) {
      this.logger.error('Error parseando banderas rojas:', error);
      return [];
    }
  }

  /**
   * Parsea respuesta de extracción a objeto JSON de hechos clínicos
   */
  _parseClinicalFactsResponse(response) {
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      this.logger.warn('No se encontró JSON válido en respuesta de extracción');
      return {};
      
    } catch (error) {
      this.logger.error('Error parseando hechos clínicos:', error);
      return {};
    }
  }

  /**
   * Parsea respuesta de análisis final a objeto completo
   */
  _parseFinalAnalysisResponse(response) {
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No se encontró JSON válido en análisis final');
      
    } catch (error) {
      this.logger.error('Error parseando análisis final:', error);
      throw error;
    }
  }

  /**
   * Genera ID único para seguimiento de cascada
   */
  _generateCascadeId() {
    return `cascade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ClinicalInsightService; 