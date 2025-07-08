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
const ClinicalInsightService = require('./src/services/ClinicalInsightService');

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
  // Configurar CORS - REPARACIÓN CRÍTICA
  const allowedOrigins = ['http://localhost:5174', 'https://localhost:5174', 'https://aiduxcare-v2.vercel.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'https://localhost:5174'); // Fallback para HTTPS local
  }
  
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
      headers: req.headers,
      requestBody: {
        hasTranscription: !!req.body?.transcription,
        transcriptionLength: req.body?.transcription?.length || 0,
        specialty: req.body?.specialty,
        sessionType: req.body?.sessionType
      }
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
    const { 
      transcription, 
      sessionType = 'initial', 
      specialty = 'general',
      phase = 'standard',
      previousAnalysis = null,
      additionalInfo = null,
      clinicalIntegration = false
    } = req.body;
    
    logger.info('📋 DATOS RECIBIDOS:', {
      transcriptionLength: transcription?.length || 0,
      sessionType: sessionType,
      specialty: specialty,
      phase: phase,
      hasPreviousAnalysis: !!previousAnalysis,
      hasAdditionalInfo: !!additionalInfo,
      clinicalIntegration: clinicalIntegration,
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

    // PASO 1: Inicializar servicios con optimización y NUEVA ARQUITECTURA DE CASCADA
    logger.info('🔧 INICIALIZANDO SERVICIOS CON CASCADA V2...');
    
    const vertexClient = new VertexAIClient();
    const promptFactory = new PromptFactory();
    const textChunker = new TextChunker();
    const knowledgeBase = new KnowledgeBase();
    const clinicalInsightService = new ClinicalInsightService(); // 🆕 NUEVO SERVICIO DE CASCADA
    
    logger.info('✅ SERVICIOS INICIALIZADOS:', {
      vertexClient: !!vertexClient,
      promptFactory: !!promptFactory,
      textChunker: !!textChunker,
      knowledgeBase: !!knowledgeBase,
      textChunkerMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(textChunker))
    });

    // PASO 2: Evaluar si necesita chunking
    logger.info('🔍 EVALUANDO CHUNKING...', {
      transcriptionLength: transcription.length,
      maxChunkLength: textChunker.maxChunkLength,
      transcriptionPreview: transcription.substring(0, 150) + '...'
    });
    
    const needsChunking = textChunker.shouldChunk(transcription);
    
    logger.info('✅ EVALUACIÓN DE PROCESAMIENTO COMPLETADA:', {
      needsChunking: needsChunking,
      transcriptionLength: transcription.length,
      strategy: needsChunking ? 'chunking' : 'standard',
      timestamp: new Date().toISOString()
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
          ahorro: chunkResult.costOptimization?.costAnalysis?.savingsVsPro || 'N/A'
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
          totalSavings: chunkResults.map(cr => cr.costOptimization?.costAnalysis?.savingsVsPro || 'N/A').join(', ')
        },
        chunks: chunkResults.map(cr => ({
          index: cr.chunkIndex,
          model: cr.modelUsed,
          time: cr.processingTime,
          savings: cr.costOptimization?.costAnalysis?.savingsVsPro || 'N/A'
        }))
      };
      
    } else {
      // PASO 3B: NUEVA ARQUITECTURA DE CASCADA - ANÁLISIS EN 3 ESTACIONES SECUENCIALES
      logger.info('🚀 PROCESANDO CON NUEVA CASCADA DE ANÁLISIS V2...', {
        phase: phase,
        specialty: specialty,
        sessionType: sessionType,
        transcriptionLength: transcription.length
      });
      
      // ✨ EJECUTAR CASCADA COMPLETA DE 3 ESTACIONES
      // Estación 1: Triaje Banderas Rojas (Gemini-Flash, <5s)
      // Estación 2: Extracción Hechos (Gemini-Flash, estructurado) 
      // Estación 3: Análisis Final (Gemini-Pro, contextualizado)
      
      const cascadeOptions = {
        specialty: specialty === 'physiotherapy' ? 'fisioterapia' : specialty,
        sessionType: sessionType,
        phase: phase,
        previousAnalysis: previousAnalysis,
        additionalInfo: additionalInfo,
        clinicalIntegration: clinicalIntegration
      };
      
      analysisResult = await clinicalInsightService.processTranscription(transcription, cascadeOptions);
      
      logger.info('🎉 CASCADA DE ANÁLISIS V2 COMPLETADA:', {
        totalTime: analysisResult.cascade_metadata?.total_processing_time || 'N/A',
        stationsCompleted: analysisResult.cascade_metadata?.stations_completed || 3,
        redFlagsDetected: analysisResult.cascade_metadata?.station_results?.station1_red_flags?.count || 0,
        clinicalFactsExtracted: analysisResult.cascade_metadata?.station_results?.station2_clinical_facts?.keys_extracted || 0,
        modelsUsed: analysisResult.cascade_metadata?.cost_optimization?.models_used || ['unknown'],
        estimatedSavings: analysisResult.cascade_metadata?.cost_optimization?.estimated_savings || '60-70%'
      });
      
      // Adaptar el formato de respuesta para compatibilidad con el parsing existente
      analysisResult.text = JSON.stringify(analysisResult);
      analysisResult.modelUsed = 'cascade-v2';
      analysisResult.processingTime = analysisResult.cascade_metadata?.total_processing_time || 0;
      analysisResult.costOptimization = {
        strategy: 'cascade-optimization',
        modelsUsed: analysisResult.cascade_metadata?.cost_optimization?.models_used || [],
        estimatedSavings: analysisResult.cascade_metadata?.cost_optimization?.estimated_savings || '60-70%',
        stationsCompleted: analysisResult.cascade_metadata?.stations_completed || 3
      };
    }

    // PASO 4: Extraer JSON del resultado con parsing robusto
    let jsonResult;
    
    logger.info('🔍 INICIANDO PARSING JSON:', {
      textLength: analysisResult.text.length,
      textPreview: analysisResult.text.substring(0, 300) + '...'
    });
    
    try {
      // Estrategia 1: Buscar JSON en bloques de código
      const jsonBlockMatch = analysisResult.text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        logger.info('✅ JSON encontrado en bloque de código');
        jsonResult = JSON.parse(jsonBlockMatch[1].trim());
      } else {
        // Estrategia 2: Buscar JSON entre llaves {}
        const jsonObjectMatch = analysisResult.text.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          logger.info('✅ JSON encontrado como objeto');
          jsonResult = JSON.parse(jsonObjectMatch[0]);
        } else {
          // Estrategia 3: Intentar parsear todo el texto
          logger.info('🔄 Intentando parsear texto completo como JSON');
          jsonResult = JSON.parse(analysisResult.text.trim());
        }
      }
      
      logger.info('✅ JSON PARSEADO EXITOSAMENTE:', {
        hasWarnings: !!jsonResult.warnings,
        hasSuggestions: !!jsonResult.suggestions,
        hasSoapAnalysis: !!jsonResult.soap_analysis,
        warningsCount: jsonResult.warnings?.length || 0,
        suggestionsCount: jsonResult.suggestions?.length || 0
      });
      
    } catch (parseError) {
      logger.error('❌ ERROR AL PARSEAR JSON:', {
        error: parseError.message,
        textSample: analysisResult.text.substring(0, 500),
        textLength: analysisResult.text.length,
        hasJsonBlock: analysisResult.text.includes('```json'),
        hasOpenBrace: analysisResult.text.includes('{'),
        hasCloseBrace: analysisResult.text.includes('}')
      });
      
      // Intentar generar respuesta de fallback básica
      const fallbackResponse = {
        warnings: [{
          id: 'parsing_error',
          severity: 'HIGH',
          category: 'system_error',
          title: 'Error de Procesamiento del Análisis Clínico',
          description: 'El sistema no pudo procesar completamente la respuesta del análisis médico debido a un problema de formato.',
          recommendation: 'Revisar la transcripción e intentar nuevamente. Si el problema persiste, contactar soporte técnico.',
          evidence: 'Error interno del sistema de análisis.'
        }],
        suggestions: [{
          id: 'retry_analysis',
          type: 'system_recommendation',
          title: 'Reintentar Análisis',
          description: 'Sugerimos volver a enviar la transcripción para un nuevo análisis.',
          rationale: 'El error fue temporal y puede resolverse con un nuevo intento.',
          priority: 'MEDIUM'
        }],
        soap_analysis: {
          subjective_completeness: 0,
          objective_completeness: 0,
          assessment_quality: 0,
          plan_appropriateness: 0,
          overall_quality: 0,
          missing_elements: ['Análisis no completado debido a error de sistema']
        },
        session_quality: {
          communication_score: 0,
          clinical_thoroughness: 0,
          patient_engagement: 0,
          professional_standards: 0,
          areas_for_improvement: ['Reintentar análisis debido a error técnico']
        }
      };
      
      logger.info('🔄 USANDO RESPUESTA DE FALLBACK');
      jsonResult = fallbackResponse;
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
      costSavings: analysisResult.costOptimization?.costAnalysis?.savingsVsPro || 'N/A',
      redFlags: analysisResult.costOptimization?.redFlagsDetected || 'N/A',
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
      requestBody: {
        transcriptionLength: req.body?.transcription?.length || 0,
        specialty: req.body?.specialty,
        sessionType: req.body?.sessionType
      },
      timestamp: new Date().toISOString()
    });

    // Respuesta de error mejorada con debug info
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      processingTime: processingTime,
      timestamp: new Date().toISOString(),
      version: '2.0-optimized',
      debugInfo: {
        errorType: error.constructor.name,
        transcriptionReceived: !!req.body?.transcription,
        transcriptionLength: req.body?.transcription?.length || 0
      }
    });
  }
}; 