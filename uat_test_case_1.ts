import clinicalAssistantService, { ClinicalEntity, Patient } from './src/services/ClinicalAssistantService';

// TEST CASE 1: SÍNDROME DE CAUDA EQUINA (CASO CRÍTICO)
const testCase1 = {
  name: "Síndrome de Cauda Equina",
  description: "Validación de detección de emergencia neurológica crítica",
  transcription: `Paciente masculino de 45 años refiere dolor lumbar intenso de inicio súbito hace 3 días tras levantar una caja pesada. El dolor se irradia hacia ambas piernas, acompañado de debilidad progresiva. Menciona que ha perdido fuerza en ambos pies y dificultad para caminar. Refiere también pérdida de control de esfínteres desde ayer por la mañana, tanto urinario como fecal. Tiene entumecimiento en la zona de la silla de montar. Niega fiebre, pero comenta que ha bajado 3 kilos en la última semana sin hacer dieta. Al examen físico, se observa debilidad motora en ambas extremidades inferiores, reflejos aquileos abolidos bilateralmente y signos de cauda equina. El paciente está muy ansioso por la pérdida de control urinario y fecal.`,
  
  // Entidades clínicas simuladas extraídas del texto
  entities: [
    { id: '1', text: 'dolor lumbar intenso', type: 'SYMPTOM', confidence: 0.95 },
    { id: '2', text: 'dolor se irradia', type: 'SYMPTOM', confidence: 0.90 },
    { id: '3', text: 'debilidad progresiva', type: 'SYMPTOM', confidence: 0.88 },
    { id: '4', text: 'pérdida fuerza', type: 'SYMPTOM', confidence: 0.92 },
    { id: '5', text: 'pérdida control esfínteres', type: 'SYMPTOM', confidence: 0.98 },
    { id: '6', text: 'incontinencia urinaria', type: 'SYMPTOM', confidence: 0.96 },
    { id: '7', text: 'incontinencia fecal', type: 'SYMPTOM', confidence: 0.96 },
    { id: '8', text: 'entumecimiento silla de montar', type: 'SYMPTOM', confidence: 0.89 },
    { id: '9', text: 'bajó 3 kilos', type: 'SYMPTOM', confidence: 0.87 },
    { id: '10', text: 'debilidad motora', type: 'FINDING', confidence: 0.91 },
    { id: '11', text: 'reflejos aquileos abolidos', type: 'FINDING', confidence: 0.93 },
    { id: '12', text: 'signos de cauda equina', type: 'FINDING', confidence: 0.97 }
  ],
  
  patient: {
    id: 'test-cauda-equina-001',
    name: 'Carlos Rodríguez',
    age: 45,
    phone: '+34 600 111 111',
    email: 'carlos.rodriguez@email.com',
    condition: 'Dolor lumbar con sospecha de síndrome de cauda equina',
    allergies: ['penicilina'],
    medications: ['paracetamol'],
    clinicalHistory: 'Sin antecedentes relevantes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Criterios de validación esperados
  expectedResults: {
    criticalFlags: 2, // pérdida control esfínteres, incontinencia
    highFlags: 2,     // pérdida fuerza, debilidad
    mediumFlags: 1,   // otros síntomas
    totalFlags: 5,
    riskScore: { min: 75, max: 85 },
    hasCaudaEquina: true,
    hasUrgentReferral: true
  }
};

async function runTestCase1() {
  console.log('🧪 TEST CASE 1: SÍNDROME DE CAUDA EQUINA');
  console.log('=' .repeat(80));
  
  try {
    console.log('📋 Transcripción de prueba:');
    console.log(testCase1.transcription);
    console.log('\n' + '=' .repeat(80));
    
    console.log('🔍 Entidades clínicas detectadas:');
    testCase1.entities.forEach(entity => {
      console.log(`  • ${entity.text} (${entity.type}) - Confianza: ${(entity.confidence * 100).toFixed(0)}%`);
    });
    console.log('\n' + '=' .repeat(80));
    
    // Contexto profesional para el test
    const professionalContext = {
      role: 'PHYSIOTHERAPIST' as const,
      country: 'SPAIN' as const,
      state: 'METROPOLITANA' as const,
      specializations: ['Neurología', 'Traumatología'],
      certifications: ['Fisioterapia Neurológica'],
      licenseNumber: 'FIS-12345'
    };
    
    // Detectar banderas rojas
    console.log('🚨 DETECTANDO BANDERAS ROJAS...');
    const redFlags = await clinicalAssistantService.detectRedFlags(testCase1.entities, testCase1.patient, professionalContext);
    
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
    const analysis = await clinicalAssistantService.performClinicalAnalysis(testCase1.entities, testCase1.patient);
    
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
      hasCaudaEquina: redFlags.some(f => 
        f.description.toLowerCase().includes('cauda equina') ||
        f.description.toLowerCase().includes('esfínteres')
      ),
      hasUrgentReferral: redFlags.some(f => 
        f.recommendation.toLowerCase().includes('urgente') ||
        f.recommendation.toLowerCase().includes('derivación')
      ),
      scoreInRange: analysis.riskScore >= testCase1.expectedResults.riskScore.min && 
                   analysis.riskScore <= testCase1.expectedResults.riskScore.max
    };
    
    // Mostrar resultados de validación
    console.log(`\n📊 CRITERIOS DE VALIDACIÓN:`);
    console.log(`  ✅ Banderas rojas CRITICAL: ${validationResults.criticalFlagsCount}/${testCase1.expectedResults.criticalFlags}`);
    console.log(`  ✅ Banderas rojas HIGH: ${validationResults.highFlagsCount}/${testCase1.expectedResults.highFlags}`);
    console.log(`  ✅ Banderas rojas MEDIUM: ${validationResults.mediumFlagsCount}/${testCase1.expectedResults.mediumFlags}`);
    console.log(`  ✅ Total banderas rojas: ${validationResults.totalFlagsCount}/${testCase1.expectedResults.totalFlags}`);
    console.log(`  ✅ Score de riesgo: ${validationResults.riskScore}/${testCase1.expectedResults.riskScore.min}-${testCase1.expectedResults.riskScore.max}`);
    console.log(`  ✅ Detecta síndrome de cauda equina: ${validationResults.hasCaudaEquina ? 'SÍ' : 'NO'}`);
    console.log(`  ✅ Genera derivación urgente: ${validationResults.hasUrgentReferral ? 'SÍ' : 'NO'}`);
    
    // Evaluación final
    const allCriteriaMet = 
      validationResults.criticalFlagsCount >= testCase1.expectedResults.criticalFlags &&
      validationResults.highFlagsCount >= testCase1.expectedResults.highFlags &&
      validationResults.totalFlagsCount >= testCase1.expectedResults.totalFlags &&
      validationResults.scoreInRange &&
      validationResults.hasCaudaEquina &&
      validationResults.hasUrgentReferral;
    
    console.log('\n' + '=' .repeat(80));
    if (allCriteriaMet) {
      console.log('🎉 TEST CASE 1: APROBADO ✅');
      console.log('✅ Todos los criterios de validación han sido cumplidos');
      console.log('✅ El sistema detecta correctamente el síndrome de cauda equina');
      console.log('✅ Las recomendaciones son clínicamente apropiadas');
    } else {
      console.log('❌ TEST CASE 1: REPROBADO ❌');
      console.log('❌ Algunos criterios de validación no han sido cumplidos');
      console.log('❌ Revisar configuración de la base de datos de síntomas críticos');
    }
    
    console.log('\n' + '=' .repeat(80));
    return allCriteriaMet;
    
  } catch (error) {
    console.error('❌ ERROR EN TEST CASE 1:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestCase1().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTestCase1, testCase1 }; 