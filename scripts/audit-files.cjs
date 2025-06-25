const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// STATS: SCRIPT DE AUDITORÍA COMPLETA DE ARCHIVOS
// Genera reporte detallado del estado del codebase

console.log('STATS: INICIANDO AUDITORÍA COMPLETA DE ARCHIVOS\n');

class CodebaseAuditor {
  constructor() {
    this.stats = {
      totalFiles: 0,
      totalDirectories: 0,
      filesByExtension: {},
      largeFiles: [],
      suspiciousFiles: [],
      documentationFiles: [],
      testFiles: [],
      configFiles: [],
      sourceFiles: [],
      buildTime: null,
      codeQualityScore: 0
    };
    
    this.suspiciousPatterns = [
      { pattern: /\.backup\./, severity: 'high', reason: 'Archivo backup' },
      { pattern: /\.old\./, severity: 'high', reason: 'Archivo obsoleto' },
      { pattern: /\.temp\./, severity: 'medium', reason: 'Archivo temporal' },
      { pattern: /copy\d*\./, severity: 'medium', reason: 'Copia duplicada' },
      { pattern: /test-.*\.html/, severity: 'low', reason: 'Test HTML suelto' },
      { pattern: /debug-/, severity: 'low', reason: 'Archivo de debug' },
      { pattern: /TODO\./, severity: 'low', reason: 'Archivo TODO' },
      { pattern: /TEMP_/, severity: 'medium', reason: 'Archivo temporal uppercase' }
    ];
  }
  
  analyzeFile(filePath, fileName) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const sizeMB = stats.size / (1024 * 1024);
    
    // Estadísticas básicas
    this.stats.totalFiles++;
    this.stats.filesByExtension[ext] = (this.stats.filesByExtension[ext] || 0) + 1;
    
    // Archivos grandes (>1MB)
    if (sizeMB > 1) {
      this.stats.largeFiles.push({
        path: filePath,
        size: `${sizeMB.toFixed(2)}MB`
      });
    }
    
    // Categorización
    if (this.isDocumentationFile(fileName)) {
      this.stats.documentationFiles.push(filePath);
    } else if (this.isTestFile(fileName)) {
      this.stats.testFiles.push(filePath);
    } else if (this.isConfigFile(fileName)) {
      this.stats.configFiles.push(filePath);
    } else if (this.isSourceFile(fileName)) {
      this.stats.sourceFiles.push(filePath);
    }
    
    // Archivos sospechosos
    for (const { pattern, severity, reason } of this.suspiciousPatterns) {
      if (pattern.test(fileName)) {
        this.stats.suspiciousFiles.push({
          path: filePath,
          severity,
          reason
        });
        break;
      }
    }
  }
  
  isDocumentationFile(fileName) {
    return /\.(md|txt|rst|doc|docx)$/i.test(fileName);
  }
  
  isTestFile(fileName) {
    return /\.(test|spec)\.(js|ts|jsx|tsx)$/i.test(fileName) || 
           fileName.includes('__tests__') || 
           fileName.includes('.test.');
  }
  
  isConfigFile(fileName) {
    const configPatterns = [
      /^package\.json$/,
      /^tsconfig/,
      /^vite\.config/,
      /^tailwind\.config/,
      /^eslint/,
      /^prettier/,
      /^\.(env|gitignore|gitattributes)/,
      /\.config\.(js|ts|json)$/
    ];
    return configPatterns.some(pattern => pattern.test(fileName));
  }
  
  isSourceFile(fileName) {
    return /\.(js|ts|jsx|tsx|vue|svelte)$/i.test(fileName);
  }
  
  analyzeDirectory(dir, basePath = '') {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        // Skip directorios excluidos
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          this.stats.totalDirectories++;
          this.analyzeDirectory(fullPath, relativePath);
        } else {
          this.analyzeFile(relativePath, item);
        }
      }
    } catch (error) {
      console.warn(`⚠️ No se pudo analizar directorio: ${dir}`);
    }
  }
  
  calculateQualityScore() {
    let score = 100;
    
    // Penalizar archivos sospechosos
    const highSeverityCount = this.stats.suspiciousFiles.filter(f => f.severity === 'high').length;
    const mediumSeverityCount = this.stats.suspiciousFiles.filter(f => f.severity === 'medium').length;
    const lowSeverityCount = this.stats.suspiciousFiles.filter(f => f.severity === 'low').length;
    
    score -= (highSeverityCount * 10);
    score -= (mediumSeverityCount * 5);
    score -= (lowSeverityCount * 2);
    
    // Penalizar ratio de documentación excesiva
    const docRatio = this.stats.documentationFiles.length / this.stats.totalFiles;
    if (docRatio > 0.1) { // >10% documentación
      score -= (docRatio - 0.1) * 50;
    }
    
    // Bonificar buena organización
    if (this.stats.testFiles.length > 0) score += 5;
    if (this.stats.configFiles.length >= 3 && this.stats.configFiles.length <= 10) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  measureBuildPerformance() {
    try {
      console.log('🔧 Midiendo performance del build...');
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      this.stats.buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`SUCCESS: Build completado en ${this.stats.buildTime}s`);
      return true;
    } catch (error) {
      console.log('ERROR: Build falló');
      this.stats.buildTime = 'FAILED';
      return false;
    }
  }
  
  generateReport() {
    console.log('STATS: Generando reporte de auditoría...\n');
    
    this.analyzeDirectory('.');
    this.stats.codeQualityScore = this.calculateQualityScore();
    const buildSuccess = this.measureBuildPerformance();
    
    const report = {
      auditTimestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.stats.totalFiles,
        totalDirectories: this.stats.totalDirectories,
        codeQualityScore: this.stats.codeQualityScore,
        buildTime: this.stats.buildTime,
        buildSuccess
      },
      breakdown: {
        filesByExtension: this.stats.filesByExtension,
        sourceFiles: this.stats.sourceFiles.length,
        testFiles: this.stats.testFiles.length,
        configFiles: this.stats.configFiles.length,
        documentationFiles: this.stats.documentationFiles.length
      },
      issues: {
        suspiciousFiles: this.stats.suspiciousFiles,
        largeFiles: this.stats.largeFiles
      },
      recommendations: this.generateRecommendations()
    };
    
    // Guardar reporte
    const reportPath = `audit-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.printReport(report);
    console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
    
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.stats.suspiciousFiles.length > 0) {
      const highPriority = this.stats.suspiciousFiles.filter(f => f.severity === 'high').length;
      if (highPriority > 0) {
        recommendations.push({
          priority: 'HIGH',
          action: `Eliminar ${highPriority} archivo(s) de alta prioridad inmediatamente`
        });
      }
    }
    
    if (this.stats.largeFiles.length > 3) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Revisar archivos grandes y considerar optimización o exclusión'
      });
    }
    
    const docRatio = this.stats.documentationFiles.length / this.stats.totalFiles;
    if (docRatio > 0.15) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Ratio de documentación muy alto (>15%), consolidar archivos MD'
      });
    }
    
    if (this.stats.buildTime && parseFloat(this.stats.buildTime) > 15) {
      recommendations.push({
        priority: 'LOW',
        action: 'Build time alto (>15s), considerar optimizaciones'
      });
    }
    
    if (this.stats.codeQualityScore < 80) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Score de calidad bajo (<80), ejecutar limpieza inmediata'
      });
    }
    
    return recommendations;
  }
  
  printReport(report) {
    console.log('STATS: REPORTE DE AUDITORÍA COMPLETA');
    console.log('='.repeat(50));
    
    console.log('\nMETRICS: RESUMEN GENERAL:');
    console.log(`• Total de archivos: ${report.summary.totalFiles}`);
    console.log(`• Total de directorios: ${report.summary.totalDirectories}`);
    console.log(`• Score de calidad: ${report.summary.codeQualityScore}/100`);
    console.log(`• Tiempo de build: ${report.summary.buildTime}s`);
    console.log(`• Build exitoso: ${report.summary.buildSuccess ? 'SUCCESS:' : 'ERROR:'}`);
    
    console.log('\n📁 DESGLOSE POR CATEGORÍA:');
    console.log(`• Archivos fuente: ${report.breakdown.sourceFiles}`);
    console.log(`• Archivos de test: ${report.breakdown.testFiles}`);
    console.log(`• Archivos de config: ${report.breakdown.configFiles}`);
    console.log(`• Archivos de docs: ${report.breakdown.documentationFiles}`);
    
    console.log('\n🔍 EXTENSIONES MÁS COMUNES:');
    const sortedExts = Object.entries(report.breakdown.filesByExtension)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedExts.forEach(([ext, count]) => {
      console.log(`• ${ext || '(sin extensión)'}: ${count} archivos`);
    });
    
    if (report.issues.suspiciousFiles.length > 0) {
      console.log('\n🚨 ARCHIVOS SOSPECHOSOS:');
      report.issues.suspiciousFiles.forEach(file => {
        const icon = file.severity === 'high' ? '🔴' : file.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${file.path} - ${file.reason}`);
      });
    }
    
    if (report.issues.largeFiles.length > 0) {
      console.log('\n📦 ARCHIVOS GRANDES (>1MB):');
      report.issues.largeFiles.forEach(file => {
        console.log(`• ${file.path} - ${file.size}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMENDACIONES:');
      report.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`${priority} ${index + 1}. ${rec.action}`);
      });
    } else {
      console.log('\n🎉 EXCELENTE: No hay recomendaciones, el codebase está limpio');
    }
  }
}

// Ejecutar auditoría
try {
  const auditor = new CodebaseAuditor();
  const report = auditor.generateReport();
  
  // Determinar código de salida basado en la calidad
  if (report.summary.codeQualityScore < 70) {
    console.log('\nERROR: AUDITORÍA FALLÓ: Score de calidad muy bajo (<70)');
    process.exit(1);
  } else if (report.summary.codeQualityScore < 85) {
    console.log('\n⚠️ AUDITORÍA CON ADVERTENCIAS: Score de calidad bajo (<85)');
    process.exit(0);
  } else {
    console.log('\nSUCCESS: AUDITORÍA EXITOSA: Codebase en excelente estado');
    process.exit(0);
  }
  
} catch (error) {
  console.error('ERROR: Error durante la auditoría:', error.message);
  process.exit(1);
} 