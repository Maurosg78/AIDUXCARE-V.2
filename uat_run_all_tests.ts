import { runTestCase1 } from './uat_test_case_1';
import { runTestCase2 } from './uat_test_case_2';
import { runTestCase3 } from './uat_test_case_3';
import { runTestCase4 } from './uat_test_case_4';

interface TestResult {
  testCase: string;
  passed: boolean;
  executionTime: number;
  details: string;
}

interface UATReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  totalExecutionTime: number;
  results: TestResult[];
  overallStatus: 'PASSED' | 'FAILED' | 'PARTIAL';
  recommendations: string[];
}

async function runAllUATTests(validateOnly: boolean = false): Promise<UATReport> {
  console.log('🧪 UAT TAREA 1.1 - EJECUTANDO TODOS LOS TESTS');
  console.log('=' .repeat(100));
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log(`🎯 Objetivo: Validación completa de la expansión de banderas rojas`);
  console.log(`🔧 Modo: ${validateOnly ? 'Validación automática' : 'Ejecución completa'}`);
  console.log('=' .repeat(100));
  
  const startTime = Date.now();
  const results: TestResult[] = [];
  const recommendations: string[] = [];
  
  // Array de tests a ejecutar
  const tests = [
    { name: 'Test Case 1', runner: runTestCase1, description: 'Síndrome de Cauda Equina' },
    { name: 'Test Case 2', runner: runTestCase2, description: 'Antecedentes Oncológicos' },
    { name: 'Test Case 3', runner: runTestCase3, description: 'Anticoagulantes y Riesgo Hemorrágico' },
    { name: 'Test Case 4', runner: runTestCase4, description: 'Consulta Estándar (Regresión)' }
  ];
  
  console.log('\n🚀 INICIANDO EJECUCIÓN DE TESTS...\n');
  
  // Ejecutar cada test
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(100)}`);
    console.log(`🧪 EJECUTANDO ${test.name}: ${test.description}`);
    console.log(`${'='.repeat(100)}`);
    
    const testStartTime = Date.now();
    
    try {
      const passed = await test.runner();
      const executionTime = Date.now() - testStartTime;
      
      const result: TestResult = {
        testCase: test.name,
        passed,
        executionTime,
        details: passed ? 'Test aprobado exitosamente' : 'Test falló - revisar criterios'
      };
      
      results.push(result);
      
      if (!passed) {
        recommendations.push(`Revisar configuración de ${test.description}`);
      }
      
      console.log(`\n${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'APROBADO' : 'REPROBADO'} (${executionTime}ms)`);
      
    } catch (error) {
      const executionTime = Date.now() - testStartTime;
      
      const result: TestResult = {
        testCase: test.name,
        passed: false,
        executionTime,
        details: `Error de ejecución: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
      
      results.push(result);
      recommendations.push(`Corregir error en ${test.description}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      console.log(`\n❌ ${test.name}: ERROR DE EJECUCIÓN (${executionTime}ms)`);
      console.error(`Error: ${error}`);
    }
    
    // Pausa entre tests para mejor legibilidad
    if (i < tests.length - 1) {
      console.log('\n⏳ Pausa de 2 segundos entre tests...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Calcular estadísticas
  const totalExecutionTime = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;
  const successRate = (passedTests / results.length) * 100;
  
  // Determinar estado general
  let overallStatus: 'PASSED' | 'FAILED' | 'PARTIAL';
  if (successRate === 100) {
    overallStatus = 'PASSED';
  } else if (successRate === 0) {
    overallStatus = 'FAILED';
  } else {
    overallStatus = 'PARTIAL';
  }
  
  // Generar reporte
  const report: UATReport = {
    totalTests: results.length,
    passedTests,
    failedTests,
    successRate,
    totalExecutionTime,
    results,
    overallStatus,
    recommendations
  };
  
  // Mostrar reporte final
  console.log('\n' + '='.repeat(100));
  console.log('📊 REPORTE FINAL UAT TAREA 1.1');
  console.log('='.repeat(100));
  
  console.log(`\n📈 ESTADÍSTICAS GENERALES:`);
  console.log(`  🧪 Total de tests: ${report.totalTests}`);
  console.log(`  ✅ Tests aprobados: ${report.passedTests}`);
  console.log(`  ❌ Tests reprobados: ${report.failedTests}`);
  console.log(`  📊 Tasa de éxito: ${report.successRate.toFixed(1)}%`);
  console.log(`  ⏱️ Tiempo total: ${report.totalExecutionTime}ms`);
  
  console.log(`\n🎯 ESTADO GENERAL: ${report.overallStatus}`);
  
  console.log(`\n📋 RESULTADOS DETALLADOS:`);
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${index + 1}. ${status} ${result.testCase}: ${result.passed ? 'APROBADO' : 'REPROBADO'} (${result.executionTime}ms)`);
    if (!result.passed) {
      console.log(`     📝 Detalles: ${result.details}`);
    }
  });
  
  if (recommendations.length > 0) {
    console.log(`\n💡 RECOMENDACIONES:`);
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // Criterios de aprobación UAT
  console.log(`\n🎯 CRITERIOS DE APROBACIÓN UAT:`);
  console.log(`  ✅ Todos los test cases deben pasar: ${report.passedTests === report.totalTests ? 'SÍ' : 'NO'}`);
  console.log(`  ✅ Tasa de éxito >95%: ${report.successRate > 95 ? 'SÍ' : 'NO'}`);
  console.log(`  ✅ Test de regresión debe pasar: ${results[3]?.passed ? 'SÍ' : 'NO'}`);
  console.log(`  ✅ Tiempo de procesamiento <10ms por caso: ${results.every(r => r.executionTime < 10) ? 'SÍ' : 'NO'}`);
  
  // Decisión final
  console.log(`\n${'='.repeat(100)}`);
  if (report.overallStatus === 'PASSED') {
    console.log('🎉 UAT TAREA 1.1: APROBADO COMPLETAMENTE ✅');
    console.log('✅ Todos los criterios de validación han sido cumplidos');
    console.log('✅ El sistema detecta correctamente las banderas rojas críticas');
    console.log('✅ No se detectaron falsos positivos en consultas normales');
    console.log('✅ Las recomendaciones son clínicamente apropiadas');
    console.log('✅ El rendimiento es aceptable');
    console.log('\n🚀 LISTO PARA PROCEDER CON LA TAREA 1.2');
  } else if (report.overallStatus === 'PARTIAL') {
    console.log('⚠️ UAT TAREA 1.1: APROBACIÓN PARCIAL ⚠️');
    console.log('⚠️ Algunos tests han fallado');
    console.log('⚠️ Revisar las recomendaciones antes de continuar');
    console.log('⚠️ Considerar correcciones antes de la Tarea 1.2');
  } else {
    console.log('❌ UAT TAREA 1.1: REPROBADO ❌');
    console.log('❌ Múltiples tests han fallado');
    console.log('❌ Se requieren correcciones críticas');
    console.log('❌ NO proceder con la Tarea 1.2 hasta resolver los problemas');
  }
  
  console.log(`${'='.repeat(100)}`);
  
  // Si es modo validación automática, mostrar resumen ejecutivo
  if (validateOnly) {
    console.log('\n📋 RESUMEN EJECUTIVO PARA CTO:');
    console.log(`Estado: ${report.overallStatus}`);
    console.log(`Tests aprobados: ${report.passedTests}/${report.totalTests}`);
    console.log(`Tasa de éxito: ${report.successRate.toFixed(1)}%`);
    console.log(`Recomendación: ${report.overallStatus === 'PASSED' ? 'APROBAR' : 'REVISAR'}`);
  }
  
  return report;
}

// Función para validación automática
async function validateUAT(): Promise<boolean> {
  const report = await runAllUATTests(true);
  return report.overallStatus === 'PASSED';
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const validateOnly = process.argv.includes('--validate');
  
  if (validateOnly) {
    console.log('🔍 MODO VALIDACIÓN AUTOMÁTICA');
    validateUAT().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    console.log('🚀 MODO EJECUCIÓN COMPLETA');
    runAllUATTests().then(report => {
      process.exit(report.overallStatus === 'PASSED' ? 0 : 1);
    });
  }
}

export { runAllUATTests, validateUAT }; 