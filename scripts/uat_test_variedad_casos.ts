import { clinicalAssistantService, ClinicalEntity, Patient } from '../src/services/ClinicalAssistantService';

const casos = [
  {
    name: "Farmacológico - Insuficiencia renal y AINEs",
    entities: [
      { id: "1", text: "ibuprofeno", type: "MEDICATION", confidence: 0.95 },
      { id: "2", text: "insuficiencia renal crónica", type: "CONDITION", confidence: 0.92 }
    ] as ClinicalEntity[],
    patient: {
      id: "1",
      name: "Pedro Ruiz",
      age: 70,
      phone: "123123123",
      email: "pedro@prueba.com",
      condition: "Insuficiencia renal crónica",
      allergies: [],
      medications: ["Ibuprofeno"],
      clinicalHistory: "HTA, insuficiencia renal crónica estadio 3",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Patient
  },
  {
    name: "Sintomático - Fiebre alta, convulsiones y pérdida de conciencia",
    entities: [
      { id: "1", text: "fiebre alta", type: "SYMPTOM", confidence: 0.97 },
      { id: "2", text: "convulsiones", type: "SYMPTOM", confidence: 0.96 },
      { id: "3", text: "pérdida conciencia", type: "SYMPTOM", confidence: 0.95 }
    ] as ClinicalEntity[],
    patient: {
      id: "2",
      name: "Lucía Torres",
      age: 28,
      phone: "321321321",
      email: "lucia@prueba.com",
      condition: "Cefalea y fiebre",
      allergies: [],
      medications: [],
      clinicalHistory: "Sin antecedentes relevantes",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Patient
  },
  {
    name: "Omisión - Dolor crónico sin datos relevantes",
    entities: [
      { id: "1", text: "dolor lumbar crónico", type: "SYMPTOM", confidence: 0.93 }
    ] as ClinicalEntity[],
    patient: {
      id: "3",
      name: "Sofía Méndez",
      age: 54,
      phone: "555444333",
      email: "sofia@prueba.com",
      condition: "Dolor lumbar crónico",
      allergies: [],
      medications: [],
      clinicalHistory: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Patient
  }
];

async function runVariedadCasos() {
  console.log('🧪 TEST DE VARIEDAD DE CASOS CLÍNICOS');
  console.log('='.repeat(60));

  for (const caso of casos) {
    console.log(`\n📋 CASO: ${caso.name}`);
    console.log('-'.repeat(40));
    const redFlags = await clinicalAssistantService.detectRedFlags(caso.entities, caso.patient);
    if (redFlags.length === 0) {
      console.log('✅ No se detectaron banderas rojas.');
    } else {
      console.log(`🚨 Banderas rojas detectadas: ${redFlags.length}`);
      redFlags.forEach(flag => {
        console.log(`   - [${flag.severity}] ${flag.title}`);
        console.log(`     Descripción: ${flag.description}`);
        console.log(`     Recomendación: ${flag.recommendation}`);
      });
    }
    // Resumen estructurado
    const resumen = {
      totalBanderas: redFlags.length,
      criticas: redFlags.filter(f => f.severity === 'CRITICAL').length,
      high: redFlags.filter(f => f.severity === 'HIGH').length,
      medium: redFlags.filter(f => f.severity === 'MEDIUM').length,
      low: redFlags.filter(f => f.severity === 'LOW').length,
      titulos: redFlags.map(f => f.title),
      omisiones: [] as string[]
    };
    // Detección simple de omisiones relevantes
    if (caso.patient.allergies.length === 0) {
      resumen.omisiones.push('No se registran alergias en ficha.');
    }
    if (caso.patient.medications.length === 0) {
      resumen.omisiones.push('No se registran medicamentos activos.');
    }
    if (!caso.patient.clinicalHistory || caso.patient.clinicalHistory.trim() === "") {
      resumen.omisiones.push('No hay antecedentes clínicos consignados.');
    }
    if (resumen.omisiones.length > 0) {
      console.log('⚠️  Omisiones detectadas:');
      resumen.omisiones.forEach(o => console.log('   - ' + o));
    }
    console.log('📊 Resumen:', resumen);
  }
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test de variedad de casos clínicos completado.');
}

runVariedadCasos(); 