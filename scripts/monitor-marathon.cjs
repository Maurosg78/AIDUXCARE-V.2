#!/usr/bin/env node

/**
 * STATS: MONITOR DE MARATÓN VERTEX AI
 * Verifica el progreso de la maratón de calentamiento
 * 
 * @author AiDuxCare Development Team
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');

const statsFile = path.join(__dirname, '../logs/marathon-stats.json');
const logFile = path.join(__dirname, '../logs/warmup-marathon.log');

function loadStats() {
  try {
    if (fs.existsSync(statsFile)) {
      return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error.message);
  }
  
  return null;
}

function getRecentLogs(lines = 10) {
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      return lines.slice(-lines);
    }
  } catch (error) {
    console.error('Error leyendo logs:', error.message);
  }
  
  return [];
}

function formatDuration(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function calculateSuccessRate(stats) {
  if (!stats || stats.totalSessions === 0) return 0;
  return ((stats.successfulSessions / stats.totalSessions) * 100).toFixed(2);
}

function showMarathonStatus() {
  const stats = loadStats();
  const recentLogs = getRecentLogs(5);
  
  console.log('\n' + '🔥'.repeat(60));
  console.log('STATS: MONITOR DE MARATÓN VERTEX AI');
  console.log('🔥'.repeat(60));
  
  if (stats) {
    console.log(`📅 Iniciada: ${new Date(stats.startTime).toLocaleString()}`);
    console.log(`TIME: Duración: ${formatDuration(stats.startTime)}`);
    console.log(`STATS: Sesiones totales: ${stats.totalSessions}`);
    console.log(`SUCCESS: Sesiones exitosas: ${stats.successfulSessions}`);
    console.log(`ERROR: Sesiones fallidas: ${stats.failedSessions}`);
    console.log(`METRICS: Tasa de éxito: ${calculateSuccessRate(stats)}%`);
    
    if (stats.lastSession) {
      console.log(`🕐 Última sesión: ${new Date(stats.lastSession).toLocaleString()}`);
    }
    
    if (stats.averageLatency > 0) {
      console.log(`⏱️ Latencia promedio: ${stats.averageLatency.toFixed(0)}ms`);
    }
  } else {
    console.log('ERROR: No se encontraron estadísticas de maratón');
  }
  
  console.log('\n📋 ÚLTIMOS LOGS:');
  console.log('-'.repeat(60));
  recentLogs.forEach(log => {
    console.log(log);
  });
  
  console.log('\n🎯 ESTADO ACTUAL:');
  console.log('-'.repeat(60));
  
  if (stats && stats.totalSessions > 0) {
    if (stats.successfulSessions > 0) {
      console.log('SUCCESS: VERTEX AI ACTIVO - Maratón funcionando correctamente');
    } else {
      console.log('⏳ VERTEX AI EN PROCESO - Continuando calentamiento...');
      console.log('💡 Esto es normal durante las primeras 24-48 horas');
    }
  } else {
    console.log('RELOAD: MARATÓN INICIÁNDOSE...');
  }
  
  console.log('🔥'.repeat(60) + '\n');
}

// Mostrar estado actual
showMarathonStatus();

// Si se ejecuta con argumento --watch, monitorear continuamente
if (process.argv.includes('--watch')) {
  console.log('👀 Monitoreando maratón en tiempo real... (Ctrl+C para salir)\n');
  
  const interval = setInterval(() => {
    showMarathonStatus();
  }, 30000); // Actualizar cada 30 segundos
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Monitoreo detenido');
    clearInterval(interval);
    process.exit(0);
  });
} 