#!/usr/bin/env node

/**
 * TEST VERTEX AI STATUS
 * Verifica si Vertex AI está disponible después del calentamiento
 */

const { VertexAI } = require('@google-cloud/vertexai');

// Configuración del proyecto
const PROJECT_ID = 'aiduxcare-mvp-prod';
const LOCATION = 'us-east1';

async function testVertexAIStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE VERTEX AI');
  console.log('=====================================');
  console.log(`📍 Proyecto: ${PROJECT_ID}`);
  console.log(`🌍 Región: ${LOCATION}`);
  console.log(`TIME: Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Inicializar Vertex AI
    console.log('LAUNCH: Inicializando cliente Vertex AI...');
    const vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });

    // Intentar obtener un modelo generativo
    console.log('🤖 Intentando acceder al modelo Gemini Pro...');
    const model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-pro',
    });

    // Hacer una consulta simple de prueba
    console.log('💬 Realizando consulta de prueba...');
    const prompt = 'Responde solo con "OK" si puedes procesar este mensaje.';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('SUCCESS: VERTEX AI DISPONIBLE');
    console.log('========================');
    console.log(`📝 Respuesta del modelo: "${text.trim()}"`);
    console.log('🎉 El calentamiento ha funcionado correctamente');
    console.log('LAUNCH: Vertex AI está listo para uso en producción');
    
    return {
      status: 'AVAILABLE',
      response: text.trim(),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.log('ERROR: VERTEX AI NO DISPONIBLE');
    console.log('===========================');
    console.log(`🚨 Error: ${error.message}`);
    
    if (error.message.includes('permission')) {
      console.log('📋 Diagnóstico: Permisos insuficientes');
      console.log('💡 Solución: Continuar con el calentamiento o solicitar acceso manual');
    } else if (error.message.includes('quota')) {
      console.log('📋 Diagnóstico: Límites de cuota');
      console.log('💡 Solución: Configurar billing o aumentar límites');
    } else if (error.message.includes('not found')) {
      console.log('📋 Diagnóstico: Servicio no habilitado');
      console.log('💡 Solución: Habilitar Vertex AI API en la consola');
    } else {
      console.log('📋 Diagnóstico: Error desconocido');
      console.log('💡 Solución: Revisar configuración y credenciales');
    }
    
    console.log('');
    console.log('RELOAD: Recomendación: Continuar con el calentamiento por 24h más');
    
    return {
      status: 'NOT_AVAILABLE',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Ejecutar test si es llamado directamente
if (require.main === module) {
  testVertexAIStatus()
    .then(result => {
      console.log('');
      console.log('STATS: RESULTADO FINAL:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.status === 'AVAILABLE') {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('ACTIVE: Error crítico:', error);
      process.exit(1);
    });
}

module.exports = { testVertexAIStatus };
