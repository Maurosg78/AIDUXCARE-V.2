#!/usr/bin/env node

/**
 * STATS: REPORTE AUTOMÁTICO 48 HORAS
 * Genera reporte cuando se cumplan las 48 horas de maratón
 */

const fs = require("fs");
const path = require("path");

class Marathon48HourReport {
  constructor() {
    this.logFile = path.join(__dirname, "..", "logs", "warmup-marathon.log");
    this.statsFile = path.join(__dirname, "..", "logs", "marathon-stats.json");
    this.reportFile = path.join(__dirname, "..", "logs", "report-48h.json");
  }

  async generateReport() {
    console.log("STATS: GENERANDO REPORTE 48 HORAS");
    console.log("=" .repeat(50));

    try {
      // Leer logs y estadísticas
      const logs = this.readLogs();
      const stats = this.readStats();
      
      // Analizar datos
      const analysis = this.analyzeData(logs, stats);
      
      // Generar reporte
      const report = this.createReport(analysis);
      
      // Guardar reporte
      this.saveReport(report);
      
      // Mostrar resumen
      this.displaySummary(report);
      
      return report;
      
    } catch (error) {
      console.error("ERROR: Error generando reporte:", error.message);
      return null;
    }
  }

  readLogs() {
    if (!fs.existsSync(this.logFile)) {
      throw new Error("Archivo de logs no encontrado");
    }
    
    const content = fs.readFileSync(this.logFile, "utf8");
    const lines = content.split("
").filter(line => line.trim());
    
    return lines;
  }

  readStats() {
    if (!fs.existsSync(this.statsFile)) {
      return {};
    }
    
    const content = fs.readFileSync(this.statsFile, "utf8");
    return JSON.parse(content);
  }

  analyzeData(logs, stats) {
    const sessions = [];
    const errors = [];
    const startTime = this.extractStartTime(logs);
    const endTime = new Date();
    
    // Analizar cada línea de log
    for (const line of logs) {
      if (line.includes("[SESSION]")) {
        const sessionInfo = this.extractSessionInfo(line);
        if (sessionInfo) sessions.push(sessionInfo);
      }
      
      if (line.includes("[ERROR]")) {
        const errorInfo = this.extractErrorInfo(line);
        if (errorInfo) errors.push(errorInfo);
      }
    }
    
    // Calcular métricas
    const totalSessions = sessions.length;
    const successfulSessions = sessions.filter(s => s.success).length;
    const failedSessions = sessions.filter(s => !s.success).length;
    const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;
    
    // Análisis de latencia
    const latencies = sessions.map(s => s.latency).filter(l => l > 0);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    
    // Análisis de errores
    const errorTypes = this.analyzeErrorTypes(errors);
    
    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      totalSessions,
      successfulSessions,
      failedSessions,
      successRate,
      avgLatency,
      errorTypes,
      sessions,
      errors
    };
  }

  extractStartTime(logs) {
    for (const line of logs) {
      if (line.includes("[START]")) {
        const match = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
        if (match) {
          return new Date(match[1]);
        }
      }
    }
    return new Date();
  }

  extractSessionInfo(line) {
    const sessionMatch = line.match(/sesión de calentamiento #(\d+)/);
    const timeMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
    
    if (sessionMatch && timeMatch) {
      return {
        sessionNumber: parseInt(sessionMatch[1]),
        timestamp: new Date(timeMatch[1]),
        success: !line.includes("falló"),
        latency: 0 // Se extraerá de la siguiente línea
      };
    }
    
    return null;
  }

  extractErrorInfo(line) {
    const timeMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
    const errorMatch = line.match(/\[ERROR\](.*)/);
    
    const timeMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
    const errorMatch = line.match(/\[ERROR\](.*)/);
    
    if (timeMatch && errorMatch) {
      return {
        timestamp: new Date(timeMatch[1]),
        error: errorMatch[1].trim()
      };
    }
    
    return null;
  }

  analyzeErrorTypes(errors) {
    const errorTypes = {};
    
    for (const error of errors) {
      if (error.error.includes("404")) {
        errorTypes["404 Not Found"] = (errorTypes["404 Not Found"] || 0) + 1;
      } else if (error.error.includes("403")) {
        errorTypes["403 Forbidden"] = (errorTypes["403 Forbidden"] || 0) + 1;
      } else if (error.error.includes("timeout")) {
        errorTypes["Timeout"] = (errorTypes["Timeout"] || 0) + 1;
      } else {
        errorTypes["Other"] = (errorTypes["Other"] || 0) + 1;
      }
    }
    
    return errorTypes;
  }

  createReport(analysis) {
    const durationHours = analysis.duration / (1000 * 60 * 60);
    const is48HoursReached = durationHours >= 48;
    
    return {
      reportType: "48_HOUR_MARATHON_REPORT",
      generatedAt: new Date().toISOString(),
      marathonInfo: {
        startTime: analysis.startTime.toISOString(),
        endTime: analysis.endTime.toISOString(),
        durationHours: Math.round(durationHours * 100) / 100,
        is48HoursReached
      },
      performance: {
        totalSessions: analysis.totalSessions,
        successfulSessions: analysis.successfulSessions,
        failedSessions: analysis.failedSessions,
        successRate: Math.round(analysis.successRate * 100) / 100,
        averageLatency: Math.round(analysis.avgLatency),
        sessionsPerHour: Math.round((analysis.totalSessions / durationHours) * 100) / 100
      },
      errorAnalysis: {
        totalErrors: analysis.errors.length,
        errorTypes: analysis.errorTypes,
        mostCommonError: this.getMostCommonError(analysis.errorTypes)
      },
      recommendations: this.generateRecommendations(analysis, is48HoursReached),
      nextSteps: this.generateNextSteps(analysis, is48HoursReached)
    };
  }

  getMostCommonError(errorTypes) {
    let mostCommon = null;
    let maxCount = 0;
    
    for (const [errorType, count] of Object.entries(errorTypes)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = errorType;
      }
    }
    
    return mostCommon;
  }

  generateRecommendations(analysis, is48HoursReached) {
    const recommendations = [];
    
    if (is48HoursReached) {
      if (analysis.successRate === 0) {
        recommendations.push("El modelo aún no está disponible después de 48 horas. Contactar soporte de Google Cloud.");
        recommendations.push("Verificar configuración de APIs y permisos del proyecto.");
        recommendations.push("Considerar solicitar acceso prioritario al modelo Gemini 1.5 Pro.");
      } else {
        recommendations.push("¡Excelente! El modelo está funcionando. Proceder con el test definitivo.");
        recommendations.push("Ejecutar script test-gemini-final.cjs para validar funcionalidad completa.");
      }
    } else {
      recommendations.push("Continuar con la maratón hasta completar las 48 horas.");
      recommendations.push("Monitorear logs para detectar cambios en el comportamiento.");
    }
    
    if (analysis.avgLatency > 2000) {
      recommendations.push("La latencia es alta. Considerar optimizaciones de red.");
    }
    
    return recommendations;
  }

  generateNextSteps(analysis, is48HoursReached) {
    if (is48HoursReached) {
      return [
        "Ejecutar test-gemini-final.cjs para validación completa",
        "Si el test es exitoso, proceder con integración en producción",
        "Si el test falla, revisar configuración y contactar soporte"
      ];
    } else {
      return [
        "Continuar monitoreo de la maratón",
        "Generar reporte cuando se alcancen las 48 horas",
        "Preparar test definitivo para cuando el modelo esté disponible"
      ];
    }
  }

  saveReport(report) {
    const logsDir = path.join(__dirname, "..", "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
    console.log(`ACTIVE: Reporte guardado en: ${this.reportFile}`);
  }

  displaySummary(report) {
    console.log("
STATS: RESUMEN DEL REPORTE 48 HORAS");
    console.log("=" .repeat(50));
    console.log(`TIME: Duración: ${report.marathonInfo.durationHours} horas`);
    console.log(`METRICS: Sesiones totales: ${report.performance.totalSessions}`);
    console.log(`SUCCESS: Sesiones exitosas: ${report.performance.successfulSessions}`);
    console.log(`ERROR: Sesiones fallidas: ${report.performance.failedSessions}`);
    console.log(`STATS: Tasa de éxito: ${report.performance.successRate}%`);
    console.log(`⏱️ Latencia promedio: ${report.performance.averageLatency}ms`);
    console.log(`🎯 48 horas alcanzadas: ${report.marathonInfo.is48HoursReached ? "SÍ" : "NO"}`);
    
    if (report.marathonInfo.is48HoursReached) {
      console.log("
🎉 ¡48 HORAS COMPLETADAS!");
      console.log("Es momento de ejecutar el test definitivo.");
    } else {
      console.log("
⏳ Continuando hacia las 48 horas...");
    }
    
    console.log("
💡 RECOMENDACIONES:");
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

// Ejecución principal
async function main() {
  const reporter = new Marathon48HourReport();
  const report = await reporter.generateReport();
  
  if (report) {
    console.log("
SUCCESS: Reporte generado exitosamente");
    process.exit(0);
  } else {
    console.log("
ERROR: Error generando reporte");
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { Marathon48HourReport };
