const https = require('https');

const API_BASE_URL = 'https://api-zalv4ryzjq-uc.a.run.app';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-zalv4ryzjq-uc.a.run.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEnhancedProcessor() {
  console.log('🔬 PROBANDO PROCESADOR MEJORADO');
  console.log('=' .repeat(60));

  const testCases = [
    {
      name: "Test 1: Dolor específico con parte del cuerpo",
      text: "El paciente refiere dolor intenso en el hombro derecho desde hace 3 semanas",
      expected: {
        symptoms: ["dolor intenso"],
        bodyParts: ["hombro", "derecho"],
        medications: []
      }
    },
    {
      name: "Test 2: Síntomas múltiples con medicamentos",
      text: "Refiere dolor de cabeza, náuseas y mareos. Ha tomado paracetamol sin mejoría",
      expected: {
        symptoms: ["dolor", "náuseas", "mareos"],
        bodyParts: ["cabeza"],
        medications: ["paracetamol"]
      }
    },
    {
      name: "Test 3: Dolor lumbar con irradiación",
      text: "Paciente presenta dolor lumbar crónico que se irradia hacia la pierna derecha",
      expected: {
        symptoms: ["dolor", "crónico"],
        bodyParts: ["lumbar", "pierna", "derecha"],
        medications: []
      }
    },
    {
      name: "Test 4: Tratamientos y medicamentos",
      text: "Está tomando ibuprofeno y recibiendo fisioterapia para el dolor en la rodilla",
      expected: {
        symptoms: ["dolor"],
        bodyParts: ["rodilla"],
        medications: ["ibuprofeno"],
        treatments: ["fisioterapia"]
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}️⃣ ${testCase.name}`);
    console.log('📝 Texto:', testCase.text);
    
    try {
      const response = await makeRequest('POST', '/clinical-nlp/analyze', {
        text: testCase.text
      });
      
      console.log('✅ Status:', response.status);
      
      if (response.data.success) {
        const data = response.data.data;
        console.log('   🆔 Session ID:', data.sessionId);
        console.log('   ⏱️ Tiempo procesamiento:', data.processingTime + 'ms');
        console.log('   🎯 Confianza general:', (data.overallConfidence * 100).toFixed(1) + '%');
        console.log('   🔧 Método usado:', data.method);
        console.log('   🔍 Entidades encontradas:', data.entities.length);
        console.log('   📋 Secciones SOAP:', data.soapSections.length);
        
        // Verificar síntomas
        const foundSymptoms = data.clinicalSummary.primarySymptoms;
        console.log('   🚨 Síntomas detectados:', foundSymptoms.length > 0 ? foundSymptoms.join(', ') : 'Ninguno');
        
        // Verificar partes del cuerpo
        const foundBodyParts = data.clinicalSummary.bodyParts;
        console.log('   🦴 Partes del cuerpo:', foundBodyParts.length > 0 ? foundBodyParts.join(', ') : 'Ninguna');
        
        // Verificar medicamentos
        const foundMedications = data.clinicalSummary.medications;
        console.log('   💊 Medicamentos:', foundMedications.length > 0 ? foundMedications.join(', ') : 'Ninguno');
        
        // Verificar tratamientos
        const foundTreatments = data.clinicalSummary.treatments;
        console.log('   🏥 Tratamientos:', foundTreatments.length > 0 ? foundTreatments.join(', ') : 'Ninguno');
        
        // Mostrar secciones SOAP
        if (data.soapSections.length > 0) {
          console.log('   📋 Secciones SOAP:');
          data.soapSections.forEach(section => {
            console.log(`      - ${section.type}: ${section.content.substring(0, 60)}...`);
          });
        }
        
        // Evaluar resultados
        let score = 0;
        let total = 0;
        
        if (testCase.expected.symptoms.length > 0) {
          total++;
          const symptomMatch = testCase.expected.symptoms.some(symptom => 
            foundSymptoms.some(found => found.toLowerCase().includes(symptom.toLowerCase()))
          );
          if (symptomMatch) score++;
        }
        
        if (testCase.expected.bodyParts.length > 0) {
          total++;
          const bodyPartMatch = testCase.expected.bodyParts.some(part => 
            foundBodyParts.some(found => found.toLowerCase().includes(part.toLowerCase()))
          );
          if (bodyPartMatch) score++;
        }
        
        if (testCase.expected.medications.length > 0) {
          total++;
          const medicationMatch = testCase.expected.medications.some(med => 
            foundMedications.some(found => found.toLowerCase().includes(med.toLowerCase()))
          );
          if (medicationMatch) score++;
        }
        
        const accuracy = total > 0 ? (score / total * 100).toFixed(1) : 100;
        console.log(`   📊 Precisión: ${accuracy}% (${score}/${total})`);
        
      } else {
        console.log('   ❌ Error:', response.data.error);
      }
      
    } catch (error) {
      console.log('   ❌ Error de conexión:', error.message);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎉 PRUEBAS DEL PROCESADOR MEJORADO COMPLETADAS');
  console.log('🌐 API URL:', API_BASE_URL);
}

testEnhancedProcessor(); 