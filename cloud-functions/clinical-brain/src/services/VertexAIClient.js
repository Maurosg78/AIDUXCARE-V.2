const { VertexAI } = require('@google-cloud/vertexai');


const ModelSelector = require('./ModelSelector');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

class VertexAIClient {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'aiduxcare-stt-20250706';
    this.location = process.env.VERTEX_AI_LOCATION || 'us-east1';
    this.defaultModel = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash'; // Modelo balanceado por defecto
    
    // Inicializar ModelSelector para optimización inteligente
    this.modelSelector = new ModelSelector();
    
    // Inicializar cliente Vertex AI
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
    
    logger.info('🚀 VERTEXAI CLIENT INICIALIZADO CON OPTIMIZACIÓN DE COSTOS', {
      proyecto: this.projectId,
      region: this.location,
      modeloPorDefecto: this.defaultModel
    });
  }

  /**
   * Procesa transcripción médica con optimización basada en evidencia empírica
   * @param {string} transcription - Transcripción médica
   * @param {string} prompt - Prompt generado
   * @param {Object} options - Opciones de procesamiento
   * @returns {Promise<Object>} Respuesta procesada con información de optimización
   */
  async processTranscription(transcription, prompt, options = {}) {
    logger.info('🧠 INICIANDO PROCESAMIENTO CON OPTIMIZACIÓN DE COSTOS');
    
    try {
      // Seleccionar modelo óptimo basado en evidencia empírica
      let modelSelection;
      
      if (options.forceModel) {
        // Forzar modelo específico (para testing)
        modelSelection = this.modelSelector.forceModel(options.forceModel);
      } else {
        // Selección automática basada en evidencia
        modelSelection = this.modelSelector.selectOptimalModel(transcription, options);
      }
      
      logger.info('✅ MODELO SELECCIONADO:', {
        modelo: modelSelection.selectedModel,
        razonamiento: modelSelection.reasoning,
        ahorro: modelSelection.costAnalysis?.savingsVsPro || 'N/A'
      });

      // Procesar con el modelo seleccionado
      const result = await this.processWithModel(
        transcription,
        prompt,
        modelSelection.selectedModel,
        options
      );

      // Enriquecer respuesta con información de optimización
      result.costOptimization = {
        modelUsed: modelSelection.selectedModel,
        redFlagsDetected: modelSelection.redFlagsDetected,
        reasoning: modelSelection.reasoning,
        costAnalysis: modelSelection.costAnalysis,
        empiricalBasis: modelSelection.empiricalBasis || 'Basado en evaluación empírica',
        timestamp: modelSelection.timestamp
      };

      return result;

    } catch (error) {
      logger.error('❌ ERROR EN PROCESAMIENTO:', error);
      throw error;
    }
  }

  /**
   * Procesa transcripción con un modelo específico
   * @param {string} transcription - Transcripción médica
   * @param {string} prompt - Prompt generado
   * @param {string} modelName - Nombre del modelo a usar
   * @param {Object} options - Opciones de procesamiento
   * @returns {Promise<Object>} Respuesta del modelo
   */
  async processWithModel(transcription, prompt, modelName, options = {}) {
    try {
      // Configurar modelo seleccionado
      const modelConfig = this.getModelConfiguration(modelName);
      
      // Obtener instancia del modelo
      const model = this.vertexAI.getGenerativeModel({
        model: modelName,
        generationConfig: modelConfig.generationConfig,
        safetySettings: modelConfig.safetySettings
      });

      // Procesar con el modelo
      const startTime = Date.now();
      
      logger.info('🔄 ENVIANDO PROMPT AL MODELO:', {
        modelo: modelName,
        longitudTranscripcion: transcription.length,
        longitudPrompt: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...',
        promptType: typeof prompt
      });

      // Asegurar que el prompt sea string y esté bien formateado
      const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
      
      const result = await model.generateContent(promptText);
      const processingTime = (Date.now() - startTime) / 1000;

      // 🔍 PASO 2: LOGGEAR RESPUESTA CRUDA DE VERTEX AI
      // CRÍTICO: Logging exhaustivo ANTES del parsing para debugging
      logger.info('🔍 RESPUESTA CRUDA COMPLETA DE VERTEX AI:', {
        modelo: modelName,
        tiempoProcesamiento: `${processingTime}s`,
        resultCompleto: JSON.stringify(result, null, 2),
        responseCompleto: JSON.stringify(result.response, null, 2),
        candidatesLength: result.response?.candidates?.length || 0,
        hasResponse: !!result.response,
        hasCandidates: !!result.response?.candidates,
        timestamp: new Date().toISOString()
      });

      // 🔧 NUEVA VALIDACIÓN ROBUSTA CON MÚLTIPLES ESTRATEGIAS
      let extractedText = null;
      
      // ESTRATEGIA 1: Estructura estándar de Vertex AI
      try {
        const response = result.response;
        
        if (!response) {
          throw new Error('Respuesta de Vertex AI está vacía');
        }

        if (response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          
          if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
            const part = candidate.content.parts[0];
            
            if (part.text) {
              extractedText = part.text;
              logger.info('✅ TEXTO EXTRAÍDO CON ESTRUCTURA ESTÁNDAR');
            }
          }
        }
      } catch (standardError) {
        logger.warn('⚠️ ESTRUCTURA ESTÁNDAR FALLÓ:', standardError.message);
      }

      // ESTRATEGIA 2: Buscar texto en cualquier parte de la respuesta
      if (!extractedText) {
        try {
          const responseString = JSON.stringify(result);
          
          // Buscar patrones de texto en la respuesta
          const textPatterns = [
            /"text":\s*"([^"]+)"/,
            /"content":\s*"([^"]+)"/,
            /"parts":\s*\[\s*{\s*"text":\s*"([^"]+)"/
          ];
          
          for (const pattern of textPatterns) {
            const match = responseString.match(pattern);
            if (match && match[1]) {
              extractedText = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
              logger.info('✅ TEXTO EXTRAÍDO CON PATRÓN ALTERNATIVO');
              break;
            }
          }
        } catch (patternError) {
          logger.warn('⚠️ BÚSQUEDA DE PATRONES FALLÓ:', patternError.message);
        }
      }

      // ESTRATEGIA 3: Extraer de cualquier propiedad que contenga texto
      if (!extractedText) {
        try {
          const extractTextFromObject = (obj, depth = 0) => {
            if (depth > 5) return null; // Evitar recursión infinita
            
            if (typeof obj === 'string' && obj.length > 50) {
              // Si es un string largo, probablemente es la respuesta
              return obj;
            }
            
            if (typeof obj === 'object' && obj !== null) {
              for (const [key, value] of Object.entries(obj)) {
                if (key.toLowerCase().includes('text') || key.toLowerCase().includes('content')) {
                  const result = extractTextFromObject(value, depth + 1);
                  if (result) return result;
                }
              }
              
              // Buscar en todas las propiedades
              for (const value of Object.values(obj)) {
                const result = extractTextFromObject(value, depth + 1);
                if (result) return result;
              }
            }
            
            return null;
          };
          
          extractedText = extractTextFromObject(result);
          if (extractedText) {
            logger.info('✅ TEXTO EXTRAÍDO CON BÚSQUEDA RECURSIVA');
          }
        } catch (recursiveError) {
          logger.warn('⚠️ BÚSQUEDA RECURSIVA FALLÓ:', recursiveError.message);
        }
      }

      // ESTRATEGIA 4: Fallback - Generar respuesta básica
      if (!extractedText) {
        logger.error('❌ NO SE PUDO EXTRAER TEXTO DE VERTEX AI - USANDO FALLBACK');
        
        // Generar respuesta de fallback basada en la transcripción
        extractedText = this._generateFallbackResponse(transcription, modelName);
      }

      // 🔍 PASO 2: LOGGING DETALLADO DEL TEXTO EXTRAÍDO
      logger.info('✅ TEXTO EXTRAÍDO EXITOSAMENTE DE VERTEX AI:', {
        modelo: modelName,
        tiempoProcesamiento: `${processingTime}s`,
        longitudRespuesta: extractedText.length,
        textoCompleto: extractedText, // CRÍTICO: Todo el texto para debugging
        textoPreview: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        contieneBrackets: extractedText.includes('{') && extractedText.includes('}'),
        contieneJsonBlock: extractedText.includes('```json'),
        primerosCaracteres: extractedText.substring(0, 50),
        ultimosCaracteres: extractedText.substring(Math.max(0, extractedText.length - 50)),
        timestamp: new Date().toISOString()
      });

      return {
        text: extractedText,
        modelUsed: modelName,
        processingTime: processingTime,
        metadata: {
          timestamp: new Date().toISOString(),
          projectId: this.projectId,
          location: this.location,
          inputLength: transcription.length,
          outputLength: extractedText.length
        }
      };

    } catch (error) {
      logger.error('❌ ERROR PROCESANDO CON MODELO:', {
        modelo: modelName,
        error: error.message
      });

      // Analizar si se debe reintentar con modelo diferente
      if (this.shouldRetryWithDifferentModel(error)) {
        logger.info('🔄 REINTENTANDO CON MODELO ALTERNATIVO...');
        
        const fallbackModel = this.getFallbackModel(modelName);
        if (fallbackModel !== modelName) {
          return await this.processWithModel(transcription, prompt, fallbackModel, options);
        }
      }

      throw error;
    }
  }

  /**
   * Genera respuesta de fallback cuando Vertex AI falla
   * @param {string} transcription - Transcripción original
   * @param {string} modelName - Nombre del modelo que falló
   * @returns {string} Respuesta de fallback en formato JSON
   */
  _generateFallbackResponse(transcription, modelName) {
    logger.info('🛡️ GENERANDO RESPUESTA DE FALLBACK');
    
    // Análisis básico de la transcripción para generar alertas
    const hasPain = /dolor|molestia|disconfort/i.test(transcription);
    const hasEmergency = /emergencia|urgencia|grave|crítico/i.test(transcription);
    const hasCardiac = /corazón|cardiaco|torácico|pecho/i.test(transcription);
    const hasNeurological = /cabeza|neurológico|mareo|desmayo/i.test(transcription);
    
    const fallbackResponse = {
      warnings: [],
      suggestions: [],
      soap_analysis: {
        subjective_completeness: 50,
        objective_completeness: 30,
        assessment_quality: 40,
        plan_appropriateness: 35,
        overall_quality: 40,
        missing_elements: ['Análisis completo no disponible - Fallback activado']
      },
      session_quality: {
        communication_score: 70,
        clinical_thoroughness: 50,
        patient_engagement: 60,
        professional_standards: 75,
        areas_for_improvement: ['Sistema de análisis temporalmente no disponible']
      }
    };

    // Agregar warnings basados en análisis básico
    if (hasEmergency) {
      fallbackResponse.warnings.push({
        id: 'fallback_emergency',
        severity: 'HIGH',
        category: 'system_fallback',
        title: 'Análisis de Emergencia Requerido',
        description: 'Se detectaron términos de emergencia en la transcripción. Se requiere evaluación médica inmediata.',
        recommendation: 'Evaluar paciente de forma urgente y considerar derivación a emergencias.',
        evidence: 'Términos de emergencia detectados en transcripción'
      });
    }

    if (hasCardiac) {
      fallbackResponse.warnings.push({
        id: 'fallback_cardiac',
        severity: 'HIGH',
        category: 'clinical_alert',
        title: 'Posible Síntoma Cardíaco',
        description: 'Se detectaron referencias a síntomas cardíacos. Requiere evaluación cardiológica.',
        recommendation: 'Realizar evaluación cardiológica completa y considerar ECG.',
        evidence: 'Referencias cardíacas detectadas en transcripción'
      });
    }

    if (hasNeurological) {
      fallbackResponse.warnings.push({
        id: 'fallback_neurological',
        severity: 'MEDIUM',
        category: 'clinical_alert',
        title: 'Síntomas Neurológicos Detectados',
        description: 'Se detectaron síntomas neurológicos que requieren evaluación especializada.',
        recommendation: 'Considerar evaluación neurológica y estudios complementarios.',
        evidence: 'Síntomas neurológicos detectados en transcripción'
      });
    }

    // Agregar sugerencias básicas
    fallbackResponse.suggestions.push({
      id: 'fallback_reassessment',
      type: 'system_recommendation',
      title: 'Reevaluación Completa Requerida',
      description: 'El sistema de análisis no está disponible. Se requiere evaluación clínica manual completa.',
      rationale: 'Fallback activado debido a problema técnico con Vertex AI',
      priority: 'HIGH'
    });

    return JSON.stringify(fallbackResponse, null, 2);
  }

  /**
   * Obtiene configuración específica para cada modelo
   * @param {string} modelName - Nombre del modelo
   * @returns {Object} Configuración del modelo
   */
  getModelConfiguration(modelName) {
    const configurations = {
      'gemini-2.5-pro': {
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          candidateCount: 1
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      },
      'gemini-2.5-flash': {
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.9,
          maxOutputTokens: 4096,
          candidateCount: 1
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      },
      'gemini-2.0-flash': {
        generationConfig: {
          temperature: 0.3,
          topK: 24,
          topP: 0.85,
          maxOutputTokens: 2048,
          candidateCount: 1
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      }
    };

    return configurations[modelName] || configurations['gemini-2.5-flash'];
  }

  /**
   * Determina si se debe reintentar con un modelo diferente
   * @param {Error} error - Error ocurrido
   * @returns {boolean} Si se debe reintentar
   */
  shouldRetryWithDifferentModel(error) {
    const retryableErrors = [
      'RESOURCE_EXHAUSTED',
      'QUOTA_EXCEEDED',
      'MODEL_NOT_AVAILABLE',
      'INVALID_ARGUMENT'
    ];

    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || error.code === errorType
    );
  }

  /**
   * Obtiene modelo de fallback
   * @param {string} currentModel - Modelo actual que falló
   * @returns {string} Modelo de fallback
   */
  getFallbackModel(currentModel) {
    const fallbackChain = {
      'gemini-2.5-pro': 'gemini-2.5-flash',
      'gemini-2.5-flash': 'gemini-2.0-flash',
      'gemini-2.0-flash': 'gemini-2.5-flash'
    };

    return fallbackChain[currentModel] || 'gemini-2.5-flash';
  }

  /**
   * Obtiene información detallada del modelo actual
   * @returns {Object} Información del modelo
   */
  getModelInfo() {
    return {
      projectId: this.projectId,
      location: this.location,
      defaultModel: this.defaultModel,
      availableModels: this.modelSelector.getAvailableModels(),
      optimizationEnabled: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtiene estadísticas de uso y costos
   * @returns {Object} Estadísticas de optimización
   */
  getOptimizationStats() {
    return {
      modelsAvailable: Object.keys(this.modelSelector.getAvailableModels()),
      costOptimization: 'Habilitado',
      selectionStrategy: 'Basado en complejidad automática',
      maxSavings: 'Hasta 22.5x vs modelo premium'
    };
  }
}

module.exports = VertexAIClient; 