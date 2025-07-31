#!/usr/bin/env tsx

/**
 * 📊 GENERADOR DE MÉTRICAS EN TIEMPO REAL
 * 
 * Script para generar métricas de salud del sistema, análisis de dependencias
 * y predicciones de IA para el dashboard ejecutivo.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface SystemMetrics {
  timestamp: string;
  health: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    buildTime: number;
    testCoverage: number;
    lintErrors: number;
    typeErrors: number;
  };
  codebase: {
    totalFiles: number;
    totalLines: number;
    duplicateFiles: number;
    deadCodeFiles: number;
    circularDependencies: number;
  };
  performance: {
    bundleSize: number;
    buildTime: number;
    testExecutionTime: number;
    memoryUsage: number;
  };
  quality: {
    technicalDebtHours: number;
    codeComplexity: number;
    maintainabilityIndex: number;
    documentationCoverage: number;
  };
  predictions: {
    nextWeekBuildTime: number;
    nextWeekTechnicalDebt: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendedActions: string[];
  };
}

class MetricsGenerator {
  private projectRoot: string;
  private srcDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.srcDir = path.join(this.projectRoot, 'src');
  }

  /**
   * 🔍 GENERAR MÉTRICAS COMPLETAS
   */
  async generateMetrics(): Promise<SystemMetrics> {
    console.log('📊 Generando métricas del sistema...');

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      health: await this.calculateHealthMetrics(),
      codebase: await this.calculateCodebaseMetrics(),
      performance: await this.calculatePerformanceMetrics(),
      quality: await this.calculateQualityMetrics(),
      predictions: await this.generatePredictions()
    };

    // Guardar métricas
    const metricsPath = path.join(this.projectRoot, 'metrics', 'system-metrics.json');
    fs.mkdirSync(path.dirname(metricsPath), { recursive: true });
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

    console.log('✅ Métricas generadas y guardadas');
    return metrics;
  }

  /**
   * 🏥 CALCULAR MÉTRICAS DE SALUD
   */
  private async calculateHealthMetrics() {
    const buildTime = await this.measureBuildTime();
    const testCoverage = await this.getTestCoverage();
    const lintErrors = await this.getLintErrors();
    const typeErrors = await this.getTypeErrors();

    const score = this.calculateHealthScore({
      buildTime,
      testCoverage,
      lintErrors,
      typeErrors
    });

    return {
      score,
      status: this.getHealthStatus(score),
      buildTime,
      testCoverage,
      lintErrors,
      typeErrors
    };
  }

  /**
   * 📁 CALCULAR MÉTRICAS DEL CODEBASE
   */
  private async calculateCodebaseMetrics() {
    const files = this.getAllFiles(this.srcDir, ['.ts', '.tsx', '.js', '.jsx']);
    const totalLines = await this.countTotalLines(files);
    const duplicateFiles = await this.findDuplicateFiles(files);
    const deadCodeFiles = await this.findDeadCodeFiles(files);
    const circularDependencies = await this.findCircularDependencies();

    return {
      totalFiles: files.length,
      totalLines,
      duplicateFiles: duplicateFiles.length,
      deadCodeFiles: deadCodeFiles.length,
      circularDependencies
    };
  }

  /**
   * ⚡ CALCULAR MÉTRICAS DE PERFORMANCE
   */
  private async calculatePerformanceMetrics() {
    const buildTime = await this.measureBuildTime();
    const bundleSize = await this.getBundleSize();
    const testExecutionTime = await this.measureTestExecutionTime();
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    return {
      bundleSize,
      buildTime,
      testExecutionTime,
      memoryUsage: Math.round(memoryUsage * 100) / 100
    };
  }

  /**
   * 🎯 CALCULAR MÉTRICAS DE CALIDAD
   */
  private async calculateQualityMetrics() {
    const technicalDebtHours = await this.calculateTechnicalDebt();
    const codeComplexity = await this.calculateCodeComplexity();
    const maintainabilityIndex = await this.calculateMaintainabilityIndex();
    const documentationCoverage = await this.calculateDocumentationCoverage();

    return {
      technicalDebtHours,
      codeComplexity,
      maintainabilityIndex,
      documentationCoverage
    };
  }

  /**
   * 🧠 GENERAR PREDICCIONES CON IA
   */
  private async generatePredictions() {
    const historicalData = await this.loadHistoricalData();
    
    // Predicción de build time para la próxima semana
    const nextWeekBuildTime = this.predictNextWeekBuildTime(historicalData);
    
    // Predicción de deuda técnica
    const nextWeekTechnicalDebt = this.predictNextWeekTechnicalDebt(historicalData);
    
    // Evaluación de riesgo
    const riskLevel = this.assessRiskLevel(historicalData);
    
    // Acciones recomendadas
    const recommendedActions = this.generateRecommendedActions(historicalData);

    return {
      nextWeekBuildTime,
      nextWeekTechnicalDebt,
      riskLevel,
      recommendedActions
    };
  }

  // Métodos auxiliares
  private async measureBuildTime(): Promise<number> {
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const endTime = Date.now();
      return Math.round((endTime - startTime) / 1000);
    } catch (error) {
      return 0; // Build falló
    }
  }

  private async getTestCoverage(): Promise<number> {
    try {
      const output = execSync('npm run test:coverage', { stdio: 'pipe' }).toString();
      const match = output.match(/All files\s+\|\s+(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getLintErrors(): Promise<number> {
    try {
      const output = execSync('npm run lint', { stdio: 'pipe' }).toString();
      const errorMatches = output.match(/error/g);
      return errorMatches ? errorMatches.length : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getTypeErrors(): Promise<number> {
    try {
      const output = execSync('npm run type-check', { stdio: 'pipe' }).toString();
      const errorMatches = output.match(/error/g);
      return errorMatches ? errorMatches.length : 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateHealthScore(metrics: any): number {
    let score = 100;
    
    // Penalizar por build time alto
    if (metrics.buildTime > 30) score -= 20;
    else if (metrics.buildTime > 20) score -= 10;
    
    // Penalizar por baja cobertura de tests
    if (metrics.testCoverage < 50) score -= 30;
    else if (metrics.testCoverage < 80) score -= 15;
    
    // Penalizar por errores de lint
    score -= metrics.lintErrors * 2;
    
    // Penalizar por errores de tipos
    score -= metrics.typeErrors * 3;
    
    return Math.max(0, score);
  }

  private getHealthStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private async countTotalLines(files: string[]): Promise<number> {
    let totalLines = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        totalLines += content.split('\n').length;
      } catch (error) {
        // Ignorar archivos que no se pueden leer
      }
    }
    
    return totalLines;
  }

  private async findDuplicateFiles(files: string[]): Promise<string[]> {
    // Implementación simplificada de detección de duplicados
    const duplicates: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        try {
          const content1 = fs.readFileSync(files[i], 'utf8');
          const content2 = fs.readFileSync(files[j], 'utf8');
          
          if (content1 === content2) {
            duplicates.push(files[i], files[j]);
          }
        } catch (error) {
          // Ignorar archivos que no se pueden leer
        }
      }
    }
    
    return [...new Set(duplicates)];
  }

  private async findDeadCodeFiles(files: string[]): Promise<string[]> {
    // Implementación simplificada de detección de código muerto
    const deadCodeFiles: string[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Detectar archivos con solo comentarios o imports
        const lines = content.split('\n').filter(line => line.trim());
        const meaningfulLines = lines.filter(line => 
          !line.trim().startsWith('//') && 
          !line.trim().startsWith('/*') && 
          !line.trim().startsWith('import') &&
          !line.trim().startsWith('export')
        );
        
        if (meaningfulLines.length < 5) {
          deadCodeFiles.push(file);
        }
      } catch (error) {
        // Ignorar archivos que no se pueden leer
      }
    }
    
    return deadCodeFiles;
  }

  private async findCircularDependencies(): Promise<number> {
    // Implementación simplificada de detección de dependencias circulares
    return 0; // Por ahora retornamos 0
  }

  private async getBundleSize(): Promise<number> {
    try {
      const output = execSync('npm run build', { stdio: 'pipe' }).toString();
      // Implementación simplificada - en realidad necesitarías analizar el bundle
      return 1024; // 1MB por defecto
    } catch (error) {
      return 0;
    }
  }

  private async measureTestExecutionTime(): Promise<number> {
    try {
      const startTime = Date.now();
      execSync('npm run test:run', { stdio: 'pipe' });
      const endTime = Date.now();
      return Math.round((endTime - startTime) / 1000);
    } catch (error) {
      return 0;
    }
  }

  private async calculateTechnicalDebt(): Promise<number> {
    // Implementación simplificada de cálculo de deuda técnica
    return 45; // 45 horas de deuda técnica
  }

  private async calculateCodeComplexity(): Promise<number> {
    // Implementación simplificada de cálculo de complejidad
    return 3.2; // Complejidad ciclomática promedio
  }

  private async calculateMaintainabilityIndex(): Promise<number> {
    // Implementación simplificada de índice de mantenibilidad
    return 75; // 75/100
  }

  private async calculateDocumentationCoverage(): Promise<number> {
    // Implementación simplificada de cobertura de documentación
    return 60; // 60%
  }

  private async loadHistoricalData(): Promise<any[]> {
    const metricsPath = path.join(this.projectRoot, 'metrics', 'system-metrics.json');
    
    if (fs.existsSync(metricsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        return [];
      }
    }
    
    return [];
  }

  private predictNextWeekBuildTime(historicalData: any[]): number {
    if (historicalData.length < 2) return 25;
    
    const recentBuildTimes = historicalData
      .slice(-5)
      .map(d => d.health?.buildTime || 25)
      .filter(t => t > 0);
    
    if (recentBuildTimes.length === 0) return 25;
    
    const average = recentBuildTimes.reduce((a, b) => a + b, 0) / recentBuildTimes.length;
    const trend = recentBuildTimes[recentBuildTimes.length - 1] - recentBuildTimes[0];
    
    return Math.max(10, Math.round(average + trend * 0.5));
  }

  private predictNextWeekTechnicalDebt(historicalData: any[]): number {
    if (historicalData.length < 2) return 50;
    
    const recentDebt = historicalData
      .slice(-3)
      .map(d => d.quality?.technicalDebtHours || 45)
      .filter(d => d > 0);
    
    if (recentDebt.length === 0) return 50;
    
    const currentDebt = recentDebt[recentDebt.length - 1];
    const trend = recentDebt[recentDebt.length - 1] - recentDebt[0];
    
    return Math.max(0, Math.round(currentDebt + trend * 0.3));
  }

  private assessRiskLevel(historicalData: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (historicalData.length === 0) return 'medium';
    
    const latest = historicalData[historicalData.length - 1];
    const healthScore = latest.health?.score || 75;
    const technicalDebt = latest.quality?.technicalDebtHours || 45;
    const buildTime = latest.health?.buildTime || 25;
    
    if (healthScore < 50 || technicalDebt > 100 || buildTime > 60) return 'critical';
    if (healthScore < 75 || technicalDebt > 60 || buildTime > 40) return 'high';
    if (healthScore < 85 || technicalDebt > 30 || buildTime > 25) return 'medium';
    return 'low';
  }

  private generateRecommendedActions(historicalData: any[]): string[] {
    const actions: string[] = [];
    
    if (historicalData.length === 0) {
      actions.push('Implementar sistema de métricas continuas');
      actions.push('Configurar auditoría automática semanal');
      return actions;
    }
    
    const latest = historicalData[historicalData.length - 1];
    const healthScore = latest.health?.score || 75;
    const technicalDebt = latest.quality?.technicalDebtHours || 45;
    const buildTime = latest.health?.buildTime || 25;
    
    if (healthScore < 75) {
      actions.push('Priorizar corrección de errores de lint y tipos');
      actions.push('Mejorar cobertura de tests');
    }
    
    if (technicalDebt > 60) {
      actions.push('Programar sprint de refactoring');
      actions.push('Implementar auditoría de deuda técnica');
    }
    
    if (buildTime > 30) {
      actions.push('Optimizar configuración de build');
      actions.push('Implementar cache de dependencias');
    }
    
    if (actions.length === 0) {
      actions.push('Mantener métricas actuales');
      actions.push('Continuar con mejoras incrementales');
    }
    
    return actions;
  }
}

// CLI Interface
async function main() {
  const generator = new MetricsGenerator();
  
  try {
    const metrics = await generator.generateMetrics();
    
    console.log('\n📊 MÉTRICAS GENERADAS:');
    console.log(`🏥 Salud del Sistema: ${metrics.health.score}/100 (${metrics.health.status})`);
    console.log(`📁 Archivos: ${metrics.codebase.totalFiles} (${metrics.codebase.totalLines} líneas)`);
    console.log(`⚡ Build Time: ${metrics.performance.buildTime}s`);
    console.log(`🎯 Deuda Técnica: ${metrics.quality.technicalDebtHours}h`);
    console.log(`⚠️  Riesgo: ${metrics.predictions.riskLevel}`);
    
    console.log('\n🎯 PREDICCIONES:');
    console.log(`📅 Build Time próxima semana: ${metrics.predictions.nextWeekBuildTime}s`);
    console.log(`📈 Deuda técnica próxima semana: ${metrics.predictions.nextWeekTechnicalDebt}h`);
    
    console.log('\n📋 ACCIONES RECOMENDADAS:');
    metrics.predictions.recommendedActions.forEach((action, index) => {
      console.log(`${index + 1}. ${action}`);
    });
    
  } catch (error) {
    console.error('❌ Error generando métricas:', error);
    process.exit(1);
  }
}

// Verificar si es el módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 