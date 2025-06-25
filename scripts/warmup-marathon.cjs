#!/usr/bin/env node

/**
 * 🏃‍♂️ MARATÓN AUTOMATIZADA VERTEX AI
 * Calentamiento continuo para activar Gemini 1.5 Pro
 * 
 * @author AiDuxCare Development Team
 * @version 2.0
 */

const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ID = 'aiduxcare-mvp-prod';
const LOCATION = 'us-central1';
const MODEL_NAME = 'gemini-1.5-pro';
const INTERVAL_MINUTES = 10;
const MAX_SESSIONS = 100; // Máximo 100 sesiones por día

// Inicializar Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model = vertexAI.preview.getGenerativeModel({
  model: MODEL_NAME,
  generation_config: {
    max_output_tokens: 1024,
    temperature: 0.1,
    top_p: 0.8,
    top_k: 40,
  },
});

// Logging
const logFile = path.join(__dirname, '../logs/warmup-marathon.log');
const statsFile = path.join(__dirname, '../logs/marathon-stats.json');

// Asegurar que existe el directorio de logs
if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Escribir a archivo
  fs.appendFileSync(logFile, logMessage + '\n');
}

function loadStats() {
  try {
    if (fs.existsSync(statsFile)) {
      return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    }
  } catch (error) {
    log(`Error cargando estadísticas: ${error.message}`, 'ERROR');
  }
  
  return {
    totalSessions: 0,
    successfulSessions: 0,
    failedSessions: 0,
    startTime: new Date().toISOString(),
    lastSession: null,
    averageLatency: 0,
    totalLatency: 0,
  };
}

function saveStats(stats) {
  try {
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  } catch (error) {
    log(`Error guardando estadísticas: ${error.message}`, 'ERROR');
  }
}

function calculateSuccessRate(stats) {
  if (stats.totalSessions === 0) return 0;
  return ((stats.successfulSessions / stats.totalSessions) * 100).toFixed(2);
}

function formatDuration(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

async function runWarmupSession(sessionNumber) {
  const startTime = Date.now();
  const stats = loadStats();
  
  log(`🔥 Iniciando sesión de calentamiento #${sessionNumber}`, 'SESSION');
  
  try {
    // Prompt médico para calentamiento
    const prompt = `Analiza el siguiente texto médico y extrae las entidades clínicas principales:

"El paciente presenta dolor en la región lumbar derecha que se irradia hacia la pierna, con limitación de movimientos y sensación de hormigueo. Refiere que el dolor empeora al sentarse y mejora al caminar. No presenta fiebre ni otros síntomas sistémicos."

Identifica:
1. Síntomas principales
2. Localización anatómica
3. Características del dolor
4. Factores agravantes/mejorantes
5. Síntomas asociados`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const latency = Date.now() - startTime;
    
    // Actualizar estadísticas
    stats.totalSessions++;
    stats.successfulSessions++;
    stats.totalLatency += latency;
    stats.averageLatency = stats.totalLatency / stats.successfulSessions;
    stats.lastSession = new Date().toISOString();
    
    saveStats(stats);
    
    const successRate = calculateSuccessRate(stats);
    const duration = formatDuration(stats.startTime);
    
    log(`SUCCESS: Sesión #${sessionNumber} completada exitosamente`, 'SUCCESS');
    log(`⏱️ Latencia: ${latency}ms`, 'METRICS');
    log(`STATS: Estadísticas: ${stats.successfulSessions}/${stats.totalSessions} exitosas (${successRate}%)`, 'STATS');
    log(`TIME: Duración total: ${duration}`, 'TIME');
    
    // Mostrar progreso
    console.log('\n' + '='.repeat(60));
    console.log(`🏃‍♂️ MARATÓN VERTEX AI - SESIÓN #${sessionNumber}`);
    console.log('='.repeat(60));
    console.log(`SUCCESS: Estado: EXITOSA`);
    console.log(`⏱️ Latencia: ${latency}ms`);
    console.log(`STATS: Tasa de éxito: ${successRate}%`);
    console.log(`TIME: Duración total: ${duration}`);
    console.log(`🎯 Próxima sesión: ${INTERVAL_MINUTES} minutos`);
    console.log('='.repeat(60) + '\n');
    
    return true;
    
  } catch (error) {
    const latency = Date.now() - startTime;
    
    // Actualizar estadísticas
    stats.totalSessions++;
    stats.failedSessions++;
    stats.lastSession = new Date().toISOString();
    
    saveStats(stats);
    
    const successRate = calculateSuccessRate(stats);
    const duration = formatDuration(stats.startTime);
    
    log(`ERROR: Sesión #${sessionNumber} falló: ${error.message}`, 'ERROR');
    log(`⏱️ Latencia: ${latency}ms`, 'METRICS');
    log(`STATS: Estadísticas: ${stats.successfulSessions}/${stats.totalSessions} exitosas (${successRate}%)`, 'STATS');
    log(`TIME: Duración total: ${duration}`, 'TIME');
    
    // Mostrar error
    console.log('\n' + '='.repeat(60));
    console.log(`🏃‍♂️ MARATÓN VERTEX AI - SESIÓN #${sessionNumber}`);
    console.log('='.repeat(60));
    console.log(`ERROR: Estado: FALLIDA`);
    console.log(`🔍 Error: ${error.message}`);
    console.log(`⏱️ Latencia: ${latency}ms`);
    console.log(`STATS: Tasa de éxito: ${successRate}%`);
    console.log(`TIME: Duración total: ${duration}`);
    console.log(`🎯 Próxima sesión: ${INTERVAL_MINUTES} minutos`);
    console.log('='.repeat(60) + '\n');
    
    return false;
  }
}

async function startMarathon() {
  const stats = loadStats();
  const sessionNumber = stats.totalSessions + 1;
  
  log('LAUNCH: INICIANDO MARATÓN AUTOMATIZADA VERTEX AI', 'START');
  log(`STATS: Sesiones previas: ${stats.totalSessions}`, 'INFO');
  log(`SUCCESS: Tasa de éxito: ${calculateSuccessRate(stats)}%`, 'INFO');
  log(`TIME: Intervalo: ${INTERVAL_MINUTES} minutos`, 'INFO');
  log(`🎯 Máximo sesiones: ${MAX_SESSIONS}`, 'INFO');
  
  console.log('\n' + '🔥'.repeat(20));
  console.log('🏃‍♂️ MARATÓN AUTOMATIZADA VERTEX AI');
  console.log('🔥'.repeat(20));
  console.log(`STATS: Sesiones previas: ${stats.totalSessions}`);
  console.log(`SUCCESS: Tasa de éxito: ${calculateSuccessRate(stats)}%`);
  console.log(`TIME: Intervalo: ${INTERVAL_MINUTES} minutos`);
  console.log(`🎯 Máximo sesiones: ${MAX_SESSIONS}`);
  console.log('🔥'.repeat(20) + '\n');
  
  // Ejecutar primera sesión inmediatamente
  await runWarmupSession(sessionNumber);
  
  // Configurar intervalo
  const intervalMs = INTERVAL_MINUTES * 60 * 1000;
  let currentSession = sessionNumber + 1;
  
  const marathonInterval = setInterval(async () => {
    if (currentSession > MAX_SESSIONS) {
      log(`🎯 Máximo de sesiones alcanzado (${MAX_SESSIONS})`, 'COMPLETE');
      console.log('\n🎯 MARATÓN COMPLETADA - Máximo de sesiones alcanzado');
      clearInterval(marathonInterval);
      return;
    }
    
    await runWarmupSession(currentSession);
    currentSession++;
  }, intervalMs);
  
  // Manejar cierre graceful
  process.on('SIGINT', () => {
    log('🛑 Maratón interrumpida por el usuario', 'STOP');
    console.log('\n🛑 Maratón interrumpida por el usuario');
    clearInterval(marathonInterval);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('🛑 Maratón terminada por el sistema', 'STOP');
    console.log('\n🛑 Maratón terminada por el sistema');
    clearInterval(marathonInterval);
    process.exit(0);
  });
}

// Iniciar maratón
startMarathon().catch(error => {
  log(`ERROR: Error iniciando maratón: ${error.message}`, 'FATAL');
  console.error('ERROR: Error iniciando maratón:', error);
  process.exit(1);
}); 