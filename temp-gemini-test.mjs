
// Test simple de integración Gemini 1.5 Pro
console.log('🔍 Iniciando test de integración Gemini...');

// Simular configuración de entorno
process.env.GOOGLE_CLOUD_PROJECT = 'aiduxcare-v2';
process.env.GOOGLE_APPLICATION_CREDENTIALS = './credentials.json';

// Importar módulos dinámicamente
const { ConsultationClassifier } = await import('./src/core/classification/ConsultationClassifier.ts');
const { RealWorldSOAPProcessor } = await import('./src/services/RealWorldSOAPProcessor.ts');

const classifier = new ConsultationClassifier();
const processor = new RealWorldSOAPProcessor();

async function testGeminiIntegration() {
  console.log('🔍 Iniciando clasificación con Gemini 1.5 Pro...');
  
  const testCase = {
    transcription: `PACIENTE: Doctor, tengo un dolor terrible en el cuello que me está matando. 
  Empezó hace como 3 semanas cuando me desperté una mañana y no podía mover la cabeza. 
  El dolor es insoportable, especialmente por la noche cuando me acuesto. 
  A veces siento como si me estuviera ahogando y tengo dificultad para tragar. 
  También noto que se me duermen los brazos cuando duermo y tengo mareos constantes. 
  Ayer tuve un episodio donde perdí el equilibrio y casi me caigo. 
  El dolor se irradia hacia el hombro derecho y siento como pinchazos en la mano. 
  No puedo dormir bien porque cualquier posición me duele. 
  También he notado que mi visión se ha vuelto borrosa últimamente. 
  ¿Crees que puede ser algo grave?`,
    professionalRole: 'PHYSIOTHERAPIST',
    location: {"country":"ES","state":"Madrid"}
  };
  
  try {
    // Clasificación directa con Gemini
    console.log('📤 Enviando a Gemini 1.5 Pro...');
    const startTime = Date.now();
    
    const geminiResult = await classifier.classifyWithGemini(
      testCase.transcription,
      testCase.professionalRole,
      testCase.location
    );
    
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Respuesta de Gemini recibida');
    console.log('⏱️  Tiempo de procesamiento:', processingTime + 'ms');
    console.log('📊 Resultado Gemini:', JSON.stringify(geminiResult, null, 2));
    
    // Procesamiento completo del pipeline
    console.log('\n🔄 Ejecutando pipeline completo...');
    const pipelineStart = Date.now();
    
    const pipelineResult = await processor.processTranscription(
      testCase.transcription,
      testCase.professionalRole,
      testCase.location
    );
    
    const pipelineTime = Date.now() - pipelineStart;
    
    console.log('✅ Pipeline completado');
    console.log('⏱️  Tiempo total pipeline:', pipelineTime + 'ms');
    console.log('📊 Resultado pipeline:', JSON.stringify(pipelineResult, null, 2));
    
    // Validación de resultados
    console.log('\n🔍 Validando resultados...');
    
    const validations = {
      geminiResponse: !!geminiResult,
      pipelineResponse: !!pipelineResult,
      processingTime: processingTime < 10000, // < 10 segundos
      pipelineTime: pipelineTime < 15000, // < 15 segundos
      hasSOAP: !!pipelineResult.soap,
      hasFlags: !!pipelineResult.redFlags && pipelineResult.redFlags.length > 0,
      hasRecommendations: !!pipelineResult.recommendations
    };
    
    console.log('📋 Validaciones:', validations);
    
    const allValid = Object.values(validations).every(v => v);
    
    if (allValid) {
      console.log('\n🎉 ¡PRUEBA EXITOSA!');
      console.log('✅ Integración Gemini 1.5 Pro funcionando correctamente');
      console.log('✅ Pipeline completo operativo');
      console.log('✅ Tiempos de respuesta aceptables');
      console.log('✅ Banderas rojas detectadas');
      console.log('✅ Recomendaciones generadas');
    } else {
      console.log('\n❌ PRUEBA FALLIDA');
      console.log('❌ Algunas validaciones no pasaron');
    }
    
    return {
      success: allValid,
      geminiResult,
      pipelineResult,
      metrics: {
        geminiTime: processingTime,
        pipelineTime: pipelineTime,
        validations
      }
    };
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

testGeminiIntegration();
