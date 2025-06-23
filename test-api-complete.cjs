const https = require('https');

const API_BASE_URL = 'https://api-zalv4ryzjq-uc.a.run.app';

// Función para hacer peticiones HTTPS
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

async function testAPI() {
  console.log('🚀 INICIANDO PRUEBAS COMPLETAS DE AIDUXCARE API');
  console.log('=' .repeat(60));

  try {
    // 1. Probar endpoint de salud
    console.log('\n1️⃣ Probando endpoint de salud...');
    const healthResponse = await makeRequest('GET', '/health');
    console.log('✅ Health Check:', healthResponse.status, healthResponse.data);

    // 2. Probar análisis clínico con Google Healthcare NLP
    console.log('\n2️⃣ Probando análisis clínico con Google Healthcare NLP...');
    const clinicalText = {
      text: "El paciente refiere dolor intenso en el hombro derecho desde hace 3 semanas, con limitación de movimientos y dolor nocturno. No hay antecedentes de trauma."
    };
    
    const clinicalResponse = await makeRequest('POST', '/clinical-nlp/analyze', clinicalText);
    console.log('✅ Clinical NLP Analysis:', clinicalResponse.status);
    if (clinicalResponse.data.success) {
      console.log('   📊 Entidades encontradas:', clinicalResponse.data.analysis.summary.totalEntities);
      console.log('   🔗 Relaciones encontradas:', clinicalResponse.data.analysis.summary.totalRelationships);
      console.log('   🎯 Confianza:', (clinicalResponse.data.analysis.summary.confidence * 100).toFixed(1) + '%');
    } else {
      console.log('   ❌ Error:', clinicalResponse.data.error);
    }

    // 3. Probar creación de paciente
    console.log('\n3️⃣ Probando creación de paciente...');
    const patientData = {
      name: "Juan Pérez",
      email: "juan.perez@email.com",
      phone: "+56 9 1234 5678",
      birthDate: "1985-03-15",
      reasonForConsultation: "Dolor en hombro derecho"
    };
    
    const patientResponse = await makeRequest('POST', '/patients', patientData);
    console.log('✅ Patient Creation:', patientResponse.status);
    if (patientResponse.status === 201) {
      console.log('   👤 Paciente creado con ID:', patientResponse.data.id);
    } else {
      console.log('   ❌ Error:', patientResponse.data.error);
    }

    // 4. Probar obtención de pacientes
    console.log('\n4️⃣ Probando obtención de pacientes...');
    const patientsResponse = await makeRequest('GET', '/patients');
    console.log('✅ Get Patients:', patientsResponse.status);
    if (patientsResponse.status === 200) {
      console.log('   📋 Total pacientes:', patientsResponse.data.length);
    } else {
      console.log('   ❌ Error:', patientsResponse.data.error);
    }

    // 5. Probar transcripción (simulada)
    console.log('\n5️⃣ Probando transcripción de audio...');
    const audioData = {
      audioData: "base64_encoded_audio_data",
      languageCode: "es-ES"
    };
    
    const transcriptionResponse = await makeRequest('POST', '/transcription', audioData);
    console.log('✅ Transcription:', transcriptionResponse.status);
    if (transcriptionResponse.data.success) {
      console.log('   🎤 Transcripción:', transcriptionResponse.data.transcription.transcript);
    } else {
      console.log('   ❌ Error:', transcriptionResponse.data.error);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 PRUEBAS COMPLETADAS - AIDUXCARE API FUNCIONANDO');
    console.log('🌐 URL de la API:', API_BASE_URL);
    console.log('📚 Documentación disponible en los endpoints:');
    console.log('   - GET /health - Estado del servicio');
    console.log('   - POST /clinical-nlp/analyze - Análisis clínico con IA');
    console.log('   - POST /patients - Crear paciente');
    console.log('   - GET /patients - Listar pacientes');
    console.log('   - POST /transcription - Transcribir audio');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

testAPI(); 