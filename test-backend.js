// Script para probar el backend directamente
const axios = require('axios');

const TEST_CASES = [
  {
    name: "Caso simple - dolor de espalda",
    transcript: "Paciente refiere dolor lumbar de 3 semanas de evolución. Sin banderas rojas. Toma ibuprofeno ocasionalmente."
  },
  {
    name: "Caso con red flags",
    transcript: "Paciente con dolor lumbar y pérdida de control de esfínteres. Debilidad progresiva en piernas."
  },
  {
    name: "Caso con problemas legales",
    transcript: "Le voy a hacer acupuntura aunque no tengo certificación. También le vendo este suplemento que traigo de USA."
  },
  {
    name: "Caso complejo múltiple",
    transcript: "Paciente post-MVA con cefalea persistente, visión doble ocasional, toma Lyrica, Percocet y Cymbalta. El terapeuta sugiere manipular códigos del seguro."
  }
];

async function testBackend() {
  const BACKEND_URL = 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/processTranscript';
  
  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Probando: ${testCase.name}`);
    console.log(`Transcript: ${testCase.transcript.substring(0, 100)}...`);
    
    try {
      const response = await axios.post(BACKEND_URL, {
        transcript: testCase.transcript
      });
      
      console.log('✅ Respuesta recibida:');
      console.log('- Entidades:', response.data.entities?.length || 0);
      console.log('- Red flags:', response.data.redFlags?.length || 0);
      console.log('- Yellow flags:', response.data.yellowFlags?.length || 0);
      console.log('- Tests sugeridos:', response.data.evaluaciones_fisicas_sugeridas?.length || 0);
      
      if (response.data.redFlags?.length > 0) {
        console.log('🚨 Red flags detectados:', response.data.redFlags);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

// Ejecutar si tenemos axios instalado
try {
  testBackend();
} catch (e) {
  console.log('Instala axios primero: npm install axios');
}
