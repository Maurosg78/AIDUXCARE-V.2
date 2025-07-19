/**
 * 🧠 AiDuxCare - Clinical Brain Cloud Function
 * Análisis médico con Vertex AI para fisioterapia
 * 
 * @author Mauricio Sobarzo - AiDuxCare
 * @version 2.0.0
 */

const functions = require('@google-cloud/functions-framework');
const { VertexAI } = require('@google/generative-ai');
const cors = require('cors');
const winston = require('winston');

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Configuración de Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'aiduxcare-stt-20250706',
  location: 'us-east1'
});

// Configuración CORS
const corsMiddleware = cors({
  origin: [
    'http://localhost:5174',
    'http://localhost:3000',
    'https://bucolic-marshmallow-92c5fb.netlify.app',
    'https://aiduxcare.com'
  ],
  credentials: true
});

/**
 * Función principal de análisis clínico
 */
functions.http('clinicalBrain', async (req, res) => {
  const startTime = Date.now();
  
  // Aplicar CORS
  corsMiddleware(req, res, async () => {
    try {
      // Validar método HTTP
      if (req.method !== 'POST') {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          message: 'Only POST requests are supported'
        });
      }

      // Validar campos requeridos
      const { transcription, specialty, model = 'gemini-1.5-pro' } = req.body;
      
      if (!transcription || !specialty) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['transcription', 'specialty'],
          received: Object.keys(req.body)
        });
      }

      logger.info('Clinical analysis request', {
        specialty,
        model,
        transcriptionLength: transcription.length,
        timestamp: new Date().toISOString()
      });

      // Generar prompt especializado según especialidad
      const prompt = generateSpecializedPrompt(transcription, specialty);
      
      // Obtener modelo de Vertex AI
      const generativeModel = vertexAI.getGenerativeModel({
        model: model,
        generation_config: {
          max_output_tokens: 2048,
          temperature: 0.3,
          top_p: 0.8,
          top_k: 40
        }
      });

      // Generar respuesta
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parsear respuesta JSON
      let analysisResult;
      try {
        analysisResult = JSON.parse(text);
      } catch (parseError) {
        logger.warn('Failed to parse JSON response', { error: parseError.message });
        analysisResult = {
          warnings: ['Error parsing AI response'],
          suggestions: ['Revisar transcripción manualmente'],
          soap: {
            subjective: 'Error en análisis automático',
            objective: 'Requiere revisión manual',
            assessment: 'Análisis no disponible',
            plan: 'Evaluación clínica directa'
          }
        };
      }

      const processingTime = Date.now() - startTime;

      logger.info('Clinical analysis completed', {
        processingTime,
        specialty,
        model,
        success: true
      });

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        ...analysisResult,
        metadata: {
          processingTimeMs: processingTime,
          model: model,
          specialty: specialty,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Clinical analysis failed', {
        error: error.message,
        processingTime,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Clinical analysis failed',
        message: error.message,
        metadata: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString()
        }
      });
    }
  });
});

/**
 * Genera prompt especializado según la especialidad médica
 */
function generateSpecializedPrompt(transcription, specialty) {
  const basePrompt = `Eres un experto en ${specialty} con amplia experiencia clínica. 
Analiza la siguiente transcripción de una sesión médica y genera un análisis estructurado.

Transcripción:
"${transcription}"

Genera una respuesta en formato JSON con la siguiente estructura:
{
  "warnings": ["Lista de advertencias clínicas importantes"],
  "suggestions": ["Lista de sugerencias de tratamiento"],
  "soap": {
    "subjective": "Información subjetiva del paciente",
    "objective": "Hallazgos objetivos",
    "assessment": "Evaluación clínica",
    "plan": "Plan de tratamiento"
  }
}

Responde SOLO en formato JSON válido.`;

  // Personalizar según especialidad
  switch (specialty) {
    case 'fisioterapia':
      return basePrompt + `\n\nEnfoque específico en fisioterapia: biomecánica, ejercicios terapéuticos, técnicas manuales.`;
    
    case 'psicologia':
      return basePrompt + `\n\nEnfoque específico en psicología: evaluación mental, riesgo suicida, plan de seguridad.`;
    
    case 'medicina_general':
      return basePrompt + `\n\nEnfoque específico en medicina general: diagnóstico diferencial, derivación a especialistas.`;
    
    default:
      return basePrompt;
  }
}

module.exports = { clinicalBrain: functions.http('clinicalBrain') }; 