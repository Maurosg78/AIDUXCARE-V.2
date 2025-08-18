const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Firebase Admin
initializeApp();

// Initialize Vertex AI
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});

// ENHANCED: Analyze Semantic Chunks with Vertex AI Flash
exports.analyzeSemanticChunk = onCall(async (request) => {
  const { semanticChunk } = request.data;
  
  // Input optimizado desde SemanticChunkingService
  const {
    transcription,
    medicalPhase,      // anamnesis|exploration|evaluation|planning
    clinicalKeywords,  // ['dolor', 'lumbar', 'contractura']
    completeness,      // 0.85
    contextRelevance   // 0.92
  } = semanticChunk;

  const optimizedPrompt = `
  ANÁLISIS CLÍNICO ESPECIALIZADO - FISIOTERAPIA
  
  CONTEXTO:
  - Fase: ${medicalPhase}
  - Transcripción: "${transcription}"
  - Keywords detectados: ${clinicalKeywords.join(', ')}
  - Completeness: ${(completeness * 100).toFixed(1)}%
  - Relevancia: ${(contextRelevance * 100).toFixed(1)}%
  
  INSTRUCCIONES:
  1. Analiza SOLO contenido clínicamente relevante
  2. Genera highlights específicos para ${medicalPhase}
  3. Identifica red flags o iatrogenias potenciales
  4. Sugiere categoría SOAP automática
  5. Propón seguimiento clínico si procede
  
  FORMATO RESPUESTA JSON:
  {
    "highlights": [
      {
        "text": "highlight específico",
        "category": "symptom|finding|treatment|assessment",
        "relevance": 0.95,
        "soapCategory": "S|O|A|P"
      }
    ],
    "clinicalInsights": [
      {
        "insight": "observación clínica",
        "confidence": 0.88,
        "evidence": "base científica"
      }
    ],
    "redFlags": [
      {
        "flag": "alerta clínica",
        "severity": "low|medium|high",
        "recommendation": "acción sugerida"
      }
    ],
    "nextSteps": [
      "pregunta de seguimiento",
      "test recomendado",
      "evaluación adicional"
    ],
    "soapSuggestion": {
      "category": "S|O|A|P",
      "confidence": 0.92,
      "reasoning": "justificación"
    }
  }
  `;

  const model = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-2.0-flash-exp', // Último modelo
    generationConfig: {
      maxOutputTokens: 1024,  // Optimizado para highlights
      temperature: 0.1,       // Precisión clínica
      topP: 0.8,
      responseMimeType: 'application/json'
    }
  });

  try {
    const startTime = Date.now();
    const result = await model.generateContent(optimizedPrompt);
    const processingTime = Date.now() - startTime;
    
    console.log(`Vertex AI processing time: ${processingTime}ms`);
    
    const analysis = JSON.parse(result.response.text());
    
    return {
      ...analysis,
      metadata: {
        processingTime,
        chunkId: semanticChunk.id,
        medicalPhase,
        timestamp: Date.now()
      }
    };
    
  } catch (error) {
    console.error('Vertex AI analysis error:', error);
    throw new HttpsError('internal', 'Error en análisis clínico');
  }
}); 