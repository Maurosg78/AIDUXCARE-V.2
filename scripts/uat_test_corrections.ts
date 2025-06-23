/**
 * 🧪 UAT TEST - VERIFICACIÓN DE CORRECCIONES CLINICALASSISTANTSERVICE
 * 
 * Script para verificar que las correcciones realizadas en la base de datos
 * de síntomas críticos y el método de detección funcionan correctamente.
 */

import { clinicalAssistantService, ClinicalEntity, Patient } from '../src/services/ClinicalAssistantService';

// === CASOS DE PRUEBA CORREGIDOS ===

const testCase1 = {
  name: "Síndrome de Cauda Equina",
  entities: [
    { id: "1", text: "pérdida control esfínteres", type: "SYMPTOM", confidence: 0.95 },
    { id: "2", text: "incontinencia urinaria", type: "SYMPTOM", confidence: 0.92 },
    { id: "3", text: "entumecimiento silla de montar", type: "SYMPTOM", confidence: 0.88 },
    { id: "4", text: "dolor lumbar intenso", type: "SYMPTOM", confidence: 0.85 }
  ] as ClinicalEntity[],
  patient: {
    id: "1",
    name: "María González",
    age: 45,
    phone: "123456789",
    email: "maria@test.com",
    condition: "Dolor lumbar",
    allergies: [],
    medications: [],
    clinicalHistory: "Hernia discal L4-L5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Patient,
  expectedRedFlags: 3,
  expectedCriticalFlags: 3
};

const testCase2 = {
  name: "Antecedentes Oncológicos",
  entities: [
    { id: "1", text: "antecedentes cáncer de mama", type: "HISTORY", confidence: 0.95 },
    { id: "2", text: "pérdida 8 kilos", type: "SYMPTOM", confidence: 0.92 },
    { id: "3", text: "fatiga intensa", type: "SYMPTOM", confidence: 0.88 },
    { id: "4", text: "suda por las noches", type: "SYMPTOM", confidence: 0.85 },
    { id: "5", text: "palidez cutánea", type: "FINDING", confidence: 0.82 }
  ] as ClinicalEntity[],
  patient: {
    id: "2",
    name: "Ana Martínez",
    age: 52,
    phone: "987654321",
    email: "ana@test.com",
    condition: "Fatiga y pérdida de peso",
    allergies: [],
    medications: [],
    clinicalHistory: "Cáncer de mama 2019, tratada con quimioterapia",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Patient,
  expectedRedFlags: 5,
  expectedCriticalFlags: 0
};

const testCase3 = {
  name: "Anticoagulantes",
  entities: [
    { id: "1", text: "warfarina", type: "MEDICATION", confidence: 0.95 },
    { id: "2", text: "aspirina", type: "MEDICATION", confidence: 0.92 },
    { id: "3", text: "moretones frecuentes", type: "SYMPTOM", confidence: 0.88 },
    { id: "4", text: "hematomas grandes", type: "FINDING", confidence: 0.85 },
    { id: "5", text: "múltiples equimosis", type: "FINDING", confidence: 0.82 }
  ] as ClinicalEntity[],
  patient: {
    id: "3",
    name: "Carlos López",
    age: 68,
    phone: "555666777",
    email: "carlos@test.com",
    condition: "Dolor articular",
    allergies: [],
    medications: ["Warfarina", "Aspirina"],
    clinicalHistory: "Fibrilación auricular, anticoagulado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Patient,
  expectedRedFlags: 5,
  expectedCriticalFlags: 0
};

const testCase4 = {
  name: "Caso Normal (Sin Banderas Rojas)",
  entities: [
    { id: "1", text: "dolor lumbar mecánico", type: "SYMPTOM", confidence: 0.95 },
    { id: "2", text: "limitación flexión", type: "FINDING", confidence: 0.92 },
    { id: "3", text: "contractura muscular", type: "FINDING", confidence: 0.88 }
  ] as ClinicalEntity[],
  patient: {
    id: "4",
    name: "Luis Pérez",
    age: 35,
    phone: "111222333",
    email: "luis@test.com",
    condition: "Dolor lumbar",
    allergies: [],
    medications: [],
    clinicalHistory: "Sin antecedentes relevantes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Patient,
  expectedRedFlags: 0,
  expectedCriticalFlags: 0
};

// === FUNCIÓN DE PRUEBA ===

async function runUATTest() {
  console.log('🧪 INICIANDO UAT - VERIFICACIÓN DE CORRECCIONES');
  console.log('=' .repeat(60));
  
  let totalTests = 0;
  let passedTests = 0;
  
  const testCases = [testCase1, testCase2, testCase3, testCase4];
  
  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n📋 TEST ${totalTests}: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    try {
      // Ejecutar detección de banderas rojas
      const redFlags = await clinicalAssistantService.detectRedFlags(testCase.entities, testCase.patient);
      
      // Contar banderas críticas
      const criticalFlags = redFlags.filter(flag => flag.severity === 'CRITICAL');
      
      // Verificar resultados
      const redFlagsMatch = redFlags.length >= testCase.expectedRedFlags;
      const criticalFlagsMatch = criticalFlags.length >= testCase.expectedCriticalFlags;
      
      console.log(`✅ Banderas rojas detectadas: ${redFlags.length} (esperado: ≥${testCase.expectedRedFlags})`);
      console.log(`✅ Banderas críticas: ${criticalFlags.length} (esperado: ≥${testCase.expectedCriticalFlags})`);
      
      if (redFlags.length > 0) {
        console.log('🚨 Banderas detectadas:');
        redFlags.forEach(flag => {
          console.log(`   - ${flag.title} (${flag.severity})`);
        });
      }
      
      if (redFlagsMatch && criticalFlagsMatch) {
        console.log('✅ TEST PASADO');
        passedTests++;
      } else {
        console.log('❌ TEST FALLIDO');
        if (!redFlagsMatch) {
          console.log(`   ❌ Banderas rojas insuficientes: ${redFlags.length} < ${testCase.expectedRedFlags}`);
        }
        if (!criticalFlagsMatch) {
          console.log(`   ❌ Banderas críticas insuficientes: ${criticalFlags.length} < ${testCase.expectedCriticalFlags}`);
        }
      }
      
    } catch (error) {
      console.log('❌ ERROR EN TEST:', error);
    }
  }
  
  // Resultados finales
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS FINALES');
  console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
  console.log(`📈 Tasa de éxito: ${((passedTests/totalTests)*100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS LOS TESTS PASARON - CORRECCIONES EXITOSAS');
    return true;
  } else {
    console.log('⚠️ ALGUNOS TESTS FALLARON - REQUIERE MÁS CORRECCIONES');
    return false;
  }
}

// === EJECUCIÓN ===

runUATTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error ejecutando UAT:', error);
    process.exit(1);
  });

export { runUATTest }; 