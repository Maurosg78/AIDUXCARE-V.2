import clinicalAssistantService, { ClinicalEntity, Patient } from './src/services/ClinicalAssistantService';

const casoFicticio = `Paciente masculino de 52 años refiere dolor lumbar intenso de inicio súbito tras levantar una caja pesada. El dolor irradia hacia la pierna izquierda, acompañado de debilidad y sensación de hormigueo. Menciona que ha perdido fuerza en el pie y dificultad para caminar. Refiere también pérdida de control de esfínteres desde esta mañana. Niega fiebre, pero comenta que ha bajado 5 kilos en el último mes sin hacer dieta. Tiene antecedentes de cáncer de próstata tratado hace 3 años. Actualmente toma anticoagulantes por fibrilación auricular. Al examen físico, se observa debilidad motora en la extremidad inferior izquierda, reflejo aquileo abolido y signos de cauda equina.`;

async function testRedFlagsDetection() {
  console.log('🔍 INICIANDO TEST DE DETECCIÓN DE BANDERAS ROJAS EXPANDIDA');
  console.log('=' .repeat(80));
  
  // Simular entidades clínicas extraídas del texto
  const entities: ClinicalEntity[] = [
    { id: '1', text: 'dolor lumbar intenso', type: 'SYMPTOM', confidence: 0.95 },
    { id: '2', text: 'dolor irradia', type: 'SYMPTOM', confidence: 0.90 },
    { id: '3', text: 'debilidad', type: 'SYMPTOM', confidence: 0.88 },
    { id: '4', text: 'hormigueo', type: 'SYMPTOM', confidence: 0.85 },
    { id: '5', text: 'pérdida fuerza', type: 'SYMPTOM', confidence: 0.92 },
    { id: '6', text: 'pérdida control esfínteres', type: 'SYMPTOM', confidence: 0.98 },
    { id: '7', text: 'bajó 5 kilos', type: 'SYMPTOM', confidence: 0.87 },
    { id: '8', text: 'antecedentes cáncer', type: 'HISTORY', confidence: 0.94 },
    { id: '9', text: 'anticoagulantes', type: 'MEDICATION', confidence: 0.96 },
    { id: '10', text: 'debilidad motora', type: 'FINDING', confidence: 0.89 },
    { id: '11', text: 'reflejo aquileo abolido', type: 'FINDING', confidence: 0.91 },
    { id: '12', text: 'signos de cauda equina', type: 'FINDING', confidence: 0.97 }
  ];

  // Simular paciente
  const patient: Patient = {
    id: 'test-001',
    name: 'Juan Pérez',
    age: 52,
    phone: '+34 600 000 000',
    email: 'juan.perez@email.com',
    condition: 'Dolor lumbar con sospecha de síndrome de cauda equina',
    allergies: ['penicilina'],
    medications: ['anticoagulantes', 'warfarina'],
    clinicalHistory: 'Cáncer de próstata tratado hace 3 años, fibrilación auricular',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    console.log('📋 CASO CLÍNICO DE PRUEBA:');
    console.log(casoFicticio);
    console.log('\n' + '=' .repeat(80));

    console.log('🔍 ENTIDADES CLÍNICAS DETECTADAS:');
    entities.forEach(entity => {
      console.log(`  • ${entity.text} (${entity.type}) - Confianza: ${(entity.confidence * 100).toFixed(0)}%`);
    });
    console.log('\n' + '=' .repeat(80));

    // Detectar banderas rojas
    console.log('🚨 DETECTANDO BANDERAS ROJAS...');
    const redFlags = await clinicalAssistantService.detectRedFlags(entities, patient);
    
    console.log(`\n✅ BANDERAS ROJAS DETECTADAS: ${redFlags.length}`);
    console.log('=' .repeat(80));
    
    if (redFlags.length === 0) {
      console.log('❌ NO SE DETECTARON BANDERAS ROJAS - VERIFICAR BASE DE DATOS');
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
        console.log(`  ⏰ Timestamp: ${flag.timestamp}`);
      });
    }

    // Análisis clínico completo
    console.log('\n' + '=' .repeat(80));
    console.log('🏥 ANÁLISIS CLÍNICO COMPLETO...');
    const analysis = await clinicalAssistantService.performClinicalAnalysis(entities, patient);
    
    console.log(`\n📊 RESULTADOS DEL ANÁLISIS:`);
    console.log(`  🚨 Banderas rojas: ${analysis.redFlags.length}`);
    console.log(`  📋 Plantillas sugeridas: ${analysis.examTemplates.length}`);
    console.log(`  💡 Sugerencias totales: ${analysis.suggestions.length}`);
    console.log(`  ⚠️ Score de riesgo: ${analysis.riskScore}/100`);
    console.log(`  📊 Confianza general: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log(`  ⏱️ Tiempo procesamiento: ${analysis.processingTime}ms`);

    // Mostrar sugerencias clínicas
    if (analysis.suggestions.length > 0) {
      console.log('\n💡 SUGERENCIAS CLÍNICAS:');
      analysis.suggestions.forEach((suggestion, index) => {
        console.log(`\n  ${index + 1}. ${suggestion.title}`);
        console.log(`     📝 ${suggestion.description}`);
        console.log(`     ⚠️ Prioridad: ${suggestion.priority}`);
        console.log(`     ✅ Acción requerida: ${suggestion.actionRequired ? 'SÍ' : 'NO'}`);
      });
    }

    // Verificar detección específica de síndrome de cauda equina
    const caudaEquinaFlags = redFlags.filter(flag => 
      flag.description.toLowerCase().includes('cauda equina') ||
      flag.description.toLowerCase().includes('esfínteres')
    );

    console.log('\n' + '=' .repeat(80));
    console.log('🎯 VERIFICACIÓN ESPECÍFICA - SÍNDROME DE CAUDA EQUINA:');
    if (caudaEquinaFlags.length > 0) {
      console.log('✅ SÍNDROME DE CAUDA EQUINA DETECTADO CORRECTAMENTE');
      caudaEquinaFlags.forEach(flag => {
        console.log(`  🚨 ${flag.title}`);
        console.log(`  📝 ${flag.description}`);
      });
    } else {
      console.log('❌ SÍNDROME DE CAUDA EQUINA NO DETECTADO - REVISAR BASE DE DATOS');
    }

    // Verificar otros síntomas críticos
    const criticalFlags = redFlags.filter(flag => 
      flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
    );

    console.log('\n🎯 VERIFICACIÓN DE SÍNTOMAS CRÍTICOS:');
    console.log(`  🚨 Síntomas críticos detectados: ${criticalFlags.length}`);
    criticalFlags.forEach(flag => {
      console.log(`    • ${flag.title} (${flag.severity})`);
    });

    console.log('\n' + '=' .repeat(80));
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log(`📊 RESUMEN: ${redFlags.length} banderas rojas detectadas de ${entities.length} entidades analizadas`);

  } catch (error) {
    console.error('❌ ERROR EN EL TEST:', error);
  }
}

// Ejecutar el test
testRedFlagsDetection(); 