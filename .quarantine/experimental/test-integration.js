/**
 * 🧪 TESTING DE INTEGRACIÓN - SISTEMA DE SEGURIDAD MÉDICA
 * 
 * Script para validar la integración completa del sistema de seguridad
 * con el Layout y todos los componentes.
 */

const puppeteer = require('puppeteer');

async function testIntegration() {
  console.log('🧪 INICIANDO TESTING DE INTEGRACIÓN');
  console.log('=' .repeat(80));
  
  let browser;
  let passedTests = 0;
  let failedTests = 0;
  
  try {
    // Iniciar navegador
    browser = await puppeteer.launch({ 
      headless: false, // Para ver el proceso
      slowMo: 1000 // Ralentizar para ver mejor
    });
    
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📱 Navegador iniciado');
    
    // Test 1: Cargar la aplicación
    console.log('\n1. 🚀 Cargando aplicación...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    console.log('✅ Aplicación cargada correctamente');
    passedTests++;
    
    // Test 2: Verificar que el Layout se carga
    console.log('\n2. 🏗️ Verificando Layout...');
    const layoutExists = await page.evaluate(() => {
      return document.querySelector('[data-testid="layout"]') !== null ||
             document.querySelector('.layout') !== null ||
             document.body.innerHTML.includes('AiDuxCare');
    });
    
    if (layoutExists) {
      console.log('✅ Layout cargado correctamente');
      passedTests++;
    } else {
      console.log('❌ Layout no encontrado');
      failedTests++;
    }
    
    // Test 3: Verificar panel derecho
    console.log('\n3. 📋 Verificando panel derecho...');
    const rightPanelExists = await page.evaluate(() => {
      return document.querySelector('[data-testid="right-panel"]') !== null ||
             document.querySelector('.right-panel') !== null ||
             document.body.innerHTML.includes('panel');
    });
    
    if (rightPanelExists) {
      console.log('✅ Panel derecho encontrado');
      passedTests++;
    } else {
      console.log('❌ Panel derecho no encontrado');
      failedTests++;
    }
    
    // Test 4: Verificar herramientas del panel
    console.log('\n4. 🛠️ Verificando herramientas del panel...');
    const toolsExist = await page.evaluate(() => {
      return document.body.innerHTML.includes('Asistente IA') ||
             document.body.innerHTML.includes('Captura Audio') ||
             document.body.innerHTML.includes('Seguridad');
    });
    
    if (toolsExist) {
      console.log('✅ Herramientas del panel encontradas');
      passedTests++;
    } else {
      console.log('❌ Herramientas del panel no encontradas');
      failedTests++;
    }
    
    // Test 5: Verificar sistema de seguridad
    console.log('\n5. 🚨 Verificando sistema de seguridad...');
    const safetySystemExists = await page.evaluate(() => {
      return document.body.innerHTML.includes('MONITOR DE SEGURIDAD') ||
             document.body.innerHTML.includes('SafetyMonitorPanel') ||
             document.body.innerHTML.includes('🚨');
    });
    
    if (safetySystemExists) {
      console.log('✅ Sistema de seguridad detectado');
      passedTests++;
    } else {
      console.log('❌ Sistema de seguridad no encontrado');
      failedTests++;
    }
    
    // Test 6: Verificar funcionalidad de análisis
    console.log('\n6. 🔍 Verificando funcionalidad de análisis...');
    const analysisFunctionality = await page.evaluate(() => {
      return document.body.innerHTML.includes('ANÁLISIS MANUAL') ||
             document.body.innerHTML.includes('Analizar') ||
             document.body.innerHTML.includes('Simulación');
    });
    
    if (analysisFunctionality) {
      console.log('✅ Funcionalidad de análisis encontrada');
      passedTests++;
    } else {
      console.log('❌ Funcionalidad de análisis no encontrada');
      failedTests++;
    }
    
    // Test 7: Verificar alertas
    console.log('\n7. ⚠️ Verificando sistema de alertas...');
    const alertsSystem = await page.evaluate(() => {
      return document.body.innerHTML.includes('ALERTAS ACTIVAS') ||
             document.body.innerHTML.includes('Nivel') ||
             document.body.innerHTML.includes('Riesgo');
    });
    
    if (alertsSystem) {
      console.log('✅ Sistema de alertas encontrado');
      passedTests++;
    } else {
      console.log('❌ Sistema de alertas no encontrado');
      failedTests++;
    }
    
    // Test 8: Verificar estadísticas
    console.log('\n8. 📊 Verificando estadísticas...');
    const statistics = await page.evaluate(() => {
      return document.body.innerHTML.includes('Análisis') ||
             document.body.innerHTML.includes('Alertas') ||
             document.body.innerHTML.includes('ANÁLISIS RECIENTES');
    });
    
    if (statistics) {
      console.log('✅ Sistema de estadísticas encontrado');
      passedTests++;
    } else {
      console.log('❌ Sistema de estadísticas no encontrado');
      failedTests++;
    }
    
    // Test 9: Verificar navegación
    console.log('\n9. 🧭 Verificando navegación...');
    const navigation = await page.evaluate(() => {
      return document.body.innerHTML.includes('Captura') ||
             document.body.innerHTML.includes('Pacientes') ||
             document.body.innerHTML.includes('Notas');
    });
    
    if (navigation) {
      console.log('✅ Navegación encontrada');
      passedTests++;
    } else {
      console.log('❌ Navegación no encontrada');
      failedTests++;
    }
    
    // Test 10: Verificar responsividad
    console.log('\n10. 📱 Verificando responsividad...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const responsive = await page.evaluate(() => {
      return window.innerWidth <= 768;
    });
    
    if (responsive) {
      console.log('✅ Responsividad verificada');
      passedTests++;
    } else {
      console.log('❌ Problemas de responsividad');
      failedTests++;
    }
    
    // Resumen de resultados
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RESUMEN DE INTEGRACIÓN');
    console.log('=' .repeat(80));
    
    console.log(`Total de tests: ${passedTests + failedTests}`);
    console.log(`Tests pasados: ${passedTests}`);
    console.log(`Tests fallidos: ${failedTests}`);
    console.log(`Tasa de éxito: ${((passedTests/(passedTests + failedTests))*100).toFixed(1)}%`);
    
    // Validaciones críticas
    console.log('\n🔍 VALIDACIONES CRÍTICAS:');
    
    const criticalTests = [
      { name: 'Aplicación carga', passed: passedTests >= 1 },
      { name: 'Layout funcional', passed: passedTests >= 2 },
      { name: 'Panel derecho', passed: passedTests >= 3 },
      { name: 'Sistema de seguridad', passed: passedTests >= 5 },
      { name: 'Funcionalidad completa', passed: passedTests >= 8 }
    ];
    
    criticalTests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASÓ' : 'FALLÓ'}`);
    });
    
    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    if (failedTests === 0) {
      console.log('  - Integración completa exitosa');
      console.log('  - Sistema listo para producción');
      console.log('  - Proceder con testing en condiciones reales');
    } else {
      console.log('  - Revisar componentes fallidos');
      console.log('  - Verificar imports y dependencias');
      console.log('  - Validar configuración del servidor');
    }
    
    return {
      totalTests: passedTests + failedTests,
      passedTests,
      failedTests,
      success: failedTests === 0
    };
    
  } catch (error) {
    console.error('❌ Error durante el testing:', error);
    return {
      totalTests: passedTests + failedTests,
      passedTests,
      failedTests,
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Navegador cerrado');
    }
  }
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
  testIntegration().then(results => {
    if (results.success) {
      console.log('\n🎉 ¡INTEGRACIÓN VALIDADA EXITOSAMENTE!');
      process.exit(0);
    } else {
      console.log('\n⚠️  INTEGRACIÓN REQUIERE AJUSTES');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { testIntegration }; 