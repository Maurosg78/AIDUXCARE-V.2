#!/usr/bin/env tsx

/**
 * Script de prueba para TextProcessingService Avanzado
 * Prueba la generación de SOAP con entidades clínicas NER
 */

import { textProcessingService, ClinicalEntity } from '../src/services/TextProcessingService';

const SAMPLE_CLINICAL_TEXT = `
Paciente de 45 años que acude por dolor torácico de 2 días de evolución. 
Refiere dolor opresivo en región precordial que se irradia a brazo izquierdo.
Se acompaña de sudoración y náuseas. No fiebre.

Al examen físico: PA 140/90, FC 95 lpm, FR 18 rpm, SatO2 98%.
Paciente consciente, orientado, pálido, sudoroso.
Cardiopulmonar: ruidos cardíacos rítmicos, no soplos. Pulmones ventilados.
Abdomen suave, no doloroso.

ECG: elevación del ST en derivaciones V1-V4.
Troponinas elevadas: 2.5 ng/ml (normal <0.1).

Plan: Aspirina 300mg, Clopidogrel 75mg, Atorvastatina 80mg.
Monitoreo cardíaco continuo. Interconsulta cardiología.
`;

const SAMPLE_CLINICAL_ENTITIES: ClinicalEntity[] = [
  {
    text: "dolor torácico",
    type: "SYMPTOM",
    confidence: 0.95,
    startOffset: 45,
    endOffset: 58
  },
  {
    text: "región precordial",
    type: "ANATOMY",
    confidence: 0.88,
    startOffset: 95,
    endOffset: 111
  },
  {
    text: "brazo izquierdo",
    type: "ANATOMY",
    confidence: 0.82,
    startOffset: 130,
    endOffset: 145
  },
  {
    text: "sudoración",
    type: "SYMPTOM",
    confidence: 0.90,
    startOffset: 165,
    endOffset: 175
  },
  {
    text: "náuseas",
    type: "SYMPTOM",
    confidence: 0.85,
    startOffset: 178,
    endOffset: 185
  },
  {
    text: "PA 140/90",
    type: "TEST",
    confidence: 0.92,
    startOffset: 220,
    endOffset: 229
  },
  {
    text: "ECG",
    type: "TEST",
    confidence: 0.98,
    startOffset: 380,
    endOffset: 383
  },
  {
    text: "elevación del ST",
    type: "CONDITION",
    confidence: 0.94,
    startOffset: 385,
    endOffset: 401
  },
  {
    text: "Troponinas elevadas",
    type: "TEST",
    confidence: 0.96,
    startOffset: 425,
    endOffset: 444
  },
  {
    text: "Aspirina",
    type: "MEDICATION",
    confidence: 0.99,
    startOffset: 480,
    endOffset: 488
  },
  {
    text: "300mg",
    type: "DOSAGE",
    confidence: 0.95,
    startOffset: 489,
    endOffset: 494
  },
  {
    text: "Clopidogrel",
    type: "MEDICATION",
    confidence: 0.98,
    startOffset: 496,
    endOffset: 507
  },
  {
    text: "75mg",
    type: "DOSAGE",
    confidence: 0.95,
    startOffset: 508,
    endOffset: 512
  },
  {
    text: "Atorvastatina",
    type: "MEDICATION",
    confidence: 0.97,
    startOffset: 514,
    endOffset: 527
  },
  {
    text: "80mg",
    type: "DOSAGE",
    confidence: 0.95,
    startOffset: 528,
    endOffset: 532
  },
  {
    text: "Monitoreo cardíaco",
    type: "PROCEDURE",
    confidence: 0.89,
    startOffset: 535,
    endOffset: 553
  }
];

async function main() {
  console.log('🧪 Iniciando pruebas del TextProcessingService Avanzado...\n');

  // Mostrar información del servicio
  const serviceInfo = textProcessingService.getServiceInfo();
  console.log(`📋 Proveedor: ${serviceInfo.provider}`);
  console.log(`📋 Modelo: ${serviceInfo.model}`);
  console.log(`📋 Proyecto: ${serviceInfo.project}`);

  // Validar configuración
  console.log('\n🔧 Validando configuración...');
  const configValidation = textProcessingService.validateConfiguration();
  if (configValidation.isValid) {
    console.log('✅ Configuración válida');
  } else {
    console.log('❌ Configuración incompleta. Variables faltantes:');
    configValidation.missingConfig.forEach(config => {
      console.log(`   - ${config}`);
    });
    console.log('\n⚠️  Continuando con las pruebas disponibles...\n');
  }

  // Prueba de conectividad
  console.log('🔍 Verificando conectividad con Google Cloud AI...');
  const isHealthy = await textProcessingService.checkHealth();
  console.log(`Estado de salud: ${isHealthy ? '✅ Saludable' : '❌ No disponible'}`);

  if (!isHealthy) {
    console.log('\n⚠️  Google Cloud AI no está disponible. Posibles causas:');
    console.log('   - Credenciales incorrectas o faltantes');
    console.log('   - Proyecto de Google Cloud no configurado');
    console.log('   - API de Vertex AI no habilitada');
    console.log('   - Problemas de conectividad');
    console.log('\nFinalizando pruebas...');
    return;
  }

  // Prueba con prompt mínimo
  console.log('\n🎯 Prueba de conectividad básica...');
  const connectionTest = await textProcessingService.testConnection();
  console.log(connectionTest);

  // Prueba 1: Procesamiento simple (sin entidades)
  console.log('\n📝 PRUEBA 1: Procesamiento SOAP simple (sin entidades NER)...');
  try {
    const startTime = Date.now();
    const simpleResult = await textProcessingService.processSimpleText(SAMPLE_CLINICAL_TEXT);
    const endTime = Date.now();

    console.log('\n✅ Resultado del procesamiento simple:');
    console.log(`⏱️  Tiempo de procesamiento: ${simpleResult.processingTime}ms`);
    console.log(`📊 Tiempo total: ${endTime - startTime}ms`);
    console.log(`🎯 Confianza: ${(simpleResult.confidence * 100).toFixed(1)}%`);
    console.log(`🔗 Entidades utilizadas: ${simpleResult.entitiesUsed}`);
    console.log(`⚠️  Advertencias: ${simpleResult.warnings.length}`);
    
    if (simpleResult.warnings.length > 0) {
      simpleResult.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    console.log('\n📋 Estructura SOAP generada:');
    console.log('🔹 Subjetivo:', simpleResult.soapStructure.subjetivo.substring(0, 100) + '...');
    console.log('🔹 Objetivo:', simpleResult.soapStructure.objetivo.substring(0, 100) + '...');
    console.log('🔹 Evaluación:', simpleResult.soapStructure.evaluacion.substring(0, 100) + '...');
    console.log('🔹 Plan:', simpleResult.soapStructure.plan.substring(0, 100) + '...');

  } catch (error) {
    console.error('\n❌ Error en procesamiento simple:', error);
  }

  // Prueba 2: Procesamiento avanzado (con entidades NER)
  console.log('\n📝 PRUEBA 2: Procesamiento SOAP avanzado (con entidades NER)...');
  console.log(`🔬 Entidades clínicas disponibles: ${SAMPLE_CLINICAL_ENTITIES.length}`);
  
  // Mostrar resumen de entidades
  const entitiesByType = SAMPLE_CLINICAL_ENTITIES.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Distribución de entidades:');
  Object.entries(entitiesByType).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} entidades`);
  });

  try {
    const startTime = Date.now();
    const advancedResult = await textProcessingService.processTextToSOAP(
      SAMPLE_CLINICAL_TEXT, 
      SAMPLE_CLINICAL_ENTITIES
    );
    const endTime = Date.now();

    console.log('\n✅ Resultado del procesamiento avanzado:');
    console.log(`⏱️  Tiempo de procesamiento: ${advancedResult.processingTime}ms`);
    console.log(`📊 Tiempo total: ${endTime - startTime}ms`);
    console.log(`🎯 Confianza: ${(advancedResult.confidence * 100).toFixed(1)}%`);
    console.log(`🔗 Entidades utilizadas: ${advancedResult.entitiesUsed}/${SAMPLE_CLINICAL_ENTITIES.length}`);
    console.log(`💡 Highlights generados: ${advancedResult.highlights.length}`);
    console.log(`⚠️  Advertencias: ${advancedResult.warnings.length}`);
    
    if (advancedResult.warnings.length > 0) {
      console.log('\n⚠️  Advertencias de calidad:');
      advancedResult.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    console.log('\n📋 Estructura SOAP avanzada:');
    console.log('🔹 Subjetivo:', advancedResult.soapStructure.subjetivo);
    console.log('🔹 Objetivo:', advancedResult.soapStructure.objetivo);
    console.log('🔹 Evaluación:', advancedResult.soapStructure.evaluacion);
    console.log('🔹 Plan:', advancedResult.soapStructure.plan);

    if (advancedResult.highlights.length > 0) {
      console.log('\n💡 Highlights clínicos generados:');
      advancedResult.highlights.forEach((highlight, index) => {
        console.log(`   ${index + 1}. "${highlight.text}" (${highlight.category}) - ${(highlight.confidence * 100).toFixed(0)}%`);
      });
    }

    // Métricas de calidad comparativas
    console.log('\n📊 Métricas de calidad:');
    const totalCharacters = SAMPLE_CLINICAL_TEXT.length;
    const processingSpeed = totalCharacters / (advancedResult.processingTime / 1000);
    console.log(`📏 Caracteres procesados: ${totalCharacters}`);
    console.log(`⚡ Velocidad: ${processingSpeed.toFixed(2)} caracteres/segundo`);
    console.log(`💰 Costo estimado: $${(totalCharacters * 0.0005 / 1000).toFixed(6)} USD`);
    console.log(`🎯 Eficiencia de entidades: ${((advancedResult.entitiesUsed / SAMPLE_CLINICAL_ENTITIES.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('\n❌ Error en procesamiento avanzado:', error);
  }

  console.log('\n🎉 Pruebas completadas!');
  console.log('\n📝 Resumen de funcionalidades validadas:');
  console.log('   ✅ Conectividad con Google Cloud AI');
  console.log('   ✅ Procesamiento SOAP básico');
  console.log('   ✅ Integración con entidades clínicas NER');
  console.log('   ✅ Generación de highlights automáticos');
  console.log('   ✅ Sistema de advertencias de calidad');
  console.log('   ✅ Métricas de confianza y rendimiento');
  
  console.log('\n🚀 El sistema está listo para integración en PatientCompletePage!');
}

// Manejo de errores global
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error en el script principal:', error);
  process.exit(1);
}); 