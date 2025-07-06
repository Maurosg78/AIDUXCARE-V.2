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
exports.clinicalBrain = async (req, res) => {
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

  const startTime = Date.now();
  
  try {
    logger.info('🧠 CEREBRO CLÍNICO INICIADO CON OPTIMIZACIÓN DE COSTOS', {
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers
    });

    // Validar método HTTP
    if (req.method !== 'POST') {
      logger.warn('❌ MÉTODO NO PERMITIDO:', { method: req.method });
      return res.status(405).json({
        error: 'Método no permitido. Use POST.',
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }

    // Validar y extraer datos del request
    const { transcription, sessionType = 'initial' } = req.body;
    
    logger.info('📋 DATOS RECIBIDOS:', {
      transcriptionLength: transcription?.length || 0,
      sessionType: sessionType,
      hasTranscription: !!transcription
    });

    // Validar transcripción
    if (!transcription || typeof transcription !== 'string' || transcription.trim().length === 0) {
      logger.error('❌ TRANSCRIPCIÓN INVÁLIDA:', { transcription });
      return res.status(400).json({
        error: 'Transcripción requerida y debe ser texto válido',
        received: typeof transcription,
        timestamp: new Date().toISOString()
      });
    }

    // Validar longitud mínima
    if (transcription.trim().length < 10) {
      logger.warn('⚠️ TRANSCRIPCIÓN MUY CORTA:', { length: transcription.length });
      return res.status(400).json({
        error: 'Transcripción muy corta. Mínimo 10 caracteres.',
        length: transcription.length,
        timestamp: new Date().toISOString()
      });
    }

    // PASO 1: Inicializar servicios con optimización
    const vertexClient = new VertexAIClient();
    const promptFactory = new PromptFactory();
    const textChunker = new TextChunker();
    const knowledgeBase = new KnowledgeBase();

    // PASO 2: Evaluar si necesita chunking
    const needsChunking = textChunker.needsChunking(transcription);
    
    logger.info('🔍 EVALUACIÓN DE PROCESAMIENTO:', {
      needsChunking: needsChunking,
      transcriptionLength: transcription.length,
      strategy: needsChunking ? 'chunking' : 'standard'
    });

    let analysisResult;

    if (needsChunking) {
      // PASO 3A: Procesamiento con chunking
      logger.info('🔄 PROCESANDO CON CHUNKING...');
      
      const chunks = textChunker.splitText(transcription);
      logger.info('📦 CHUNKS GENERADOS:', { count: chunks.length });

      const chunkResults = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        logger.info(`🔄 PROCESANDO CHUNK ${i + 1}/${chunks.length}`);
        
        const chunkPrompt = promptFactory.generateChunkPrompt(chunk, i + 1, chunks.length);
        
        // Usar optimización de costos para cada chunk
        const chunkResult = await vertexClient.processTranscription(chunk, chunkPrompt);
        
        logger.info(`✅ CHUNK ${i + 1} PROCESADO:`, {
          modelo: chunkResult.modelUsed,
          tiempo: chunkResult.processingTime,
          ahorro: chunkResult.costOptimization.savings
        });
        
        chunkResults.push({
          chunkIndex: i + 1,
          result: chunkResult.text,
          modelUsed: chunkResult.modelUsed,
          processingTime: chunkResult.processingTime,
          costOptimization: chunkResult.costOptimization
        });
      }

      // Consolidar resultados de chunks
      const consolidatedResults = textChunker.consolidateResults(chunkResults.map(cr => cr.result));
      analysisResult = {
        text: consolidatedResults,
        modelUsed: 'mixed-chunking',
        processingTime: chunkResults.reduce((sum, cr) => sum + cr.processingTime, 0),
        costOptimization: {
          strategy: 'chunking',
          chunksProcessed: chunks.length,
          modelsUsed: chunkResults.map(cr => cr.modelUsed),
          totalSavings: chunkResults.map(cr => cr.costOptimization.savings).join(', ')
        },
        chunks: chunkResults.map(cr => ({
          index: cr.chunkIndex,
          model: cr.modelUsed,
          time: cr.processingTime,
          savings: cr.costOptimization.savings
        }))
      };
      
    } else {
      // PASO 3B: Procesamiento estándar con optimización
      logger.info('🔄 PROCESAMIENTO ESTÁNDAR CON OPTIMIZACIÓN...');
      
      const prompt = promptFactory.generatePrompt(transcription, sessionType);
      
      // Usar optimización de costos automática
      analysisResult = await vertexClient.processTranscription(transcription, prompt);
      
      logger.info('✅ PROCESAMIENTO COMPLETADO:', {
        modelo: analysisResult.modelUsed,
        tiempo: analysisResult.processingTime,
        complejidad: analysisResult.costOptimization.complexity.total,
        ahorro: analysisResult.costOptimization.savings
      });
    }

    // PASO 4: Extraer JSON del resultado
    let jsonResult;
    try {
      const jsonMatch = analysisResult.text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[1]);
      } else {
        // Intentar parsear directamente
        jsonResult = JSON.parse(analysisResult.text);
      }
    } catch (parseError) {
      logger.error('❌ ERROR AL PARSEAR JSON:', parseError);
      throw new Error('Respuesta del modelo no contiene JSON válido');
    }

    // PASO 5: Enriquecer resultado con información de optimización
    const finalResult = {
      ...jsonResult,
      metadata: {
        processingTime: analysisResult.processingTime,
        modelUsed: analysisResult.modelUsed,
        costOptimization: analysisResult.costOptimization,
        totalTime: (Date.now() - startTime) / 1000,
        timestamp: new Date().toISOString(),
        version: '2.0-optimized'
      }
    };

    // PASO 6: Logging final con métricas de optimización
    logger.info('✅ RESPUESTA FINAL GENERADA:', {
      processingTime: analysisResult.processingTime,
      totalTime: finalResult.metadata.totalTime,
      modelUsed: analysisResult.modelUsed,
      costSavings: analysisResult.costOptimization.savings,
      complexity: analysisResult.costOptimization.complexity?.total || 'N/A',
      warningsCount: finalResult.warnings?.length || 0,
      suggestionsCount: finalResult.suggestions?.length || 0,
      soapQuality: finalResult.soap_quality?.overall_score || 'N/A'
    });

    // PASO 7: Responder con resultado optimizado
    res.status(200).json(finalResult);

  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    
    logger.error('❌ ERROR EN CEREBRO CLÍNICO:', {
      error: error.message,
      stack: error.stack,
      processingTime: processingTime,
      timestamp: new Date().toISOString()
    });

    // Respuesta de error mejorada
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      processingTime: processingTime,
      timestamp: new Date().toISOString(),
      version: '2.0-optimized'
    });
  }
}; 