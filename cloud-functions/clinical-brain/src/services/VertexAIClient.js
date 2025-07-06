const { VertexAI } = require('@google-cloud/vertexai');
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
    this.model = process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash';
    
    // Inicializar cliente Vertex AI
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
    
    // Configuración del modelo - SIMPLIFICADA para debugging
    this.generationConfig = {
      temperature: 0.1,  // Muy baja para máxima precisión clínica
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
      candidateCount: 1
    };

    // Configuración de seguridad médica - SIMPLIFICADA
    this.safetySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ];

    logger.info('🧠 VertexAI Client initialized', {
      projectId: this.projectId,
      location: this.location,
      model: this.model,
      timestamp: new Date().toISOString()
    });
  }

  async analyze(prompt) {
    const startTime = Date.now();
    
    try {
      logger.info('🚀 INICIANDO ANÁLISIS VERTEX AI', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...',
        model: this.model,
        timestamp: new Date().toISOString()
      });

      // LOG CRÍTICO: Configuración completa que se enviará
      logger.info('📋 CONFIGURACIÓN VERTEX AI', {
        projectId: this.projectId,
        location: this.location,
        model: this.model,
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        timestamp: new Date().toISOString()
      });

      // LOG CRÍTICO: Prompt completo (primeros 1000 caracteres)
      logger.info('📝 PROMPT ENVIADO A VERTEX AI', {
        promptLength: prompt.length,
        promptFirst1000: prompt.substring(0, 1000),
        promptLast500: prompt.substring(Math.max(0, prompt.length - 500)),
        timestamp: new Date().toISOString()
      });

      // Obtener el modelo generativo
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.model,
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings
      });

      logger.info('✅ Modelo generativo obtenido correctamente');

      // Generar contenido
      logger.info('🤖 Enviando request a Gemini 1.5 Pro...');
      
      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      logger.info('📨 Respuesta recibida de Vertex AI');

      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

      // LOG CRÍTICO: Respuesta completa de Vertex AI
      logger.info('📄 RESPUESTA VERTEX AI COMPLETA', {
        processingTimeMs: processingTime,
        responseLength: text.length,
        responseFirst500: text.substring(0, 500),
        responseLast500: text.substring(Math.max(0, text.length - 500)),
        model: this.model,
        timestamp: new Date().toISOString()
      });

      // Validar que la respuesta sea JSON válido
      try {
        const parsed = JSON.parse(text);
        logger.info('✅ JSON VÁLIDO recibido de Vertex AI', {
          hasWarnings: !!parsed.warnings,
          warningsCount: parsed.warnings?.length || 0,
          hasSuggestions: !!parsed.suggestions,
          suggestionsCount: parsed.suggestions?.length || 0
        });
      } catch (jsonError) {
        logger.error('❌ RESPUESTA NO ES JSON VÁLIDO', {
          error: jsonError.message,
          responsePreview: text.substring(0, 500),
          responseLength: text.length
        });
        
        // Intentar extraer JSON de la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          try {
            JSON.parse(extractedJson);
            logger.info('✅ JSON extraído exitosamente de la respuesta');
            return extractedJson;
          } catch (extractError) {
            logger.error('❌ Falló extracción de JSON', {
              error: extractError.message,
              extractedJson: extractedJson.substring(0, 200)
            });
          }
        }
        
        // Si no se puede extraer JSON válido, lanzar error
        throw new Error('Vertex AI response is not valid JSON');
      }

      return text;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // LOG CRÍTICO: Error completo con detalles
      logger.error('🚨 ERROR CRÍTICO EN VERTEX AI', {
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorStack: error.stack,
        processingTimeMs: processingTime,
        model: this.model,
        projectId: this.projectId,
        location: this.location,
        timestamp: new Date().toISOString()
      });

      // Análisis específico de errores
      if (error.message.includes('INVALID_ARGUMENT')) {
        logger.error('🔍 ANÁLISIS INVALID_ARGUMENT', {
          possibleCauses: [
            'Prompt demasiado largo',
            'Formato de prompt incompatible',
            'Parámetros de configuración inválidos',
            'Modelo no disponible en la región'
          ],
          promptLength: prompt?.length || 'unknown',
          modelUsed: this.model,
          locationUsed: this.location
        });
      }

      // Manejar errores específicos de Vertex AI
      if (error.message.includes('quota')) {
        throw new Error('Vertex AI quota exceeded. Please check your project limits.');
      }
      
      if (error.message.includes('permission')) {
        throw new Error('Vertex AI permission denied. Please check your service account permissions.');
      }
      
      if (error.message.includes('model')) {
        throw new Error(`Vertex AI model error: ${this.model} may not be available in ${this.location}`);
      }

      if (error.message.includes('INVALID_ARGUMENT')) {
        throw new Error(`Vertex AI INVALID_ARGUMENT: ${error.message}. Check prompt format and parameters.`);
      }

      throw new Error(`Vertex AI analysis failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      logger.info('🔍 Testing Vertex AI connection');
      
      const testPrompt = 'Test connection. Respond with: {"status": "connected", "timestamp": "' + new Date().toISOString() + '"}';
      const response = await this.analyze(testPrompt);
      
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.status === 'connected') {
        logger.info('✅ Vertex AI connection test successful');
        return true;
      } else {
        logger.warn('⚠️ Vertex AI connection test returned unexpected response', {
          response: parsedResponse
        });
        return false;
      }
      
    } catch (error) {
      logger.error('❌ Vertex AI connection test failed', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  getModelInfo() {
    return {
      projectId: this.projectId,
      location: this.location,
      model: this.model,
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings
    };
  }
}

module.exports = VertexAIClient; 