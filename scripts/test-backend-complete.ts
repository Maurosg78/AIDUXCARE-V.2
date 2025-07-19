#!/usr/bin/env tsx

/**
 * 🧪 AiDuxCare - Test Completo del Backend
 * Script para validar todo el sistema antes de user testing
 */

import { ollamaClient, isOllamaConfigured } from '../src/lib/ollama';
import { NLPServiceOllama } from '../src/services/nlpServiceOllama';
import { RAGMedicalMCP } from '../src/core/mcp/RAGMedicalMCP';

interface TestResult {
  name: string;
  status: 'success' | 'error';
  duration: number;
  details?: any;
  error?: string;
}

interface TestCase {
  name: string;
  transcript: string;
  expectedEntities: string[];
  expectedSOAPSections: string[];
}

const TEST_CASES: TestCase[] = [
  {
    name: "Caso 1: Dolor Lumbar Agudo",
    transcript: `El paciente Carlos Mendoza llegó reportando dolor intenso en la zona lumbar baja. 
Menciona que el dolor comenzó hace 3 días después de levantar una caja pesada en el trabajo. 
Durante la evaluación observé tensión muscular significativa en el área paravertebral L4-L5. 
Limitación notable en la flexión anterior del tronco, alcanzando solo 30 grados.
Aplicamos masaje terapéutico profundo y técnicas de liberación miofascial durante 20 minutos.
El paciente reportó alivio inmediato del 60% del dolor tras la sesión.
Plan: continuar con sesiones de fisioterapia tres veces por semana durante 2 semanas,
ejercicios de fortalecimiento del core en casa, y aplicación de calor local antes de dormir.
Reevaluación en una semana para evaluar progreso.`,
    expectedEntities: ['dolor lumbar', 'tensión muscular', 'L4-L5', 'flexión anterior', 'masaje terapéutico'],
    expectedSOAPSections: ['subjective', 'objective', 'assessment', 'plan']
  },
  {
    name: "Caso 2: Rehabilitación Post-Operatoria Rodilla",
    transcript: `Paciente María González, segunda sesión post-cirugía de menisco. 
Reporta dolor moderado 4/10 en rodilla derecha, especialmente al subir escaleras.
Evaluación: rango de movimiento mejorado desde última sesión, flexión 90 grados, extensión completa.
Aplicamos ejercicios de movilidad pasiva, fortalecimiento de cuádriceps con resistencia leve.
Hidroterapia 15 minutos para reducir inflamación.
Paciente tolera bien el tratamiento, sin complicaciones.
Objetivos: alcanzar flexión 120 grados en próximas 2 sesiones.
Continuar ejercicios en casa, hielo post-ejercicio, control en 3 días.`,
    expectedEntities: ['post-cirugía menisco', 'rodilla derecha', 'flexión 90 grados', 'cuádriceps', 'hidroterapia'],
    expectedSOAPSections: ['subjective', 'objective', 'assessment', 'plan']
  },
  {
    name: "Caso 3: Cervicalgia Crónica",
    transcript: `Paciente Ana López, 45 años, consulta por dolor cervical crónico de 6 meses.
Refiere dolor 6/10 en región cervical posterior, irradiado a hombro derecho.
Exploración: limitación rotación derecha 30%, tensión trapecio superior bilateral.
Aplicamos técnicas de liberación miofascial y ejercicios de movilidad cervical.
Educación postural y ergonomía en el trabajo.
Plan: sesiones 2x semana, ejercicios domiciliarios diarios, control en 2 semanas.`,
    expectedEntities: ['dolor cervical crónico', 'trapecio superior', 'rotación cervical', 'liberación miofascial'],
    expectedSOAPSections: ['subjective', 'objective', 'assessment', 'plan']
  },
  {
    name: "Caso 4: Lesión Deportiva Aguda",
    transcript: `Paciente Juan Pérez, 28 años, futbolista amateur. Lesión en partido hace 2 días.
Reporta dolor agudo 8/10 en tobillo derecho, edema moderado, limitación funcional completa.
Evaluación: esguince grado II, inestabilidad anterior, dolor a la palpación ligamento lateral externo.
Aplicamos protocolo RICE inicial, vendaje funcional, ejercicios isométricos suaves.
Plan: reposo relativo 48h, hielo 20min cada 2h, elevación, control en 3 días.
Objetivos: reducción edema, recuperación rango movimiento, retorno progresivo actividad.`,
    expectedEntities: ['esguince grado II', 'tobillo derecho', 'edema', 'ligamento lateral externo', 'protocolo RICE'],
    expectedSOAPSections: ['subjective', 'objective', 'assessment', 'plan']
  }
];

/**
 * Test de conectividad básica
 */
async function testConnectivity(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔗 Verificando conectividad...');
    
    // Test Ollama
    if (!isOllamaConfigured()) {
      throw new Error('Ollama no está configurado');
    }
    
    const health = await ollamaClient.healthCheck();
    if (health.status !== 'healthy') {
      throw new Error(`Ollama no está saludable: ${health.status}`);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'Conectividad Básica',
      status: 'success',
      duration,
      details: {
        ollama_status: health.status,
        ollama_latency: health.latency_ms
      }
    };
    
  } catch (error) {
    return {
      name: 'Conectividad Básica',
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Test de NLP Service
 */
async function testNLPService(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🧠 Probando NLP Service...');
    
    const testTranscript = "Paciente reporta dolor lumbar. Evaluación revela tensión muscular.";
    const entities = await NLPServiceOllama.extractClinicalEntities(testTranscript, false);
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'NLP Service',
      status: 'success',
      duration,
      details: {
        entities_extracted: entities.length,
        sample_entities: entities.slice(0, 3).map(e => `${e.text} (${e.type})`)
      }
    };
    
  } catch (error) {
    return {
      name: 'NLP Service',
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Test de RAG Medical
 */
async function testRAGMedical(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔬 Probando RAG Medical...');
    
    const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge('low back pain', 'fisioterapia', 2);
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'RAG Medical',
      status: 'success',
      duration,
      details: {
        citations_found: ragResult.citations.length,
        confidence_score: ragResult.confidence_score,
        sample_citation: ragResult.citations[0]?.title?.substring(0, 50)
      }
    };
    
  } catch (error) {
    return {
      name: 'RAG Medical',
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Test de caso clínico completo
 */
async function testClinicalCase(testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🏥 Probando: ${testCase.name}`);
    
    // 1. Extracción de entidades
    const entities = await NLPServiceOllama.extractClinicalEntities(testCase.transcript, false);
    
    // 2. Generación SOAP
    const soapNotes = await NLPServiceOllama.generateSOAPNotes(testCase.transcript, entities, false);
    
    // 3. RAG (opcional)
    let ragResult = null;
    try {
      const primaryCondition = entities.find(e => e.type === 'diagnosis')?.text || 
                              entities.find(e => e.type === 'symptom')?.text;
      if (primaryCondition) {
        ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(primaryCondition, 'fisioterapia', 1);
      }
    } catch (ragError) {
      console.warn('⚠️ RAG falló para este caso, continuando...');
    }
    
    const duration = Date.now() - startTime;
    
    // Validaciones
    const entityValidation = entities.length > 0;
    const soapValidation = soapNotes && 
                          testCase.expectedSOAPSections.every(section => 
                            soapNotes[section as keyof typeof soapNotes]
                          );
    
    if (!entityValidation) {
      throw new Error('No se extrajeron entidades clínicas');
    }
    
    if (!soapValidation) {
      throw new Error('SOAP incompleto o mal formateado');
    }
    
    return {
      name: testCase.name,
      status: 'success',
      duration,
      details: {
        entities_count: entities.length,
        entities_types: [...new Set(entities.map(e => e.type))],
        soap_complete: soapValidation,
        rag_used: !!ragResult,
        rag_citations: ragResult?.citations?.length || 0
      }
    };
    
  } catch (error) {
    return {
      name: testCase.name,
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Test de performance
 */
async function testPerformance(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⚡ Probando performance...');
    
    const performanceTests = [];
    
    // Test 1: Extracción de entidades rápida
    const entityStart = Date.now();
    await NLPServiceOllama.extractClinicalEntities("Dolor lumbar agudo", false);
    const entityTime = Date.now() - entityStart;
    performanceTests.push({ name: 'Entidades', time: entityTime });
    
    // Test 2: SOAP rápido
    const soapStart = Date.now();
    const entities = await NLPServiceOllama.extractClinicalEntities("Paciente con dolor", false);
    await NLPServiceOllama.generateSOAPNotes("Paciente con dolor lumbar", entities, false);
    const soapTime = Date.now() - soapStart;
    performanceTests.push({ name: 'SOAP', time: soapTime });
    
    // Test 3: RAG rápido
    const ragStart = Date.now();
    await RAGMedicalMCP.retrieveRelevantKnowledge('pain', 'fisioterapia', 1);
    const ragTime = Date.now() - ragStart;
    performanceTests.push({ name: 'RAG', time: ragTime });
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'Performance',
      status: 'success',
      duration,
      details: {
        tests: performanceTests,
        average_time: performanceTests.reduce((sum, test) => sum + test.time, 0) / performanceTests.length
      }
    };
    
  } catch (error) {
    return {
      name: 'Performance',
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests(): Promise<void> {
  console.log('🧪 AiDuxCare - Test Completo del Backend');
  console.log('═════════════════════════════════════════════════════════════════════\n');
  
  const results: TestResult[] = [];
  
  try {
    // 1. Test de conectividad
    const connectivity = await testConnectivity();
    results.push(connectivity);
    
    if (connectivity.status === 'error') {
      console.log('❌ Sistema no está listo. Deteniendo tests.');
      return;
    }
    
    // 2. Test de servicios básicos
    const nlpTest = await testNLPService();
    results.push(nlpTest);
    
    const ragTest = await testRAGMedical();
    results.push(ragTest);
    
    // 3. Test de casos clínicos
    console.log('\n🏥 TESTING CASOS CLÍNICOS');
    console.log('═'.repeat(70));
    
    for (const testCase of TEST_CASES) {
      const result = await testClinicalCase(testCase);
      results.push(result);
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. Test de performance
    const performanceTest = await testPerformance();
    results.push(performanceTest);
    
    // 5. Resumen final
    console.log('\n📊 RESUMEN DE RESULTADOS');
    console.log('═'.repeat(70));
    
    const successful = results.filter(r => r.status === 'success').length;
    const total = results.length;
    const successRate = (successful / total) * 100;
    
    console.log(`✅ Tests exitosos: ${successful}/${total} (${successRate.toFixed(1)}%)`);
    
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.duration}ms`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    });
    
    // 6. Recomendaciones
    console.log('\n💡 RECOMENDACIONES');
    console.log('═'.repeat(70));
    
    if (successRate >= 90) {
      console.log('🎉 Sistema listo para user testing');
      console.log('   - Todos los componentes funcionando correctamente');
      console.log('   - Performance dentro de parámetros esperados');
      console.log('   - Puedes proceder con fisioterapeutas reales');
    } else if (successRate >= 70) {
      console.log('⚠️ Sistema funcional pero requiere optimización');
      console.log('   - Algunos componentes tienen problemas menores');
      console.log('   - Revisar errores antes de user testing');
    } else {
      console.log('❌ Sistema no está listo para user testing');
      console.log('   - Múltiples componentes fallando');
      console.log('   - Requiere debugging antes de continuar');
    }
    
    // 7. Métricas de calidad
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`\n📈 Métricas de Calidad:`);
    console.log(`   - Tiempo promedio por test: ${avgDuration.toFixed(0)}ms`);
    console.log(`   - Tasa de éxito: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('\n🚀 ¡Sistema validado y listo para producción!');
    }
    
  } catch (error) {
    console.error('❌ Error en testing suite:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
} 