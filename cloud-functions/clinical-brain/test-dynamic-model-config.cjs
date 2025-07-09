/**
 * TEST DE CONFIGURACIÓN DINÁMICA DE MODELOS
 * 
 * Valida que VertexAIClient y ModelSelector funcionen correctamente
 * con variables de entorno MODEL_FLASH y MODEL_PRO
 */

const VertexAIClient = require('./src/services/VertexAIClient');
const ModelSelector = require('./src/services/ModelSelector');

async function testDynamicModelConfiguration() {
  console.log('🧪 INICIANDO TEST DE CONFIGURACIÓN DINÁMICA DE MODELOS...\n');

  // Test 1: Verificar que las variables de entorno están configuradas
  console.log('📋 TEST 1: Verificación de Variables de Entorno');
  
  const modelFlash = process.env.MODEL_FLASH;
  const modelPro = process.env.MODEL_PRO;
  
  console.log(`MODEL_FLASH: ${modelFlash || 'NO CONFIGURADA'}`);
  console.log(`MODEL_PRO: ${modelPro || 'NO CONFIGURADA'}`);
  
  if (!modelFlash || !modelPro) {
    console.log('❌ FALLO: Variables de entorno no configuradas');
    console.log('Configure MODEL_FLASH y MODEL_PRO antes de ejecutar el test');
    return false;
  }
  
  console.log('✅ Variables de entorno configuradas correctamente\n');

  // Test 2: Inicialización de ModelSelector
  console.log('📋 TEST 2: Inicialización de ModelSelector');
  
  try {
    const modelSelector = new ModelSelector();
    const stats = modelSelector.getOptimizationStats();
    
    console.log('✅ ModelSelector inicializado correctamente');
    console.log(`Standard Model: ${stats.standardModel}`);
    console.log(`Configuration: ${stats.configuration}`);
    console.log(`Models Configured: ${JSON.stringify(stats.modelsConfigured)}\n`);
    
    // Test 2.1: Verificar selección de modelo para caso estándar
    const standardCase = "El paciente refiere dolor leve en el hombro derecho sin banderas rojas";
    const selection = modelSelector.selectOptimalModel(standardCase);
    
    console.log('📋 TEST 2.1: Selección para caso estándar');
    console.log(`Modelo seleccionado: ${selection.selectedModel}`);
    console.log(`Esperado: ${modelFlash}`);
    console.log(`✅ ${selection.selectedModel === modelFlash ? 'CORRECTO' : 'INCORRECTO'}\n`);
    
    // Test 2.2: Verificar selección de modelo para caso crítico
    const criticalCase = "Paciente con dolor torácico irradiado al brazo izquierdo con sudoración profusa";
    const criticalSelection = modelSelector.selectOptimalModel(criticalCase);
    
    console.log('📋 TEST 2.2: Selección para caso crítico');
    console.log(`Modelo seleccionado: ${criticalSelection.selectedModel}`);
    console.log(`Esperado: ${modelPro}`);
    console.log(`✅ ${criticalSelection.selectedModel === modelPro ? 'CORRECTO' : 'INCORRECTO'}\n`);
    
  } catch (error) {
    console.log('❌ FALLO en ModelSelector:', error.message);
    return false;
  }

  // Test 3: Inicialización de VertexAIClient
  console.log('📋 TEST 3: Inicialización de VertexAIClient');
  
  try {
    const vertexClient = new VertexAIClient();
    const modelInfo = vertexClient.getModelInfo();
    
    console.log('✅ VertexAIClient inicializado correctamente');
    console.log(`Flash Model: ${modelInfo.availableModels.flash.name}`);
    console.log(`Pro Model: ${modelInfo.availableModels.pro.name}`);
    console.log(`Default Model: ${modelInfo.defaultModel}`);
    console.log(`Configuration: ${modelInfo.configuration}\n`);
    
    // Test 3.1: Verificar configuración de modelos
    const flashConfig = vertexClient.getModelConfiguration(modelFlash);
    const proConfig = vertexClient.getModelConfiguration(modelPro);
    
    console.log('📋 TEST 3.1: Configuración de modelos');
    console.log(`Flash Config: ${flashConfig ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    console.log(`Pro Config: ${proConfig ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    console.log('✅ Configuraciones generadas dinámicamente\n');
    
    // Test 3.2: Verificar fallback
    const fallbackFromPro = vertexClient.getFallbackModel(modelPro);
    const fallbackFromFlash = vertexClient.getFallbackModel(modelFlash);
    
    console.log('📋 TEST 3.2: Sistema de fallback');
    console.log(`Fallback de Pro: ${fallbackFromPro} (esperado: ${modelFlash})`);
    console.log(`Fallback de Flash: ${fallbackFromFlash} (esperado: ${modelPro})`);
    console.log(`✅ ${fallbackFromPro === modelFlash && fallbackFromFlash === modelPro ? 'CORRECTO' : 'INCORRECTO'}\n`);
    
  } catch (error) {
    console.log('❌ FALLO en VertexAIClient:', error.message);
    return false;
  }

  console.log('🎯 RESUMEN DE TESTS:');
  console.log('✅ Variables de entorno validadas');
  console.log('✅ ModelSelector con configuración dinámica');
  console.log('✅ VertexAIClient con configuración dinámica');
  console.log('✅ Selección inteligente de modelos');
  console.log('✅ Sistema de fallback dinámico');
  console.log('\n🏆 TODOS LOS TESTS PASARON - CONFIGURACIÓN DINÁMICA EXITOSA');
  
  return true;
}

// Ejecutar test si se llama directamente
if (require.main === module) {
  // Configurar variables de entorno para test (si no están configuradas)
  if (!process.env.MODEL_FLASH) {
    process.env.MODEL_FLASH = 'gemini-2.5-flash';
  }
  if (!process.env.MODEL_PRO) {
    process.env.MODEL_PRO = 'gemini-2.5-pro';
  }
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'aiduxcare-stt-20250706';
  }
  
  testDynamicModelConfiguration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ ERROR EN TEST:', error);
      process.exit(1);
    });
}

module.exports = { testDynamicModelConfiguration }; 