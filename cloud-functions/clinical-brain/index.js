const functions = require('@google-cloud/functions-framework');
const express = require('express');
const cors = require('cors');
const winston = require('winston');

// Importar servicios core
const PromptFactory = require('./src/services/PromptFactory');
const VertexAIClient = require('./src/services/VertexAIClient');
const ResponseParser = require('./src/services/ResponseParser');
const KnowledgeBase = require('./src/services/KnowledgeBase');

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
    logger.info('Clinical Brain request received', {
      method: req.method,
      path: req.path,
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
    logger.error('Clinical Brain error', {
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
    // Validar request
    const { transcription, specialty, sessionType } = req.body;
    
    if (!transcription || !specialty) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['transcription', 'specialty'],
        received: Object.keys(req.body)
      });
    }

    logger.info('Starting clinical analysis', {
      specialty,
      sessionType,
      transcriptionLength: transcription.length,
      timestamp: new Date().toISOString()
    });

    // PASO 1: Cargar KnowledgeBase
    const knowledgeBase = await KnowledgeBase.load(specialty);
    
    // PASO 2: Generar prompt especializado
    const promptFactory = new PromptFactory(knowledgeBase);
    const prompt = promptFactory.generatePrompt(transcription, specialty, sessionType);
    
    // PASO 3: Llamar a Vertex AI
    const vertexClient = new VertexAIClient();
    const rawResponse = await vertexClient.analyze(prompt);
    
    // PASO 4: Parsear y estructurar respuesta
    const responseParser = new ResponseParser(knowledgeBase);
    const structuredResponse = responseParser.parse(rawResponse, specialty);
    
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

    logger.info('Clinical analysis completed', {
      specialty,
      processingTimeMs: processingTime,
      warningsCount: structuredResponse.warnings?.length || 0,
      suggestionsCount: structuredResponse.suggestions?.length || 0,
      timestamp: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Clinical analysis failed', {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
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
}

module.exports = { clinicalBrain: functions.http('clinicalBrain', handleAnalyzeRequest) }; 