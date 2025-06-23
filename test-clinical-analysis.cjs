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

async function testClinicalAnalysis() {
  console.log('🧠 PROBANDO ANÁLISIS CLÍNICO MEJORADO');
  console.log('=' .repeat(60));

  const testCases = [
    {
      name: "Caso 1: Dolor de hombro",
      text: "El paciente refiere dolor intenso en el hombro derecho desde hace 3 semanas, con limitación de movimientos y dolor nocturno. No hay antecedentes de trauma."
    },
    {
      name: "Caso 2: Dolor lumbar",
      text: "Paciente presenta dolor lumbar crónico que se irradia hacia la pierna derecha, con sensación de hormigueo y debilidad muscular. Empeora al estar sentado."
    },
    {
      name: "Caso 3: Síntomas múltiples",
      text: "Refiere dolor de cabeza, náuseas, mareos y fatiga. Ha tomado paracetamol sin mejoría. Presenta inflamación en la rodilla izquierda."
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}️⃣ ${testCase.name}`);
    console.log('📝 Texto:', testCase.text.substring(0, 80) + '...');
    
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
        console.log('   🔍 Entidades encontradas:', data.entities.length);
        console.log('   📋 Secciones SOAP:', data.soapSections.length);
        
        if (data.entities.length > 0) {
          console.log('   📊 Entidades principales:');
          data.entities.slice(0, 3).forEach(entity => {
            console.log(`      - ${entity.text} (${entity.type}, ${(entity.confidence * 100).toFixed(1)}%)`);
          });
        }
        
        if (data.soapSections.length > 0) {
          console.log('   🏥 Secciones SOAP:');
          data.soapSections.forEach(section => {
            console.log(`      - ${section.type}: ${section.content.substring(0, 50)}...`);
          });
        }
        
        if (data.clinicalSummary.primarySymptoms.length > 0) {
          console.log('   🚨 Síntomas principales:', data.clinicalSummary.primarySymptoms.join(', '));
        }
        
        if (data.clinicalSummary.bodyParts.length > 0) {
          console.log('   🦴 Partes del cuerpo:', data.clinicalSummary.bodyParts.join(', '));
        }
        
      } else {
        console.log('   ❌ Error:', response.data.error);
      }
      
    } catch (error) {
      console.log('   ❌ Error de conexión:', error.message);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎉 PRUEBAS DE ANÁLISIS CLÍNICO COMPLETADAS');
  console.log('🌐 API URL:', API_BASE_URL);
}

testClinicalAnalysis(); 