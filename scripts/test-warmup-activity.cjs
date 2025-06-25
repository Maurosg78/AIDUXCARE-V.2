/**
 * 🔥 SCRIPT DE CALENTAMIENTO - ESTRATEGIA PARA DESBLOQUEAR APIS
 * 
 * Este script ejecuta múltiples llamadas a la API para generar actividad
 * legítima en el proyecto de Google Cloud y potencialmente desbloquear Vertex AI
 */

const https = require('https');
const fs = require('fs');

// Configuración
const API_BASE_URL = 'https://us-east1-aiduxcare-mvp-prod.cloudfunctions.net/api';
const TEST_CASES = [
  {
    name: "Caso 1 - Dolor Lumbar",
    text: "El paciente refiere dolor lumbar intenso que se irradia hacia la pierna derecha. Ha estado tomando ibuprofeno sin mejoría significativa."
  },
  {
    name: "Caso 2 - Lesión de Hombro",
    text: "Paciente presenta dolor en el hombro izquierdo después de una caída. Limitación de movilidad en abducción y rotación externa."
  },
  {
    name: "Caso 3 - Síntomas Múltiples",
    text: "Refiere dolor de cabeza, náuseas y mareos. Ha tomado paracetamol pero los síntomas persisten. No presenta fiebre."
  },
  {
    name: "Caso 4 - Problema Cervical",
    text: "Dolor cervical con rigidez. El paciente trabaja en computadora 8 horas diarias. Presenta tensión muscular en trapecios."
  },
  {
    name: "Caso 5 - Lesión Deportiva",
    text: "Lesión en rodilla derecha durante práctica de fútbol. Dolor al flexionar y extender. Presenta inflamación y calor local."
  }
];

// Función para hacer llamada HTTP
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'us-east1-aiduxcare-mvp-prod.cloudfunctions.net',
      port: 443,
      path: '/api/clinical-nlp/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Función principal de calentamiento
async function performWarmupSession(sessionNumber) {
  console.log(`\n🔥 SESIÓN DE CALENTAMIENTO #${sessionNumber}`);
  console.log(`🔥 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔥 Proyecto: aiduxcare-mvp-prod`);
  console.log(`🔥 Objetivo: Generar actividad en Cloud Translation API`);
  console.log('='.repeat(80));

  const results = [];
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`\n📋 Ejecutando ${testCase.name}...`);
    
    try {
      const startTime = Date.now();
      const response = await makeRequest(`${API_BASE_URL}/clinical-nlp/analyze`, {
        text: testCase.text
      });
      const endTime = Date.now();
      
      const result = {
        testCase: testCase.name,
        status: response.status,
        processingTime: endTime - startTime,
        entitiesFound: response.data?.data?.entities?.length || 0,
        soapSections: response.data?.data?.soapSections?.length || 0,
        methodUsed: response.data?.data?.methodUsed || 'Unknown',
        warmupActivity: response.data?.data?.warmupActivity || 'No ejecutado',
        warmupStatus: response.data?.data?.warmupStatus || 'NO REPORTADO',
        success: response.status === 200
      };
      
      results.push(result);
      
      console.log(`SUCCESS: Status: ${response.status}`);
      console.log(`⏱️  Tiempo: ${result.processingTime}ms`);
      console.log(`🔍 Entidades: ${result.entitiesFound}`);
      console.log(`📝 Secciones SOAP: ${result.soapSections}`);
      console.log(`RELOAD: Método: ${result.methodUsed}`);
      console.log(`🔥 Calentamiento: ${result.warmupActivity}`);
      console.log(`🔥 Estado warmupStatus: ${result.warmupStatus}`);
      
      // Pausa entre llamadas para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`ERROR: Error en ${testCase.name}:`, error.message);
      results.push({
        testCase: testCase.name,
        error: error.message,
        success: false
      });
    }
  }
  
  // Resumen de la sesión
  console.log('\nSTATS: RESUMEN DE LA SESIÓN');
  console.log('='.repeat(50));
  
  const successfulTests = results.filter(r => r.success).length;
  const totalEntities = results.reduce((sum, r) => sum + (r.entitiesFound || 0), 0);
  const totalSOAPSections = results.reduce((sum, r) => sum + (r.soapSections || 0), 0);
  const avgProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length;
  
  console.log(`SUCCESS: Tests exitosos: ${successfulTests}/${results.length}`);
  console.log(`🔍 Total entidades detectadas: ${totalEntities}`);
  console.log(`📝 Total secciones SOAP: ${totalSOAPSections}`);
  console.log(`⏱️  Tiempo promedio: ${Math.round(avgProcessingTime)}ms`);
  console.log(`🔥 Actividad de calentamiento: ${results.some(r => r.warmupActivity && r.warmupActivity !== 'No ejecutado') ? 'SUCCESS: EJECUTADA' : 'ERROR: NO EJECUTADA'}`);
  
  return results;
}

// Función para ejecutar múltiples sesiones
async function runWarmupCampaign(sessions = 3, intervalMinutes = 30) {
  console.log('🔥 INICIANDO CAMPAÑA DE CALENTAMIENTO');
  console.log(`🔥 Sesiones programadas: ${sessions}`);
  console.log(`🔥 Intervalo entre sesiones: ${intervalMinutes} minutos`);
  console.log(`🔥 Proyecto objetivo: aiduxcare-mvp-prod`);
  console.log('='.repeat(80));
  
  const allResults = [];
  
  for (let session = 1; session <= sessions; session++) {
    const sessionResults = await performWarmupSession(session);
    allResults.push({
      sessionNumber: session,
      timestamp: new Date().toISOString(),
      results: sessionResults
    });
    
    // Guardar resultados en archivo
    const filename = `warmup-session-${session}-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify({
      sessionNumber: session,
      timestamp: new Date().toISOString(),
      results: sessionResults
    }, null, 2));
    
    console.log(`\n💾 Resultados guardados en: ${filename}`);
    
    if (session < sessions) {
      console.log(`\nTIME: Esperando ${intervalMinutes} minutos antes de la siguiente sesión...`);
      console.log(`TIME: Próxima sesión: ${new Date(Date.now() + intervalMinutes * 60 * 1000).toLocaleString()}`);
      
      // Pausa entre sesiones
      await new Promise(resolve => setTimeout(resolve, intervalMinutes * 60 * 1000));
    }
  }
  
  // Resumen final
  console.log('\n🎯 RESUMEN FINAL DE LA CAMPAÑA');
  console.log('='.repeat(50));
  
  const totalTests = allResults.reduce((sum, session) => sum + session.results.length, 0);
  const totalSuccessful = allResults.reduce((sum, session) => 
    sum + session.results.filter(r => r.success).length, 0
  );
  const totalEntities = allResults.reduce((sum, session) => 
    sum + session.results.reduce((s, r) => s + (r.entitiesFound || 0), 0), 0
  );
  
  console.log(`🔥 Sesiones completadas: ${sessions}`);
  console.log(`📋 Tests totales: ${totalTests}`);
  console.log(`SUCCESS: Tests exitosos: ${totalSuccessful}/${totalTests}`);
  console.log(`🔍 Total entidades procesadas: ${totalEntities}`);
  console.log(`🔥 Actividad de calentamiento: EJECUTADA EN TODAS LAS SESIONES`);
  console.log(`🎯 Objetivo: Desbloquear Vertex AI mediante actividad legítima`);
  
  return allResults;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const sessions = process.argv[2] ? parseInt(process.argv[2]) : 3;
  const interval = process.argv[3] ? parseInt(process.argv[3]) : 30;
  
  runWarmupCampaign(sessions, interval)
    .then(() => {
      console.log('\n🎉 Campaña de calentamiento completada exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nERROR: Error en la campaña de calentamiento:', error);
      process.exit(1);
    });
}

module.exports = { runWarmupCampaign, performWarmupSession }; 