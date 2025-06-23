import clinicalAssistantService, { ClinicalEntity, Patient } from './src/services/ClinicalAssistantService';

// TEST CASE 4: CONSULTA ESTÁNDAR SIN BANDERAS ROJAS (PRUEBA DE REGRESIÓN)
const testCase4 = {
  name: "Consulta Estándar - Prueba de Regresión",
  description: "Validación de que el sistema NO genera falsos positivos en consultas normales",
  transcription: `Paciente femenina de 35 años refiere dolor lumbar mecánico de 2 semanas de evolución tras hacer ejercicio intenso en el gimnasio. El dolor es localizado en la región lumbar baja, sin irradiación, y mejora con el reposo. Niega antecedentes de trauma, fiebre, pérdida de peso o alteraciones neurológicas. No toma medicamentos crónicos y no tiene alergias conocidas. Al examen físico, se observa dolor a la palpación en la región lumbar baja, ligera limitación del rango de movimiento en flexión y extensión, y buena fuerza muscular en extremidades inferiores. Los reflejos son normales y simétricos. La paciente desea tratamiento para el dolor y ejercicios de rehabilitación.`,
  
  // Entidades clínicas simuladas extraídas del texto
  entities: [
    { id: '1', text: 'dolor lumbar mecánico', type: 'SYMPTOM', confidence: 0.94 },
    { id: '2', text: 'dolor localizado', type: 'SYMPTOM', confidence: 0.89 },
    { id: '3', text: 'dolor lumbar baja', type: 'SYMPTOM', confidence: 0.92 },
    { id: '4', text: 'mejora con reposo', type: 'SYMPTOM', confidence: 0.87 },
    { id: '5', text: 'sin irradiación', type: 'SYMPTOM', confidence: 0.85 },
    { id: '6', text: 'ejercicio intenso', type: 'HISTORY', confidence: 0.88 },
    { id: '7', text: 'dolor palpación lumbar', type: 'FINDING', confidence: 0.91 },
    { id: '8', text: 'limitación movimiento', type: 'FINDING', confidence: 0.86 },
    { id: '9', text: 'buena fuerza muscular', type: 'FINDING', confidence: 0.93 },
    { id: '10', text: 'reflejos normales', type: 'FINDING', confidence: 0.95 },
    { id: '11', text: 'reflejos simétricos', type: 'FINDING', confidence: 0.94 }
  ],
  
  patient: {
    id: 'test-estandar-001',
    name: 'Ana López',
    age: 35,
    phone: '+34 600 444 444',
    email: 'ana.lopez@email.com',
    condition: 'Dolor lumbar mecánico post-ejercicio',
    allergies: [],
    medications: [],
    clinicalHistory: 'Sin antecedentes relevantes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Criterios de validación esperados (NO debe detectar banderas rojas críticas)
  expectedResults: {
    criticalFlags: 0,  // NO debe detectar banderas rojas críticas
    highFlags: 0,      // NO debe detectar banderas rojas altas
    mediumFlags: 1,    // Máximo 1 bandera roja media (dolor lumbar)
    totalFlags: 1,     // Máximo 1 bandera roja total
    riskScore: { min: 10, max: 25 },
    hasNoCriticalFlags: true,
    hasNoHighFlags: true,
    hasLowRiskScore: true,
    hasNoUrgentRecommendations: true
  }
};

async function runTestCase4() {
  console.log('🧪 TEST CASE 4: CONSULTA ESTÁNDAR - PRUEBA DE REGRESIÓN');
  console.log('=' .repeat(80));
  
  try {
    console.log('📋 Transcripción de prueba:');
    console.log(testCase4.transcription);
    console.log('\n' + '=' .repeat(80));
    
    console.log('🔍 Entidades clínicas detectadas:');
    testCase4.entities.forEach(entity => {
      console.log(`  • ${entity.text} (${entity.type}) - Confianza: ${(entity.confidence * 100).toFixed(0)}%`);
    });
    console.log('\n' + '=' .repeat(80));
    
    // Detectar banderas rojas
    console.log('🚨 DETECTANDO BANDERAS ROJAS...');
    const redFlags = await clinicalAssistantService.detectRedFlags(testCase4.entities, testCase4.patient);
    
    console.log(`\n✅ BANDERAS ROJAS DETECTADAS: ${redFlags.length}`);
    console.log('=' .repeat(80));
    
    // Mostrar banderas rojas detectadas (deberían ser pocas o ninguna)
    if (redFlags.length === 0) {
      console.log('✅ NO SE DETECTARON BANDERAS ROJAS - EXCELENTE (Consulta normal)');
    } else {
      redFlags.forEach((flag, index) => {
        console.log(`\n🚨 BANDERA ROJA #${index + 1}:`);
        console.log(`  📌 Tipo: ${flag.type}`);
        console.log(`  ⚠️ Severidad: ${flag.severity}`);
        console.log(`  📋 Título: ${flag.title}`);
        console.log(`  📝 Descripción: ${flag.description}`);
        console.log(`  💡 Recomendación: ${flag.recommendation}`);
        console.log(`  🔗 Entidades relacionadas: ${flag.relatedEntities.join(', ')}`);
        console.log(`  📊 Confianza: ${(flag.confidence * 100).toFixed(0)}%`);
      });
    }
    
    // Análisis clínico completo
    console.log('\n' + '=' .repeat(80));
    console.log('🏥 ANÁLISIS CLÍNICO COMPLETO...');
    const analysis = await clinicalAssistantService.performClinicalAnalysis(testCase4.entities, testCase4.patient);
    
    console.log(`\n📊 RESULTADOS DEL ANÁLISIS:`);
    console.log(`  🚨 Banderas rojas: ${analysis.redFlags.length}`);
    console.log(`  📋 Plantillas sugeridas: ${analysis.examTemplates.length}`);
    console.log(`  💡 Sugerencias totales: ${analysis.suggestions.length}`);
    console.log(`  ⚠️ Score de riesgo: ${analysis.riskScore}/100`);
    console.log(`  📊 Confianza general: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log(`  ⏱️ Tiempo procesamiento: ${analysis.processingTime}ms`);
    
    // Validación automática de criterios (para regresión)
    console.log('\n' + '=' .repeat(80));
    console.log('✅ VALIDACIÓN AUTOMÁTICA DE CRITERIOS (REGRESIÓN):');
    
    const criticalFlags = redFlags.filter(f => f.severity === 'CRITICAL');
    const highFlags = redFlags.filter(f => f.severity === 'HIGH');
    const mediumFlags = redFlags.filter(f => f.severity === 'MEDIUM');
    
    const validationResults = {
      criticalFlagsCount: criticalFlags.length,
      highFlagsCount: highFlags.length,
      mediumFlagsCount: mediumFlags.length,
      totalFlagsCount: redFlags.length,
      riskScore: analysis.riskScore,
      hasNoCriticalFlags: criticalFlags.length === 0,
      hasNoHighFlags: highFlags.length === 0,
      hasLowRiskScore: analysis.riskScore <= testCase4.expectedResults.riskScore.max,
      hasNoUrgentRecommendations: !redFlags.some(f => 
        f.recommendation.toLowerCase().includes('urgente') ||
        f.recommendation.toLowerCase().includes('derivación') ||
        f.recommendation.toLowerCase().includes('emergencia')
      ),
      scoreInRange: analysis.riskScore >= testCase4.expectedResults.riskScore.min && 
                   analysis.riskScore <= testCase4.expectedResults.riskScore.max
    };
    
    // Mostrar resultados de validación
    console.log(`\n📊 CRITERIOS DE VALIDACIÓN (REGRESIÓN):`);
    console.log(`  ✅ Banderas rojas CRITICAL: ${validationResults.criticalFlagsCount}/${testCase4.expectedResults.criticalFlags} (DEBE SER 0)`);
    console.log(`  ✅ Banderas rojas HIGH: ${validationResults.highFlagsCount}/${testCase4.expectedResults.highFlags} (DEBE SER 0)`);
    console.log(`  ✅ Banderas rojas MEDIUM: ${validationResults.mediumFlagsCount}/${testCase4.expectedResults.mediumFlags} (MÁXIMO 1)`);
    console.log(`  ✅ Total banderas rojas: ${validationResults.totalFlagsCount}/${testCase4.expectedResults.totalFlags} (MÁXIMO 1)`);
    console.log(`  ✅ Score de riesgo: ${validationResults.riskScore}/${testCase4.expectedResults.riskScore.min}-${testCase4.expectedResults.riskScore.max}`);
    console.log(`  ✅ NO detecta banderas críticas: ${validationResults.hasNoCriticalFlags ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ NO detecta banderas altas: ${validationResults.hasNoHighFlags ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Score de riesgo bajo: ${validationResults.hasLowRiskScore ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ NO genera recomendaciones urgentes: ${validationResults.hasNoUrgentRecommendations ? 'SÍ' : 'NO'}`);
    
    // Evaluación final (para regresión, queremos que NO detecte banderas rojas críticas)
    const allCriteriaMet = 
      validationResults.hasNoCriticalFlags &&
      validationResults.hasNoHighFlags &&
      validationResults.mediumFlagsCount <= testCase4.expectedResults.mediumFlags &&
      validationResults.totalFlagsCount <= testCase4.expectedResults.totalFlags &&
      validationResults.scoreInRange &&
      validationResults.hasNoUrgentRecommendations;
    
    console.log('\n' + '=' .repeat(80));
    if (allCriteriaMet) {
      console.log('🎉 TEST CASE 4: APROBADO ✅ (REGRESIÓN EXITOSA)');
      console.log('✅ No se detectaron falsos positivos críticos');
      console.log('✅ El sistema no es excesivamente sensible');
      console.log('✅ Las recomendaciones son apropiadas para una consulta normal');
    } else {
      console.log('❌ TEST CASE 4: REPROBADO ❌ (FALSOS POSITIVOS DETECTADOS)');
      console.log('❌ Se detectaron banderas rojas en una consulta normal');
      console.log('❌ El sistema es excesivamente sensible');
      console.log('❌ Revisar configuración para evitar falsos positivos');
    }
    
    console.log('\n' + '=' .repeat(80));
    return allCriteriaMet;
    
  } catch (error) {
    console.error('❌ ERROR EN TEST CASE 4:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestCase4().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTestCase4, testCase4 }; 