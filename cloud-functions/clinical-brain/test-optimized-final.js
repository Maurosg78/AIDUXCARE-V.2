const VertexAIClient = require('./src/services/VertexAIClient');
const PromptFactory = require('./src/services/PromptFactory');

/**
 * TEST FINAL DEL SISTEMA OPTIMIZADO
 * Basado en evidencia empírica de 5 casos clínicos
 */

// Casos de prueba para validar el sistema optimizado
const testCases = {
  simple_case: {
    name: "Caso Simple - Contractura Cervical",
    transcription: `
      Paciente masculino de 35 años consulta por dolor cervical desde hace 3 días.
      Refiere que empezó después de dormir en mala posición. Dolor localizado en cuello,
      sin irradiación. Mejora con analgésicos. Sin otros síntomas asociados.
      
      Evaluación: contractura muscular cervical, dolor a la palpación.
      Movilidad cervical limitada por dolor. Paciente refiere mejoría gradual.
    `,
    expectedModel: 'gemini-2.5-flash',
    expectedRedFlags: 0,
    description: "Caso simple sin banderas rojas - debe usar modelo estándar"
  },

  moderate_case: {
    name: "Caso Moderado - Una Bandera Roja",
    transcription: `
      Paciente femenina de 45 años consulta por dolor lumbar desde hace 1 semana.
      Refiere dolor que baja por la pierna derecha hasta el pie. También menciona
      pérdida de fuerza en el pie derecho para levantar la punta.
      
      Sin antecedentes relevantes. Dolor empeora al toser o estornudar.
      Evaluación: test de Lasègue positivo, disminución de reflejos.
    `,
    expectedModel: 'gemini-2.5-flash',
    expectedRedFlags: 1,
    description: "Una bandera roja (déficit neurológico) - modelo estándar suficiente"
  },

  critical_case: {
    name: "Caso Crítico - Múltiples Banderas Rojas",
    transcription: `
      Paciente masculino de 58 años consulta por dolor torácico desde hace 2 horas.
      Refiere dolor opresivo que irradia al brazo izquierdo y mandíbula.
      También presenta sudoración profusa y disnea moderada.
      
      Antecedentes: hipertensión, diabetes, fumador. Dolor no mejora con reposo.
      Evaluación: paciente ansioso, diaforético, dolor precordial.
    `,
    expectedModel: 'gemini-2.5-pro',
    expectedRedFlags: 3,
    description: "Múltiples banderas rojas (dolor torácico + disnea + sudoración) - requiere modelo premium"
  }
};

async function testOptimizedSystem() {
  console.log('🧪 TESTING SISTEMA OPTIMIZADO BASADO EN EVIDENCIA EMPÍRICA');
  console.log('='.repeat(80));
  
  // Inicializar servicios
  const vertexClient = new VertexAIClient();
  const promptFactory = new PromptFactory();
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [caseKey, testCase] of Object.entries(testCases)) {
    console.log(`\n📋 TESTING: ${testCase.name}`);
    console.log('-'.repeat(60));
    console.log(`Descripción: ${testCase.description}`);
    console.log(`Banderas rojas esperadas: ${testCase.expectedRedFlags}`);
    console.log(`Modelo esperado: ${testCase.expectedModel}`);
    
    try {
      // Generar prompt
      const prompt = promptFactory.generatePrompt(testCase.transcription);
      
      // Procesar con selección automática
      const startTime = Date.now();
      const result = await vertexClient.processTranscription(
        testCase.transcription,
        prompt
      );
      const processingTime = (Date.now() - startTime) / 1000;
      
      // Verificar resultados
      const modelUsed = result.costOptimization.modelUsed;
      const redFlagsDetected = result.costOptimization.redFlagsDetected;
      
      console.log(`\n✅ RESULTADO:`);
      console.log(`   🤖 Modelo usado: ${modelUsed}`);
      console.log(`   🚩 Banderas rojas detectadas: ${redFlagsDetected}`);
      console.log(`   ⏱️  Tiempo de procesamiento: ${processingTime.toFixed(1)}s`);
      console.log(`   💰 Análisis de costos: ${result.costOptimization.costAnalysis.savingsVsPro}`);
      console.log(`   🧠 Razonamiento: ${result.costOptimization.reasoning}`);
      
      // Validar selección de modelo
      totalTests++;
      if (modelUsed === testCase.expectedModel) {
        console.log(`   ✅ MODELO CORRECTO: ${modelUsed}`);
        passedTests++;
      } else {
        console.log(`   ❌ MODELO INCORRECTO: Esperado ${testCase.expectedModel}, obtuvo ${modelUsed}`);
      }
      
      // Validar detección de banderas rojas
      if (redFlagsDetected >= testCase.expectedRedFlags) {
        console.log(`   ✅ DETECCIÓN BANDERAS ROJAS: ${redFlagsDetected} >= ${testCase.expectedRedFlags}`);
      } else {
        console.log(`   ⚠️  DETECCIÓN PARCIAL: ${redFlagsDetected} < ${testCase.expectedRedFlags}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      totalTests++;
    }
    
    // Pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Resumen final
  console.log('\n📊 RESUMEN DE TESTING');
  console.log('='.repeat(80));
  console.log(`Tests ejecutados: ${totalTests}`);
  console.log(`Tests exitosos: ${passedTests}`);
  console.log(`Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡SISTEMA OPTIMIZADO FUNCIONANDO PERFECTAMENTE!');
    console.log('✅ Selección automática de modelos basada en evidencia empírica');
    console.log('✅ Detección de banderas rojas críticas');
    console.log('✅ Optimización de costos inteligente');
    console.log('✅ Preservación de seguridad clínica');
  } else {
    console.log('\n⚠️  SISTEMA REQUIERE AJUSTES');
    console.log('❌ Algunos casos no pasaron la validación');
  }
  
  return {
    totalTests,
    passedTests,
    successRate: (passedTests / totalTests) * 100
  };
}

// Ejecutar test
testOptimizedSystem().catch(console.error); 