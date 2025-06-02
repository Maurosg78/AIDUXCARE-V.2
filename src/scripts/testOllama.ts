/**
 * 🧪 AiDuxCare - Test Completo Ollama Integration
 * Script para probar todo el pipeline NLP con LLM local
 */

import { ollamaClient, isOllamaConfigured, getOllamaConfig } from '../lib/ollama';
import { NLPServiceOllama } from '../services/nlpServiceOllama';

// Transcripciones de prueba variadas
const testTranscripts = [
  {
    name: "Sesión Dolor Lumbar",
    text: `
El paciente Carlos Mendoza llegó reportando dolor intenso en la zona lumbar baja. 
Menciona que el dolor comenzó hace 3 días después de levantar una caja pesada en el trabajo. 
Durante la evaluación observé tensión muscular significativa en el área paravertebral L4-L5. 
Limitación notable en la flexión anterior del tronco, alcanzando solo 30 grados.
Aplicamos masaje terapéutico profundo y técnicas de liberación miofascial durante 20 minutos.
El paciente reportó alivio inmediato del 60% del dolor tras la sesión.
Plan: continuar con sesiones de fisioterapia tres veces por semana durante 2 semanas,
ejercicios de fortalecimiento del core en casa, y aplicación de calor local antes de dormir.
Reevaluación en una semana para evaluar progreso.
    `
  },
  {
    name: "Rehabilitación Rodilla",
    text: `
Paciente María González, segunda sesión post-cirugía de menisco. 
Reporta dolor moderado 4/10 en rodilla derecha, especialmente al subir escaleras.
Evaluación: rango de movimiento mejorado desde última sesión, flexión 90 grados, extensión completa.
Aplicamos ejercicios de movilidad pasiva, fortalecimiento de cuádriceps con resistencia leve.
Hidroterapia 15 minutos para reducir inflamación.
Paciente tolera bien el tratamiento, sin complicaciones.
Objetivos: alcanzar flexión 120 grados en próximas 2 sesiones.
Continuar ejercicios en casa, hielo post-ejercicio, control en 3 días.
    `
  },
  {
    name: "Sesión Corta Hombro",
    text: `
Paciente Juan reporta dolor hombro izquierdo. 
Observo rigidez capsular. 
Aplicamos movilización articular.
Mejora parcial inmediata.
Plan: continuar tratamiento 2 veces por semana.
    `
  }
];

// Configuraciones de test
const testConfigs = {
  quick: { maxTests: 1, detailed: false },
  standard: { maxTests: 2, detailed: true },
  complete: { maxTests: 3, detailed: true }
};

/**
 * Función principal de testing
 */
async function runOllamaTests(mode: keyof typeof testConfigs = 'standard') {
  console.log('🧪 === INICIANDO TESTS OLLAMA INTEGRATION ===\n');
  
  const config = testConfigs[mode];
  const startTime = Date.now();
  
  try {
    // Test 1: Verificar configuración
    await testConfiguration();
    
    // Test 2: Health check del cliente
    await testClientHealth();
    
    // Test 3: Procesamiento de transcripciones
    await testTranscriptProcessing(config.maxTests, config.detailed);
    
    // Test 4: Performance y métricas
    if (config.detailed) {
      await testPerformanceMetrics();
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 === TODOS LOS TESTS COMPLETADOS EXITOSAMENTE ===');
    console.log(`⏱️  Tiempo total: ${totalTime}ms`);
    console.log(`💰 Costo total: $0.00 (¡GRATIS!)`);
    console.log(`✅ Sistema listo para integración en AiDuxCare\n`);
    
  } catch (error) {
    console.error('\n❌ === ERROR EN TESTS ===');
    console.error('Error:', error);
    console.log('\n🔧 === TROUBLESHOOTING ===');
    await printTroubleshootingGuide();
  }
}

/**
 * Test de configuración básica
 */
async function testConfiguration() {
  console.log('🔧 Testing configuración...');
  
  const isConfigured = isOllamaConfigured();
  const config = getOllamaConfig();
  
  console.log('📋 Configuración actual:');
  console.log(`   Provider: ${config.provider}`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Model: ${config.model}`);
  
  if (!isConfigured) {
    throw new Error('Ollama no está configurado correctamente');
  }
  
  console.log('✅ Configuración válida\n');
}

/**
 * Test de salud del cliente Ollama
 */
async function testClientHealth() {
  console.log('🏥 Testing salud del cliente...');
  
  // Test disponibilidad
  const isAvailable = await ollamaClient.isAvailable();
  console.log(`   Disponibilidad: ${isAvailable ? '✅' : '❌'}`);
  
  if (!isAvailable) {
    throw new Error('Ollama server no está disponible');
  }
  
  // Test modelos
  const models = await ollamaClient.listModels();
  console.log(`   Modelos disponibles: ${models.length}`);
  models.forEach(model => console.log(`     - ${model}`));
  
  // Health check completo
  const health = await ollamaClient.healthCheck();
  console.log(`   Status: ${health.status}`);
  console.log(`   Latencia: ${health.latency_ms}ms`);
  
  if (health.status !== 'healthy') {
    throw new Error(`Health check falló: ${health.error}`);
  }
  
  console.log('✅ Cliente saludable\n');
}

/**
 * Test de procesamiento de transcripciones
 */
async function testTranscriptProcessing(maxTests: number, detailed: boolean) {
  console.log('📝 Testing procesamiento de transcripciones...');
  
  for (let i = 0; i < Math.min(maxTests, testTranscripts.length); i++) {
    const test = testTranscripts[i];
    console.log(`\n🧪 Test ${i + 1}: ${test.name}`);
    
    if (detailed) {
      console.log(`📋 Transcripción: "${test.text.substring(0, 100)}..."`);
    }
    
    try {
      // Procesar transcripción completa
      const result = await NLPServiceOllama.processTranscript(test.text);
      
      // Mostrar resultados
      console.log(`✅ Entidades extraídas: ${result.entities.length}`);
      
      if (detailed) {
        result.entities.slice(0, 3).forEach(entity => {
          console.log(`   - ${entity.type}: "${entity.text}" (${(entity.confidence * 100).toFixed(0)}%)`);
        });
      }
      
      console.log(`✅ Nota SOAP generada:`);
      console.log(`   S: ${result.soapNotes.subjective.substring(0, 80)}...`);
      console.log(`   O: ${result.soapNotes.objective.substring(0, 80)}...`);
      console.log(`   A: ${result.soapNotes.assessment.substring(0, 80)}...`);
      console.log(`   P: ${result.soapNotes.plan.substring(0, 80)}...`);
      
      console.log(`📊 Métricas:`);
      console.log(`   Tiempo total: ${result.metrics.total_processing_time_ms}ms`);
      console.log(`   Confianza general: ${(result.metrics.overall_confidence * 100).toFixed(0)}%`);
      console.log(`   Requiere revisión: ${result.metrics.requires_review ? '⚠️ Sí' : '✅ No'}`);
      
    } catch (error) {
      console.error(`❌ Error en test ${i + 1}:`, error);
      throw error;
    }
  }
  
  console.log('\n✅ Todos los tests de procesamiento completados\n');
}

/**
 * Test de métricas de performance
 */
async function testPerformanceMetrics() {
  console.log('📊 Testing métricas de performance...');
  
  const simpleText = "Paciente reporta dolor leve en rodilla.";
  const complexText = testTranscripts[0].text;
  
  // Test texto simple
  console.log('🔹 Test texto simple...');
  const simpleStart = Date.now();
  await NLPServiceOllama.extractClinicalEntities(simpleText);
  const simpleTime = Date.now() - simpleStart;
  console.log(`   Tiempo: ${simpleTime}ms`);
  
  // Test texto complejo
  console.log('🔹 Test texto complejo...');
  const complexStart = Date.now();
  await NLPServiceOllama.extractClinicalEntities(complexText);
  const complexTime = Date.now() - complexStart;
  console.log(`   Tiempo: ${complexTime}ms`);
  
  // Health check del servicio NLP
  const nlpHealth = await NLPServiceOllama.healthCheck();
  console.log(`🏥 Health check NLP: ${nlpHealth.status} (${nlpHealth.latency_ms}ms)`);
  
  console.log('✅ Métricas de performance completadas\n');
}

/**
 * Guía de troubleshooting
 */
async function printTroubleshootingGuide() {
  console.log('1. ¿Está Ollama corriendo?');
  console.log('   → ollama serve');
  console.log('');
  console.log('2. ¿Modelo descargado?');
  console.log('   → ollama list');
  console.log('   → ollama pull llama3.2:3b');
  console.log('');
  console.log('3. ¿Puerto correcto?');
  console.log('   → curl http://localhost:11434/api/tags');
  console.log('');
  console.log('4. ¿Variables de entorno?');
  console.log('   → cat .env.local | grep OLLAMA');
  console.log('');
  console.log('5. Reiniciar Ollama:');
  console.log('   → pkill ollama && ollama serve');
}

/**
 * Función para testing específico de un área
 */
async function testSpecificFeature(feature: 'entities' | 'soap' | 'health' | 'performance') {
  const testText = testTranscripts[0].text;
  
  switch (feature) {
    case 'entities':
      console.log('🧪 Testing solo extracción de entidades...');
      const entities = await NLPServiceOllama.extractClinicalEntities(testText);
      console.log(`✅ ${entities.length} entidades extraídas`);
      entities.forEach(e => console.log(`   - ${e.type}: ${e.text}`));
      break;
      
    case 'soap':
      console.log('🧪 Testing solo generación SOAP...');
      const soap = await NLPServiceOllama.generateSOAPNotes(testText, []);
      console.log('✅ Nota SOAP generada:');
      console.log(`   S: ${soap.subjective}`);
      console.log(`   O: ${soap.objective}`);
      console.log(`   A: ${soap.assessment}`);
      console.log(`   P: ${soap.plan}`);
      break;
      
    case 'health':
      console.log('🧪 Testing solo health checks...');
      await testClientHealth();
      break;
      
    case 'performance':
      console.log('🧪 Testing solo performance...');
      await testPerformanceMetrics();
      break;
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = (process.argv[2] as keyof typeof testConfigs) || 'standard';
  runOllamaTests(mode);
}

// Exportar para uso en otros archivos
export { runOllamaTests, testSpecificFeature };

// Para ejecutar desde navegador/Vite
declare global {
  interface Window {
    testOllama: typeof runOllamaTests;
    testOllamaFeature: typeof testSpecificFeature;
  }
}

if (typeof window !== 'undefined') {
  window.testOllama = runOllamaTests;
  window.testOllamaFeature = testSpecificFeature;
} 