#!/usr/bin/env node
/**
 * Script de monitoreo automático para Google Cloud Speech-to-Text
 * Ejecuta checks de salud, métricas y alertas
 */

const { exec } = require('child_process');
const fs = require('fs');

// Configuración
const CONFIG = {
  healthUrl: 'https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/healthCheck',
  transcribeUrl: 'https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/transcribeAudio',
  frontendUrl: 'http://localhost:5177',
  maxLatency: 3000, // 3 segundos
  alertEmail: 'msobarzo78@gmail.com',
  logFile: 'production-monitoring.log'
};

// Estado del sistema
let systemStatus = {
  timestamp: new Date().toISOString(),
  healthCheck: false,
  latency: 0,
  errors: [],
  uptime: 0,
  lastAlert: null
};

/**
 * Logging con timestamp
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
  
  console.log(logEntry);
  
  // Escribir a archivo de log
  fs.appendFileSync(CONFIG.logFile, logEntry + '\n');
}

/**
 * Ejecutar comando shell
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Health Check de Cloud Functions
 */
async function checkHealthStatus() {
  log('INFO', 'Ejecutando health check...');
  
  try {
    const start = Date.now();
    const result = await execCommand(`curl -s -w "\\n%{http_code}\\n%{time_total}" "${CONFIG.healthUrl}"`);
    const lines = result.stdout.trim().split('\n');
    
    const response = lines[0];
    const httpCode = parseInt(lines[1]);
    const totalTime = parseFloat(lines[2]);
    
    systemStatus.latency = Math.round(totalTime * 1000); // Convertir a ms
    systemStatus.healthCheck = httpCode === 200;
    
    if (systemStatus.healthCheck) {
      const healthData = JSON.parse(response);
      log('SUCCESS', `Health check exitoso: ${healthData.status}`, {
        latency: systemStatus.latency,
        httpCode
      });
    } else {
      systemStatus.errors.push(`Health check failed: HTTP ${httpCode}`);
      log('ERROR', `Health check falló: HTTP ${httpCode}`);
    }
    
  } catch (error) {
    systemStatus.errors.push(`Health check error: ${error.message}`);
    log('ERROR', 'Error en health check', { error: error.message });
  }
}

/**
 * Verificar CORS
 */
async function checkCORS() {
  log('INFO', 'Verificando configuración CORS...');
  
  try {
    const result = await execCommand(`curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${CONFIG.transcribeUrl}" -H "Origin: ${CONFIG.frontendUrl}"`);
    const httpCode = parseInt(result.stdout.trim());
    
    if (httpCode === 200) {
      log('SUCCESS', 'CORS configurado correctamente');
    } else {
      systemStatus.errors.push(`CORS failed: HTTP ${httpCode}`);
      log('ERROR', `CORS falló: HTTP ${httpCode}`);
    }
    
  } catch (error) {
    systemStatus.errors.push(`CORS error: ${error.message}`);
    log('ERROR', 'Error verificando CORS', { error: error.message });
  }
}

/**
 * Verificar logs de errores recientes
 */
async function checkRecentErrors() {
  log('INFO', 'Verificando logs de errores recientes...');
  
  try {
    const result = await execCommand(`gcloud functions logs read transcribeAudio --limit 20 --filter="severity=ERROR" --region us-central1 --format="value(timestamp,textPayload)" 2>/dev/null || echo "No errors found"`);
    
    if (result.stdout.trim() !== "No errors found" && result.stdout.trim() !== "") {
      const errorCount = result.stdout.trim().split('\n').length;
      systemStatus.errors.push(`${errorCount} errores recientes en logs`);
      log('WARN', `${errorCount} errores encontrados en logs recientes`);
    } else {
      log('SUCCESS', 'No hay errores recientes en logs');
    }
    
  } catch (error) {
    log('WARN', 'No se pudieron verificar logs', { error: error.message });
  }
}

/**
 * Verificar métricas de rendimiento
 */
async function checkPerformanceMetrics() {
  log('INFO', 'Verificando métricas de rendimiento...');
  
  // Verificar latencia
  if (systemStatus.latency > CONFIG.maxLatency) {
    systemStatus.errors.push(`Latencia alta: ${systemStatus.latency}ms (max: ${CONFIG.maxLatency}ms)`);
    log('WARN', `Latencia por encima del objetivo: ${systemStatus.latency}ms`);
  } else {
    log('SUCCESS', `Latencia dentro del objetivo: ${systemStatus.latency}ms`);
  }
  
  // Verificar disponibilidad del frontend
  try {
    const result = await execCommand(`curl -s -o /dev/null -w "%{http_code}" "${CONFIG.frontendUrl}"`);
    const httpCode = parseInt(result.stdout.trim());
    
    if (httpCode === 200) {
      log('SUCCESS', 'Frontend disponible');
    } else {
      systemStatus.errors.push(`Frontend no disponible: HTTP ${httpCode}`);
      log('ERROR', `Frontend no disponible: HTTP ${httpCode}`);
    }
  } catch (error) {
    systemStatus.errors.push(`Frontend error: ${error.message}`);
    log('ERROR', 'Error verificando frontend', { error: error.message });
  }
}

/**
 * Enviar alerta si es necesario
 */
async function sendAlertIfNeeded() {
  if (systemStatus.errors.length === 0) {
    log('SUCCESS', 'Todos los checks pasaron - No se requieren alertas');
    return;
  }
  
  // Evitar spam de alertas (máximo 1 cada 30 minutos)
  const now = Date.now();
  if (systemStatus.lastAlert && (now - systemStatus.lastAlert) < 30 * 60 * 1000) {
    log('INFO', 'Alerta suprimida (cooldown activo)');
    return;
  }
  
  const alertMessage = `
🚨 ALERTA AiDuxCare V.2 - Google Cloud Speech-to-Text

Timestamp: ${systemStatus.timestamp}
Errores detectados: ${systemStatus.errors.length}

Detalles:
${systemStatus.errors.map(error => `- ${error}`).join('\n')}

Métricas:
- Health Check: ${systemStatus.healthCheck ? '✅' : '❌'}
- Latencia: ${systemStatus.latency}ms
- URL: ${CONFIG.healthUrl}

Acción requerida: Revisar logs y estado del sistema.
  `;
  
  log('ALERT', 'Enviando alerta de sistema', {
    errorsCount: systemStatus.errors.length,
    latency: systemStatus.latency
  });
  
  // En producción aquí se enviaría email/Slack/etc
  console.log('\n' + '='.repeat(60));
  console.log(alertMessage);
  console.log('='.repeat(60) + '\n');
  
  systemStatus.lastAlert = now;
}

/**
 * Generar reporte de estado
 */
function generateStatusReport() {
  const successRate = systemStatus.errors.length === 0 ? 100 : 
    Math.max(0, 100 - (systemStatus.errors.length * 25));
  
  const report = {
    timestamp: systemStatus.timestamp,
    status: systemStatus.errors.length === 0 ? 'HEALTHY' : 'DEGRADED',
    successRate: `${successRate}%`,
    latency: `${systemStatus.latency}ms`,
    healthCheck: systemStatus.healthCheck,
    errorsCount: systemStatus.errors.length,
    errors: systemStatus.errors,
    nextCheck: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
  };
  
  // Guardar reporte
  fs.writeFileSync('system-status.json', JSON.stringify(report, null, 2));
  
  log('INFO', 'Reporte de estado generado', {
    status: report.status,
    successRate: report.successRate,
    errorsCount: report.errorsCount
  });
  
  return report;
}

/**
 * Ejecutar monitoreo completo
 */
async function runMonitoring() {
  log('INFO', '🚀 Iniciando monitoreo de producción AiDuxCare V.2');
  
  systemStatus = {
    timestamp: new Date().toISOString(),
    healthCheck: false,
    latency: 0,
    errors: [],
    uptime: 0,
    lastAlert: systemStatus.lastAlert // Mantener última alerta
  };
  
  try {
    // Ejecutar todos los checks
    await checkHealthStatus();
    await checkCORS();
    await checkPerformanceMetrics();
    await checkRecentErrors();
    
    // Procesar resultados
    await sendAlertIfNeeded();
    const report = generateStatusReport();
    
    // Resumen final
    console.log('\n📊 RESUMEN DE MONITOREO:');
    console.log(`Estado: ${report.status}`);
    console.log(`Tasa de éxito: ${report.successRate}`);
    console.log(`Latencia: ${report.latency}`);
    console.log(`Errores: ${report.errorsCount}`);
    
    if (report.status === 'HEALTHY') {
      console.log('✅ Sistema funcionando correctamente');
    } else {
      console.log('⚠️ Sistema requiere atención');
    }
    
  } catch (error) {
    log('ERROR', 'Error ejecutando monitoreo', { error: error.message });
    process.exit(1);
  }
}

// Ejecutar monitoreo
if (require.main === module) {
  runMonitoring();
}

module.exports = { runMonitoring, CONFIG }; 