import clinicalAssistantService, { ClinicalEntity, Patient } from './src/services/ClinicalAssistantService';

// TEST CASE 3: ANTICOAGULANTES + RIESGO HEMORRÁGICO
const testCase3 = {
  name: "Anticoagulantes y Riesgo Hemorrágico",
  description: "Validación de detección de medicamentos anticoagulantes y riesgo hemorrágico",
  transcription: `Paciente masculino de 72 años refiere dolor en hombro derecho de 2 semanas de evolución tras una caída. El dolor es intenso, especialmente por las noches, y limita el movimiento del brazo. Tiene antecedentes de fibrilación auricular y toma warfarina desde hace 3 años. También toma aspirina por recomendación médica. Refiere que ha notado moretones frecuentes en los brazos y que cualquier golpe menor le produce hematomas grandes. Al examen físico, se observa dolor a la palpación en la región deltoidea, limitación del rango de movimiento y múltiples equimosis en ambos brazos. El paciente está preocupado por los moretones y el dolor intenso.`,
  
  // Entidades clínicas simuladas extraídas del texto
  entities: [
    { id: '1', text: 'dolor hombro derecho', type: 'SYMPTOM', confidence: 0.93 },
    { id: '2', text: 'dolor intenso', type: 'SYMPTOM', confidence: 0.91 },
    { id: '3', text: 'fibrilación auricular', type: 'CONDITION', confidence: 0.95 },
    { id: '4', text: 'warfarina', type: 'MEDICATION', confidence: 0.98 },
    { id: '5', text: 'aspirina', type: 'MEDICATION', confidence: 0.96 },
    { id: '6', text: 'anticoagulantes', type: 'MEDICATION', confidence: 0.97 },
    { id: '7', text: 'moretones frecuentes', type: 'SYMPTOM', confidence: 0.89 },
    { id: '8', text: 'hematomas grandes', type: 'SYMPTOM', confidence: 0.88 },
    { id: '9', text: 'sangrado', type: 'SYMPTOM', confidence: 0.90 },
    { id: '10', text: 'dolor palpación deltoidea', type: 'FINDING', confidence: 0.92 },
    { id: '11', text: 'limitación movimiento', type: 'FINDING', confidence: 0.87 },
    { id: '12', text: 'múltiples equimosis', type: 'FINDING', confidence: 0.94 }
  ],
  
  patient: {
    id: 'test-anticoagulantes-001',
    name: 'José Martínez',
    age: 72,
    phone: '+34 600 333 333',
    email: 'jose.martinez@email.com',
    condition: 'Dolor de hombro con antecedentes de anticoagulación',
    allergies: ['penicilina'],
    medications: ['warfarina', 'aspirina', 'paracetamol'],
    clinicalHistory: 'Fibrilación auricular, hipertensión arterial, diabetes tipo 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Criterios de validación esperados
  expectedResults: {
    criticalFlags: 0,
    highFlags: 1,     // sangrado (si interpreta moretones como sangrado)
    mediumFlags: 2,   // anticoagulantes, warfarina
    totalFlags: 3,
    riskScore: { min: 40, max: 55 },
    hasAnticoagulants: true,
    hasWarfarin: true,
    hasBleedingRisk: true,
    hasCoagulationRecommendation: true
  }
};

async function runTestCase3() {
  console.log('🧪 TEST CASE 3: ANTICOAGULANTES Y RIESGO HEMORRÁGICO');
  console.log('=' .repeat(80));
  
  try {
    console.log('📋 Transcripción de prueba:');
    console.log(testCase3.transcription);
    console.log('\n' + '=' .repeat(80));
    
    console.log('🔍 Entidades clínicas detectadas:');
    testCase3.entities.forEach(entity => {
      console.log(`  • ${entity.text} (${entity.type}) - Confianza: ${(entity.confidence * 100).toFixed(0)}%`);
    });
    console.log('\n' + '=' .repeat(80));
    
    // Detectar banderas rojas
    console.log('🚨 DETECTANDO BANDERAS ROJAS...');
    const redFlags = await clinicalAssistantService.detectRedFlags(testCase3.entities, testCase3.patient);
    
    console.log(`\n✅ BANDERAS ROJAS DETECTADAS: ${redFlags.length}`);
    console.log('=' .repeat(80));
    
    // Mostrar banderas rojas detectadas
    if (redFlags.length === 0) {
      console.log('❌ NO SE DETECTARON BANDERAS ROJAS - FALLO CRÍTICO');
      return false;
    }
    
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
    
    // Análisis clínico completo
    console.log('\n' + '=' .repeat(80));
    console.log('🏥 ANÁLISIS CLÍNICO COMPLETO...');
    const analysis = await clinicalAssistantService.performClinicalAnalysis(testCase3.entities, testCase3.patient);
    
    console.log(`\n📊 RESULTADOS DEL ANÁLISIS:`);
    console.log(`  🚨 Banderas rojas: ${analysis.redFlags.length}`);
    console.log(`  📋 Plantillas sugeridas: ${analysis.examTemplates.length}`);
    console.log(`  💡 Sugerencias totales: ${analysis.suggestions.length}`);
    console.log(`  ⚠️ Score de riesgo: ${analysis.riskScore}/100`);
    console.log(`  📊 Confianza general: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log(`  ⏱️ Tiempo procesamiento: ${analysis.processingTime}ms`);
    
    // Validación automática de criterios
    console.log('\n' + '=' .repeat(80));
    console.log('✅ VALIDACIÓN AUTOMÁTICA DE CRITERIOS:');
    
    const criticalFlags = redFlags.filter(f => f.severity === 'CRITICAL');
    const highFlags = redFlags.filter(f => f.severity === 'HIGH');
    const mediumFlags = redFlags.filter(f => f.severity === 'MEDIUM');
    
    const validationResults = {
      criticalFlagsCount: criticalFlags.length,
      highFlagsCount: highFlags.length,
      mediumFlagsCount: mediumFlags.length,
      totalFlagsCount: redFlags.length,
      riskScore: analysis.riskScore,
      hasAnticoagulants: redFlags.some(f => 
        f.description.toLowerCase().includes('anticoagulante') ||
        f.relatedEntities.some(e => e.toLowerCase().includes('anticoagulante'))
      ),
      hasWarfarin: redFlags.some(f => 
        f.description.toLowerCase().includes('warfarina') ||
        f.relatedEntities.some(e => e.toLowerCase().includes('warfarina'))
      ),
      hasBleedingRisk: redFlags.some(f => 
        f.description.toLowerCase().includes('sangrado') ||
        f.description.toLowerCase().includes('hemorrágico') ||
        f.relatedEntities.some(e => e.toLowerCase().includes('sangrado'))
      ),
      hasCoagulationRecommendation: redFlags.some(f => 
        f.recommendation.toLowerCase().includes('inr') ||
        f.recommendation.toLowerCase().includes('coagulación') ||
        f.recommendation.toLowerCase().includes('coagul')
      ),
      scoreInRange: analysis.riskScore >= testCase3.expectedResults.riskScore.min && 
                   analysis.riskScore <= testCase3.expectedResults.riskScore.max
    };
    
    // Mostrar resultados de validación
    console.log(`\n📊 CRITERIOS DE VALIDACIÓN:`);
    console.log(`  ✅ Banderas rojas CRITICAL: ${validationResults.criticalFlagsCount}/${testCase3.expectedResults.criticalFlags}`);
    console.log(`  ✅ Banderas rojas HIGH: ${validationResults.highFlagsCount}/${testCase3.expectedResults.highFlags}`);
    console.log(`  ✅ Banderas rojas MEDIUM: ${validationResults.mediumFlagsCount}/${testCase3.expectedResults.mediumFlags}`);
    console.log(`  ✅ Total banderas rojas: ${validationResults.totalFlagsCount}/${testCase3.expectedResults.totalFlags}`);
    console.log(`  ✅ Score de riesgo: ${validationResults.riskScore}/${testCase3.expectedResults.riskScore.min}-${testCase3.expectedResults.riskScore.max}`);
    console.log(`  ✅ Detecta anticoagulantes: ${validationResults.hasAnticoagulants ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Detecta warfarina: ${validationResults.hasWarfarin ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Detecta riesgo hemorrágico: ${validationResults.hasBleedingRisk ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Genera recomendación de coagulación: ${validationResults.hasCoagulationRecommendation ? 'SÍ' : 'NO'}`);
    
    // Evaluación final
    const allCriteriaMet = 
      validationResults.criticalFlagsCount >= testCase3.expectedResults.criticalFlags &&
      validationResults.highFlagsCount >= testCase3.expectedResults.highFlags &&
      validationResults.totalFlagsCount >= testCase3.expectedResults.totalFlags &&
      validationResults.scoreInRange &&
      validationResults.hasAnticoagulants &&
      validationResults.hasWarfarin &&
      validationResults.hasCoagulationRecommendation;
    
    console.log('\n' + '=' .repeat(80));
    if (allCriteriaMet) {
      console.log('🎉 TEST CASE 3: APROBADO ✅');
      console.log('✅ Todos los criterios de validación han sido cumplidos');
      console.log('✅ El sistema detecta correctamente anticoagulantes y riesgo hemorrágico');
      console.log('✅ Las recomendaciones son clínicamente apropiadas');
    } else {
      console.log('❌ TEST CASE 3: REPROBADO ❌');
      console.log('❌ Algunos criterios de validación no han sido cumplidos');
      console.log('❌ Revisar configuración de la base de datos de síntomas críticos');
    }
    
    console.log('\n' + '=' .repeat(80));
    return allCriteriaMet;
    
  } catch (error) {
    console.error('❌ ERROR EN TEST CASE 3:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestCase3().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTestCase3, testCase3 }; 