const functions = require('@google-cloud/functions-framework');
const express = require('express');
const cors = require('cors');
const winston = require('winston');

// Importar servicios core
const PromptFactory = require('./src/services/PromptFactory');
const VertexAIClient = require('./src/services/VertexAIClient');
const ResponseParser = require('./src/services/ResponseParser');
const KnowledgeBase = require('./src/services/KnowledgeBase');
const TextChunker = require('./src/services/TextChunker');

// Configurar logger
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

// Configurar CORS
const corsOptions = {
  origin: ['http://localhost:5174', 'https://aiduxcare-v2.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Función principal de la Cloud Function
functions.http('clinicalBrain', async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    logger.info('🧠 CLINICAL BRAIN REQUEST RECIBIDO', {
      method: req.method,
      path: req.path,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    // Routing básico
    if (req.method === 'POST' && req.path === '/analyze') {
      return await handleAnalyzeRequest(req, res);
    }

    if (req.method === 'GET' && req.path === '/health') {
      return res.status(200).json({
        status: 'healthy',
        service: 'clinical-brain',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // Endpoint no encontrado
    res.status(404).json({
      error: 'Endpoint not found',
      availableEndpoints: ['/analyze', '/health']
    });

  } catch (error) {
    logger.error('🚨 CLINICAL BRAIN ERROR GENERAL', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Internal server error',
      message: 'Clinical analysis failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Handler principal para análisis clínico
async function handleAnalyzeRequest(req, res) {
  const startTime = Date.now();
  
  try {
    // LOG CRÍTICO: Request body completo
    logger.info('📨 REQUEST BODY RECIBIDO', {
      bodyKeys: Object.keys(req.body),
      transcriptionLength: req.body.transcription?.length || 0,
      specialty: req.body.specialty,
      sessionType: req.body.sessionType,
      transcriptionPreview: req.body.transcription?.substring(0, 200) || 'No transcription',
      timestamp: new Date().toISOString()
    });

    // Validar request
    const { transcription, specialty, sessionType } = req.body;
    
    if (!transcription || !specialty) {
      logger.error('❌ VALIDACIÓN FALLIDA', {
        missingFields: {
          transcription: !transcription,
          specialty: !specialty
        },
        receivedKeys: Object.keys(req.body)
      });
      
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['transcription', 'specialty'],
        received: Object.keys(req.body)
      });
    }

    logger.info('✅ VALIDACIÓN EXITOSA - INICIANDO ANÁLISIS CLÍNICO', {
      specialty,
      sessionType,
      transcriptionLength: transcription.length,
      timestamp: new Date().toISOString()
    });

    // PASO 1: Cargar KnowledgeBase
    logger.info('📚 PASO 1: Cargando KnowledgeBase...');
    const knowledgeBase = await KnowledgeBase.load(specialty);
    logger.info('✅ KnowledgeBase cargada exitosamente', {
      hasRules: !!knowledgeBase.rules,
      hasTerminology: !!knowledgeBase.terminology
    });
    
    // PASO 2: Generar prompt especializado
    logger.info('🏭 PASO 2: Generando prompt especializado...');
    const promptFactory = new PromptFactory(knowledgeBase);
    const prompt = promptFactory.generatePrompt(transcription, specialty, sessionType);
    
    // LOG CRÍTICO: Prompt final generado
    logger.info('📝 PROMPT FINAL GENERADO', {
      promptLength: prompt.length,
      promptFirst500: prompt.substring(0, 500),
      promptLast500: prompt.substring(Math.max(0, prompt.length - 500)),
      specialty,
      sessionType,
      timestamp: new Date().toISOString()
    });
    
    // PASO 3: Evaluar si necesita chunking
    logger.info('🔍 PASO 3: Evaluando necesidad de chunking...');
    const textChunker = new TextChunker();
    const needsChunking = textChunker.shouldChunk(transcription);
    
    let structuredResponse;
    
    if (needsChunking) {
      logger.info('📄 PROCESAMIENTO CON CHUNKING ACTIVADO');
      
      // Dividir transcripción en chunks
      const chunks = textChunker.chunkTranscription(transcription);
      
      // Procesar cada chunk
      const vertexClient = new VertexAIClient();
      const chunkResults = await textChunker.processChunks(chunks, promptFactory, vertexClient, specialty, sessionType);
      
      // Consolidar resultados
      structuredResponse = textChunker.consolidateResults(chunkResults, transcription);
      
      logger.info('✅ CHUNKING COMPLETADO', {
        totalChunks: chunks.length,
        successfulChunks: chunkResults.filter(r => r.result).length,
        finalWarnings: structuredResponse.warnings.length,
        finalSuggestions: structuredResponse.suggestions.length
      });
      
    } else {
      logger.info('📝 PROCESAMIENTO ESTÁNDAR SIN CHUNKING');
      
      // PASO 3: Llamar a Vertex AI
      logger.info('🤖 PASO 3: Enviando a Vertex AI...');
      const vertexClient = new VertexAIClient();
      
      // LOG CRÍTICO: Configuración de Vertex AI
      logger.info('⚙️ CONFIGURACIÓN VERTEX AI', vertexClient.getModelInfo());
      
      const rawResponse = await vertexClient.analyze(prompt);
      
      logger.info('✅ RESPUESTA RECIBIDA DE VERTEX AI', {
        responseLength: rawResponse.length,
        responsePreview: rawResponse.substring(0, 200)
      });
      
      // PASO 4: Parsear y estructurar respuesta
      logger.info('🔧 PASO 4: Parseando respuesta...');
      const responseParser = new ResponseParser(knowledgeBase);
      structuredResponse = responseParser.parse(rawResponse, specialty);
    }
    
    logger.info('✅ RESPUESTA PARSEADA EXITOSAMENTE', {
      warningsCount: structuredResponse.warnings?.length || 0,
      suggestionsCount: structuredResponse.suggestions?.length || 0,
      hasSOAPAnalysis: !!structuredResponse.soap_analysis,
      hasSessionQuality: !!structuredResponse.session_quality
    });
    
    // PASO 5: Preparar respuesta final
    const processingTime = Date.now() - startTime;
    const response = {
      success: true,
      analysis: structuredResponse,
      metadata: {
        specialty,
        sessionType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // LOG CRÍTICO: Respuesta final que se envía al frontend
    logger.info('📤 RESPUESTA FINAL ENVIADA AL FRONTEND', {
      success: response.success,
      specialty: response.metadata.specialty,
      processingTimeMs: response.metadata.processingTimeMs,
      warningsCount: response.analysis.warnings?.length || 0,
      suggestionsCount: response.analysis.suggestions?.length || 0,
      overallQuality: response.analysis.soap_analysis?.overall_quality || 'N/A',
      responseSize: JSON.stringify(response).length,
      timestamp: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // LOG CRÍTICO: Error completo con contexto
    logger.error('🚨 ERROR CRÍTICO EN ANÁLISIS CLÍNICO', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code,
      processingTimeMs: processingTime,
      requestBody: {
        transcriptionLength: req.body.transcription?.length || 0,
        specialty: req.body.specialty,
        sessionType: req.body.sessionType
      },
      timestamp: new Date().toISOString()
    });

    // Análisis específico del error
    let errorResponse = {
      success: false,
      error: 'Clinical analysis failed',
      message: error.message,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    };

    // Personalizar respuesta según tipo de error
    if (error.message.includes('INVALID_ARGUMENT')) {
      errorResponse.error = 'Invalid request to AI service';
      errorResponse.details = 'The request format or content is not supported by the AI model';
      errorResponse.troubleshooting = [
        'Check transcription length (max ~15,000 characters)',
        'Verify prompt format compatibility',
        'Confirm model availability in region'
      ];
    } else if (error.message.includes('quota')) {
      errorResponse.error = 'AI service quota exceeded';
      errorResponse.details = 'Daily or monthly usage limits reached';
    } else if (error.message.includes('permission')) {
      errorResponse.error = 'AI service permission denied';
      errorResponse.details = 'Service account lacks required permissions';
    }

    logger.info('📤 ERROR RESPONSE ENVIADA AL FRONTEND', {
      errorType: errorResponse.error,
      errorMessage: errorResponse.message,
      processingTimeMs: processingTime
    });

    res.status(500).json(errorResponse);
  }
}

module.exports = { clinicalBrain: functions.http('clinicalBrain', handleAnalyzeRequest) }; 