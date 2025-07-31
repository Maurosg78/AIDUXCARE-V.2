#!/usr/bin/env tsx

/**
 * 🏥 SCRIPT DE PRUEBA - INTEGRACIÓN MÉDICA COMPLETA
 * 
 * Script para verificar que todos los componentes del sistema médico
 * estén funcionando correctamente.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface IntegrationTest {
  name: string;
  command: string;
  expectedOutput?: string;
  expectedExitCode?: number;
}

interface TestResult {
  test: IntegrationTest;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

class MedicalIntegrationTester {
  private projectRoot: string;
  private results: TestResult[] = [];

  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * 🧪 EJECUTAR TODAS LAS PRUEBAS DE INTEGRACIÓN MÉDICA
   */
  async runAllTests(): Promise<void> {
    console.log('🏥 INICIANDO PRUEBAS DE INTEGRACIÓN MÉDICA');
    console.log('=' .repeat(60));

    const tests: IntegrationTest[] = [
      {
        name: 'Compliance Médico',
        command: 'npm run audit:medical-compliance',
        expectedOutput: 'Compliance Score: 100/100'
      },
      {
        name: 'Seguridad Médica',
        command: 'npm run audit:security-scan',
        expectedOutput: 'Security Score: 100/100'
      },
      {
        name: 'Análisis Médico Completo',
        command: 'npm run audit:analyze',
        expectedOutput: 'Análisis médico completado'
      },
      {
        name: 'Generación de Métricas',
        command: 'npm run metrics:generate',
        expectedOutput: 'Métricas generadas y guardadas'
      },
      {
        name: 'Verificación de Sistema de Seguridad',
        command: 'npm run audit:safety-system-check',
        expectedOutput: 'Security Score: 100/100'
      },
      {
        name: 'Verificación de Configuración Médica',
        command: 'node -e "console.log(require(\'./.aidux-audit.config.cjs\').projectType)"',
        expectedOutput: 'medical'
      }
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.generateReport();
  }

  /**
   * 🧪 EJECUTAR PRUEBA INDIVIDUAL
   */
  private async runTest(test: IntegrationTest): Promise<void> {
    console.log(`\n🧪 Ejecutando: ${test.name}`);
    console.log(`📋 Comando: ${test.command}`);
    
    const startTime = Date.now();
    
    try {
      const output = execSync(test.command, { 
        stdio: 'pipe',
        encoding: 'utf8',
        cwd: this.projectRoot
      });
      
      const duration = Date.now() - startTime;
      const success = this.validateTest(test, output);
      
      this.results.push({
        test,
        success,
        output,
        duration
      });

      if (success) {
        console.log(`✅ ${test.name} - EXITOSO (${duration}ms)`);
      } else {
        console.log(`❌ ${test.name} - FALLÓ (${duration}ms)`);
        console.log(`📄 Salida: ${output.substring(0, 200)}...`);
      }
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        test,
        success: false,
        output: '',
        error: error.message,
        duration
      });

      console.log(`❌ ${test.name} - ERROR (${duration}ms)`);
      console.log(`🚨 Error: ${error.message}`);
    }
  }

  /**
   * ✅ VALIDAR RESULTADO DE PRUEBA
   */
  private validateTest(test: IntegrationTest, output: string): boolean {
    if (test.expectedOutput) {
      return output.includes(test.expectedOutput);
    }
    return true;
  }

  /**
   * 📊 GENERAR REPORTE DE INTEGRACIÓN
   */
  private generateReport(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 REPORTE DE INTEGRACIÓN MÉDICA');
    console.log('=' .repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log(`\n📈 ESTADÍSTICAS:`);
    console.log(`   Total de pruebas: ${totalTests}`);
    console.log(`   Exitosas: ${passedTests}`);
    console.log(`   Fallidas: ${failedTests}`);
    console.log(`   Tasa de éxito: ${successRate.toFixed(1)}%`);

    console.log(`\n✅ PRUEBAS EXITOSAS:`);
    this.results
      .filter(r => r.success)
      .forEach(result => {
        console.log(`   ✅ ${result.test.name} (${result.duration}ms)`);
      });

    if (failedTests > 0) {
      console.log(`\n❌ PRUEBAS FALLIDAS:`);
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   ❌ ${result.test.name} (${result.duration}ms)`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
    }

    console.log(`\n🏥 ESTADO DEL SISTEMA MÉDICO:`);
    if (successRate >= 100) {
      console.log(`   🟢 SISTEMA MÉDICO COMPLETAMENTE OPERATIVO`);
      console.log(`   ✅ Compliance: 100%`);
      console.log(`   ✅ Seguridad: 100%`);
      console.log(`   ✅ Integración: 100%`);
    } else if (successRate >= 80) {
      console.log(`   🟡 SISTEMA MÉDICO MAYORMENTE OPERATIVO`);
      console.log(`   ⚠️  Requiere atención en ${failedTests} componente(s)`);
    } else {
      console.log(`   🔴 SISTEMA MÉDICO CON PROBLEMAS`);
      console.log(`   🚨 Requiere corrección inmediata`);
    }

    // Guardar reporte
    const reportPath = path.join(this.projectRoot, 'MEDICAL_INTEGRATION_REPORT.md');
    const reportContent = this.generateReportContent();
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(`\n📄 Reporte guardado: ${reportPath}`);
  }

  /**
   * 📄 GENERAR CONTENIDO DEL REPORTE
   */
  private generateReportContent(): string {
    const timestamp = new Date().toISOString();
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const successRate = (passedTests / totalTests) * 100;

    return `# 🏥 REPORTE DE INTEGRACIÓN MÉDICA

## 📊 RESUMEN EJECUTIVO
- **Fecha:** ${timestamp}
- **Total de pruebas:** ${totalTests}
- **Pruebas exitosas:** ${passedTests}
- **Tasa de éxito:** ${successRate.toFixed(1)}%
- **Estado del sistema:** ${successRate >= 100 ? 'OPERATIVO' : successRate >= 80 ? 'MAYORMENTE OPERATIVO' : 'CON PROBLEMAS'}

## 🧪 DETALLES DE PRUEBAS

${this.results.map(result => `
### ${result.success ? '✅' : '❌'} ${result.test.name}
- **Comando:** \`${result.test.command}\`
- **Duración:** ${result.duration}ms
- **Estado:** ${result.success ? 'EXITOSO' : 'FALLIDO'}
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('')}

## 🏥 ESTADO DEL SISTEMA MÉDICO

### ✅ COMPONENTES OPERATIVOS
${this.results.filter(r => r.success).map(r => `- ${r.test.name}`).join('\n')}

${this.results.filter(r => !r.success).length > 0 ? `
### ❌ COMPONENTES CON PROBLEMAS
${this.results.filter(r => !r.success).map(r => `- ${r.test.name}`).join('\n')}
` : ''}

## 🎯 RECOMENDACIONES

${successRate >= 100 ? `
### ✅ SISTEMA COMPLETAMENTE OPERATIVO
- El sistema médico está funcionando correctamente
- Todos los componentes están integrados
- Compliance y seguridad verificados
- Proceder con uso en producción
` : successRate >= 80 ? `
### ⚠️ SISTEMA MAYORMENTE OPERATIVO
- La mayoría de componentes funcionan correctamente
- Revisar componentes con problemas
- Corregir antes de producción
` : `
### 🚨 SISTEMA CON PROBLEMAS
- Requiere corrección inmediata
- No usar en producción hasta resolver
- Revisar configuración médica
`}

---
*Reporte de Integración Médica - AiDuxCare*  
*Fecha: ${timestamp}*  
*Estado: ${successRate >= 100 ? 'OPERATIVO' : successRate >= 80 ? 'MAYORMENTE OPERATIVO' : 'CON PROBLEMAS'}*
`;
  }
}

// Ejecutar pruebas
async function main() {
  const tester = new MedicalIntegrationTester();
  await tester.runAllTests();
}

main().catch(console.error); 