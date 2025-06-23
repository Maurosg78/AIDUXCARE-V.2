/**
 * Test Script para RealWorldSOAPProcessor
 * Valida el pipeline completo con casos reales de fisioterapia
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importar el processor y casos de prueba
import RealWorldSOAPProcessor from '../src/services/RealWorldSOAPProcessor.ts';

// Casos de prueba con resultados esperados
const TEST_CASES = [
  {
    name: 'Cervicalgia Post-Latigazo',
    input: `Paciente refiere dolor cervical intenso desde hace 3 semanas tras accidente de tráfico. Me duele mucho al girar la cabeza hacia la derecha, sobre todo por las mañanas. No puedo dormir bien por el dolor. Al examinar, se evidencia contractura de musculatura cervical bilateral. Test de Spurling positivo a la derecha. Rango de movimiento cervical limitado 50% en rotación derecha. Compatible con síndrome post-latigazo cervical. Recomiendo terapia manual y ejercicios de movilización gradual.`,
    expected: {
      totalSegments: 6,
      soapSections: ['S', 'S', 'S', 'O', 'O', 'A', 'P'],
      speakerAccuracy: 0.85,
      keyEntities: ['cuello', 'dolor', 'contractura', 'spurling', 'terapia manual'],
      assessment: 'cervicalgia'
    }
  },
  {
    name: 'Lumbalgia Mecánica',
    input: `Tengo dolor en la espalda baja desde hace 2 meses. Empezó después de levantar una caja pesada en el trabajo. El dolor es constante, me baja hasta la pierna izquierda. Por las mañanas me cuesta mucho levantarme. Al palpar hay contractura evidente de musculatura paravertebral L4-L5. Test de Lasègue negativo. Movilidad lumbar limitada en flexión. Cuadro compatible con lumbalgia mecánica con contractura muscular. Plan: terapia manual, ejercicios de fortalecimiento del core.`,
    expected: {
      totalSegments: 7,
      soapSections: ['S', 'S', 'S', 'S', 'O', 'O', 'A', 'P'],
      speakerAccuracy: 0.88,
      keyEntities: ['lumbar', 'dolor', 'contractura', 'lasègue', 'ejercicios'],
      assessment: 'lumbalgia'
    }
  },
  {
    name: 'Hombro Doloroso',
    input: `Me duele el hombro derecho cuando levanto el brazo. Empezó hace 1 mes sin causa aparente. Por las noches es peor, no puedo dormir sobre ese lado. Al examinar, arco doloroso entre 60-120 grados de abducción. Test de Neer positivo. Limitación funcional evidente. Impresión diagnóstica: síndrome de impingement subacromial. Tratamiento: terapia manual y ejercicios de fortalecimiento del manguito rotador.`,
    expected: {
      totalSegments: 6,
      soapSections: ['S', 'S', 'S', 'O', 'O', 'A', 'P'],
      speakerAccuracy: 0.90,
      keyEntities: ['hombro', 'dolor', 'abducción', 'neer', 'manguito rotador'],
      assessment: 'impingement'
    }
  }
];

/**
 * Ejecuta un caso de prueba individual
 */
async function runTestCase(testCase, processor) {
  console.log(`\n🧪 Ejecutando: ${testCase.name}`);
  console.log(`📝 Input: ${testCase.input.substring(0, 100)}...`);
  
  try {
    // Procesar transcripción
    const result = await processor.processTranscription(testCase.input);
    
    // Validar resultados
    const validation = validateResult(result, testCase.expected);
    
    // Mostrar resultados
    console.log(`✅ Segmentos procesados: ${result.segments.length}`);
    console.log(`👥 Precisión hablantes: ${(result.speakerAccuracy * 100).toFixed(1)}%`);
    console.log(`🎯 Confianza promedio: ${(result.processingMetrics.averageConfidence * 100).toFixed(1)}%`);
    console.log(`⚡ Tiempo procesamiento: ${result.processingMetrics.processingTimeMs}ms`);
    
    // Mostrar distribución SOAP
    const soapDist = result.processingMetrics.soapDistribution;
    console.log(`📊 Distribución SOAP: S:${soapDist.S || 0} O:${soapDist.O || 0} A:${soapDist.A || 0} P:${soapDist.P || 0}`);
    
    // Mostrar entidades extraídas
    const allEntities = result.segments.flatMap(s => Object.values(s.entities).flat());
    console.log(`🔍 Entidades extraídas: ${allEntities.slice(0, 5).join(', ')}...`);
    
    // Mostrar assessment generado
    if (result.fullAssessment) {
      console.log(`🏥 Assessment: ${result.fullAssessment.substring(0, 100)}...`);
    }
    
    // Mostrar validación
    console.log(`\n📋 Validación:`);
    Object.entries(validation).forEach(([key, value]) => {
      const status = value.passed ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${value.message}`);
    });
    
    return validation;
    
  } catch (error) {
    console.error(`❌ Error en ${testCase.name}:`, error.message);
    return { error: true, message: error.message };
  }
}

/**
 * Valida el resultado contra las expectativas
 */
function validateResult(result, expected) {
  const validation = {};
  
  // Validar número de segmentos (±1 de tolerancia)
  const segmentDiff = Math.abs(result.segments.length - expected.totalSegments);
  validation.segmentCount = {
    passed: segmentDiff <= 1,
    message: `Esperado: ${expected.totalSegments}, Obtenido: ${result.segments.length}`
  };
  
  // Validar precisión de hablantes
  validation.speakerAccuracy = {
    passed: result.speakerAccuracy >= (expected.speakerAccuracy - 0.05),
    message: `Esperado: ≥${expected.speakerAccuracy}, Obtenido: ${result.speakerAccuracy.toFixed(3)}`
  };
  
  // Validar presencia de entidades clave
  const allEntities = result.segments.flatMap(s => Object.values(s.entities).flat());
  const foundEntities = expected.keyEntities.filter(entity => 
    allEntities.some(e => e.toLowerCase().includes(entity.toLowerCase()))
  );
  validation.keyEntities = {
    passed: foundEntities.length >= Math.floor(expected.keyEntities.length * 0.7),
    message: `Esperado: ${expected.keyEntities.length}, Encontrado: ${foundEntities.length} (${foundEntities.join(', ')})`
  };
  
  // Validar assessment
  const assessmentMatch = result.fullAssessment.toLowerCase().includes(expected.assessment.toLowerCase());
  validation.assessment = {
    passed: assessmentMatch,
    message: `Esperado: contiene "${expected.assessment}", Assessment: "${result.fullAssessment.substring(0, 50)}..."`
  };
  
  // Validar distribución SOAP mínima
  const soapDist = result.processingMetrics.soapDistribution;
  const hasAllSections = ['S', 'O', 'A', 'P'].every(section => soapDist[section] > 0);
  validation.soapDistribution = {
    passed: hasAllSections || Object.keys(soapDist).length >= 3,
    message: `Secciones encontradas: ${Object.keys(soapDist).join(', ')}`
  };
  
  return validation;
}

/**
 * Calcula estadísticas generales de todos los tests
 */
function calculateOverallStats(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => !r.error).length;
  
  let totalValidations = 0;
  let passedValidations = 0;
  
  results.forEach(result => {
    if (!result.error) {
      Object.values(result).forEach(validation => {
        if (validation.passed !== undefined) {
          totalValidations++;
          if (validation.passed) passedValidations++;
        }
      });
    }
  });
  
  return {
    testSuccessRate: (passedTests / totalTests) * 100,
    validationSuccessRate: (passedValidations / totalValidations) * 100,
    totalTests,
    passedTests,
    totalValidations,
    passedValidations
  };
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando Tests del RealWorldSOAPProcessor');
  console.log('=' .repeat(60));
  
  // Crear instancia del processor
  const processor = new RealWorldSOAPProcessor({
    specialty: 'fisioterapia',
    confidenceThreshold: 0.7,
    enableAdvancedNER: true,
    generateAssessment: true
  });
  
  // Ejecutar todos los casos de prueba
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase, processor);
    results.push(result);
  }
  
  // Calcular estadísticas generales
  const stats = calculateOverallStats(results);
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('=' .repeat(60));
  console.log(`🧪 Tests ejecutados: ${stats.totalTests}`);
  console.log(`✅ Tests exitosos: ${stats.passedTests} (${stats.testSuccessRate.toFixed(1)}%)`);
  console.log(`📋 Validaciones totales: ${stats.totalValidations}`);
  console.log(`✅ Validaciones exitosas: ${stats.passedValidations} (${stats.validationSuccessRate.toFixed(1)}%)`);
  
  // Determinar resultado final
  const overallSuccess = stats.validationSuccessRate >= 90;
  console.log(`\n🎯 RESULTADO FINAL: ${overallSuccess ? '✅ EXITOSO' : '❌ NECESITA MEJORAS'}`);
  
  if (overallSuccess) {
    console.log('🎉 El RealWorldSOAPProcessor está listo para producción!');
  } else {
    console.log('⚠️  El processor necesita ajustes antes de producción.');
  }
  
  // Guardar log detallado
  const logPath = path.join(__dirname, '..', 'test-results-realworld.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    stats,
    overallSuccess
  }, null, 2));
  
  console.log(`📝 Log detallado guardado en: ${logPath}`);
  
  process.exit(overallSuccess ? 0 : 1);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
} 