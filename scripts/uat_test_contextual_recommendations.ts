import { clinicalAssistantService, ClinicalEntity, Patient, ProfessionalRole } from '../src/services/ClinicalAssistantService';

const casoFarmacologico = {
  name: "Caso Farmacológico - Insuficiencia renal y AINEs",
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
};

const casoSintomatico = {
  name: "Caso Sintomático - Fiebre alta y convulsiones",
  entities: [
    { id: "1", text: "fiebre alta", type: "SYMPTOM", confidence: 0.97 },
    { id: "2", text: "convulsiones", type: "SYMPTOM", confidence: 0.96 }
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
};

async function testContextualRecommendations() {
  console.log('🧪 TEST DE RECOMENDACIONES CONTEXTUALES POR ROL');
  console.log('='.repeat(70));

  const roles: ProfessionalRole[] = ['PHYSIOTHERAPIST', 'PHYSICIAN', 'NURSE'];
  const casos = [casoFarmacologico, casoSintomatico];

  for (const caso of casos) {
    console.log(`\n📋 CASO: ${caso.name}`);
    console.log('='.repeat(50));
    
    for (const rol of roles) {
      console.log(`\n👨‍⚕️ ROL: ${rol}`);
      console.log('-'.repeat(30));
      
      const redFlags = await clinicalAssistantService.detectRedFlags(caso.entities, caso.patient, rol);
      
      if (redFlags.length === 0) {
        console.log('✅ No se detectaron banderas rojas.');
      } else {
        console.log(`🚨 Banderas rojas detectadas: ${redFlags.length}`);
        redFlags.forEach(flag => {
          console.log(`   - [${flag.severity}] ${flag.title}`);
          console.log(`     Recomendación: ${flag.recommendation}`);
          if (flag.soapNote) {
            console.log(`     SOAP Note: ${flag.soapNote}`);
          }
        });
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test de recomendaciones contextuales completado.');
}

testContextualRecommendations(); 