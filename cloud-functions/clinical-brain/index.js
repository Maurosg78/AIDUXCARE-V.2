// AiDuxCare - Clinical Brain Cloud Function
// Análisis médico con Vertex AI para fisioterapia y especialidades
// Enterprise, logging avanzado, CORS robusto, prompt especializado
// @author Mauricio Sobarzo - AiDuxCare
// @version 2.0.0

const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const winston = require('winston');

// Logger enterprise
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Inicialización de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CORS robusto
const corsMiddleware = cors({
  origin: [
    'http://localhost:5174',
    'http://localhost:3000',
    'https://bucolic-marshmallow-92c5fb.netlify.app',
    'https://aiduxcare.com',
    'https://aiduxcare-v2.vercel.app'
  ],
  credentials: true
});

/**
 * Función principal de análisis clínico
 */
functions.http('clinicalBrain', async (req, res) => {
  const startTime = Date.now();
  corsMiddleware(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          message: 'Only POST requests are supported'
        });
      }
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
      // Prompt especializado
      const prompt = generateSpecializedPrompt(transcription, specialty);
      // Modelo Vertex AI
      const geminiModel = genAI.getGenerativeModel({ model: model });
      // Generar respuesta
      const result = await geminiModel.generateContent(prompt);
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
      res.status(200).json({
        success: true,
        ...analysisResult,
        metadata: {
          processingTimeMs: processingTime,
          model: geminiModel,
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
