const VertexAIClient = require('./src/services/VertexAIClient');
const PromptFactory = require('./src/services/PromptFactory');
const KnowledgeBase = require('./src/services/KnowledgeBase');
const winston = require('winston');

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

async function testGemini25Integration() {
  console.log('🧪 INICIANDO TEST DE INTEGRACIÓN GEMINI 2.5 PRO');
  console.log('=' * 60);
  
  try {
    // PASO 1: Verificar configuración
    console.log('\n📋 PASO 1: Verificando configuración...');
    const vertexClient = new VertexAIClient();
    const modelInfo = vertexClient.getModelInfo();
    
    console.log('✅ Configuración Vertex AI:', JSON.stringify(modelInfo, null, 2));
    
    // PASO 2: Test de conexión básica
    console.log('\n🔍 PASO 2: Testeando conexión básica...');
    const connectionTest = await vertexClient.testConnection();
    
    if (connectionTest) {
      console.log('✅ Conexión exitosa con Gemini 2.5 Pro');
    } else {
      console.log('❌ Fallo en conexión básica');
      return false;
    }
    
    // PASO 3: Test con transcripción médica real
    console.log('\n🏥 PASO 3: Test con transcripción médica...');
    
    const testTranscription = `
TERAPEUTA: Buenos días, ¿cómo ha estado desde la última sesión?

PACIENTE: Bueno, doctor, he tenido mucho dolor en el hombro derecho. Especialmente cuando levanto el brazo por encima de la cabeza. Me duele mucho por las noches y no puedo dormir bien.

TERAPEUTA: ¿Cuándo comenzó este dolor?

PACIENTE: Hace como dos semanas. Estaba jugando tenis y sentí como un tirón fuerte. Desde entonces no ha mejorado, más bien ha empeorado.

TERAPEUTA: Vamos a hacer algunas pruebas. Levante el brazo lentamente hacia un lado.

PACIENTE: Ay, no puedo. Me duele mucho cuando llego a los 90 grados.

TERAPEUTA: Entiendo. ¿Siente debilidad en el brazo?

PACIENTE: Sí, especialmente cuando trato de levantar cosas pesadas. Antes podía cargar las bolsas del supermercado sin problema, ahora me cuesta mucho.

TERAPEUTA: Voy a palpar el área. Dígame si duele.

PACIENTE: ¡Ay! Sí, justo ahí duele mucho.

TERAPEUTA: Parece que hay inflamación en el manguito rotador. Vamos a hacer un plan de tratamiento con ejercicios específicos y posiblemente necesite una resonancia magnética.
`;

    // Cargar knowledge base
    console.log('📚 Cargando KnowledgeBase...');
    const knowledgeBase = await KnowledgeBase.load('physiotherapy');
    
    // Generar prompt
    console.log('🏭 Generando prompt especializado...');
    const promptFactory = new PromptFactory(knowledgeBase);
    const prompt = promptFactory.generatePrompt(testTranscription, 'physiotherapy', 'initial');
    
    console.log(`📝 Prompt generado: ${prompt.length} caracteres`);
    
    // Enviar a Gemini 2.5 Pro
    console.log('🤖 Enviando a Gemini 2.5 Pro...');
    const startTime = Date.now();
    
    const rawResponse = await vertexClient.analyze(prompt);
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);
    
    // Validar respuesta
    console.log('\n✅ RESPUESTA RECIBIDA DE GEMINI 2.5 PRO:');
    console.log('Length:', rawResponse.length);
    console.log('Preview:', rawResponse.substring(0, 500));
    
    // Intentar parsear JSON
    try {
      const parsedResponse = JSON.parse(rawResponse);
      console.log('\n📊 ANÁLISIS ESTRUCTURADO:');
      console.log('Warnings:', parsedResponse.warnings?.length || 0);
      console.log('Suggestions:', parsedResponse.suggestions?.length || 0);
      console.log('SOAP Quality:', parsedResponse.soap_analysis?.overall_quality || 'N/A');
      
      // Mostrar advertencias
      if (parsedResponse.warnings && parsedResponse.warnings.length > 0) {
        console.log('\n⚠️ ADVERTENCIAS DETECTADAS:');
        parsedResponse.warnings.forEach((warning, index) => {
          console.log(`${index + 1}. [${warning.severity}] ${warning.title}`);
          console.log(`   ${warning.description}`);
        });
      }
      
      // Mostrar sugerencias
      if (parsedResponse.suggestions && parsedResponse.suggestions.length > 0) {
        console.log('\n💡 SUGERENCIAS GENERADAS:');
        parsedResponse.suggestions.forEach((suggestion, index) => {
          console.log(`${index + 1}. [${suggestion.priority}] ${suggestion.title}`);
          console.log(`   ${suggestion.description}`);
        });
      }
      
      console.log('\n✅ TEST COMPLETADO EXITOSAMENTE');
      console.log(`🎯 Gemini 2.5 Pro funcionando correctamente`);
      console.log(`⏱️ Tiempo total: ${processingTime}ms`);
      
      return true;
      
    } catch (parseError) {
      console.log('❌ Error parseando JSON:', parseError.message);
      console.log('Raw response:', rawResponse);
      return false;
    }
    
  } catch (error) {
    console.error('🚨 ERROR EN TEST:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Ejecutar test
if (require.main === module) {
  testGemini25Integration()
    .then(success => {
      if (success) {
        console.log('\n🎉 MIGRACIÓN A GEMINI 2.5 PRO EXITOSA');
        process.exit(0);
      } else {
        console.log('\n💥 MIGRACIÓN FALLIDA - REVISAR CONFIGURACIÓN');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 ERROR FATAL:', error);
      process.exit(1);
    });
}

module.exports = { testGemini25Integration }; 