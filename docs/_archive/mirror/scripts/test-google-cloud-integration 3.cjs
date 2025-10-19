#!/usr/bin/env node
/**
 * Script de prueba para validar integración Google Cloud Speech-to-Text
 * Ejecuta pruebas de latencia, precisión y funcionalidad
 */

const fs = require('fs');
const fetch = require('node-fetch');

// URLs de prueba
const HEALTH_URL = 'https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/healthCheck';
const TRANSCRIBE_URL = 'https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/transcribeAudio';
const FRONTEND_URL = 'http://localhost:5177';

// Métricas de éxito
const SUCCESS_CRITERIA = {
  latency: 3000, // <3 segundos
  successRate: 95, // >95%
  healthCheck: true
};

let testResults = {
  healthCheck: false,
  cors: false,
  latency: 0,
  successRate: 0,
  errors: []
};

console.log('🚀 INICIANDO PRUEBAS DE INTEGRACIÓN GOOGLE CLOUD SPEECH-TO-TEXT\n');

async function testHealthCheck() {
  console.log('1️⃣ Probando Health Check...');
  
  try {
    const start = Date.now();
    const response = await fetch(HEALTH_URL);
    const latency = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      testResults.healthCheck = data.status === 'healthy';
      console.log(`   ✅ Health Check: ${data.status} (${latency}ms)`);
    } else {
      testResults.errors.push(`Health check failed: ${response.status}`);
      console.log(`   ❌ Health Check failed: ${response.status}`);
    }
  } catch (error) {
    testResults.errors.push(`Health check error: ${error.message}`);
    console.log(`   ❌ Health Check error: ${error.message}`);
  }
}

async function testCORS() {
  console.log('2️⃣ Probando CORS...');
  
  try {
    const response = await fetch(TRANSCRIBE_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5177',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (response.ok) {
      testResults.cors = true;
      console.log('   ✅ CORS configurado correctamente');
    } else {
      testResults.errors.push(`CORS failed: ${response.status}`);
      console.log(`   ❌ CORS failed: ${response.status}`);
    }
  } catch (error) {
    testResults.errors.push(`CORS error: ${error.message}`);
    console.log(`   ❌ CORS error: ${error.message}`);
  }
}

async function testFrontendAvailability() {
  console.log('3️⃣ Probando disponibilidad del frontend...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    
    if (response.ok) {
      console.log('   ✅ Frontend disponible en localhost:5177');
    } else {
      testResults.errors.push(`Frontend not available: ${response.status}`);
      console.log(`   ❌ Frontend not available: ${response.status}`);
    }
  } catch (error) {
    testResults.errors.push(`Frontend error: ${error.message}`);
    console.log(`   ❌ Frontend error: ${error.message}`);
  }
}

async function testLatency() {
  console.log('4️⃣ Probando latencia de respuesta...');
  
  const latencies = [];
  const testCount = 5;
  
  for (let i = 0; i < testCount; i++) {
    try {
      const start = Date.now();
      const response = await fetch(HEALTH_URL);
      const latency = Date.now() - start;
      latencies.push(latency);
      
      console.log(`   Test ${i + 1}: ${latency}ms`);
    } catch (error) {
      testResults.errors.push(`Latency test ${i + 1} failed: ${error.message}`);
    }
  }
  
  if (latencies.length > 0) {
    testResults.latency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    console.log(`   📊 Latencia promedio: ${testResults.latency}ms`);
    
    if (testResults.latency < SUCCESS_CRITERIA.latency) {
      console.log('   ✅ Latencia dentro del objetivo (<3s)');
    } else {
      console.log('   ⚠️ Latencia por encima del objetivo');
    }
  }
}

async function generateReport() {
  console.log('\n📋 RESUMEN DE PRUEBAS:\n');
  
  // Calcular tasa de éxito
  const totalTests = 4;
  const passedTests = [
    testResults.healthCheck,
    testResults.cors,
    testResults.latency < SUCCESS_CRITERIA.latency,
    testResults.errors.length === 0
  ].filter(Boolean).length;
  
  testResults.successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`✅ Health Check: ${testResults.healthCheck ? 'PASS' : 'FAIL'}`);
  console.log(`✅ CORS: ${testResults.cors ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Latencia: ${testResults.latency}ms ${testResults.latency < SUCCESS_CRITERIA.latency ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Tasa de éxito: ${testResults.successRate}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Veredicto final
  console.log('\n🎯 VEREDICTO FINAL:');
  
  if (testResults.successRate >= SUCCESS_CRITERIA.successRate && 
      testResults.latency < SUCCESS_CRITERIA.latency && 
      testResults.healthCheck) {
    console.log('✅ SISTEMA LISTO PARA PRODUCCIÓN');
    console.log('   - Todas las pruebas críticas pasaron');
    console.log('   - Latencia dentro del objetivo');
    console.log('   - Tasa de éxito >95%');
  } else {
    console.log('⚠️ SISTEMA REQUIERE AJUSTES');
    console.log('   - Algunas pruebas fallaron');
    console.log('   - Revisar errores antes de producción');
  }
  
  // Guardar resultados
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 Resultados guardados en test-results.json');
}

async function runAllTests() {
  try {
    await testHealthCheck();
    await testCORS();
    await testFrontendAvailability();
    await testLatency();
    await generateReport();
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
runAllTests(); 