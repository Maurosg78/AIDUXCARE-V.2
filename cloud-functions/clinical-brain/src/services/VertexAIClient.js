const { VertexAI } = require('@google-cloud/aiplatform');
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
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'aiduxcare-mvp';
    this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
    this.model = process.env.VERTEX_AI_MODEL || 'gemini-1.5-pro';
    
    // Inicializar cliente Vertex AI
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
    
    // Configuración del modelo
    this.generationConfig = {
      temperature: 0.1,  // Muy baja para máxima precisión clínica
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
      candidateCount: 1
    };

    // Configuración de seguridad médica
    this.safetySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ];

    logger.info('VertexAI Client initialized', {
      projectId: this.projectId,
      location: this.location,
      model: this.model,
      timestamp: new Date().toISOString()
    });
  }

  async analyze(prompt) {
    const startTime = Date.now();
    
    try {
      logger.info('Starting Vertex AI analysis', {
        promptLength: prompt.length,
        model: this.model,
        timestamp: new Date().toISOString()
      });

      // Obtener el modelo generativo
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.model,
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings
      });

      // Generar contenido
      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

      logger.info('Vertex AI analysis completed', {
        processingTimeMs: processingTime,
        responseLength: text.length,
        model: this.model,
        timestamp: new Date().toISOString()
      });

      // Validar que la respuesta sea JSON válido
      try {
        JSON.parse(text);
      } catch (jsonError) {
        logger.warn('Response is not valid JSON, attempting to extract JSON', {
          error: jsonError.message,
          responsePreview: text.substring(0, 200)
        });
        
        // Intentar extraer JSON de la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          try {
            JSON.parse(extractedJson);
            logger.info('Successfully extracted JSON from response');
            return extractedJson;
          } catch (extractError) {
            logger.error('Failed to extract valid JSON', {
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
      
      logger.error('Vertex AI analysis failed', {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        model: this.model,
        timestamp: new Date().toISOString()
      });

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

      throw new Error(`Vertex AI analysis failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      logger.info('Testing Vertex AI connection');
      
      const testPrompt = 'Test connection. Respond with: {"status": "connected", "timestamp": "' + new Date().toISOString() + '"}';
      const response = await this.analyze(testPrompt);
      
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.status === 'connected') {
        logger.info('Vertex AI connection test successful');
        return true;
      } else {
        logger.warn('Vertex AI connection test returned unexpected response', {
          response: parsedResponse
        });
        return false;
      }
      
    } catch (error) {
      logger.error('Vertex AI connection test failed', {
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