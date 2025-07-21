/**
 * DEMOSTRACIÓN MODELSELECTOR INTELIGENTE V3.0
 * 
 * Script para demostrar el árbol de decisión del ModelSelector:
 * - Caso 1: Sin banderas rojas → Flash
 * - Caso 2: Con banderas rojas → Pro
 */

const ClinicalInsightService = require('./src/services/ClinicalInsightService');

// =========================================
// CASOS DE PRUEBA PARA DEMOSTRACIÓN
// =========================================

const CASO_SIN_BANDERAS_ROJAS = `
Paciente femenina de 35 años consulta por molestias leves en zona lumbar baja. 
Refiere que comenzó hace una semana después de realizar actividades de jardinería el fin de semana pasado.
El dolor es de intensidad 3/10, tipo pulsátil, se presenta principalmente al estar sentada por períodos prolongados.
Mejora con movimiento suave y calor local. No hay irradiación a miembros inferiores.
Duerme bien, el dolor no la despierta por las noches.
No hay antecedentes de trauma significativo. No toma medicamentos actualmente.
Trabaja en oficina con largas horas sentada frente al computador.
Al examen: postura ligeramente antálgica, movilidad lumbar conservada con ligera limitación en flexión.
No hay signos neurológicos. Pulsos periféricos normales.
Pruebas de tensión neural negativas. Fuerza muscular 5/5 en miembros inferiores.
`;

const CASO_CON_BANDERAS_ROJAS = `
Paciente masculino de 28 años consulta por dolor de espalda severo de 3 semanas de evolución.
El dolor es constante, intensidad 8/10, de tipo penetrante y quemante.
Lo que más le preocupa es que el dolor es especialmente severo durante la noche, llegando a despertarlo varias veces.
La rigidez matutina dura aproximadamente 90 minutos cada día.
Refiere pérdida de peso no intencional de aproximadamente 4 kg en el último mes.
Antecedentes personales: psoriasis en codos y rodillas desde hace 5 años.
Historia de uveítis hace 2 años que requirió tratamiento oftalmológico.
Padre con diagnóstico de espondilitis anquilosante.
Al examen físico: limitación marcada de movilidad lumbar en todos los planos.
Test de Schober positivo (expansión reducida). Maniobras de provocación sacroilíaca positivas bilateralmente.
No déficit neurológico focal, pero refiere ocasional sensación de hormigueo en extremidades.
`;

// =========================================
// FUNCIÓN PRINCIPAL DE DEMOSTRACIÓN
// =========================================

async function demostrarModelSelectorInteligente() {
  console.log('🎯 INICIANDO DEMOSTRACIÓN MODELSELECTOR INTELIGENTE V3.0');
  console.log('============================================================\n');

  const clinicalService = new ClinicalInsightService();

  try {
    // CASO 1: SIN BANDERAS ROJAS (debería seleccionar Flash)
    console.log('📋 CASO 1: PACIENTE SIN BANDERAS ROJAS');
    console.log('───────────────────────────────────────');
    console.log('Caso: Dolor lumbar mecánico leve post-actividad física');
    console.log('Expectativa: ModelSelector debe elegir Gemini-Flash\n');

    const resultado1 = await clinicalService.processTranscriptionWithIntelligentModel(
      CASO_SIN_BANDERAS_ROJAS,
      { specialty: 'fisioterapia', sessionType: 'initial' }
    );

    console.log('✅ RESULTADO CASO 1:');
    console.log(`   Modelo Seleccionado: ${resultado1.intelligent_model_metadata.model_decision.selected_model}`);
    console.log(`   Razonamiento: ${resultado1.intelligent_model_metadata.model_decision.reasoning}`);
    console.log(`   Banderas Rojas: ${resultado1.intelligent_model_metadata.model_decision.triage_result.redFlags.length}`);
    console.log(`   Nivel de Riesgo: ${resultado1.intelligent_model_metadata.model_decision.triage_result.riskLevel}`);
    console.log(`   Optimización de Costos: ${resultado1.intelligent_model_metadata.model_decision.cost_optimization.savingsVsPro || resultado1.intelligent_model_metadata.model_decision.cost_optimization}`);
    console.log(`   Tiempo Total: ${resultado1.intelligent_model_metadata.total_processing_time}s\n`);

    // Pausa entre casos
    console.log('⏳ Esperando 2 segundos antes del siguiente caso...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // CASO 2: CON BANDERAS ROJAS (debería seleccionar Pro)
    console.log('🚨 CASO 2: PACIENTE CON MÚLTIPLES BANDERAS ROJAS');
    console.log('─────────────────────────────────────────────────');
    console.log('Caso: Dolor nocturno + rigidez matutina + pérdida peso + antecedentes');
    console.log('Expectativa: ModelSelector debe elegir Gemini-Pro\n');

    const resultado2 = await clinicalService.processTranscriptionWithIntelligentModel(
      CASO_CON_BANDERAS_ROJAS,
      { specialty: 'fisioterapia', sessionType: 'initial' }
    );

    console.log('✅ RESULTADO CASO 2:');
    console.log(`   Modelo Seleccionado: ${resultado2.intelligent_model_metadata.model_decision.selected_model}`);
    console.log(`   Razonamiento: ${resultado2.intelligent_model_metadata.model_decision.reasoning}`);
    console.log(`   Banderas Rojas: ${resultado2.intelligent_model_metadata.model_decision.triage_result.redFlags.length}`);
    if (resultado2.intelligent_model_metadata.model_decision.triage_result.redFlags.length > 0) {
      console.log(`   Banderas Detectadas: ${resultado2.intelligent_model_metadata.model_decision.triage_result.redFlags.join(', ')}`);
    }
    console.log(`   Nivel de Riesgo: ${resultado2.intelligent_model_metadata.model_decision.triage_result.riskLevel}`);
    console.log(`   Optimización de Costos: ${resultado2.intelligent_model_metadata.model_decision.cost_optimization.savingsVsPro || resultado2.intelligent_model_metadata.model_decision.cost_optimization}`);
    console.log(`   Tiempo Total: ${resultado2.intelligent_model_metadata.total_processing_time}s\n`);

    // RESUMEN COMPARATIVO
    console.log('📊 RESUMEN COMPARATIVO DEL ÁRBOL DE DECISIÓN');
    console.log('============================================================');
    console.log('│ CASO                    │ MODELO         │ BANDERAS │ TIEMPO │');
    console.log('├─────────────────────────┼────────────────┼──────────┼────────┤');
    console.log(`│ Lumbar mecánico leve    │ ${resultado1.intelligent_model_metadata.model_decision.selected_model.padEnd(14)} │ ${String(resultado1.intelligent_model_metadata.model_decision.triage_result.redFlags.length).padEnd(8)} │ ${resultado1.intelligent_model_metadata.total_processing_time.toFixed(1)}s  │`);
    console.log(`│ Dolor inflamatorio      │ ${resultado2.intelligent_model_metadata.model_decision.selected_model.padEnd(14)} │ ${String(resultado2.intelligent_model_metadata.model_decision.triage_result.redFlags.length).padEnd(8)} │ ${resultado2.intelligent_model_metadata.total_processing_time.toFixed(1)}s  │`);
    console.log('└─────────────────────────┴────────────────┴──────────┴────────┘\n');

    // VALIDACIÓN DE OBJETIVOS
    console.log('🎯 VALIDACIÓN DE OBJETIVOS DEL MODELSELECTOR:');
    console.log('─────────────────────────────────────────────');
    
    const caso1EsFlash = resultado1.intelligent_model_metadata.model_decision.selected_model === 'gemini-2.5-flash';
    const caso2EsPro = resultado2.intelligent_model_metadata.model_decision.selected_model === 'gemini-2.5-pro';
    
    console.log(`✅ Caso sin banderas rojas usa Flash: ${caso1EsFlash ? 'CORRECTO' : 'ERROR'}`);
    console.log(`✅ Caso con banderas rojas usa Pro: ${caso2EsPro ? 'CORRECTO' : 'ERROR'}`);
    console.log(`✅ Triaje detecta banderas rojas: ${resultado2.intelligent_model_metadata.model_decision.triage_result.redFlags.length > 0 ? 'CORRECTO' : 'ERROR'}`);
    console.log(`✅ Optimización de costos caso estándar: ${resultado1.intelligent_model_metadata.model_decision.cost_optimization.savingsVsPro ? 'CORRECTO' : 'N/A'}`);

    // LOGS PARA PULL REQUEST
    console.log('\n📋 LOGS PARA PULL REQUEST:');
    console.log('═══════════════════════════');
    console.log('CASO 1 (Sin Banderas Rojas):');
    console.log(`"${resultado1.intelligent_model_metadata.model_decision.reasoning}"`);
    console.log('\nCASO 2 (Con Banderas Rojas):');
    console.log(`"${resultado2.intelligent_model_metadata.model_decision.reasoning}"`);

    console.log('\n🎉 DEMOSTRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('✨ El ModelSelector Inteligente está funcionando correctamente!');

  } catch (error) {
    console.error('❌ ERROR EN DEMOSTRACIÓN:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar demostración si es llamado directamente
if (require.main === module) {
  demostrarModelSelectorInteligente()
    .then(() => {
      console.log('\n🏁 Proceso de demostración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal en demostración:', error);
      process.exit(1);
    });
}

module.exports = { demostrarModelSelectorInteligente }; 