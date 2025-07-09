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
    
    // 🔐 CONFIGURACIÓN DINÁMICA DE MODELOS: Leer desde variables de entorno
    this.flashModel = process.env.MODEL_FLASH;
    this.proModel = process.env.MODEL_PRO;
    
    // Validación crítica de configuración
    if (!this.flashModel || !this.proModel) {
      const missingVars = [];
      if (!this.flashModel) missingVars.push('MODEL_FLASH');
      if (!this.proModel) missingVars.push('MODEL_PRO');
      
      throw new Error(`Missing critical AI model configuration in VertexAIClient: ${missingVars.join(', ')}. Please set environment variables.`);
    }
    
    // Usar modelo flash como default (estrategia 90/10)
    this.defaultModel = this.flashModel;
    
    // Inicializar ModelSelector para optimización inteligente
    this.modelSelector = new ModelSelector();
    
    // Inicializar cliente Vertex AI
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
    
    logger.info('🚀 VERTEXAI CLIENT INICIALIZADO CON CONFIGURACIÓN DINÁMICA', {
      proyecto: this.projectId,
      region: this.location,
      flashModel: this.flashModel,
      proModel: this.proModel,
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

      // Extraer respuesta con validación exhaustiva
      const response = result.response;
      
      // 🔍 PASO 2: VALIDACIÓN DETALLADA DE LA ESTRUCTURA DE RESPUESTA
      if (!response) {
        logger.error('❌ RESPUESTA DE VERTEX AI ESTÁ VACÍA:', {
          modelo: modelName,
          resultKeys: Object.keys(result || {}),
          resultType: typeof result
        });
        throw new Error('Vertex AI devolvió una respuesta vacía');
      }

      if (!response.candidates || !Array.isArray(response.candidates)) {
        logger.error('❌ CANDIDATES NO ENCONTRADOS EN RESPUESTA DE VERTEX AI:', {
          modelo: modelName,
          responseKeys: Object.keys(response || {}),
          candidatesType: typeof response.candidates,
          candidatesValue: response.candidates
        });
        throw new Error('Vertex AI no devolvió candidates válidos');
      }

      if (response.candidates.length === 0) {
        logger.error('❌ ARRAY DE CANDIDATES ESTÁ VACÍO:', {
          modelo: modelName,
          candidatesLength: response.candidates.length,
          responseCompleto: JSON.stringify(response, null, 2)
        });
        throw new Error('Vertex AI devolvió un array de candidates vacío');
      }

      const candidate = response.candidates[0];
      
      if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
        logger.error('❌ ESTRUCTURA DE CONTENT INVÁLIDA EN CANDIDATE:', {
          modelo: modelName,
          candidateKeys: Object.keys(candidate || {}),
          contentKeys: Object.keys(candidate.content || {}),
          partsType: typeof candidate.content?.parts,
          candidateCompleto: JSON.stringify(candidate, null, 2)
        });
        throw new Error('Estructura de content inválida en candidate de Vertex AI');
      }

      if (candidate.content.parts.length === 0) {
        logger.error('❌ ARRAY DE PARTS ESTÁ VACÍO:', {
          modelo: modelName,
          partsLength: candidate.content.parts.length,
          candidateCompleto: JSON.stringify(candidate, null, 2)
        });
        throw new Error('Vertex AI devolvió un array de parts vacío');
      }

      const part = candidate.content.parts[0];
      
      if (!part.text) {
        logger.error('❌ TEXT NO ENCONTRADO EN PART:', {
          modelo: modelName,
          partKeys: Object.keys(part || {}),
          partCompleto: JSON.stringify(part, null, 2)
        });
        throw new Error('Vertex AI no devolvió texto válido');
      }

      const text = part.text;

      // 🔍 PASO 2: LOGGING DETALLADO DEL TEXTO EXTRAÍDO
      logger.info('✅ TEXTO EXTRAÍDO EXITOSAMENTE DE VERTEX AI:', {
        modelo: modelName,
        tiempoProcesamiento: `${processingTime}s`,
        longitudRespuesta: text.length,
        textoCompleto: text, // CRÍTICO: Todo el texto para debugging
        textoPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        contieneBrackets: text.includes('{') && text.includes('}'),
        contieneJsonBlock: text.includes('```json'),
        primerosCaracteres: text.substring(0, 50),
        ultimosCaracteres: text.substring(Math.max(0, text.length - 50)),
        timestamp: new Date().toISOString()
      });

      return {
        text: text,
        modelUsed: modelName,
        processingTime: processingTime,
        metadata: {
          timestamp: new Date().toISOString(),
          projectId: this.projectId,
          location: this.location,
          inputLength: transcription.length,
          outputLength: text.length
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
   * CONFIGURACIÓN DINÁMICA: Obtiene configuración basada en variables de entorno
   * @param {string} modelName - Nombre del modelo (debe ser flashModel o proModel)
   * @returns {Object} Configuración del modelo
   */
  getModelConfiguration(modelName) {
    // 🔧 CONFIGURACIÓN DINÁMICA: Mapear a configuraciones basadas en variables de entorno
    const configurations = {};
    
    // Configuración para modelo Flash (optimización de costos)
    configurations[this.flashModel] = {
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH'
        }
      ]
    };

    // Configuración para modelo Pro (máxima calidad)
    configurations[this.proModel] = {
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.05,
        topP: 0.95,
        topK: 40,
        candidateCount: 1
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH'
        }
      ]
    };

    // Retornar configuración específica o default a Flash
    return configurations[modelName] || configurations[this.flashModel];
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
   * FALLBACK DINÁMICO: Obtiene modelo de respaldo basado en configuración de entorno
   * @param {string} currentModel - Modelo actual que falló
   * @returns {string} Modelo de respaldo
   */
  getFallbackModel(currentModel) {
    // 🔧 CADENA DE FALLBACK DINÁMICA basada en variables de entorno
    const fallbackChain = {};
    
    // Si falla Pro, usar Flash
    fallbackChain[this.proModel] = this.flashModel;
    
    // Si falla Flash, usar Pro como último recurso
    fallbackChain[this.flashModel] = this.proModel;
    
    // Retornar fallback específico o default a Flash
    return fallbackChain[currentModel] || this.flashModel;
  }

  /**
   * INFORMACIÓN DINÁMICA: Obtiene información de modelos basada en configuración de entorno
   * @returns {Object} Información de modelos configurados
   */
  getModelInfo() {
    return {
      projectId: this.projectId,
      location: this.location,
      availableModels: {
        flash: {
          name: this.flashModel,
          description: 'Modelo optimizado para costos y rendimiento',
          usageStrategy: 'Casos estándar (90% de consultas)'
        },
        pro: {
          name: this.proModel,
          description: 'Modelo premium para casos críticos',
          usageStrategy: 'Casos complejos con banderas rojas (10% de consultas)'
        }
      },
      defaultModel: this.defaultModel,
      configuration: 'DYNAMIC_FROM_ENVIRONMENT'
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