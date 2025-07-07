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
        longitudPrompt: prompt.length
      });

      const result = await model.generateContent(prompt);
      const processingTime = (Date.now() - startTime) / 1000;

      // Extraer respuesta
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      logger.info('✅ RESPUESTA RECIBIDA:', {
        modelo: modelName,
        tiempoProcesamiento: `${processingTime}s`,
        longitudRespuesta: text.length
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