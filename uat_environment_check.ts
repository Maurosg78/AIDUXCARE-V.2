import clinicalAssistantService from './src/services/ClinicalAssistantService';

interface EnvironmentCheck {
  serviceAvailable: boolean;
  redFlagsDatabase: boolean;
  clinicalAnalysis: boolean;
  performance: boolean;
  recommendations: string[];
}

async function checkUATEnvironment(): Promise<EnvironmentCheck> {
  console.log('🔍 VERIFICACIÓN DEL ENTORNO UAT TAREA 1.1');
  console.log('=' .repeat(80));
  
  const recommendations: string[] = [];
  let serviceAvailable = false;
  let redFlagsDatabase = false;
  let clinicalAnalysis = false;
  let performance = false;
  
  try {
    // 1. Verificar que el servicio está disponible
    console.log('1️⃣ Verificando disponibilidad del ClinicalAssistantService...');
    if (clinicalAssistantService && typeof clinicalAssistantService.detectRedFlags === 'function') {
      serviceAvailable = true;
      console.log('   ✅ ClinicalAssistantService disponible');
    } else {
      console.log('   ❌ ClinicalAssistantService no disponible');
      recommendations.push('Instalar o configurar ClinicalAssistantService');
    }
    
    // 2. Verificar base de datos de banderas rojas
    console.log('\n2️⃣ Verificando base de datos de banderas rojas...');
    try {
      const testEntities = [
        { id: '1', text: 'pérdida control esfínteres', type: 'SYMPTOM', confidence: 0.95 }
      ];
      
      const testPatient = {
        id: 'test-env-001',
        name: 'Test Patient',
        age: 45,
        phone: '+34 600 000 000',
        email: 'test@email.com',
        condition: 'Test condition',
        allergies: [],
        medications: [],
        clinicalHistory: 'Test history',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const redFlags = await clinicalAssistantService.detectRedFlags(testEntities, testPatient);
      
      if (redFlags && Array.isArray(redFlags)) {
        redFlagsDatabase = true;
        console.log(`   ✅ Base de datos de banderas rojas funcional (${redFlags.length} banderas detectadas)`);
      } else {
        console.log('   ❌ Base de datos de banderas rojas no responde correctamente');
        recommendations.push('Verificar configuración de la base de datos de banderas rojas');
      }
    } catch (error) {
      console.log(`   ❌ Error al verificar base de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      recommendations.push('Corregir errores en la base de datos de banderas rojas');
    }
    
    // 3. Verificar análisis clínico
    console.log('\n3️⃣ Verificando funcionalidad de análisis clínico...');
    try {
      const testEntities = [
        { id: '1', text: 'dolor lumbar', type: 'SYMPTOM', confidence: 0.90 }
      ];
      
      const testPatient = {
        id: 'test-env-002',
        name: 'Test Patient 2',
        age: 35,
        phone: '+34 600 000 001',
        email: 'test2@email.com',
        condition: 'Test condition 2',
        allergies: [],
        medications: [],
        clinicalHistory: 'Test history 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const analysis = await clinicalAssistantService.performClinicalAnalysis(testEntities, testPatient);
      
      if (analysis && typeof analysis.riskScore === 'number') {
        clinicalAnalysis = true;
        console.log(`   ✅ Análisis clínico funcional (Score: ${analysis.riskScore}/100)`);
      } else {
        console.log('   ❌ Análisis clínico no responde correctamente');
        recommendations.push('Verificar configuración del análisis clínico');
      }
    } catch (error) {
      console.log(`   ❌ Error al verificar análisis clínico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      recommendations.push('Corregir errores en el análisis clínico');
    }
    
    // 4. Verificar rendimiento
    console.log('\n4️⃣ Verificando rendimiento...');
    try {
      const startTime = Date.now();
      
      const testEntities = [
        { id: '1', text: 'test symptom', type: 'SYMPTOM', confidence: 0.85 }
      ];
      
      const testPatient = {
        id: 'test-env-003',
        name: 'Test Patient 3',
        age: 40,
        phone: '+34 600 000 002',
        email: 'test3@email.com',
        condition: 'Test condition 3',
        allergies: [],
        medications: [],
        clinicalHistory: 'Test history 3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await clinicalAssistantService.detectRedFlags(testEntities, testPatient);
      const executionTime = Date.now() - startTime;
      
      if (executionTime < 100) { // Menos de 100ms
        performance = true;
        console.log(`   ✅ Rendimiento aceptable (${executionTime}ms)`);
      } else {
        console.log(`   ⚠️ Rendimiento lento (${executionTime}ms)`);
        recommendations.push('Optimizar rendimiento del sistema');
      }
    } catch (error) {
      console.log(`   ❌ Error al verificar rendimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      recommendations.push('Corregir errores de rendimiento');
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL EN VERIFICACIÓN:', error);
    recommendations.push('Revisar configuración general del sistema');
  }
  
  // Mostrar resumen
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMEN DE VERIFICACIÓN DEL ENTORNO');
  console.log('=' .repeat(80));
  
  console.log(`\n✅ Servicio disponible: ${serviceAvailable ? 'SÍ' : 'NO'}`);
  console.log(`✅ Base de datos banderas rojas: ${redFlagsDatabase ? 'SÍ' : 'NO'}`);
  console.log(`✅ Análisis clínico: ${clinicalAnalysis ? 'SÍ' : 'NO'}`);
  console.log(`✅ Rendimiento: ${performance ? 'SÍ' : 'NO'}`);
  
  const allChecksPassed = serviceAvailable && redFlagsDatabase && clinicalAnalysis && performance;
  
  if (allChecksPassed) {
    console.log('\n🎉 ENTORNO LISTO PARA UAT ✅');
    console.log('✅ Todas las verificaciones han pasado');
    console.log('✅ El sistema está listo para ejecutar las pruebas UAT');
  } else {
    console.log('\n⚠️ ENTORNO NO LISTO PARA UAT ⚠️');
    console.log('❌ Algunas verificaciones han fallado');
    console.log('❌ Corregir los problemas antes de ejecutar UAT');
  }
  
  if (recommendations.length > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '=' .repeat(80));
  
  return {
    serviceAvailable,
    redFlagsDatabase,
    clinicalAnalysis,
    performance,
    recommendations
  };
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUATEnvironment().then(result => {
    const allChecksPassed = result.serviceAvailable && 
                           result.redFlagsDatabase && 
                           result.clinicalAnalysis && 
                           result.performance;
    
    process.exit(allChecksPassed ? 0 : 1);
  });
}

export { checkUATEnvironment }; 