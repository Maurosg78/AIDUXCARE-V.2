import clinicalAssistantService, { ClinicalEntity, Patient } from './src/services/ClinicalAssistantService';

// TEST CASE 2: ANTECEDENTES ONCOLÓGICOS + SÍNTOMAS CONSTITUCIONALES
const testCase2 = {
  name: "Antecedentes Oncológicos",
  description: "Validación de detección de factores de riesgo oncológico y síntomas constitucionales",
  transcription: `Paciente femenina de 58 años refiere dolor lumbar crónico de 6 meses de evolución. El dolor es constante, sordo, sin irradiación específica. Menciona que ha perdido 8 kilos en los últimos 3 meses sin hacer dieta ni ejercicio. Tiene antecedentes de cáncer de mama tratado hace 5 años con cirugía, quimioterapia y radioterapia. Actualmente toma tamoxifeno como tratamiento hormonal. Refiere fatiga intensa y pérdida de apetito. Niega fiebre, pero comenta que suda mucho por las noches. Al examen físico, se observa palidez cutánea, dolor a la palpación lumbar bilateral y limitación del rango de movimiento. La paciente está preocupada por la pérdida de peso y la fatiga.`,
  
  // Entidades clínicas simuladas extraídas del texto
  entities: [
    { id: '1', text: 'dolor lumbar crónico', type: 'SYMPTOM', confidence: 0.94 },
    { id: '2', text: 'dolor constante', type: 'SYMPTOM', confidence: 0.89 },
    { id: '3', text: 'pérdida 8 kilos', type: 'SYMPTOM', confidence: 0.96 },
    { id: '4', text: 'bajó peso', type: 'SYMPTOM', confidence: 0.95 },
    { id: '5', text: 'antecedentes cáncer', type: 'HISTORY', confidence: 0.98 },
    { id: '6', text: 'historial cáncer', type: 'HISTORY', confidence: 0.97 },
    { id: '7', text: 'cáncer de mama', type: 'CONDITION', confidence: 0.99 },
    { id: '8', text: 'tamoxifeno', type: 'MEDICATION', confidence: 0.92 },
    { id: '9', text: 'fatiga intensa', type: 'SYMPTOM', confidence: 0.88 },
    { id: '10', text: 'pérdida apetito', type: 'SYMPTOM', confidence: 0.87 },
    { id: '11', text: 'suda por las noches', type: 'SYMPTOM', confidence: 0.85 },
    { id: '12', text: 'palidez cutánea', type: 'FINDING', confidence: 0.90 },
    { id: '13', text: 'dolor palpación lumbar', type: 'FINDING', confidence: 0.91 }
  ],
  
  patient: {
    id: 'test-oncologico-001',
    name: 'María González',
    age: 58,
    phone: '+34 600 222 222',
    email: 'maria.gonzalez@email.com',
    condition: 'Dolor lumbar crónico con antecedentes oncológicos',
    allergies: ['sulfas'],
    medications: ['tamoxifeno', 'paracetamol'],
    clinicalHistory: 'Cáncer de mama tratado hace 5 años con cirugía, quimioterapia y radioterapia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Criterios de validación esperados
  expectedResults: {
    criticalFlags: 0,
    highFlags: 3,     // antecedentes cáncer, pérdida peso, bajó peso
    mediumFlags: 2,   // fatiga, sudoración nocturna
    totalFlags: 5,
    riskScore: { min: 60, max: 75 },
    hasCancerHistory: true,
    hasWeightLoss: true,
    hasOncologicalRecommendation: true
  }
};

async function runTestCase2() {
  console.log('🧪 TEST CASE 2: ANTECEDENTES ONCOLÓGICOS');
  console.log('=' .repeat(80));
  
  try {
    console.log('📋 Transcripción de prueba:');
    console.log(testCase2.transcription);
    console.log('\n' + '=' .repeat(80));
    
    console.log('🔍 Entidades clínicas detectadas:');
    testCase2.entities.forEach(entity => {
      console.log(`  • ${entity.text} (${entity.type}) - Confianza: ${(entity.confidence * 100).toFixed(0)}%`);
    });
    console.log('\n' + '=' .repeat(80));
    
    // Detectar banderas rojas
    console.log('🚨 DETECTANDO BANDERAS ROJAS...');
    const redFlags = await clinicalAssistantService.detectRedFlags(testCase2.entities, testCase2.patient);
    
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
    const analysis = await clinicalAssistantService.performClinicalAnalysis(testCase2.entities, testCase2.patient);
    
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
      hasCancerHistory: redFlags.some(f => 
        f.description.toLowerCase().includes('cáncer') ||
        f.description.toLowerCase().includes('oncológico') ||
        f.relatedEntities.some(e => e.toLowerCase().includes('cáncer'))
      ),
      hasWeightLoss: redFlags.some(f => 
        f.description.toLowerCase().includes('peso') ||
        f.relatedEntities.some(e => e.toLowerCase().includes('peso'))
      ),
      hasOncologicalRecommendation: redFlags.some(f => 
        f.recommendation.toLowerCase().includes('metástasis') ||
        f.recommendation.toLowerCase().includes('oncológico') ||
        f.recommendation.toLowerCase().includes('cáncer')
      ),
      scoreInRange: analysis.riskScore >= testCase2.expectedResults.riskScore.min && 
                   analysis.riskScore <= testCase2.expectedResults.riskScore.max
    };
    
    // Mostrar resultados de validación
    console.log(`\n📊 CRITERIOS DE VALIDACIÓN:`);
    console.log(`  ✅ Banderas rojas CRITICAL: ${validationResults.criticalFlagsCount}/${testCase2.expectedResults.criticalFlags}`);
    console.log(`  ✅ Banderas rojas HIGH: ${validationResults.highFlagsCount}/${testCase2.expectedResults.highFlags}`);
    console.log(`  ✅ Banderas rojas MEDIUM: ${validationResults.mediumFlagsCount}/${testCase2.expectedResults.mediumFlags}`);
    console.log(`  ✅ Total banderas rojas: ${validationResults.totalFlagsCount}/${testCase2.expectedResults.totalFlags}`);
    console.log(`  ✅ Score de riesgo: ${validationResults.riskScore}/${testCase2.expectedResults.riskScore.min}-${testCase2.expectedResults.riskScore.max}`);
    console.log(`  ✅ Detecta antecedentes oncológicos: ${validationResults.hasCancerHistory ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Detecta pérdida de peso: ${validationResults.hasWeightLoss ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Genera recomendación oncológica: ${validationResults.hasOncologicalRecommendation ? 'SÍ' : 'NO'}`);
    
    // Evaluación final
    const allCriteriaMet = 
      validationResults.criticalFlagsCount >= testCase2.expectedResults.criticalFlags &&
      validationResults.highFlagsCount >= testCase2.expectedResults.highFlags &&
      validationResults.totalFlagsCount >= testCase2.expectedResults.totalFlags &&
      validationResults.scoreInRange &&
      validationResults.hasCancerHistory &&
      validationResults.hasWeightLoss &&
      validationResults.hasOncologicalRecommendation;
    
    console.log('\n' + '=' .repeat(80));
    if (allCriteriaMet) {
      console.log('🎉 TEST CASE 2: APROBADO ✅');
      console.log('✅ Todos los criterios de validación han sido cumplidos');
      console.log('✅ El sistema detecta correctamente antecedentes oncológicos');
      console.log('✅ Las recomendaciones son clínicamente apropiadas');
    } else {
      console.log('❌ TEST CASE 2: REPROBADO ❌');
      console.log('❌ Algunos criterios de validación no han sido cumplidos');
      console.log('❌ Revisar configuración de la base de datos de síntomas críticos');
    }
    
    console.log('\n' + '=' .repeat(80));
    return allCriteriaMet;
    
  } catch (error) {
    console.error('❌ ERROR EN TEST CASE 2:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestCase2().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTestCase2, testCase2 }; 