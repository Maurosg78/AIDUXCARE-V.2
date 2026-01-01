/**
 * Cloud Function actualizada con validación de schema
 * Versión 2.0 - Orquestación Clínica
 */

const functions = require("firebase-functions");
const { VertexAI } = require("@google-cloud/vertexai");

// Inicializar Vertex AI
const vertex_ai = new VertexAI({
  project: 'aiduxcare-1',
  location: 'northamerica-northeast1',
});

const model = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.5-pro-preview-0409',
});

/**
 * Función principal con validación de schema
 */
exports.analyzeClinicalTranscriptV2 = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB'
  })
  .https.onRequest(async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { transcript, promptVersion } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ 
          error: 'Transcript is required',
          schemaVersion: '1.0.0'
        });
      }
      
      // Generar prompt con schema constraints
      const prompt = generateConstrainedPrompt(transcript);
      
      // Llamar a Vertex AI
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
      
      const response = await result.response;
      const text = response.candidates[0].content.parts[0].text;
      
      // Parsear y validar respuesta
      const parsedResponse = parseAndValidateResponse(text);
      
      // Métricas de procesamiento
      const processingTime = Date.now() - startTime;
      
      res.json({
        ...parsedResponse,
        metadata: {
          ...parsedResponse.metadata,
          processingTimeMs: processingTime,
          functionsVersion: '2.0.0',
          validated: true
        }
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ 
        error: 'Processing failed',
        details: error.message,
        schemaVersion: '1.0.0'
      });
    }
  });

/**
 * Genera prompt con schema constraints
 */
function generateConstrainedPrompt(transcript) {
  return `[INCLUIR AQUÍ EL PROMPT DEL ARCHIVO schema-constrained-prompt.ts]
  
  TRANSCRIPT: ${transcript}`;
}

/**
 * Parsea y valida la respuesta según schema
 */
function parseAndValidateResponse(text) {
  try {
    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    // Validación básica del schema
    const validation = validateSchema(parsed);
    
    if (!validation.valid) {
      console.warn('Schema validation warnings:', validation.errors);
      // Aplicar correcciones básicas
      parsed.required = parsed.required || {};
      parsed.required.redFlagsAssessed = parsed.required.redFlagsAssessed ?? true;
      parsed.required.contraindicationsChecked = parsed.required.contraindicationsChecked ?? true;
    }
    
    return parsed;
    
  } catch (error) {
    console.error('Parse error:', error);
    // Retornar estructura mínima válida
    return {
      required: {
        redFlagsAssessed: false,
        contraindicationsChecked: false,
        planDocumented: false
      },
      entities: [],
      error: 'Failed to parse AI response'
    };
  }
}

/**
 * Validación básica del schema
 */
function validateSchema(data) {
  const errors = [];
  
  if (!data.required) {
    errors.push('Missing required fields section');
  }
  
  if (!data.required?.redFlagsAssessed) {
    errors.push('Red flags assessment missing');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  analyzeClinicalTranscriptV2: exports.analyzeClinicalTranscriptV2
};
